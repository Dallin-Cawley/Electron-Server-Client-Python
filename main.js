const {app, BrowserWindow, ipcMain, Menu, dialog, DownloadItem, shell} = require('electron');
let {PythonShell} = require('python-shell');
let window;
let user;

  function createWindow () {
    window = new BrowserWindow({
    	width: 700, 
    	height: 400,
      resizable: false,
        webPreferences: {
          nodeIntegration: true,
          enableRemoteModule: true
        }
    })
    window.loadFile('login.html');

    var menu = Menu.buildFromTemplate([
      {
        label: 'File',
          submenu: [
            {
              label: 'Update Server',
              click() {
                console.log("Attempting to Update Server")
                options = {
                  args: ['update_server']
                }
            
                PythonShell.run('python_scripts/client.py', options, function(err, results){
                  if  (err)  throw err;
                  response_body = JSON.parse(results[1]);
                })
              }
            },
            {
              label: 'Dev Tools',
              click() {
                window.webContents.openDevTools();
              }
            }
          ]
      },
      {
        label: 'Contributors',
          submenu: [
            {
              label: 'Icons by: Icons8',
              click() {
                shell.openExternal('https://icons8.com');
              }
            }
          ]
      }
    ])

    Menu.setApplicationMenu(menu);

  }

  app.on('ready', createWindow);
  
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  });



//Handle login_info
  ipcMain.on('login_info', function(event, login_info){
  	options = {
  		args: ['login', login_info["username"], login_info["password"]]
  	}

    //Run the client python script with specified options.
    //The options variable will be the command line arguments
    //given to the python script.
    PythonShell.run('python_scripts/client.py', options, function  (err, results)  {
    
      if  (err)  throw err;
      console.log(results)
      response_body = JSON.parse(results[1]);

      //If authenticated, allow user to view their files
      if (response_body['authenticated'] == true){
        user = response_body['user']
        window.loadFile('file_explorer.html');
        window.setSize(800, 600);
        window.setResizable(true);
      }
      else {
        event.sender.send('incorrect_login')
      }
    
    });
});

  ipcMain.on('get-file-names', function(event){
    options = {
      args: ['file_view', user]
    }

    PythonShell.run('python_scripts/client.py', options, function(err, results){
      if  (err)  throw err;
      response_body = JSON.parse(results[1]);
      console.log("\nResponse body: ", response_body);
      response_body["user"] = user;

      window.webContents.send('file-names', response_body, user);
    })
  })

  ipcMain.on('ondragstart', (event, file_paths) => {
    
    //file_paths is an array
    event.sender.startDrag({
      files: file_paths,
      icon: 'images/file_folder.png'
    })

  })

  ipcMain.on('ondrop', (event, dropped_items) => {

    options = {
      args: ['send_file', user, dropped_items]
    }
    console.log("Dropped items: ", dropped_items, "\n");

    PythonShell.run('python_scripts/client.py', options, function(err, results) {     
      if  (err) throw err;
      py_result = JSON.parse(results[1])
      response_body['updated_directories'] = py_result['updated_directories']

      window.webContents.send('update-file-names', response_body);
    })

  })

  ipcMain.on('delete-file-dir', (event, delete_list, current_directory) => {

    options = {
      args:['delete', user, delete_list, current_directory]
    }

    PythonShell.run('python_scripts/client.py', options, function(err, results) {     
      if  (err) throw err;
      console.log("\nDelete Results:", results, "\n")
      response_body = JSON.parse(results[1]);

      window.webContents.send('update-file-names', response_body);
    })
  })

  ipcMain.on('new-folder', (event, folderName) => {
    window.webContents.send('new-folder', folderName)
  })

  ipcMain.on('new-folder-current', (event, newFolderInfo) => {

    options = {
      args: ['newFolder', user, newFolderInfo]
    }

    PythonShell.run('python_scripts/client.py', options, function(err, results) {     
      if  (err) throw err;
      let newFolderStatus = {}
      newFolderStatus['updated_directories'] = JSON.parse(results[1]);
      // console.log('results:', results);
      console.log('New Folder Response Body:', newFolderStatus);

      window.webContents.send('update-file-names', newFolderStatus);

    })

  })

  function downloadFiles(dialog_info, user, selected_files) {
    if (dialog_info.canceled == true) {
      window.webContents.send('no-directory-selected');
    }
    else {
      directory = dialog_info.filePaths[0];
    
      for (i = 0; i < selected_files.length; i++) {
        console.log("Iteration ", i);
        options = {
          args: ['download', user, selected_files[i], directory]
        }

        PythonShell.run('python_scripts/client.py', options, function(err, results) {     
          if  (err) throw err;
          console.log('\nresults: ', results); 

          download_status = JSON.parse(results[1])
          console.log("\nDownload Status:", download_status, '\n')
          window.webContents.send('download-status', download_status)
        })
      }
    }
  }

  ipcMain.on('download', (event, selected_files) => {
    console.log("Downloading files:", selected_files);
    let options = {
        title: "Download Location",
        buttonLabel: "Download",
        properties: ['openDirectory']
      };
    
    dialog.showOpenDialog(window, options).then(dialog_selection => {
       downloadFiles(dialog_selection, user, selected_files) 
      })
    })

  ipcMain.on('rename-element', (event, rename_body) => {
    console.log("Rename body:", rename_body, '\n')
    options = {
      args: ['rename', user, rename_body]
    }

      // PythonShell.run('python_scripts/client.py', options, function(err, results) {     
      //   if  (err) throw err;
      //   console.log('\nresults: ', results); 
      // })
  })
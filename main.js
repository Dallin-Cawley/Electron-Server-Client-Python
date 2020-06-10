const {app, BrowserWindow, ipcMain, Menu} = require('electron');
let {PythonShell} = require('python-shell');
let window;
let user;

  function createWindow () {
    window = new BrowserWindow({
    	width: 700, 
    	height: 400,
      resizable: false,
        webPreferences: {
        	nodeIntegration: true
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
    console.log()

    PythonShell.run('python_scripts/client.py', options, function(err, results) {     
      if  (err) throw err;
      console.log("\nDelete Results:", results, "\n")
      response_body = JSON.parse(results[1]);

      window.webContents.send('update-file-names', response_body);
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
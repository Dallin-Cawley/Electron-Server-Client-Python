const {app, BrowserWindow, ipcMain} = require('electron');
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
      console.log("response body: ", response_body);
      response_body["user"] = user;
      console.log("base_path: ", response_body["base_path"]);

      window.webContents.send('file-names', response_body);
    })
  })

  ipcMain.on('ondragstart', (event, file_paths) => {
    
    //file_paths is an array
    event.sender.startDrag({
      files: file_paths,
      icon: 'images/file_folder.png'
    })

  })

  ipcMain.on('ondrop', (event, paths) => {

    options = {
      args: ['send_file', paths]
    }

    PythonShell.run('python_scripts/client.py', options, function(err, results) {     
      if  (err) throw err;
      console.log("\nResponse: ", results, "\n")
      response_body = JSON.parse(results[1]);
      window.webContents.send('update-file-names', response_body);
    })

  })

  ipcMain.on('delete-file-dir', (event, delete_list, current_directory) => {

    options = {
      args:['delete', delete_list, current_directory]
    }

    PythonShell.run('python_scripts/client.py', options, function(err, results) {     
      if  (err) throw err;
      console.log('\nresults: ', results); 

      response_body['updated_directories'] = JSON.parse(results[1]);

      console.log("\nresponse_body: ", response_body, "\n");
      window.webContents.send('update-file-names', response_body);
    })
  })
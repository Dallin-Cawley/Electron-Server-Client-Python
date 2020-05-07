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

      window.webContents.send('file-names', response_body);
    })
  })

  ipcMain.on('ondragstart', (event, filePath) => {
    event.sender.startDrag({
      file: filePath,
      icon: 'images/file_folder.png'
    })
})

  ipcMain.on('ondrop', (event, paths) => {
    console.log("ondrop caught");

    options = {
      args: ['send_file', paths]
    }

    PythonShell.run('python_scripts/client.py', options, function(err, results) {
      if  (err)  throw err;
      console.log('results', results);

      //response_body = JSON.parse(results[1]);
      //console.log("response_body: ", response_body)
      window.webContents.send('update-file-names', response_body)
    })

  })
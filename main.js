const {app, BrowserWindow, ipcMain} = require('electron');
let {PythonShell} = require('python-shell');
let window;

  function createWindow () {
    window = new BrowserWindow({
    	width: 700, 
    	height: 400,
        webPreferences: {
        	nodeIntegration: true
        }
    })
    window.loadFile('login.html');
    window.setResizable(false);
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
  		args: [login_info["username"], login_info["password"]]
  	}

	PythonShell.run('python_scripts/client.py', options, function  (err, results)  {
 	if  (err)  throw err;
 	console.log('results', results);
	});
});
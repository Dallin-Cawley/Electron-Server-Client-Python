const {remote} = require('electron');
const BrowserWindow = remote.BrowserWindow;


var programState = {
	'currentDirectory': null,
	'previousDirectory': null,
	'showDir': null,
	'selectedFiles': [],
	'recentSelection': null,
	'user': null,
	'iconSize': {},
	'fileExplorerDropDown': null,
	'newFolderWindow': null
}


//This function shows the desired directory when the window loads.
function showDir() {

	//Remove current <li> elements
	let fileListUl = document.getElementById('file-name-list');

	while(fileListUl.firstChild) {
		fileListUl.removeChild(fileListUl.lastChild);
	}

	//Create Directories as <li>
	let selectedDirectory = remoteDirectories[programState.currentDirectory];
	let fileBody = {
		'directory': true,
		'to_display': selectedDirectory.sub_directories,
		'image': 'images/file_folder.png'
	}

	createLiElements(fileBody);

	//Create Files as <li>
	fileBody['directory'] = false;
	fileBody['to_display'] = selectedDirectory.file_names;
	fileBody['image'] = 'images/txt-file-icon.png'

	createLiElements(fileBody);

	//Update program state
	programState.selectedFiles.length = 0;
	programState.recentSelection = null;

	currentDirectoryDiv = document.getElementById('current-directory');
	currentDirectoryDiv.innerHTML = programState.currentDirectory;
}


function createFolder(event) {

	let childWindow = new BrowserWindow({ 
		width: 500, 
		height: 150,
		frame: false,
		movable: true,
		resizable: false,
		show: false,
		parent: BrowserWindow.getFocusedWindow(),
		modal: true,
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: true
		}
	});
	childWindow.loadFile('newFolder.html');

	programState.newFolderWindow = childWindow;



	childWindow.on('ready-to-show', () => {
		childWindow.show();
	  });

	childWindow.on('close', (event) => {
		programState.newFolderWindow = null;
	})
}
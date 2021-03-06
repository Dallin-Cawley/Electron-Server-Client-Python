const {ipcRenderer, dialog} = require('electron');
const Menu = remote.require('electron').Menu;
const MenuItem = remote.require('electron').MenuItem;
const {getCurrentWindow, globalShortcut} = require('electron').remote;

var reload = () => {
  getCurrentWindow().reload()
}

globalShortcut.register('F5', reload);
globalShortcut.register('CommandOrControl+R', reload);

window.addEventListener('beforeunload', ()=>{
  globalShortcut.unregister('F5', reload);
  globalShortcut.unregister('CommandOrControl+R', reload);
})

window.onload = startUp();
document.addEventListener('keydown', handleKeyDown);

function startUp() {
	ipcRenderer.send('get-file-names')
	dropdownSizeDIV = document.getElementById('icon-size');
	dropdownSizeDIV.innerHTML = 'Medium';

	programState.iconSize['imgWidth'] = '100px';
	programState.iconSize['imgHeight'] = '100px';
	programState.iconSize['fontSize'] = 'medium';
	programState.iconSize['divHeight'] = '30px';
	programState.iconSize['liHeight'] = (parseInt(programState.iconSize.imgHeight) + parseInt(programState.iconSize.divHeight) + 5).toString() + 'px';

}

function windowOnClick(event) {
	hideFileSearch();
	hideDropDown();
	deselectAllElements();
}


/*************************************************
 * onclick() events for icon size dropdown menu
 ************************************************/

function showDropDown(event) {
	event.stopPropagation();
	hideFileSearch();

	dropdownContentDIV = document.getElementById('icon-size-content');
	dropdownContentDIV.style.opacity = '100%';
	dropdownContentDIV.onclick = 'iconSizeUpdate(event)';

	iconSmall = document.getElementById('icon-small')
	iconSmall.classList.toggle('border-hover');
	iconSmall.style.pointerEvents = 'auto';
	
	iconMedium = document.getElementById('icon-medium')
	iconMedium.classList.toggle('border-hover');
	iconMedium.style.pointerEvents = 'auto';

	iconLarge = document.getElementById('icon-large')
	iconLarge.classList.toggle('border-hover');
	iconLarge.style.pointerEvents = 'auto';

	dropdownArrow = document.getElementById('dropdown-arrow');
	dropdownArrow.style.transform = 'rotate(-135deg)';
}

function hideDropDown() {
	dropdownContentDIV = document.getElementById('icon-size-content');
	if (dropdownContentDIV.style.opacity == '0') {
		return;
	}

	dropdownContentDIV.style.opacity = '0';
	dropdownContentDIV.onclick = null;

	iconSmall = document.getElementById('icon-small')
	iconSmall.classList.toggle('border-hover');
	iconSmall.style.pointerEvents = 'none';
	
	iconMedium = document.getElementById('icon-medium')
	iconMedium.classList.toggle('border-hover');
	iconMedium.style.pointerEvents = 'none';

	iconLarge = document.getElementById('icon-large')
	iconLarge.classList.toggle('border-hover');
	iconLarge.style.pointerEvents = 'none';

	dropdownArrow = document.getElementById('dropdown-arrow');
	dropdownArrow.style.transform = 'rotate(45deg)';
}

function iconSizeUpdate(event) {
	let ul = document.getElementById('file-name-list')
	let liList = ul.getElementsByTagName('li');
	dropdownSizeDIV = document.getElementById('icon-size')

	let selection = event.currentTarget.id.toString();
	
	if (selection == 'icon-small') {
		programState.iconSize.fontSize = 'small';
		programState.iconSize.divHeight = '20px';

		programState.iconSize.imgHeight = '75px';
		programState.iconSize.imgWidth = '75px';
		dropdownSizeDIV.innerHTML = 'Small';

		programState.iconSize.liHeight = (parseInt(programState.iconSize.imgHeight) + parseInt(programState.iconSize.divHeight) + 5).toString() + 'px';
	}
	else if (selection == 'icon-medium') {
		programState.iconSize.fontSize = 'medium';
		programState.iconSize.divHeight = '30px';

		programState.iconSize.imgHeight = '100px';
		programState.iconSize.imgWidth = '100px';
		dropdownSizeDIV.innerHTML = 'Medium';

		programState.iconSize.liHeight = (parseInt(programState.iconSize.imgHeight) + parseInt(programState.iconSize.divHeight) + 5).toString() + 'px';
	}
	else if (selection == 'icon-large') {
		programState.iconSize.fontSize = 'large';
		programState.iconSize.divHeight = '40px';

		programState.iconSize.imgHeight = '125px';
		programState.iconSize.imgWidth = '125px';

		dropdownSizeDIV.innerHTML = 'Large';

		programState.iconSize.liHeight = (parseInt(programState.iconSize.imgHeight) + parseInt(programState.iconSize.divHeight) + 5).toString() + 'px';
	}

	for (i = 0; i < liList.length; i++) {
		let li = liList[i];
		let divChild = li.firstChild;
		let imgChild = li.lastChild;

		li.style.gridTemplateRows = programState.iconSize.divHeight + ' ' + programState.iconSize.imgHeight;
		li.style.height = programState.iconSize.liHeight;
		li.style.width = programState.iconSize.imgWidth;

		divChild.style.fontSize = programState.iconSize.fontSize;
		divChild.style.width = programState.iconSize.imgWidth;
		divChild.style.height = programState.iconSize.divHeight;

		imgChild.style.height = programState.iconSize.imgHeight;
		imgChild.style.width = programState.iconSize.imgWidth;
	}

	hideDropDown();
}





/**************************************************
 * events for current-directory-container
 *************************************************/

 //place cursor at end of contentEditable entity

//Courtesy of Nico Burns: Stack Overflow post 
//https://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity/3866442#3866442
 function focusEnd(element) {
	 let range,selection;
	 if(document.createRange) {//Firefox, Chrome, Opera, Safari, IE 9+
		 range = document.createRange();
		 range.selectNodeContents(element);
		 range.collapse(false);
		 selection = window.getSelection();
		 selection.removeAllRanges();
		 selection.addRange(range);
	 }
	 else if(document.selection) {//IE 8 and lower  
		 range = document.body.createTextRange();
		 range.moveToElementText(element);
		 range.collapse(false);
		 range.select();
	 }
 }


 //onclick
function fileSearchClick(event) {
	event.stopPropagation();
	hideDropDown();

	let currentDirectoryContainer = document.getElementById('current-directory-container');

	currentDirectoryContainer.style.borderWidth = '0px';
	currentDirectoryContainer.style.boxShadow = '0px 8px 16px 0px rgba(0,0,0,0.2)';
	currentDirectoryContainer.style.zIndex = '1';

	let currentDirectoryDiv = document.getElementById('current-directory');
	currentDirectoryDiv.contentEditable = 'true';

	focusEnd(currentDirectoryDiv);
	updateFileSearch(event);
}

function hideFileSearch() {
	let currentDirectoryContainer = document.getElementById('current-directory-container');

	for (i = 1; i < currentDirectoryContainer.childNodes.length; i++) {
		if (currentDirectoryContainer.lastChild.id == 'current-directory') {
			continue;
		}
		currentDirectoryContainer.removeChild(currentDirectoryContainer.lastChild);
	}
	
	let currentDirectoryDiv = document.getElementById('current-directory');
	if (currentDirectoryDiv.contentEditable == 'false') {
		return;
	}


	currentDirectoryContainer.style.height = '25px'
	currentDirectoryContainer.style.zIndex = '0'
	currentDirectoryContainer.style.boxShadow = '0px 0px 0px 0px rgba(0,0,0,0.2)';

	currentDirectoryDiv.contentEditable = 'false';
}

 function updateFileSearch(event) {
		let currentDirectoryContainer = document.getElementById('current-directory-container');
		let currentDirectoryDiv = document.getElementById('current-directory');	
		
		let childNodes = currentDirectoryContainer.getElementsByTagName('div');
		let childNodeLength = childNodes.length;

		for (i = 1; i < childNodeLength; i++) {
			currentDirectoryContainer.removeChild(currentDirectoryContainer.lastChild);
		}

		subDirectories = remoteDirectories[currentDirectoryDiv.innerText].sub_directories;
		subDirectoriesLength = subDirectories.length;

		if (subDirectoriesLength <= 0) {
			divChild = document.createElement('div');
			textNode = document.createTextNode('No Directories Found');
			divChild.id = 'no-directories-found';
			divChild.appendChild(textNode);
			divChild.style.height = "25px";
			divChild.style.width = "100%";
			divChild.style.color = '#8D8C8C'

			currentDirectoryContainer.style.height = '50px';
			currentDirectoryContainer.appendChild(divChild);
		}
		else {
			for (i = 0; i <	subDirectoriesLength; i++) {

				divChild = document.createElement('div');
				textNode = document.createTextNode(subDirectories[i]);
				divChild.id = subDirectories[i];
				divChild.appendChild(textNode);
				divChild.style.height = "25px";
				divChild.style.width = "100%";

				divChild.onclick = function(event) {
					event.stopPropagation();
					currentDirectoryDiv = document.getElementById('current-directory');
					text = currentDirectoryDiv.innerText;
					currentDirectoryDiv.innerHTML = path.join(text, event.target.innerText);
					document.getElementById('current-directory-container').style.height = '25px'
					updateFileSearch(event);
					focusEnd(currentDirectoryDiv);
				}

				currentDirectoryContainer.appendChild(divChild);
				currentDirectoryContainer.style.height = (parseInt(currentDirectoryContainer.offsetHeight) + 25).toString() + 'px';
			}
		}
 	}

 //onKeyPress
 function submitLocation(event) {

	var code = (event.keyCode ? event.keyCode : event.which);
	if(code != 13) { //Enter keycode
		return;
	}

	let currentDirectoryContainer = document.getElementById('current-directory-container');
	let currentDirectoryDiv = document.getElementById('current-directory');
	if (currentDirectoryDiv.contentEditable == 'false') {
		return;
	}

	currentDirectoryContainer.style.borderColor = 'black';
	currentDirectoryContainer.style.borderWidth = '1px';
	currentDirectoryContainer.style.boxShadow = '0px 0px 0px 0px rgba(0,0,0,0.2)';
	currentDirectoryContainer.style.height = '25px';

	let directoryText = currentDirectoryDiv.innerText;
	if (directoryText[directoryText.length - 1] == '\\' || directoryText[directoryText.length - 1] == '/') {
		directoryText = directoryText.slice(0, -1);
	}

	currentDirectoryDiv.contentEditable = 'false';

	if (remoteDirectories[directoryText] == undefined) {
		alert('Directory not found');
		currentDirectoryDiv.innerHTML = programState.currentDirectory;
	}
	else {
		programState.currentDirectory = directoryText;
		programState.previousDirectory = path.dirname(directoryText);
		showDir();
	}
	hideFileSearch();

 }


/**************************************************
 * Download status Dialog
 *************************************************/
ipcRenderer.on('no-directory-selected', function() {
	alert('No Directory was selected. Please try again');
})

ipcRenderer.on('download-status', function(event, downloadStatus) {
	if (downloadStatus.downloaded == true) {
		message = 'All files were saved.'
		alert(message);
	}
	else {
		message = 'The following files were NOT saved.....';
		for (file in downloadStatus.unsaved_files) {
			message += '\n\t' + downloadStatus.unsaved_files[file] + '\n'
		}
		alert(message);
	}
})

/**********************************************
 * Context Menu on Right Click
 *********************************************/
let rightClickPosition = null;

const menu = new Menu();
const inspectElement = new MenuItem({
  label: 'Inspect Element',
  click: () => {
    remote.getCurrentWindow().inspectElement(rightClickPosition.x, rightClickPosition.y)
  }
});

const download = new MenuItem({
	label: 'Download',
	click: () => {
		if (programState.selectedFiles.length > 0) {
			ipcRenderer.send('download', programState.selectedFiles);

		}
		else {
			alert('Please select atleast one File or Directory');
		}
	}
})

const newFolder = new MenuItem({
	label: 'Create Folder',
	click: () => {
		createFolder(null);
	}
})


menu.append(inspectElement);
menu.append(download);
menu.append(newFolder);

window.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  rightClickPosition = {x: e.x, y: e.y};
  menu.popup(remote.getCurrentWindow());
}, false);


/**********************************************
 * <li> Elements
 *********************************************/
function createLiElements(fileBody) {
	let directory = fileBody.directory;

	// Prepare local variables for repeated use in loop
	let ul = document.getElementById('file-name-list');
	let imageSrc = fileBody.image;
	let fileList = fileBody.to_display;

	//Begin dynamically creating the list of files
	for (fileIndex in fileList){

		//Create <li> element
		let liNode = document.createElement('li');
		liNode.style.height = programState.iconSize.liHeight;
		liNode.style.width = programState.iconSize.imgWidth;
		liNode.classList.add('folder-view');
		liNode.classList.add('pointer-hover');

		let text = document.createTextNode(fileList[fileIndex]);
		let divNode = document.createElement('div')
		divNode.appendChild(text);
		divNode.id = 'div_' + fileList[fileIndex];

		divNode.style.height = programState.iconSize.divHeight;
		divNode.style.width = programState.iconSize.imgWidth;
		divNode.style.fontSize = programState.iconSize.fontSize;
		divNode.style.overflow= 'hidden';
		divNode.style.whiteSpace = 'nowrap';
		divNode.style.textOverflow = 'ellipsis';
		
		liNode.id = fileList[fileIndex];
		
		//Create and adjust image
		let image = document.createElement('img');
		image.id = fileList[fileIndex];
		image.setAttribute('src', imageSrc);
		image.style.width = programState.iconSize.imgWidth;
		image.style.height = programState.iconSize.imgHeight;
		image.style.margin = 'auto';

		liNode.appendChild(divNode);
		liNode.appendChild(image);

		/*********************************
		Create events for all <li> nodes
		*********************************/
		//Drag Events
		liNode.ondragstart = (event) => {
		   	event.preventDefault();
			event.stopPropagation();
			
			if (programState.selectedFiles.length > 0) {
				ipcRenderer.send('ondragstart', programState.selectedFiles);
			}
		}

		divNode.addEventListener('keydown', editableInputChange)

		//On Click or on Click if selected
		liNode.onclick = (event) => {
			let selectedItem = path.join(programState.currentDirectory, event.target.id);
			if (programState.selectedFiles.includes(selectedItem) && programState.selectedFiles.length == 1) {
				renameItem(event);
				liOnClick(event);
			}
			else {
				liOnClick(event);
			}
		}

		/* ********************************
		 * Create events for Directory <li>
		 * nodes
		 * ********************************/
		if (directory == true){
			//OnDrop events
			liNode.ondrop = (event) => {
				event.preventDefault();
				event.stopPropagation();
				
				//Get a list of all items dropped into window
				let droppedItems = event.dataTransfer.files

				//Used to hold directory and file names seperately
				directories = [];
				files = [];

				//Check to see which are files and which are directories
				for (i = 0; i < droppedItems.length; i++) {
					item = droppedItems[i];
					
					if (item.type == '') {  //Item is a directory

						let directoryInfo = {
							'name': item.name,
							'path': item.path,
							'size': item.size,
						}
					directories.push(directoryInfo)
					}
					else {   //Item is a file

						let fileInfo = {
							'name': item.name,
							'path': item.path,
							'size': item.size,
							'type': item.type
						}
						files.push(fileInfo)
					}
				}

				droppedItems = {
					'files': files,
					'directories': directories,
					'sending_to': path.join(programState.currentDirectory, event.target.id),
					'current_directory': programState.currentDirectory,
					'delete_orig': 'true',
					'move': 'true'
				}
				
				programState.showDir = true;
				event.currentTarget.style.backgroundColor = '#99badd';
				ipcRenderer.send('ondrop', JSON.stringify(droppedItems));

			}

			//Hover Events
			liNode.ondragover = (event) => {
		   		event.preventDefault();
		   		event.stopPropagation();
				event.currentTarget.style.backgroundColor = 'blue';
	   		}

	   		//Hover End Events
	   		liNode.ondragleave = (event) => {
				event.preventDefault();
				event.stopPropagation();
				event.currentTarget.style.backgroundColor = 'transparent';
			}

			//Double Click Event
			liNode.ondblclick = (event) => {
				showDirOnEvent(event);
			}
		}

		//Add it to <ul id='file-name-list'>
		ul.appendChild(liNode);
	}
}


/**********************************************
 * ipcRenderere.on() events
 *********************************************/

ipcRenderer.on('new-folder', (event, folderName) => {
	data = {
		'folderName': folderName,
		'current_directory': programState.currentDirectory
	}

	ipcRenderer.send('new-folder-current', JSON.stringify(data))
	programState.showDir = true;
  })

//file-names is thrown after a successful login to localize and display
//directory and file names.
ipcRenderer.on('file-names', function(event, directoryInfo, user){

	//Localize these variables for future use;
	remoteDirectories = directoryInfo;
	programState.user = user;
	programState.currentDirectory = user
	let currentDirectoryDiv = document.getElementById('current-directory');
	currentDirectoryDiv.innerHTML = programState.currentDirectory;
	updateFilePaths()

	//Create Directories as <li>
	fileBody = {
		'directory': true,
		'to_display': directoryInfo[programState.user].sub_directories,
		'image': 'images/file_folder.png'
	}

	createLiElements(fileBody);

	//Create Files as <li>
	fileBody['directory'] = false;
	fileBody['to_display'] = directoryInfo[programState.user].file_names;
	fileBody['image'] = 'images/txt-file-icon.png'

	createLiElements(fileBody);

	createFolderMenu();
})


ipcRenderer.on('update-file-names', function(event, responseBody) {
	let updatedDirectories = responseBody['updated_directories'];
	console.log('updated Directories:', updatedDirectories);

	if (typeof updatedDirectories == 'string') {
		updatedDirectories = JSON.parse(updatedDirectories);
	}

	// Set the parent_directory of each directory so that back navigation 
	// in file explorer is possible
	for (dirKey in updatedDirectories) {
		if (dirKey != programState.user) {
			parentPath = dirKey.substring(0, dirKey.lastIndexOf(path.basename(dirKey)));
			parentPath = parentPath.slice(0, -1);
		}
		else {
			parentPath = programState.user;
		}
		updatedDirectories[dirKey]['parent_directory'] = parentPath;
		remoteDirectories[dirKey] = updatedDirectories[dirKey];
	}

	if (programState.showDir == true){
		showDir();
		programState.showDir = false;
	}
})


/*********************************************
 * Folder Menu Functions
 ********************************************/
function createFolderMenu() {
	let parentFolder = new FileExplorerDropDown(document.getElementById('folder-menu'), programState.user);
	programState.fileExplorerDropDown = parentFolder;
}


/**********************************************
 * Extra necessary functions
 *********************************************/

//Add all files with their current location to the global
//remote_directories for easy use when dragging and dropping
function updateFilePaths() {
	for (directory in remoteDirectories) {
		if (directory == 'user') {
			break;
		}

		//For easy access to file paths later
		for (fileIndex in remoteDirectories[directory].file_names){
			
			let file = remoteDirectories[directory].file_names[fileIndex];
			let filePath = path.join(remoteDirectories[directory].path, file);

			remoteDirectories[filePath] = {
				'path': filePath
			}
		}
		//For easy access to parent directories later
		let subDirectoryList = remoteDirectories[directory].sub_directories;
		if (subDirectoryList != null) {
			if (subDirectoryList.length > 0) {
				for (i = 0; i < subDirectoryList.length; i++) {
					subDirIndex = path.join(directory, subDirectoryList[i]);
					remoteDirectories[subDirIndex].parent_directory = directory;
				}
			}
		}
	}
}

function liOnClick(event) {
	event.preventDefault();
	event.stopPropagation();

	if (event.shiftKey == true) {

		if (programState.selectedFiles.length > 0) {

			let ul = document.getElementById('file-name-list');
			let liList = ul.getElementsByTagName('li');

			let first = false;
			for (i = 0; i < liList.length; i++) {
				if (first == true && (programState.recentSelection == liList[i].id || event.target.id == liList[i])) {
					first = false;
				}
				else if ((programState.recentSelection == liList[i].id || event.target.id == liList[i]) && first == false) {
					first = true;
				}

				if (first == true) {
					liList[i].style.backgroundColor = '#4863A0'
					programState.selectedFiles.push(path.join(programState.currentDirectory, liList[i].id));
				}
				else {
					liList[i].style.backgroundColor = '#99badd';
				}
			}
		}
		else {
			deselectAllElements();

			//set selected item's background color.
			event.currentTarget.style.backgroundColor = '#4863A0';
			programState.selectedFiles.push(path.join(programState.currentDirectory, event.target.id));
			programState.recentSelection = event.target.id;
			
		}

	}
	else if (event.ctrlKey == true) {
		programState.selectedFiles.push(path.join(programState.currentDirectory, event.target.id));
		event.currentTarget.style.backgroundColor = '#4863A0';
		programState.recentSelection = event.target.id;
	}
	else {
		deselectAllElements();
		//set selected item's background color.
		event.currentTarget.style.backgroundColor = '#4863A0';
		programState.selectedFiles.push(path.join(programState.currentDirectory, event.target.id));
		programState.recentSelection = event.target.id;
	}
}


function deselectAllElements() {
	if (programState.selectedFiles.length <= 0) {
		return;
	}
	
	//Set currently selected items back to default background color
	for (i = 0; i < programState.selectedFiles.length; i++){
		let { dir, name, ext } = path.parse(programState.selectedFiles[i]);
		document.getElementById(name + ext).style.backgroundColor = 'transparent';
	}

	//Clear selected files so only one can be selected at a time unless shift or control
	//is clicked.
	programState.selectedFiles.length = 0;
	programState.recentSelection = null;
}

//Change the name of a File or Directory
function renameItem(event) {
	let liId = event.target.id.replace('div_', '');
	let liChildList = document.getElementById(liId).childNodes;
	let liItem = 0;

	//Find the div element
	for (i = 0; i < liChildList.length; i++) {

		if (liChildList[i].tagName == 'div') {
			liItem = liChildList[i];
			break;
		}
	}

	if (liItem == 0) {
		console.log('Div element for', event.target.id, 'not found.');
		return;
	}
	
	//div element was found. Allow it to be edited.
	liItem.contentEditable = 'true';

}

function editableInputChange(event) {

	//Enter key was pressed
	if (event.keyCode == 13) {
		//Prevent the return character
		event.preventDefault();
		let renameBody = {
			'old_name': programState.selectedFiles[0],
			'new_name': event.target.textContent
		}
		document.getElementById(event.target.id).contentEditable = 'false';
		ipcRenderer.send('rename-element', JSON.stringify(renameBody));
	}
}


function droppedInWindow(event) {
	//Get a list of all items dropped into window
	let droppedItems = event.dataTransfer.files

	//Used to hold directory and file names seperately
	directories = [];
	files = [];

	//Check to see which are files and which are directories
	for (i = 0; i < droppedItems.length; i++) {
		item = droppedItems[i];
		
		if (item.type == '') {  //Item is a directory

			let directoryInfo = {
				'name': item.name,
				'path': item.path,
				'size': item.size,
			}
		   directories.push(directoryInfo)
		}
		else {   //Item is a file

			let fileInfo = {
				'name': item.name,
				'path': item.path,
				'size': item.size,
				'type': item.type
			}
			files.push(fileInfo)
		}
	}

	droppedItems = {
		'files': files,
		'directories': directories,
		'sending_to': programState.currentDirectory,
		'current_directory': programState.currentDirectory,
	}
	   
	programState.showDir = true;
	event.currentTarget.style.backgroundColor = '#99badd';
   	ipcRenderer.send('ondrop', JSON.stringify(droppedItems));
}

function draggedOverWindow(event) {
	event.preventDefault();
	event.currentTarget.style.backgroundColor = 'blue';
}

function draggedLeftWindow(event) {
	event.preventDefault();
	event.currentTarget.style.backgroundColor = '#99badd';
}

//This function shows the selected directory when the user double clicks
//the directory in the window.
function showDirOnEvent(event) {
	event.preventDefault();
	event.stopPropagation();

	//Get the abs path of selected Directory
	let selectionPath = path.join(programState.currentDirectory, event.target.id);
	let selectedDirectory = remoteDirectories[selectionPath];

	if (selectedDirectory == null){
		alert('Unable to find selection.')
		return false;
	}

	//Remove current <li> elements
	let fileListUl = document.getElementById('file-name-list');

	while(fileListUl.firstChild) {
		fileListUl.removeChild(fileListUl.lastChild);
	}

	//Create Directories as <li>
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
	programState.currentDirectory = selectionPath;
	programState.previousDirectory = remoteDirectories[selectionPath].parent_directory;
	programState.selectedFiles.length = 0;
	programState.recentSelection = null;

	currentDirectoryDiv = document.getElementById('current-directory');
	currentDirectoryDiv.innerHTML = programState.currentDirectory;
}


function handleKeyDown(event) {
	var key = event.keyCode || event.charCode;
	if (document.getElementById('current-directory').contentEditable == 'true') {
		return;
	}

	//Backspace
	if (key == 8) {
		showPrevDir(event);
	}
	//Delete
	else if (key == 46) {
		deleteFileDir(event);
	}
}

function deleteFileDir(event){
	programState.showDir = true;
	ipcRenderer.send('delete-file-dir', JSON.stringify(programState.selectedFiles), programState.currentDirectory);
}

function showPrevDir(event) {

	//If we are as far back as is allowed, don't do anything
    if (programState.currentDirectory == programState.user) {
    	return false;
    }
    	
	let selectedDirectory = remoteDirectories[programState.previousDirectory];
		
	//Remove current <li> elements
	let fileListUl = document.getElementById('file-name-list');

	while(fileListUl.firstChild) {
		fileListUl.removeChild(fileListUl.lastChild);
	}

	//Create Directories as <li>
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
	programState.currentDirectory = programState.previousDirectory;
	programState.previousDirectory = remoteDirectories[programState.currentDirectory].parent_directory;
	programState.selectedFiles.length = 0;
	programState.recentSelection = null;

	currentDirectoryDiv = document.getElementById('current-directory');
	currentDirectoryDiv.innerHTML = programState.currentDirectory;
};

const electron = require('electron');
const {ipcRenderer} = electron;
const path = require('path');

window.onload = get_file_names();
var remote_directories;

var program_state = {
	'base_directory': null,
	'current_directory': null,
	'previous_directory': null,
	'show_dir': null,
	'selected_files': [],
	'recent_selection': null,
}

document.addEventListener("keydown", handleKeyDown);

function get_file_names() {
    ipcRenderer.send('get-file-names')
}


function create_li_elements(file_body) {
	let directory = file_body.directory;

	// Prepare local variables for repeated use in loop
	let ul = document.getElementById("file-name-list");
	let image_src = file_body.image;
	let file_list = file_body.to_display;

	//Begin dynamically creating the list of files
	for (file_index in file_list){

		//Create <li> element
		let li_node = document.createElement("LI");
		let text = document.createTextNode(file_list[file_index]);
		li_node.id = file_list[file_index];
		
		//Create and adjust image
		let image = document.createElement("IMG");
		image.id = file_list[file_index];
		image.setAttribute('src', image_src);
		image.width = "100";
		image.height = "100";

		li_node.appendChild(text);
		li_node.appendChild(image);

		/*********************************
		Create events for all <li> nodes
		*********************************/
		//Drag Events
		li_node.ondragstart = (event) => {
		   	event.preventDefault();
			event.stopPropagation();
			
			if (program_state.selected_files.length > 0) {
				ipcRenderer.send('ondragstart', program_state.selected_files);
			}
		}

		li_node.onclick = (event) => {
			liOnClick(event);
		}

		if (directory == true){
			//OnDrop events
			li_node.ondrop = (event) => {
				event.preventDefault();
				event.stopPropagation();
				
				//Get path of where the file is being moved to
		    	let drop_dir_name = path.join(program_state.current_directory, event.target.id);
		    	let end_location = remote_directories[drop_dir_name].path;

		    	//Get path of files to move
		    	let files_to_send_path = [];
		    	let event_files_length = event.dataTransfer.files.length;
		    	let event_files = event.dataTransfer.files;

		    	for (let i = 0; i < event_files_length; i++){
		    		files_to_send_path.push(event_files[i].path);
		    	}

		    	drop_body = {
		    		'sending_to': end_location,
		    		'files_to_send': files_to_send_path
		    	}

		    	ipcRenderer.send('ondrop', JSON.stringify(drop_body));

			}

			//Hover Events
			li_node.ondragover = (event) => {
		   		event.preventDefault();
		   		event.stopPropagation();
				event.currentTarget.style.backgroundColor = 'blue';
	   		}

	   		//Hover End Events
	   		li_node.ondragleave = (event) => {
				event.preventDefault();
				event.stopPropagation();
				event.currentTarget.style.backgroundColor = '#99badd';
			}

			//Double Click Event
			li_node.ondblclick = (event) => {
				showDirOnEvent(event);
			}
		}

		//Add it to <ul id="file-name-list">
		ul.appendChild(li_node);
	}
}

//file-names is thrown after a successful login to localize and display
//directory and file names.
ipcRenderer.on('file-names', function(event, directory_info){

	//Localize these variables for future use
	program_state.base_directory = directory_info.base_path;
	remote_directories = directory_info;
	program_state.current_directory = program_state.base_directory;

	update_file_paths()
	//console.log("remote directories: ", remote_directories);
	//Create Directories as <li>
	console.log("base_directory: ", program_state.base_directory);
	file_body = {
		'directory': true,
		'to_display': directory_info[program_state.base_directory].sub_directories,
		'image': 'images/file_folder.png'
	}

	create_li_elements(file_body);

	//Create Files as <li>
	file_body['directory'] = false;
	file_body['to_display'] = directory_info[program_state.base_directory].file_names;
	file_body['image'] = 'images/txt-file-icon.png'

	create_li_elements(file_body);
})

ipcRenderer.on('update-file-names', function(event, response_body) {
	updated_directories = response_body["updated_directories"];

	for (dir_key in updated_directories) {
		updated_directories[dir_key]["parent_directory"] = remote_directories[dir_key].parent_directory;
		remote_directories[dir_key] = updated_directories[dir_key];
	}

	if (program_state.show_dir == true){
		showDir();
		program_state.show_dir = false;
	}

})

//Add all files with their current location to the global
//remote_directories for easy use when dragging and dropping
function update_file_paths() {
	let i = 0
	for (directory in remote_directories) {
		if (directory == 'user') {
			break;
		}
		else if (directory == program_state.base_path) {
			i++;
		}

		//For easy access to file paths later
		for (file_index in remote_directories[directory].file_names){
			
			let file = remote_directories[directory].file_names[file_index];
			let file_path = path.join(remote_directories[directory].path, file);

			remote_directories[file_path] = {
				'path': file_path
			}
		}
		//For easy access to parent directories later
		let sub_directory_list = remote_directories[directory].sub_directories;
		
		if (sub_directory_list != null) {
			if (sub_directory_list.length > 0) {
				for (i = 0; i < sub_directory_list.length; i++) {
					sub_dir_index = path.join(directory, sub_directory_list[i]);
					remote_directories[sub_dir_index].parent_directory = directory;
				}
			}
		}
	}
}

function liOnClick(event) {
	event.preventDefault();
	event.stopPropagation();
	if (event.shiftKey == true) {

		if (program_state.selected_files.length > 0) {

			let ul = document.getElementById('file-name-list');
			let li_list = ul.getElementsByTagName('li');

			let first = false;
			for (i = 0; i < li_list.length; i++) {
				if (first == true && (program_state.recent_selection == li_list[i].id || event.target.id == li_list[i])) {
					first = false;
				}
				else if ((program_state.recent_selection == li_list[i].id || event.target.id == li_list[i]) && first == false) {
					first = true;
				}

				if (first == true) {
					li_list[i].style.backgroundColor = '#4863A0'
					program_state.selected_files.push(path.join(program_state.current_directory, li_list[i].id));
				}
				else {
					li_list[i].style.backgroundColor = '#99badd';
				}
			}
		}
		else {

			//Set currently selected items back to default background color
			for (i = 0; i < program_state.selected_files.length; i++){
				let { dir, name, ext } = path.parse(program_state.selected_files[i]);
				document.getElementById(name + ext).style.backgroundColor = '#99badd';
			}

			//Clear selected files so only one can be selected at a time unless shift or control
			//is clicked.
			program_state.selected_files.length = 0;

			//set selected item's background color.
			event.currentTarget.style.backgroundColor = '#4863A0';
			program_state.selected_files.push(path.join(program_state.current_directory, event.target.id));
			program_state.recent_selection = event.target.id;
			
		}

	}
	else if (event.ctrlKey == true) {
		program_state.selected_files.push(path.join(program_state.current_directory, event.target.id));
		event.currentTarget.style.backgroundColor = '#4863A0';
		program_state.recent_selection = event.target.id;
	}
	else {

		//Set currently selected items back to default background color
		for (i = 0; i < program_state.selected_files.length; i++){
			let { dir, name, ext } = path.parse(program_state.selected_files[i]);
			document.getElementById(name + ext).style.backgroundColor = '#99badd';
		}

		//Clear selected files so only one can be selected at a time unless shift or control
		//is clicked.
		program_state.selected_files.length = 0;

		//set selected item's background color.
		event.currentTarget.style.backgroundColor = '#4863A0';
		program_state.selected_files.push(path.join(program_state.current_directory, event.target.id));
		program_state.recent_selection = event.target.id;
	}
}

//Removes all selections
function fileWindowClick(event) {

	//Set currently selected items back to default background color
	for (i = 0; i < program_state.selected_files.length; i++){
		let { dir, name, ext } = path.parse(program_state.selected_files[i]);
		document.getElementById(name + ext).style.backgroundColor = '#99badd';
	}

	program_state.selected_files.length = 0;
	program_state.recent_selection = null;
}


function droppedInWindow(event) {

	//Get path of where the file is being moved to
   	let end_location = remote_directories[program_state.base_directory].path;
 
   	//Get path of files to move
	let files_to_send_path = [];
	let directories_to_send_path = [];   
   	let event_files_length = event.dataTransfer.files.length;
	let event_files = event.dataTransfer.files;

   	for (let i = 0; i < event_files_length; i++){
		let { dir, name, ext } = path.parse(event_files[i].path)
		//Dropped item is a directory
		if (ext == '') {
			directories_to_send_path.push(event_files[i].path)
		}
		else {
			files_to_send_path.push(event_files[i].path);
		}
   	}

   	//Create and send necessary information for client.py
   	drop_body = {
   		'sending_to': end_location,
		'files_to_send': files_to_send_path,
		'directories_to_send': directories_to_send_path,
		'base_path': program_state.base_directory
	   }
	   
	program_state.show_dir = true;
	event.currentTarget.style.backgroundColor = '#99badd';
   	ipcRenderer.send('ondrop', JSON.stringify(drop_body));
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
	let selection_path = path.join(program_state.current_directory, event.target.id);
	let selected_directory = remote_directories[selection_path];

	if (selected_directory == null){
		alert("Unable to find selection.")
		return false;
	}

	//Remove current <li> elements
	file_list_ul = document.getElementById("file-name-list");

	while(file_list_ul.firstChild) {
		file_list_ul.removeChild(file_list_ul.lastChild);
	}

	//Create Directories as <li>
	file_body = {
		'directory': true,
		'to_display': selected_directory.sub_directories,
		'image': 'images/file_folder.png'
	}

	create_li_elements(file_body);

	//Create Files as <li>
	file_body['directory'] = false;
	file_body['to_display'] = selected_directory.file_names;
	file_body['image'] = 'images/txt-file-icon.png'

	create_li_elements(file_body);

	//Update program state
	program_state.current_directory = selected_directory.path;
	program_state.previous_directory = remote_directories[selected_directory.path].parent_directory;

}

//This function shows the desired directory when the window loads.
function showDir() {

	//Remove current <li> elements
	file_list_ul = document.getElementById("file-name-list");

	while(file_list_ul.firstChild) {
		file_list_ul.removeChild(file_list_ul.lastChild);
	}

	//Create Directories as <li>
	selected_directory = remote_directories[program_state.current_directory];
	file_body = {
		'directory': true,
		'to_display': selected_directory.sub_directories,
		'image': 'images/file_folder.png'
	}

	create_li_elements(file_body);

	//Create Files as <li>
	file_body['directory'] = false;
	file_body['to_display'] = selected_directory.file_names;
	file_body['image'] = 'images/txt-file-icon.png'

	create_li_elements(file_body);
}

function handleKeyDown(event) {
	var key = event.keyCode || event.charCode;
	
	if (key == 8) {
		showPrevDir(event);
	}
	else if (key == 46) {
		deleteFileDir(event);
	}
}

function deleteFileDir(event){
	program_state.show_dir = true;
	ipcRenderer.send('delete-file-dir', JSON.stringify(program_state.selected_files), program_state.current_directory);
}

function showPrevDir(event) {

	//If we are as far back as is allowed, don't do anything
    if (program_state.current_directory == program_state.base_directory) {
    	return false;
    }
    	
	selected_directory = remote_directories[program_state.previous_directory];
		
	//Remove current <li> elements
	file_list_ul = document.getElementById("file-name-list");

	while(file_list_ul.firstChild) {
		file_list_ul.removeChild(file_list_ul.lastChild);
	}

	//Create Directories as <li>
	file_body = {
		'directory': true,
		'to_display': selected_directory.sub_directories,
		'image': 'images/file_folder.png'
	}

	create_li_elements(file_body);

	//Create Files as <li>
	file_body['directory'] = false;
	file_body['to_display'] = selected_directory.file_names;
	file_body['image'] = 'images/txt-file-icon.png'

	create_li_elements(file_body);

	program_state.current_directory = program_state.previous_directory;
	program_state.previous_directory = remote_directories[program_state.current_directory].parent_directory;

};

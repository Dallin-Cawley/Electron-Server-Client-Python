const electron = require('electron');
const {ipcRenderer} = electron;

window.onload = get_file_names();
var remote_directories;

var program_state = {
	'current_user': null,
	'current_directory': null,
	'dropped_in_window': null
}

document.addEventListener("keydown", showPrevDir);

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

			ipcRenderer.send('ondragstart', remote_directories[event.target.id].file_path);
		}

		if (directory == true){
			//OnDrop events
			li_node.ondrop = (event) => {
				event.preventDefault();
				event.stopPropagation();
				
				//Get path of where the file is being moved to
		    	let drop_dir_name = event.target.id;
		    	let end_location = remote_directories[drop_dir_name].current_directory;

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

ipcRenderer.on('file-names', function(event, directory_info){

	//Localize these variables for future use
	program_state.current_user = directory_info["user"];
	remote_directories = directory_info;
	program_state.current_directory = program_state.current_user;

	update_file_paths()

	//Create Directories as <li>
	file_body = {
		'directory': true,
		'to_display': directory_info[program_state.current_user].sub_directories,
		'image': 'images/file_folder.png'
	}

	create_li_elements(file_body);

	//Create Files as <li>
	file_body['directory'] = false;
	file_body['to_display'] = directory_info[program_state.current_user].file_names;
	file_body['image'] = 'images/txt-file-icon.png'

	create_li_elements(file_body);
})

ipcRenderer.on('update-file-names', function(event, response_body) {
	updated_directories = response_body["updated_directories"];

	for (dir_key in updated_directories) {
		updated_directories[dir_key]["parent_directory"] = remote_directories[dir_key].parent_directory;
		remote_directories[dir_key] = updated_directories[dir_key];
	}

	if (program_state.dropped_in_window == true){
		showDir();
		program_state.dropped_in_window = false;
	}

})

//Add all files with their current location to the global
//remote_directories for easy use when dragging and dropping
function update_file_paths() {
	let i = 0
	let j = 0
	console.log('\nRemote directories Before:', remote_directories)
	for (directory in remote_directories) {
		console.log('Directory ', j,':', directory);
		j++;
		if (directory == 'user') {
			break;
		}
		else if (directory == program_state.current_user) {
			i++;
		}

		//For easy access to file paths later
		for (file_index in remote_directories[directory].file_names){
			
			file = remote_directories[directory].file_names[file_index];
			let file_path = remote_directories[directory].current_directory + '\\' + file;

			remote_directories[file] = {
				'file_path': file_path
			}
		}
		console.log("Before adding parent directory")
		//For easy access to parent directories later
		let sub_directories = remote_directories[directory].sub_directories;

		if (sub_directories.length > 0) {
			for (sub_directory of sub_directories) {
				remote_directories[sub_directory].parent_directory = directory;
			}
		}

		// remote_directories[directory]["parent_directory"] = program_state.current_user;
	}
	console.log('\nRemote directories After: ', remote_directories)
}

function droppedInWindow(event) {

	//Get path of where the file is being moved to
   	let end_location = remote_directories[program_state.current_user].current_directory;
 
   	//Get path of files to move
   	let files_to_send_path = [];
   	let event_files_length = event.dataTransfer.files.length;
   	let event_files = event.dataTransfer.files;

   	for (let i = 0; i < event_files_length; i++){
   		files_to_send_path.push(event_files[i].path);
   	}

   	//Create and send necessary information for client.py
   	drop_body = {
   		'sending_to': end_location,
   		'files_to_send': files_to_send_path
	   }
	   
	program_state.dropped_in_window = true;
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

function showDirOnEvent(event) {
	event.preventDefault();
	event.stopPropagation();

	selected_directory = remote_directories[event.target.id];

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

	program_state.current_directory = event.target.id;
}

function showDir() {

	//Remove current <li> elements
	file_list_ul = document.getElementById("file-name-list");

	while(file_list_ul.firstChild) {
		file_list_ul.removeChild(file_list_ul.lastChild);
	}

	console.log("Current Directory: ", program_state.current_directory)
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

function showPrevDir(event) {

    var key = event.keyCode || event.charCode;

    if( key == 8) {

    	if (program_state.current_directory == program_state.current_user) {
    		return false;
    	}

    	previous_directory = remote_directories[program_state.current_directory]["parent_directory"];
    	
		selected_directory = remote_directories[previous_directory];
		
		//Remove current <li> elements
		console.log("Selected Directory: ", selected_directory, "\n");
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

		program_state.current_directory = previous_directory;
    }
};

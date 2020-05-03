const electron = require('electron');
const {ipcRenderer} = electron;

window.onload = get_file_names();
var remote_directories;
var current_user;

function get_file_names() {
    console.log('onload event loaded')
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

		   	console.log("this.id: ", event.target.id);

		   	//Get file path of dragged element
		   	let item_name = event.target.id;

			ipcRenderer.send('ondragstart', remote_directories[item_name].current_directory);
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
		}

		//Add it to <ul id="file-name-list">
		ul.appendChild(li_node);
	}
}

ipcRenderer.on('file-names', function(event, directory_info){
	console.log("file names: ", directory_info);

	//Localize these variables for future use
	current_user = directory_info["user"];
	remote_directories = directory_info;

	update_file_paths()

	//Create Directories as <li>
	file_body = {
		'directory': true,
		'to_display': directory_info[current_user].sub_directories,
		'image': 'images/file_folder.png'
	}

	create_li_elements(file_body);

	//Create Files as <li>
	file_body['directory'] = false;
	file_body['to_display'] = directory_info[current_user].file_names;
	file_body['image'] = 'images/txt-file-icon.png'

	create_li_elements(file_body);
})

function update_file_paths() {
	let i = 0
	for (directory in remote_directories) {
		console.log('directory: ', directory);
		if (directory == current_user && i > 0) {
			break;
		}
		i++;
		for (file_index in remote_directories[directory].file_names){
			file = remote_directories[directory].file_names[file_index];
			let file_path = remote_directories[directory].current_directory + '\\' + file;
			console.log('file: ', file_path);
			remote_directories[file] = {
				'current_directory': file_path
			}
		}
	}
	console.log("updated directories: ", remote_directories)
}

function droppedInWindow(event) {

	//Get path of where the file is being moved to
   	let drop_dir_name = current_user;
   	let end_location = remote_directories[drop_dir_name].current_directory;
 
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

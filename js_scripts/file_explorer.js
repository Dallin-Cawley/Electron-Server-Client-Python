const electron = require('electron');
const {ipcRenderer} = electron;

window.onload = get_file_names();
var remote_directories;
var current_user;

function get_file_names() {
    console.log('onload event loaded')
    ipcRenderer.send('get-file-names')
}

ipcRenderer.on('file-names', function(event, file_names){
	console.log("file names: ", file_names)

	//Localize these variables for future use
	current_user = file_names["user"];
	remote_directories = file_names;
	
	// Prepare local variables for repeated use in loop
	let ul = document.getElementById("file-name-list")
	let sub_directories = file_names[current_user].sub_directories
	let folder_image_src = "images/file_folder.png"

	//Begin dynamically creating the list of files
	for (dir_index in sub_directories){

		//Create <li> element
		let li_node = document.createElement("LI");
		let text = document.createTextNode(sub_directories[dir_index]);
		
		//Create and adjust image
		let image = document.createElement("IMG")
		image.id = sub_directories[dir_index];
		image.setAttribute('src', folder_image_src);
		image.width = "100";
		image.height = "100";

		li_node.appendChild(text);
		li_node.appendChild(image);

		/*********************************
		Create events for all <li> nodes
		*********************************/
		//OnDrop events
		li_node.ondrop = (event) => {
			//Get path of where the file is being moved to
	    	let drop_dir_name = current_user;
	    	let end_location = remote_directories[drop_dir_name].current_directory;
	 
	    	//Get path of files to move
	    	let files_to_send_path = []
	    	let event_files_length = event.dataTransfer.files.length;
	    	let event_files = event.dataTransfer.files;

	    	for (let i = 0; i < event_files_length; i++){
	    		files_to_send_path.push(event_files[i].path);
	    	}

	    	drop_body = {
	    		'sending_to': end_location,
	    		'files_to_send': event.dataTranser.files[0]
	    	}

	    	ipcRenderer.send('ondrop', drop_body)

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

		//Drag Events
		li_node.ondragstart = (event) => {
	    	event.preventDefault();
	    	event.stopPropagation();

	    	console.log("this.id: ", event.target.id);

	    	//Get file path of dragged element
	    	let item_name = event.target.id;
	    	console.log(remote_directories[item_name]);
	   		ipcRenderer.send('ondragstart', remote_directories[item_name].current_directory);
		}


		//Add it to <ul id="file-name-list">
		ul.appendChild(li_node);
	}
})



	function droppedInWindow(event) {

		//Get path of where the file is being moved to
    	let drop_dir_name = current_user;
    	let end_location = remote_directories[drop_dir_name].current_directory;
 
    	//Get path of files to move
    	let files_to_send_path = []

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

    	ipcRenderer.send('ondrop', JSON.stringify(drop_body))
	}

	function draggedOverWindow(event) {
		event.preventDefault();
		event.currentTarget.style.backgroundColor = 'blue';
	}

	function draggedLeftWindow(event) {
		event.preventDefault();
		event.currentTarget.style.backgroundColor = '#99badd';
	}

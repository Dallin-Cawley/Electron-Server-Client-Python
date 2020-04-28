const electron = require('electron');
const {ipcRenderer} = electron;

window.onload = get_file_names();
let remote_directories;
let current_user;

function get_file_names() {
    console.log('onload event loaded')
    ipcRenderer.send('get-file-names')
}

ipcRenderer.on('file-names', function(event, file_names){
	console.log("file names: ", file_names)

	//Localize these variables for future use
	current_user = file_names["user"];
	remote_directories = file_names;
	
	// Prepare local variables for repeated us in loop
	ul = document.getElementById("file-name-list")
	sub_directories = file_names[current_user].sub_directories
	folder_image_src = "images/file_folder.png"

	//Begin dynamically creating the list of files
	for (dir_index in sub_directories){

		//Create <li> element
		var li_node = document.createElement("LI");
		var text = document.createTextNode(sub_directories[dir_index]);

		//Create and adjust image
		var image = document.createElement("IMG")
		image.id = sub_directories[dir_index];
		image.setAttribute('src', folder_image_src);
		image.width = "100";
		image.height = "100";

		li_node.appendChild(text);
		li_node.appendChild(image);


		//Add it to <ul id="file-name-list">
		ul.appendChild(li_node);
	}
})

	document.getElementById('file-name-list').ondragstart = (event) => {
    	event.preventDefault();
    	event.stopPropatation();

    	//Get file path of dragged element
    	let item_name = event.target.id;
    	console.log(remote_directories[item_name])
   		ipcRenderer.send('ondragstart', remote_directories[item_name].current_directory)
	}

	document.getElementById('file-name-list').ondrop = (event) => {
		event.preventDefault();
		event.stopPropagation();
		console.log('on drop in <li> element');

		//Get file path of element to drop in
    	let drop_dir_name = event.target.id;
    	end_location = remote_directories[drop_dri_name].current_directory;

    	drop_body = {
    		'sending_to': end_location,
    		'file_to_send': event.dataTranser.files[0]
    	}

    	ipcRenderer.send('ondrop', drop_body)

	}

	document.getElementById('file-display').ondrop = (event) => {
		event.preventDefault();
		event.stopPropagation();
		console.log('on drop in <body> tag');

		//Get file path of element to drop in
    	let drop_dir_name = current_user;
    	end_location = remote_directories[drop_dir_name].current_directory;
    	console.log("event id: ", event.tagName)

    	drop_body = {
    		'sending_to': end_location,
    		'file_to_send': event.dataTranser.files[0]
    	}

    	ipcRenderer.send('ondrop', drop_body)
    }

    //Handle Hover Events
   	document.getElementById('file-name-list').ondragover = function(event) {
   		event.preventDefault();
   		event.stopPropagation();
		event.target.style.backgroundColor = 'blue';
   	}
    document.getElementById('mainBody').ondragover = function(event) {
   		event.preventDefault();
   		event.stopPropagation();
		event.target.style.backgroundColor = 'blue';
   	}


   	//Handle dragged item leaving valid drop zone
	document.getElementById('file-name-list').ondragleave = function(event) {
		event.preventDefault();
		event.stopPropagation();
		event.target.style.backgroundColor = '#99badd';
	}
	document.getElementById('mainBody').ondragleave = function(event) {
		event.preventDefault();
		event.stopPropagation();
		event.target.style.backgroundColor = '#99badd';
	}

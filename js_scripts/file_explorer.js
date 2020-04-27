const electron = require('electron');
const {ipcRenderer} = electron;

window.onload = get_file_names();
let directories;

function get_file_names() {
    console.log('onload event loaded')
    ipcRenderer.send('get-file-names')
}

ipcRenderer.on('file-names', function(event, file_names){
	console.log("file names: ", file_names)
	directories = file_names;
	ul = document.getElementById("file-name-list")
	sub_directories = file_names["Dallin"].sub_directories
	folder_image_src = "images/file_folder.png"

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

    	//Get file path of dragged element
    	let item_name = event.target.id;
    	console.log(directories[item_name])
   		ipcRenderer.send('ondragstart', directories[item_name].current_directory)
	}

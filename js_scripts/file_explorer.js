const electron = require('electron');
const {ipcRenderer} = electron;

window.onload = get_file_names();

function get_file_names() {
    console.log('onload event loaded')
    ipcRenderer.send('get-file-names')
}

ipcRenderer.on('file-names', function(event, file_names){
	console.log("file names: ", file_names)
	ul = document.getElementById("file-name-list")
	sub_directories = file_names["Dallin"].sub_directories
	folder_image_src = "images/file_folder.png"

	for (dir_index in sub_directories){

		//Create <li> element
		var li_node = document.createElement("LI");
		var text = document.createTextNode(sub_directories[dir_index]);

		//Create and adjust image
		var image = document.createElement("IMG")
		image.setAttribute('src', folder_image_src);
		image.width = "50";
		image.height = "50";

		li_node.appendChild(image);
		li_node.appendChild(text);

		//Add it to <ul id="file-name-list">
		ul.appendChild(li_node);
	}
})
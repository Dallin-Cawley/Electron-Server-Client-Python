const path = require('path');
const { NONAME } = require('dns');
var remoteDirectories;

class Directory {
    constructor (dirName, parentPath) {
        this.dirName = dirName;
        this.fullPath = path.join(parentPath, dirName);
    }
}



class FileExplorerDropDown {
    constructor (divContainer, parentFolder) {
        this.divContainer = divContainer;
        this.parentFolder = parentFolder;

        this.parentDropDownItem = new DropDownItem(parentFolder, '', divContainer);
        this.parentDropDownItem.dirContainer.ondblclick = this.onDblClick.bind(this);
        this.parentDropDownItem.dirContainer.onclick = this.onClick.bind(this);
        this.parentDropDownItem.dirContainer.classList.add('pointer-hover');
        this.parentDropDownItem.dirContainer.id = parentFolder;
        this.parentDropDownItem.dirContainer.style.userSelect = 'none';
        this.parentDropDownItem.dirContainer.ondrop = this.onDrop;
        this.parentDropDownItem.dirContainer.ondragover = this.onDragOver.bind(this);
        this.parentDropDownItem.dirContainer.ondragleave = this.onDragLeave.bind(this);

        this.dropDownItems = {};
        this.dropDownItems[this.parentFolder] = this.parentDropDownItem;
    }

    /* The id is the directory path from the parent path */
    addItem(subDirName, parentPath, parentDOM) {
        let newItem = new DropDownItem(subDirName, parentPath, parentDOM);
        
        let li = document.createElement('li');
        li.appendChild(newItem.dirContainer);
        
        newItem.li = li;
        newItem.li.id = newItem.fullPath;
        
        newItem.li.style.listStyle = 'none';
        newItem.li.style.width = 'auto';
        newItem.li.style.maxWidth = '200px';
        newItem.li.style.height = 'auto';
        newItem.li.style.marginLeft = '-30px';
        newItem.li.style.userSelect = 'none';
        newItem.li.style.textOverflow = 'fade';
        newItem.li.style.display = 'block';
        newItem.li.style.overflow = 'hidden';
        newItem.li.style.whiteSpace = 'nowrap';
        newItem.li.style.float = 'left';

        newItem.li.classList.add('pointer-hover');
        newItem.li.onclick = this.onClick.bind(this);
        newItem.li.ondblclick = this.onDblClick.bind(this);

        newItem.dirContainer.ondrop = this.onDrop;
        newItem.dirContainer.ondragover = this.onDragOver.bind(this);
        newItem.dirContainer.ondragleave = this.onDragLeave.bind(this);

        parentDOM.appendChild(newItem.li);

        let newItemKey = path.join(parentPath, subDirName);
        this.dropDownItems[newItemKey] = newItem;
    }

    findItem(id) {
        return this.dropDownItems[id];
    }

    onDragLeave(event) {
        event.preventDefault();
        event.stopPropagation();
        let id;
        if (event.target.id == null) {
            if (event.currentTarget.id == null) {
                return
            }
            else {
                id = event.currentTarget.id
            }
        }
        else {
            id = event.target.id
        }
        this.findItem(id).dirContainer.style.backgroundColor = 'transparent';
    }

    onDragOver(event) {
        event.preventDefault();
        event.stopPropagation();
        let id;
        if (event.target.id == null) {
            if (event.currentTarget.id == null) {
                return
            }
            else {
                id = event.currentTarget.id
            }
        }
        else {
            id = event.target.id
        }
        this.findItem(id).dirContainer.style.backgroundColor = 'blue';
    }

    onDrop(event) {
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
        event.currentTarget.style.backgroundColor = 'transparent';
        ipcRenderer.send('ondrop', JSON.stringify(droppedItems));

    }

    onClick(event) {
        event.stopPropagation();

        let id = event.currentTarget.id;
        let dom = event.currentTarget;
        let clickedItem = this.findItem(id);

        if (clickedItem.subDirDisplayed == true) {  
            let removedUL = dom.removeChild(clickedItem.childUL);
            clickedItem.childUL = null;

            //Free up memory from dropDownItems
            let childrenLI = removedUL.getElementsByTagName('li');
            let childrenLILength = childrenLI.length;

            for (i = 0; i < childrenLILength; i++) {
                delete this.dropDownItems[childrenLI[i].id];
            }

            //Rotate arrow back to closed position
            clickedItem.dropdownArrow.style.transform = 'rotate(-45deg)';

            //Change state of clickedItem.subDirDisplayed
            clickedItem.subDirDisplayed = false;
            return;
        }

        let subDirectories = remoteDirectories[id].sub_directories;

        let ul = document.createElement('ul');
        for (i = subDirectories.length - 1; i >= 0; i--) {
            this.addItem(subDirectories[i], id, ul);
        }
        dom.appendChild(ul);
        clickedItem.childUL = ul;

        clickedItem.dropdownArrow.style.transform = 'rotate(45deg)';
        clickedItem.subDirDisplayed = true;
    }

    onDblClick(event) {
        event.stopPropagation();

        programState.previousDirectory = programState.currentDirectory;
        programState.currentDirectory = this.findItem(event.currentTarget.id).fullPath;

        showDir();
    }



}


class DropDownItem extends Directory{
    constructor (dirName, parentPath, parentDOM) {
        super(dirName, parentPath);
        this.fullPath = path.join(parentPath, dirName);
        this.parentDOM = parentDOM;
        this.dropdownArrow = this.createDropDownArrow();
        this.dirContainer = this.createDirDiv('', '');
        this.subDirectories = null;
        this.subDirDisplayed = false;
        this.childUL = null;
        
        parentDOM.appendChild(this.dirContainer);
    }

    createDropDownArrow() {
        let arrowDiv = document.createElement('div');
        arrowDiv.classList.add('dropdown-arrow');
        arrowDiv.style.transform = 'rotate(-45deg)';
        arrowDiv.style.transition = '250ms';
        
        return arrowDiv;
    }

    createDirDiv(dirName, parentPath) {
        let textNode;
        let dropDownArrow;
        let fullPath;

        if (dirName == '') {
            dirName = this.dirName;
            textNode = document.createTextNode(dirName);
            dropDownArrow = this.dropdownArrow;
            fullPath = this.fullPath;
        }
        else {
            textNode = document.createTextNode(dirName);
            dropDownArrow = this.createDropDownArrow();
            fullPath = path.join(parentPath, dirName);
        }

        let dirContainer = document.createElement('div');
        dirContainer.style.width = '200px';
        dirContainer.id = fullPath;
        let columnWidth = '20px ' + (dirName.length * 8).toString() + 'px';
        
        dirContainer.appendChild(dropDownArrow);
        dirContainer.appendChild(textNode);

		dirContainer.style.display = 'grid';
		dirContainer.style.gridTemplateColumns = columnWidth;
        dirContainer.style.gridTemplateRows = '25px';    
        dirContainer.style.marginLeft = '10px';    
        return dirContainer;
    }
}
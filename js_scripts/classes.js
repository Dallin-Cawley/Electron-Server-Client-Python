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
        this.parentDropDownItem.dirContainer.onclick = this.onClick.bind(this);
        this.parentDropDownItem.dirContainer.id = parentFolder;

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
        newItem.li.style.height = 'auto';
        newItem.li.style.marginLeft = '-30px';
        newItem.li.onclick = this.onClick.bind(this);

        parentDOM.appendChild(newItem.li);

        let newItemKey = path.join(parentPath, subDirName);
        this.dropDownItems[newItemKey] = newItem;
    }

    findItem(id) {
        return this.dropDownItems[id];
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
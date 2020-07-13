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

        console.log('LI width:', newItem.li.offsetWidth);
        console.log('Div width:', newItem.dirContainer.offsetWidth);

        parentDOM.appendChild(newItem.li);

        let newItemKey = path.join(subDirName, parentPath);
        this.dropDownItems[newItemKey] = newItem;
    }

    findItem(id) {
        return this.dropDownItems[id];
    }

    onClick(event) {
        event.stopPropagation();

        let id = event.currentTarget.id;
        let dom = event.currentTarget;

        let subDirectories = remoteDirectories[id].sub_directories;
        let childNodeLength = dom.childNodes.length;

        for (i = 2; i < childNodeLength; i++) {
            event.target.removeChild(dom.lastChild);
        }

        let ul = document.createElement('ul');
        for (i = subDirectories.length - 1; i >= 0; i--) {
            this.addItem(subDirectories[i], id, ul);
        }
        dom.appendChild(ul);
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

        parentDOM.appendChild(this.dirContainer);
    }

    createDropDownArrow() {
        let arrowDiv = document.createElement('div');
        arrowDiv.classList.add('dropdown-arrow');
        arrowDiv.style.transform = 'rotate(-45deg)';
        
        return arrowDiv;
    }

    createDirDiv(dirName, parentPath) {
        let textNode;
        let dropDownArrow;
        let fullPath;

        if (dirName == '') {
            textNode = document.createTextNode(this.dirName);
            dropDownArrow = this.dropdownArrow;
            fullPath = this.fullPath;
        }
        else {
            textNode = document.createTextNode(dirName);
            dropDownArrow = this.createDropDownArrow();
            fullPath = path.join(parentPath, dirName);
        }

        let dirContainer = document.createElement('div');
        let columnWidth = '20px ' + (dirName.length * 8).toString() + 'px';
        
        dirContainer.appendChild(dropDownArrow);
        dirContainer.appendChild(textNode);

		dirContainer.style.display = 'grid';
		dirContainer.style.gridTemplateColumns = columnWidth;
        dirContainer.style.gridTemplateRows = '25px';        
        return dirContainer;
    }
}
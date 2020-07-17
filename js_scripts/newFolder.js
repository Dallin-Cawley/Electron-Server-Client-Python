const { ipcRenderer, remote } = require('electron');


const childDocument = getDocument();
const childWindow = remote.getCurrentWindow();

function closeWindow(event) {
    remote.getCurrentWindow().close();
}

function submitFileName(event) {
    console.log('Submitting folder');
    folderNameInput = childDocument.getElementById('folder-name-input');
    console.log("Folder name:", folderNameInput.value);
    ipcRenderer.send('new-folder', folderNameInput.value);
    closeWindow(event);

}

ipcRenderer.on('message-to-second-window', (message) => {
    console.log('message');
})
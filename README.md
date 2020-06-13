# Electron-Server-Client-Python
This Python Client/Server uses Electron by GitHub as it's GUI. This program converts older Linux or Windows machines into remote storage that can be accessed anywhere there is an internet connection. The GUI is a File Exploerer allowing the user to navigate their files on the remote machine.

The Server reads/writes files in a designated directory specified by the user. The Server keeps track of each user via a hashed username/password system. Each user only has access to the files inside their user folder.

The Client can send upload, download, and delete requests. Each request recieves an updated directory and file list except for the download request. Navigation in the Client is currently with the double-click to enter a folder and the delete key for back navigation. In the future there will be navigation buttons.

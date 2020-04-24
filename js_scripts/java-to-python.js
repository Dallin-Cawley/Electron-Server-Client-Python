const electron = require('electron');
const {ipcRenderer} = electron;

window.onL
const login_form = document.getElementById("login-form");
login_form.addEventListener('submit', submitLoginForm);

function submitLoginForm(event) {
	event.preventDefault();
	const login_info = {
		username: document.getElementById('username').value,
		password: document.getElementById('password').value
	};
	ipcRenderer.send('login_info', login_info);
}
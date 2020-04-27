const electron = require('electron');
const {ipcRenderer} = electron;

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

ipcRenderer.on('incorrect_login', function(event) {
	document.getElementById('user-pass-incorrect').innerHTML = "Username or Password is Incorrect"
})
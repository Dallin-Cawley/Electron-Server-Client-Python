const electron = require('electron');
const {ipcRenderer} = electron;

const loginForm = document.getElementById("login-form");
loginForm.addEventListener('submit', submitLoginForm);

const loginAnimation = document.getElementById("login_animation");

function submitLoginForm(event) {
	event.preventDefault();
	const loginInfo = {
		username: document.getElementById('username').value,
		password: document.getElementById('password').value
	};
	ipcRenderer.send('login_info', loginInfo);

	loginAnimation.style.display = "flex";
	loginAnimation.style.justifyContent = "center";
	loginAnimation.style.marginTop = "50px";

}

ipcRenderer.on('incorrect_login', function(event) {
	document.getElementById('user-pass-incorrect').innerHTML = "Username or Password is Incorrect"
})
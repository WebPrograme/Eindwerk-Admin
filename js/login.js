import Auth from '../modules/Auth.js';

Auth.logout();

document.querySelector('.login-btn').addEventListener('click', () => {
	try {
		const loadingBtn = document.querySelector('.login-btn').innerHTML.replace('<i class="fa-brands fa-google"></i>', '<i class="fa-solid fa-circle-notch fa-spin"></i>');
		document.querySelector('.login-btn').innerHTML = loadingBtn;
		document.querySelector('.login-btn').disabled = true;

		Auth.login()
			.then((response) => {
				const target = new URLSearchParams(window.location.search).get('target');
				if (target) {
					window.location.href = target;
				} else {
					window.location.href = '/pages/wondelgem.html';
				}
			})
			.catch((error) => {
				alert(error);
			});
	} catch (error) {
		alert('An error occured while logging in. Please try again.');
	}
});

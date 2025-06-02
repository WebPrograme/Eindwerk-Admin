import { postRequest } from './Requests.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js';
import {
	getAuth,
	GoogleAuthProvider,
	onAuthStateChanged,
	getRedirectResult,
	signInWithRedirect,
	signOut,
	signInWithPopup,
	setPersistence,
	browserSessionPersistence,
} from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js';
import firebaseConfig from './Firebase.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const provider = new GoogleAuthProvider();

// Auth
async function login() {
	try {
		const result = await signInWithPopup(auth, provider);
		if (result) {
			const user = result.user;
			localStorage.setItem('user', JSON.stringify(user));
			document.cookie = `AdminID=${user['stsTokenManager']['accessToken']}; path=/`;

			return { user: user, token: user['stsTokenManager']['accessToken'] };
		} else {
			signInWithPopup(auth, provider);
		}
	} catch (error) {
		alert(error);
	}
}

async function getUser() {
	return new Promise(async (resolve, reject) => {
		await setPersistence(auth, browserSessionPersistence);
		onAuthStateChanged(auth, (user) => {
			if (user) {
				localStorage.setItem('user', JSON.stringify({ displayName: user.displayName, email: user.email, photoURL: user.photoURL, uid: user.uid }));
				document.cookie = `AdminID=${getCookieToken()}; path=/`;
				resolve(user);
			} else {
				signOut(auth);
				window.location.href = '/pages/login.html?target=' + window.location.pathname;
			}
		});
	});
}

async function verifyUser() {
	return new Promise((resolve, reject) => {
		postRequest('/api/auth', { token: getCookieToken() })
			.then((response) => {
				resolve(response);
			})
			.catch((error) => {
				reject(error);
			});
	});
}

async function logout() {
	return new Promise((resolve, reject) => {
		signOut(auth)
			.then(() => {
				document.cookie = 'AdminID=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
				localStorage.removeItem('user');

				if (window.location.pathname !== '/pages/login.html') window.location.href = '/pages/login.html';
			})
			.catch((error) => {
				reject(error);
			});
	});
}

function getCookieToken() {
	const user = auth.currentUser;
	if (!user) return '';
	return user['stsTokenManager']['accessToken'];
}

export default {
	login,
	getUser,
	verifyUser,
	getCookieToken,
	logout,
	app,
};

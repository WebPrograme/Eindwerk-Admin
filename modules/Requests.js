import Auth from '../modules/Auth.js';
const baseUrl = 'https://hhkw-eindwerk-api.onrender.com';

async function getCookieToken() {
	return new Promise((resolve, reject) => {
		let token = '';
		document.cookie.split(';').forEach((cookie) => {
			if (cookie.includes('AdminID')) {
				token = cookie.split('=')[1];
			}
		});

		resolve(token);
	});
}

async function postRequest(path, data, headers = { 'Content-Type': 'application/json' }, retry = false, trigger = null) {
	if (trigger) trigger.classList.add('disabled');
	if (!headers['Authorization'] && (await getCookieToken()) != '') headers['Authorization'] = 'Bearer ' + (await getCookieToken());

	return new Promise((resolve, reject) => {
		fetch(baseUrl + path, {
			method: 'POST',
			body: JSON.stringify(data),
			headers: headers,
		})
			.then(async (response) => {
				if (200 <= response.status && response.status < 300) {
					let data;

					if (response.headers.get('Content-Type').includes('application/json')) {
						data = await response.json();
					} else {
						data = response.text();
					}

					resolve({ status: response.status, data: data });
				} else if (retry) {
					postRequest(path, data, headers, false);
				} else {
					reject({ status: response.status, data: response });
				}
			})
			.catch((error) => {
				reject(error);
			})
			.finally(() => {
				if (trigger) trigger.classList.remove('disabled');
			});
	});
}

async function getRequest(path, headers = { 'Content-Type': 'application/json' }, retry = true, trigger = null) {
	if (trigger) trigger.classList.add('disabled');
	if (!headers['Authorization'] && (await getCookieToken()) != '') headers['Authorization'] = 'Bearer ' + (await getCookieToken());

	return new Promise((resolve, reject) => {
		fetch(baseUrl + path, {
			method: 'GET',
			headers: headers,
		})
			.then(async (response) => {
				if (200 <= response.status && response.status < 300) {
					let data;

					if (response.headers.get('Content-Type').includes('application/json')) {
						data = await response.json();
					} else {
						data = await response.text();
					}

					resolve({ status: response.status, data: data });
				} else if (retry) {
					getRequest(path, headers, false);
				} else {
					reject({ status: response.status, data: response });
				}
			})
			.catch((error) => {
				reject(error);
			})
			.finally(() => {
				if (trigger) trigger.classList.remove('disabled');
			});
	});
}

export { postRequest, getRequest };

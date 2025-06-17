import Auth from '../modules/Auth.js';
import { getRequest, postRequest } from '../modules/Requests.js';
import Table from '../modules/Table.js';
import Popover from '../modules/Popover.js';

let globalToken;
const page = window.location.search.includes('page=') ? window.location.search.split('page=')[1].split('&')[0] : 0;
const count = window.location.search.includes('count=') ? window.location.search.split('count=')[1].split('&')[0] : 50;

Auth.getUser()
	.then((data) => {
		document.querySelector('.sidebar .sidebar-profile-img').src = data.photoURL;
		document.querySelector('.sidebar .sidebar-profile-name').innerHTML = data.displayName;

		globalToken = data['stsTokenManager']['accessToken'];
		main(page, count);
	})
	.catch((error) => {
		alert(error);
	});

function updateTable(page, count = 50) {
	document.querySelector('.loader').classList.remove('close');

	getRequest(`/api/form/newsletter/subscriptions?page=${page}&size=${count}`, { 'Content-Type': 'application/json', Authorization: 'Bearer ' + globalToken }, false)
		.then((data) => {
			new Table(document.getElementById('newsletter-table'), {
				data: Object.values(data.data.subscriptions).map((item) => {
					return {
						id: item.ID,
						email: item.Email,
						createdAt: item.CreatedAt,
					};
				}),
				columns: [
					{ title: 'ID', key: 'id' },
					{ title: 'Email', key: 'email' },
					{
						title: 'Tijdstamp',
						key: 'createdAt',
						type: 'string',
						valueResolver: (value) => {
							return (
								new Intl.DateTimeFormat('nl-BE', {
									year: 'numeric',
									month: '2-digit',
									day: '2-digit',
									hour: '2-digit',
									minute: '2-digit',
									second: '2-digit',
								}).format(new Date(value)) +
								' (' +
								(
									new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(new Date(value)).find((part) => part.type === 'timeZoneName') || {
										value: '',
									}
								).value +
								')'
							);
						},
					},
				],
				more: {
					enabled: true,
					limit: count,
					page: page,
					total: data.data.total,
					hasAllData: data.data.total == data.data.subscriptions.length,
					dataRetriever: async (page, limit) => {
						const data = await getRequest(`/api/form/newsletter/subscriptions?page=${page}&size=${limit}`, {
							'Content-Type': 'application/json',
							Authorization: 'Bearer ' + globalToken,
						});
						return Object.values(data.data.subscriptions).map((item) => {
							return {
								id: item.ID,
								email: item.Email,
								createdAt: item.CreatedAt,
							};
						});
					},
				},
			});

			document.querySelector('.loader').classList.add('close');
		})
		.catch((error) => {
			console.error(error);
			document.querySelector('.loader').classList.add('close');

			if (error.status == 403) {
				new Popover(null, {
					content: `<h3>Geen Toegang!</h3>
        		<p>U heeft geen toegang tot deze pagina. Vraag een admin om u toegang te geven.</p>`,
					type: 'error',
					noIcon: true,
					sidebarVisible: false,
					close: false,
				}).show();
			} else {
				new Popover(null, {
					content: `<h3>Fout!</h3>
				<p>Er is iets fout gegaan tijdens het laden van de pagina. Probeer het later opnieuw.</p>`,
					type: 'error',
					noIcon: true,
					sidebarVisible: false,
					close: false,
				}).show();
			}
		});
}

// Main function
async function main(page, count = 50, collection = 'all', fromDate = null, toDate = null) {
	// Update the table with the logs data
	updateTable(page, count);
}

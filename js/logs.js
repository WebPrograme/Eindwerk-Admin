import Auth from '../modules/Auth.js';
import { getRequest, postRequest } from '../modules/Requests.js';
import Table from '../modules/Table.js';
import Popover from '../modules/Popover.js';
import Modal from '../modules/Modal.js';
import Select from '../modules/Select.js';

let globalToken;
const filterCollectionSelect = new Select(document.getElementById('logs-collection').nextElementSibling, document.getElementById('logs-collection'));
const modal = new Modal(document.getElementById('log-details-modal'), null);
const page = window.location.search.includes('page=') ? window.location.search.split('page=')[1].split('&')[0] : 0;
const count = window.location.search.includes('size=') ? window.location.search.split('size=')[1].split('&')[0] : 50;
const collection = window.location.search.includes('collection=') ? window.location.search.split('collection=')[1].split('&')[0] : 'all';
const fromDate = window.location.search.includes('startTime=') ? window.location.search.split('startTime=')[1].split('&')[0] : null;
const toDate = window.location.search.includes('endTime=') ? window.location.search.split('endTime=')[1].split('&')[0] : null;
const icons = {
	'Archief Artikel Toegevoegd': 'plus',
	'Archief Artikel Bijgewerkt': 'pencil',
	'Archief Artikelen Verwijderd': 'trash',
	'Blog Artikel Toegevoegd': 'plus',
	'Blog Artikel Bijgewerkt': 'pencil',
	'Blog Artikelen Verwijderd': 'trash',
	'Blog Event Toegevoegd': 'plus',
	'Blog Event Bijgewerkt': 'pencil',
	'Blog Event Verwijderd': 'trash',
	'Sectie Toegevoegd': 'plus',
	'Sectie Bijgewerkt': 'pencil',
	'Secties Verwijderd': 'trash',
	'Publicatie Toegevoegd': 'plus',
	'Publicatie Bijgewerkt': 'pencil',
	'Publicatie Verwijderd': 'trash',
};

// Initialize the filters
if (collection !== 'all') {
	filterCollectionSelect.setValue(collection);
} else {
	filterCollectionSelect.setValue('all');
}

// Set the date filters if they exist in the URL
if (fromDate) {
	document.getElementById('logs-from-date').setAttribute('value', fromDate);
	document.getElementById('logs-from-date').value = fromDate;
	document.getElementById('logs-from-date').style.setProperty('--date-value', `"${fromDate.split('-')[2]}/${fromDate.split('-')[1]}/${fromDate.split('-')[0]}"`);
}

if (toDate) {
	document.getElementById('logs-to-date').setAttribute('value', toDate);
	document.getElementById('logs-to-date').value = toDate;
	document.getElementById('logs-to-date').style.setProperty('--date-value', `"${toDate.split('-')[2]}/${toDate.split('-')[1]}/${toDate.split('-')[0]}"`);
}

Auth.getUser()
	.then((data) => {
		document.querySelector('.sidebar .sidebar-profile-img').src = data.photoURL;
		document.querySelector('.sidebar .sidebar-profile-name').innerHTML = data.displayName;

		globalToken = data['stsTokenManager']['accessToken'];
		main(page, count, collection, fromDate, toDate);
	})
	.catch((error) => {
		alert(error);
	});

function openLogDetails(log) {
	const hasDeepInfo = log.deepInfo && Object.keys(log.deepInfo).length > 0;
	const deepInfo = hasDeepInfo ? log.deepInfo : null;
	const logDetails = document.getElementById('log-details');
	const goToButton = document.getElementById('log-details-go-to-button');

	logDetails.querySelector('#log-action').innerHTML = log.action;
	logDetails.querySelector('#log-description').innerHTML = log.description;
	logDetails.querySelector('#log-timestamp').innerHTML = new Date(log.createdAt * 1000).toLocaleString('nl-BE', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});
	logDetails.querySelector('#log-deep-info').innerHTML = deepInfo ? JSON.stringify(deepInfo, null, 2) : 'Geen diepte-informatie beschikbaar';

	if (log.action == 'Participant Added' || log.action == 'Participant Updated') {
		goToButton.classList.remove('hidden');
		goToButton.onclick = () => {
			window.location.href = `/pages/lists.html?event=${deepInfo.Event}&userCode=${deepInfo.UserCode}`;
		};
	} else if (log.action == 'Participant Removed') {
		goToButton.classList.remove('hidden');
		goToButton.onclick = () => {
			window.location.href = `/events/${deepInfo.eventId}/participants`;
		};
	} else {
		goToButton.classList.add('hidden');
	}

	modal.open();
}

function updateTable(page, count = 50, collection = 'all', fromDate = null, toDate = null) {
	document.querySelector('.loader').classList.remove('close');

	getRequest(
		`/api/logs?page=${page}&size=${count}&collection=${collection}&startTime=${fromDate}&endTime=${toDate}`,
		{ 'Content-Type': 'application/json', Authorization: 'Bearer ' + globalToken },
		false
	)
		.then((data) => {
			new Table(document.getElementById('logs-table'), {
				data: Object.values(data.data.logs).map((item) => {
					return {
						id: item.id,
						icon: item.Action,
						action: item.Action,
						description: item.Description,
						createdAt: item.CreatedAt._seconds,
						deepInfo: item.DeepInfo,
					};
				}),
				columns: [
					{ title: '', key: 'icon', valueResolver: (value) => `<i data-lucide="${icons[value] ? icons[value] : 'circle'}" class="table-icon"></i>`, center: true },
					{ title: 'Actie', key: 'action' },
					{ title: 'Beschrijving', key: 'description' },
					{
						title: 'Tijdstamp',
						key: 'createdAt',
						type: 'string',
						valueResolver: (value) => {
							const date = new Date(1970, 0, 1, 0, 0, 0, 0);
							date.setSeconds(value);
							return (
								new Intl.DateTimeFormat('nl-BE', {
									year: 'numeric',
									month: '2-digit',
									day: '2-digit',
									hour: '2-digit',
									minute: '2-digit',
									second: '2-digit',
								}).format(date) +
								' (' +
								(new Intl.DateTimeFormat('en-US', { timeZoneName: 'short' }).formatToParts(date).find((part) => part.type === 'timeZoneName') || { value: '' })
									.value +
								')'
							);
						},
					},
				],
				onRowClick: (row, tableData) => {
					// Open the log details modal when a row is clicked
					openLogDetails(Object.values(tableData).find((item) => item.id == row.id));
				},
				more: {
					enabled: true,
					limit: count,
					page: page,
					total: data.data.totalCount,
					hasAllData: data.data.totalCount == data.data.logs.length,
					dataRetriever: async (page, limit) => {
						const data = await getRequest(`/api/logs?page=${page}&size=${limit}&collection=${collection}&startTime=${fromDate}&endTime=${toDate}`, {
							'Content-Type': 'application/json',
							Authorization: 'Bearer ' + globalToken,
						});
						return Object.values(data.data.logs).map((item) => {
							return {
								id: item.id,
								icon: item.Action,
								action: item.Action,
								description: item.Description,
								createdAt: item.CreatedAt._seconds,
								deepInfo: item.DeepInfo,
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

// Event listener for filter
document.getElementById('logs-search-button').addEventListener('click', () => {
	const collection = filterCollectionSelect.getValue();
	const fromDate = document.getElementById('logs-from-date').value;
	const toDate = document.getElementById('logs-to-date').value;

	// Update the URL with the new parameters
	const url = new URL(window.location.href);
	url.searchParams.set('collection', collection);

	if (fromDate) url.searchParams.set('startTime', fromDate);
	if (toDate) url.searchParams.set('endTime', toDate);
	window.history.pushState({}, '', url);

	// Update the table with the new filters
	updateTable(page, count, collection, fromDate, toDate);
});

// Main function
async function main(page, count = 50, collection = 'all', fromDate = null, toDate = null) {
	// Update the table with the logs data
	updateTable(page, count, collection, fromDate, toDate);
}

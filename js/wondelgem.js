import Auth from '../modules/Auth.js';
import Upload from '../modules/Upload.js';
import FormShema from '../modules/FormShema.js';
import { getRequest, postRequest } from '../modules/Requests.js';
import { newArchiveItemInputConfig } from '../modules/FormShemaConfig.js';
import Drawer from '../modules/Drawer.js';
import Tooltip from '../modules/Tooltip.js';
import Modal from '../modules/Modal.js';
import Popover from '../modules/Popover.js';
import Table from '../modules/Table.js';

const page = window.location.search.includes('page=') ? window.location.search.split('page=')[1].split('&')[0] : 0;
const count = window.location.search.includes('count=') ? window.location.search.split('count=')[1].split('&')[0] : 10;

Auth.getUser()
	.then((data) => {
		document.querySelector('.sidebar .sidebar-profile-img').src = data.photoURL;
		document.querySelector('.sidebar .sidebar-profile-name').innerHTML = data.displayName;

		main(data['stsTokenManager']['accessToken'], page, count);
	})
	.catch((error) => {
		window.location.href = '/pages/login.html';
	});

let archiveTotalArticles = 0;
let archiveImage = null;

const deleteArchiveModal = new Modal(document.getElementById('delete-archive-modal'));
const photoPreviewModal = new Modal(document.getElementById('photo-preview-modal'), document.querySelector('.photo-preview-trigger'));
const newArchiveItemDrawer = new Drawer(document.getElementById('add-archive-item-drawer'), document.getElementById('btn-add-archive'), { position: 'right' });
newArchiveItemDrawer.on('open', (drawer, signal) => {
	if (signal !== 'edit') {
		document.querySelector('.archive-item-id-label').innerHTML = '';
		document.getElementById('archive-item-photo').removeAttribute('data-url');
		document.getElementById('archive-item-order').value = parseInt(archiveTotalArticles) + 1;
		document.getElementById('archive-item-order').dataset.old = parseInt(archiveTotalArticles) + 1;
	}
});

async function main(token, page = 0, count = 50) {
	const { status, data } = await getRequest(`/api/archive/all?page=${page}&count=${count}`, { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token });
	const archiveItems = data?.Articles;

	if (!(200 <= status && status < 300)) {
		new Popover(null, {
			content: `<h3>Fout!</h3>
				<p>Er is iets fout gegaan tijdens het laden van de pagina. Probeer het later opnieuw.</p>`,
			type: 'error',
			noIcon: true,
			sidebarVisible: false,
			close: false,
		}).show();

		return;
	}

	try {
		archiveTotalArticles = data.Total;
		document.getElementById('archive-item-last-index').innerHTML = archiveTotalArticles + 1;

		new Table(document.querySelector('.archive-table'), {
			data: archiveItems
				? Object.values(archiveItems).map((item) => {
						return {
							Order: item.Order,
							Title: item.Title,
							Description: item.Description['0'],
							Date: formatDate(item.Date) || `N.v.t.`,
							OnTimeline: item.OnTimeline,
							HasOwnPage: item.HasOwnPage,
							VroonhofTag: item.VroonhofTag,
							CreatedAt: formatCreateDate(item.CreatedAt),
							RawData: item,
						};
				  })
				: [],
			columns: [
				{ title: '#', key: 'Order', type: 'number', center: true },
				{ title: 'Titel', key: 'Title', classes: ['text-bold', 'archive-title'], width: '100%' },
				{ title: 'Beschrijving', key: 'Description', classes: 'archive-description', minWidth: '200px' },
				{
					title: 'Tijdlijn',
					key: 'OnTimeline',
					valueResolver: (value) => (value ? `<i class="fa-solid fa-check fa-fw table-check"></i>` : `<i class="fa-solid fa-xmark fa-fw table-x"></i>`),
					center: true,
				},
				{
					title: 'Eigen Pagina',
					key: 'HasOwnPage',
					valueResolver: (value) => (value ? `<i class="fa-solid fa-check fa-fw table-check"></i>` : `<i class="fa-solid fa-xmark fa-fw table-x"></i>`),
					center: true,
				},
				{
					title: 'Vroonhof',
					key: 'VroonhofTag',
					valueResolver: (value) => (value ? `<i class="fa-solid fa-check fa-fw table-check"></i>` : `<i class="fa-solid fa-xmark fa-fw table-x"></i>`),
					center: true,
				},
				{ title: 'Datum', key: 'Date', type: 'date' },
				{ title: 'Aangemaakt Op', key: 'CreatedAt', type: 'date' },
			],
			rowAttributes: { 'data-id': 'RawData.ID' },
			onRowClick: (data) => openArchiveItemDrawer(data.RawData),
			hasWrapper: false,
			noDataMessage: 'Geen archief items gevonden',
			searchElement: document.querySelector('.search'),
			selectable: true,
			fixed: false,
			selectButtons: [
				{
					text: 'Verwijderen',
					classes: ['btn', 'btn-danger'],
					onClick: (selected) => {
						deleteArchiveModal.open();
					},
				},
			],
			pagination: {
				enabled: true,
				limit: count,
				page: page,
				showMore: true,
				total: archiveTotalArticles,
				hasAllData: false,
				saveInUrl: true,
				dataRetriever: async (page, count) => {
					const { status, data } = await getRequest(`/api/archive/all?page=${page}&count=${count}`, {
						'Content-Type': 'application/json',
						Authorization: 'Bearer ' + token,
					});
					return status === 200
						? Object.values(data.Articles).map((item) => {
								return {
									Order: item.Order,
									Title: item.Title,
									Description: item.Description['0'],
									Date: formatDate(item.Date) || `N.v.t.`,
									OnTimeline: item.OnTimeline,
									HasOwnPage: item.HasOwnPage,
									CreatedAt: formatCreateDate(item.CreatedAt),
									VroonhofTag: item.VroonhofTag,
									RawData: item,
								};
						  })
						: [];
				},
			},
		});

		lucide.createIcons();

		document.querySelector('.loader').classList.add('close');
	} catch (error) {
		document.querySelector('.loader').classList.add('close');
		console.error('Error initializing table:', error);
		new Popover(null, {
			content: `<h3>Fout!</h3>
				<p>Er is iets fout gegaan tijdens het laden van de pagina. Probeer het later opnieuw.</p>${error.message ? `<p>${error.message}</p>` : ''}`,
			type: 'error',
			noIcon: true,
			sidebarVisible: false,
			close: false,
		}).show();
	}
}

async function openArchiveItemDrawer(row) {
	newArchiveItemDrawer.setInputs({
		'#archive-item-title': row.Title,
		'#archive-item-description': Object.values(row.Description).join('\n'),
		'#archive-item-date-day': row.Date.Day,
		'#archive-item-date-month': row.Date.Month,
		'#archive-item-date-year': row.Date.Year,
		'#archive-item-timeline': row.OnTimeline,
		'#archive-item-vroonhof': row.VroonhofTag,
		'#archive-item-page': row.HasOwnPage,
		'#archive-item-id': row.ID,
		'#archive-item-createdat': row.CreatedAt,
		'#archive-item-order': row.Order,
	});

	document.getElementById('archive-item-order').dataset.old = row.Order;
	document.querySelector('.archive-item-id-label').innerHTML = row.ID ? `#${row.ID}` : '';
	newArchiveItemDrawer.open('edit');

	if (row.Image) {
		// if (archiveItemImageTooltip) archiveItemImageTooltip.remove();
		// archiveItemImageTooltip = new Tooltip(
		// 	document.getElementById('archive-item-photo'),
		// 	`<img src="${row.Image}" alt="Archive Item Image" style="width: 100%; height: 100%;">`,
		// 	'left',
		// 	500,
		// 	true
		// );

		document.getElementById('archive-item-photo').setAttribute('data-url', row.Image);

		// Set the value of the input
		document.getElementById('archive-item-photo').classList.add('input-file-active');
		const fileBlob = await fetch(row.Image, { 'Access-Control-Allow-Origin': '*' }).then((response) => response.blob());
		const file = new File([fileBlob], 'archive-item-photo', { type: fileBlob.type });
		const data = new DataTransfer();
		data.items.add(file);

		document.getElementById('archive-item-photo').files = data.files;

		archiveImage = data.files;
	} else {
		document.getElementById('archive-item-photo').removeAttribute('data-url');
	}
}

document.getElementById('archive-item-photo').addEventListener('change', (e) => {
	const file = e.target.files[0];
	const input = document.getElementById('archive-item-photo');

	if (!file) {
		e.preventDefault();
		input.files = archiveImage;
		input.classList.add('input-file-active');
		return;
	}

	Upload.UploadImage('Archive', file, input)
		.then((url) => {
			// if (archiveItemImageTooltip) archiveItemImageTooltip.remove();
			// archiveItemImageTooltip = new Tooltip(input, `<img src="${url}" alt="Archive Item Image" style="width: 100%; height: 100%;">`, 'left', 500, true);
		})
		.catch((error) => {
			alert(error);
		});
});

document.querySelector('.archive-item-save').addEventListener('click', () => {
	const result = FormShema.CheckInputs(newArchiveItemInputConfig);
	const invalidInputs = result[0];

	if (invalidInputs.length > 0) return;

	const shemaData = FormShema.GetInputValues(newArchiveItemInputConfig);
	const data = {
		Title: shemaData['#archive-item-title'],
		Description: shemaData['#archive-item-description'],
		Image: document.getElementById('archive-item-photo').getAttribute('data-url') || '',
		Date: {
			Day: shemaData['#archive-item-date-day'],
			Month: shemaData['#archive-item-date-month'],
			Year: document.getElementById('archive-item-date-year').value,
		},
		OnTimeline: document.getElementById('archive-item-timeline').checked,
		HasOwnPage: document.getElementById('archive-item-page').checked,
		VroonhofTag: document.getElementById('archive-item-vroonhof').checked,
		Order: parseInt(shemaData['#archive-item-order']) > archiveTotalArticles + 1 ? archiveTotalArticles + 1 : parseInt(shemaData['#archive-item-order']),
	};

	const id = document.getElementById('archive-item-id').value;
	const createdAt = document.getElementById('archive-item-createdat').value;
	const oldOrder = parseInt(document.getElementById('archive-item-order').dataset.old);
	const isLast = parseInt(document.getElementById('archive-item-order').value) === archiveTotalArticles + 1;

	if (id) {
		postRequest(
			'/api/archive/update/' + id,
			{ Article: Object.assign(data, { ID: id, CreatedAt: createdAt }), OldOrder: oldOrder, IsLast: isLast },
			{ 'Content-Type': 'application/json' },
			true,
			document.querySelector('.archive-item-save')
		)
			.then((response) => {
				window.location.reload();
			})
			.catch((error) => {
				console.log(error);
			});
	} else {
		postRequest('/api/archive/add', { Article: data, IsLast: isLast }, { 'Content-Type': 'application/json' }, true, document.querySelector('.archive-item-save'))
			.then((response) => {
				window.location.reload();
			})
			.catch((error) => {
				console.log(error);
			});
	}
});

document.querySelector('.archive-item-delete').addEventListener('click', () => {
	const selected = Array.from(document.querySelectorAll('.table tr:has(input:checked)'));
	const ids = selected.map((row) => row.getAttribute('data-id'));

	postRequest('/api/archive/delete', { IDs: ids }, { 'Content-Type': 'application/json' }, true, document.querySelector('.archive-item-delete'))
		.then((response) => {
			window.location.reload();
		})
		.catch((error) => {
			console.log(error);
		});
});

// Update the photo preview modal when attribute changes
const mutationObserver = new MutationObserver((mutationsList, observer) => {
	for (const mutation of mutationsList) {
		if (mutation.type === 'attributes' && mutation.attributeName === 'data-url') {
			const url = mutation.target.getAttribute('data-url');

			if (url && mutation.oldValue !== url) {
				document.querySelector('.photo-preview').src = url;
				document.querySelector('.photo-preview-trigger').classList.remove('hidden');
			} else if (!url) {
				document.querySelector('.photo-preview').src = '';
				document.querySelector('.photo-preview-trigger').classList.add('hidden');
			}
		}
	}
});

mutationObserver.observe(document.getElementById('archive-item-photo'), { attributes: true, attributeFilter: ['data-url'], attributeOldValue: true });

const formatDate = (date) => {
	let { Day, Month, Year } = date;

	if (!Day && !Month && !Year) return null;

	if (!Day && !Month) return Year;
	if (!Day) {
		// If month is a number, convert it to a string with leading zero if necessary
		Month = Month < 10 ? `0${Month}` : Month;
		const month = new Intl.DateTimeFormat('nl-BE', {
			month: 'short',
		}).format(new Date(`${Year}-${Month}-01`));
		return `${month.charAt(0).toUpperCase() + month.slice(1)} ${Year}`;
	}
	return formatCreateDate(`${Year}-${Month}-${Day}`);
};

const formatCreateDate = (date) => {
	date = date.replace(/-/g, '/');
	const month = new Intl.DateTimeFormat('nl-BE', {
		month: 'short',
	}).format(new Date(date));
	return `${new Date(date).getDate()} ${month.charAt(0).toUpperCase() + month.slice(1)} ${new Date(date).getFullYear()}`;
};

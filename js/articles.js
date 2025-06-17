import Auth from '../modules/Auth.js';
import Upload from '../modules/Upload.js';
import FormShema from '../modules/FormShema.js';
import { getRequest, postRequest } from '../modules/Requests.js';
import { newArticleInputConfig } from '../modules/FormShemaConfig.js';
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

let totalArticles = 0;
let articleFile = null;

const formatDate = (date) => {
	const month = new Intl.DateTimeFormat('nl-BE', { month: 'short' }).format(date);
	return `${new Intl.DateTimeFormat('nl-BE', { day: '2-digit' }).format(date)} ${month.charAt(0).toUpperCase() + month.slice(1)} ${new Intl.DateTimeFormat('nl-BE', {
		year: 'numeric',
	}).format(date)}`;
};

const deleteArticleModal = new Modal(document.getElementById('delete-article-modal'));
const photoPreviewModal = new Modal(document.getElementById('photo-preview-modal'), document.querySelector('.photo-preview-trigger'));
const newarticleItemDrawer = new Drawer(document.getElementById('add-article-item-drawer'), document.getElementById('btn-add-article'), { position: 'right' });
newarticleItemDrawer.on('open', async (drawer, signal) => {
	if (signal !== 'edit') {
		document.querySelector('.article-item-id-label').innerHTML = '';
		document.getElementById('article-item-photo').removeAttribute('data-url');
	}
});

async function main(token, page = 0, count = 50) {
	const { status, data } = await getRequest(`/api/blog/articles/all?page=${page}&count=${count}`, { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token });
	const articleItems = data?.Articles;

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

	totalArticles = data.Total;

	new Table(document.querySelector('.articles-table'), {
		data: articleItems
			? Object.values(articleItems).map((item) => {
					return {
						Title: item.Title,
						Description: item.Description['0'],
						Date: formatDate(new Date(item.Timestamp)),
						RawData: item,
					};
			  })
			: [],
		columns: [
			{ title: 'Titel', key: 'Title', classes: ['text-bold', 'article-title'] },
			{ title: 'Beschrijving', key: 'Description', classes: 'article-description' },
			{ title: 'Datum', key: 'Date', type: 'date' },
		],
		rowAttributes: { 'data-id': 'RawData.ID' },
		onRowClick: (data) => openArticleDrawer(data.RawData),
		hasWrapper: false,
		hasPagination: false,
		noDataMessage: 'Geen artikelen gevonden',
		selectable: true,
		selectButtons: [
			{
				text: 'Verwijderen',
				classes: ['btn', 'btn-danger'],
				onClick: (selected) => {
					deleteArticleModal.open();
				},
			},
		],
		searchElement: document.querySelector('.search'),
		pagination: {
			enabled: true,
			limit: count,
			page: page,
			showMore: true,
			total: totalArticles,
			hasAllData: false,
			saveInUrl: true,
			dataRetriever: async (page, count) => {
				const { status, data } = await getRequest(`/api/blog/articles/all?page=${page}&count=${count}`, {
					'Content-Type': 'application/json',
					Authorization: 'Bearer ' + token,
				});
				return status === 200
					? Object.values(data.Articles).map((item) => {
							return {
								Title: item.Title,
								Description: item.Description['0'],
								Type: item.Type,
								Date: formatDate(new Date(item.Timestamp)),
								RawData: item,
							};
					  })
					: [];
			},
		},
	});

	lucide.createIcons();

	document.querySelector('.loader').classList.add('close');
}

async function openArticleDrawer(row) {
	newarticleItemDrawer.setInputs({
		'#article-item-title': row.Title,
		'#article-item-description': Object.values(row.Description).join('\n'),
		'#article-item-id': row.ID,
		'#article-item-createdat': row.CreatedAt,
		'#article-item-timestamp': row.Timestamp,
	});

	document.querySelector('.article-item-id-label').innerHTML = row.ID ? `#${row.ID}` : '';
	newarticleItemDrawer.open('edit');

	document.getElementById('article-item-photo').setAttribute('data-url', row.Image);

	// Set the value of the input
	document.getElementById('article-item-photo').classList.add('input-file-active');

	// Check if the image is cached
	const fileBlob = await fetch(row.Image, { 'Access-Control-Allow-Origin': '*', cache: 'force-cache' }).then((response) => response.blob());
	const file = new File([fileBlob], 'article-item-photo', { type: fileBlob.type });
	const data = new DataTransfer();
	data.items.add(file);

	document.getElementById('article-item-photo').files = data.files;
	articleFile = data.files;
}

document.getElementById('article-item-photo').addEventListener('change', (e) => {
	const file = e.target.files[0];
	const input = document.getElementById('article-item-photo');

	if (!file) {
		e.preventDefault();
		input.files = articleFile;
		input.classList.add('input-file-active');
		return;
	}

	Upload.UploadImage('article', file, input)
		.then((url) => {
			// if (articleItemImageTooltip) articleItemImageTooltip.remove();
			// articleItemImageTooltip = new Tooltip(input, `<img src="${url}" alt="article Item Image" style="width: 100%; height: 100%;">`, 'left', 500, true);
		})
		.catch((error) => {
			alert(error);
		});
});

document.querySelector('.article-item-save').addEventListener('click', () => {
	const result = FormShema.CheckInputs(newArticleInputConfig);
	const invalidInputs = result[0];

	if (invalidInputs.length > 0) return;

	const shemaData = FormShema.GetInputValues(newArticleInputConfig);
	const data = {
		Title: shemaData['#article-item-title'],
		Description: shemaData['#article-item-description'],
		Image: document.getElementById('article-item-photo').getAttribute('data-url') || '',
	};

	const id = document.getElementById('article-item-id').value;
	const createdAt = document.getElementById('article-item-createdat').value;
	const timestamp = document.getElementById('article-item-timestamp').value;

	if (id) {
		postRequest(
			'/api/blog/articles/update/' + id,
			{ Article: Object.assign(data, { ID: id, CreatedAt: createdAt, Timestamp: timestamp }) },
			{ 'Content-Type': 'application/json' },
			true,
			document.querySelector('.article-item-save')
		)
			.then((response) => {
				window.location.reload();
			})
			.catch((error) => {
				console.log(error);
			});
	} else {
		postRequest('/api/blog/articles/add', { Article: data }, { 'Content-Type': 'application/json' }, true, document.querySelector('.article-item-save'))
			.then((response) => {
				window.location.reload();
			})
			.catch((error) => {
				console.log(error);
			});
	}
});

document.querySelector('.article-item-delete').addEventListener('click', () => {
	const selected = Array.from(document.querySelectorAll('.table tr:has(input:checked)'));
	const ids = selected.map((row) => row.getAttribute('data-id'));

	postRequest('/api/blog/articles/delete', { IDs: ids }, { 'Content-Type': 'application/json' }, true, document.querySelector('.article-item-delete'))
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

mutationObserver.observe(document.getElementById('article-item-photo'), { attributes: true, attributeFilter: ['data-url'], attributeOldValue: true });

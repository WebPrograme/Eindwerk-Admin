import Auth from '../modules/Auth.js';
import Upload from '../modules/Upload.js';
import FormShema from '../modules/FormShema.js';
import { getRequest, postRequest } from '../modules/Requests.js';
import { newPublicationInputConfig } from '../modules/FormShemaConfig.js';
import { CreatePublicationCard } from '../modules/Components.js';
import Drawer from '../modules/Drawer.js';
import Modal from '../modules/Modal.js';
import Popover from '../modules/Popover.js';

Auth.getUser()
	.then((data) => {
		document.querySelector('.sidebar .sidebar-profile-img').src = data.photoURL;
		document.querySelector('.sidebar .sidebar-profile-name').innerHTML = data.displayName;

		main(data['stsTokenManager']['accessToken']);
	})
	.catch((error) => {
		window.location.href = '/pages/login.html';
	});

let publicationCover = null;
let publicationContent = null;

const photoPreviewModal = new Modal(document.getElementById('photo-preview-modal'), document.querySelector('.cover-preview-trigger'));
const newPublicationDrawer = new Drawer(document.getElementById('add-publication-drawer'), document.getElementById('btn-add-publication'), { position: 'right' });
newPublicationDrawer.on('open', (drawer, signal) => {
	if (signal !== 'edit') {
		document.querySelector('.publication-id-label').innerHTML = '';
		document.getElementById('publication-cover').removeAttribute('data-url');
		document.getElementById('publication-content').removeAttribute('data-url');
		document.getElementById('publication-cover').classList.remove('input-file-active');
		document.getElementById('publication-content').classList.remove('input-file-active');
		document.querySelector('.publication-delete').classList.add('hidden');
	} else {
		document.querySelector('.publication-delete').classList.remove('hidden');
	}
});

async function main(token) {
	const { status, data } = await getRequest(`/api/publications/all`, { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token });
	const publications = data?.Publications || [];

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

	Object.values(publications).forEach((publication) => {
		CreatePublicationCard(publication, document.querySelector('.publications-cards'), (e) => {
			e.preventDefault();
			openPublicationDrawer(publication);
		});
	});

	lucide.createIcons();
	document.querySelector('.loader').classList.add('close');
}

async function openPublicationDrawer(publication) {
	newPublicationDrawer.setInputs({
		'#publication-title': publication.Title,
		'#publication-id': publication.ID,
		'#publication-createdat': publication.CreatedAt,
	});

	document.querySelector('.publication-id-label').innerHTML = publication.ID ? `#${publication.ID}` : '';
	newPublicationDrawer.open('edit');

	document.getElementById('publication-cover').setAttribute('data-url', publication.CoverImage);

	// Set the value of the input file to the cover image
	document.getElementById('publication-cover').classList.add('input-file-active');
	const coverFileBlob = await fetch(publication.CoverImage, { 'Access-Control-Allow-Origin': '*' }).then((response) => response.blob());
	const coverFile = new File([coverFileBlob], 'publication-cover', { type: coverFileBlob.type });
	const coverData = new DataTransfer();
	coverData.items.add(coverFile);

	document.getElementById('publication-cover').files = coverData.files;
	publicationCover = coverData.files;

	// Set the value of the input file to the content PDF
	document.getElementById('publication-content').setAttribute('data-url', publication.Content);
	document.getElementById('publication-content').classList.add('input-file-active');
	const contentFileBlob = await fetch(publication.Content, { 'Access-Control-Allow-Origin': '*' }).then((response) => response.blob());
	const contentFile = new File([contentFileBlob], 'publication-content', { type: contentFileBlob.type });
	const contentData = new DataTransfer();
	contentData.items.add(contentFile);

	document.getElementById('publication-content').files = contentData.files;
	publicationContent = contentData.files;
}

// Save or update publication
document.querySelector('.publication-save').addEventListener('click', () => {
	const result = FormShema.CheckInputs(newPublicationInputConfig);
	const invalidInputs = result[0];

	if (invalidInputs.length > 0) return;

	const shemaData = FormShema.GetInputValues(newPublicationInputConfig);
	const data = {
		Title: shemaData['#publication-title'],
		CoverImage: document.getElementById('publication-cover').getAttribute('data-url'),
		Content: document.getElementById('publication-content').getAttribute('data-url'),
	};

	const id = document.getElementById('publication-id').value;
	const createdAt = document.getElementById('publication-createdat').value;

	if (id) {
		postRequest(
			'/api/publications/update/' + id,
			{ Publication: Object.assign(data, { ID: id, CreatedAt: createdAt }) },
			{ 'Content-Type': 'application/json' },
			true,
			document.querySelector('.publication-save')
		)
			.then((response) => {
				window.location.reload();
			})
			.catch((error) => {
				console.log(error);
			});
	} else {
		postRequest('/api/publications/add', { Publication: data }, { 'Content-Type': 'application/json' }, true, document.querySelector('.publication-save'))
			.then((response) => {
				window.location.reload();
			})
			.catch((error) => {
				console.log(error);
			});
	}
});

// Delete publication
document.querySelector('.publication-delete').addEventListener('click', () => {
	const id = document.getElementById('publication-id').value;

	postRequest('/api/publications/delete', { ID: id }, { 'Content-Type': 'application/json' }, true, document.querySelector('.publication-delete'))
		.then((response) => {
			window.location.reload();
		})
		.catch((error) => {
			console.log(error);
		});
});

// Upload cover and content files
document.getElementById('publication-cover').addEventListener('change', (e) => {
	const file = e.target.files[0];
	const input = document.getElementById('publication-cover');
	const saveButton = document.querySelector('.publication-save');

	if (!file) {
		e.preventDefault();
		input.files = publicationCover;
		input.classList.add('input-file-active');
		return;
	}

	saveButton.innerHTML = 'Uploaden...';
	saveButton.disabled = true;
	saveButton.classList.add('disabled');

	Upload.UploadImage('Publications/Covers', file, input)
		.then((url) => {
			input.setAttribute('data-url', url);
			input.classList.add('input-file-active');
			saveButton.innerHTML = 'Opslaan';
			saveButton.disabled = false;
			saveButton.classList.remove('disabled');
		})
		.catch((error) => {
			alert(error);
		});
});

document.getElementById('publication-content').addEventListener('change', (e) => {
	const file = e.target.files[0];
	const input = document.getElementById('publication-content');
	const saveButton = document.querySelector('.publication-save');

	if (!file) {
		e.preventDefault();
		input.files = publicationContent;
		input.classList.add('input-file-active');
		return;
	}

	saveButton.innerHTML = 'Uploaden...';
	saveButton.disabled = true;
	saveButton.classList.add('disabled');

	Upload.UploadPDF('Publications/Files', file, input)
		.then((url) => {
			input.setAttribute('data-url', url);
			input.classList.add('input-file-active');
			saveButton.innerHTML = 'Opslaan';
			saveButton.disabled = false;
			saveButton.classList.remove('disabled');
		})
		.catch((error) => {
			alert(error);
		});
});

// Update the photo preview modal when attribute changes
const mutationObserver = new MutationObserver((mutationsList, observer) => {
	for (const mutation of mutationsList) {
		if (mutation.type === 'attributes' && mutation.attributeName === 'data-url') {
			const url = mutation.target.getAttribute('data-url');

			if (url && mutation.oldValue !== url) {
				document.querySelector('.photo-preview').src = url;
				document.querySelector('.cover-preview-trigger').classList.remove('hidden');
			} else if (!url) {
				document.querySelector('.photo-preview').src = '';
				document.querySelector('.cover-preview-trigger').classList.add('hidden');
			}
		}
	}
});

mutationObserver.observe(document.getElementById('publication-cover'), { attributes: true, attributeFilter: ['data-url'], attributeOldValue: true });
mutationObserver.observe(document.getElementById('publication-content'), { attributes: true, attributeFilter: ['data-url'], attributeOldValue: true });

document.querySelector('.cover-preview-trigger').addEventListener('click', (e) => {
	e.preventDefault();
	const url = document.getElementById('publication-cover').getAttribute('data-url');
	if (url) {
		document.querySelector('.photo-preview').src = url;
		photoPreviewModal.open();
	}
});

import Auth from '../modules/Auth.js';
import Upload from '../modules/Upload.js';
import FormShema from '../modules/FormShema.js';
import { getRequest, postRequest } from '../modules/Requests.js';
import { newContactSectionInputConfig } from '../modules/FormShemaConfig.js';
import { CreateContactSection } from '../modules/Components.js';
import Drawer from '../modules/Drawer.js';
import Modal from '../modules/Modal.js';

// Observers And Listeners For FormShema
let receipts = {};
let sectionFile = null;

// Photo Preview Modal
const photoPreviewModal = new Modal(document.getElementById('photo-preview-modal'), document.querySelector('.photo-preview-trigger'));

// Section Drawer
const sectionItemDrawer = new Drawer(document.getElementById('add-section-drawer'), document.getElementById('btn-add-section-text'), { position: 'right' });
// Add second trigger for drawer
document.getElementById('btn-add-section-image').addEventListener('click', () => {
	sectionItemDrawer.open('Image');
});

sectionItemDrawer.on('open', (drawer, value) => {
	if (typeof value === 'object' && value !== null) openSectionDrawer(value); // Open section drawer with data
	else {
		const sectionType = value === 'Image' ? 'TextWithImage' : 'TextOnly';

		document.getElementById('section-type').value = sectionType;
		document.getElementById('section-order').value = document.querySelectorAll('.contact-section').length + 1;

		// Show/hide image input
		document.getElementById('section-photo-container').classList.toggle('hidden', sectionType === 'TextOnly');

		// Hide delete button
		document.querySelector('.section-delete').classList.add('hidden');
	}
});
sectionItemDrawer.on('close', (drawer, value) => {
	if (receipts['newContactSectionInputConfig']) {
		FormShema.StopUpdate(receipts['newContactSectionInputConfig']);
	}
});

Auth.getUser()
	.then((data) => {
		document.querySelector('.sidebar .sidebar-profile-img').src = data.photoURL;
		document.querySelector('.sidebar .sidebar-profile-name').innerHTML = data.displayName;

		main(data['stsTokenManager']['accessToken']);
	})
	.catch((error) => {
		window.location.href = '/pages/login.html';
	});

async function main(token) {
	// Get all sections
	const { status, data } = await getRequest(`/api/contact/all`, { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token });
	const sections = data;

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

	// Create contact sections
	const contactSectionContainer = document.querySelector('.contact-sections');
	Object.values(sections).forEach((section) => {
		CreateContactSection(section, contactSectionContainer, (e) => {
			sectionItemDrawer.open(section);
		});
	});

	document.querySelector('.loader').classList.add('close');
}

// Open section drawer with data
async function openSectionDrawer(section) {
	sectionItemDrawer.setInputs({
		'#section-title': section.Title,
		'#section-description': Object.values(section.Content).join('\n'),
		'#section-order': section.Order,
		'#section-id': section.ID,
		'#section-createdat': section.CreatedAt,
		'#section-timestamp': section.Timestamp,
		'#section-type': section.Type,
	});

	// Old Order
	document.getElementById('section-order').setAttribute('data-old-order', section.Order);

	// Show/hide image input
	document.getElementById('section-photo-container').classList.toggle('hidden', section.Type === 'TextOnly');

	if (section.Type === 'TextWithImage') {
		document.getElementById('section-photo').setAttribute('data-url', section.Image);

		// Set image file
		const fileBlob = await fetch(section.Image, { 'Access-Control-Allow-Origin': '*', cache: 'force-cache' }).then((response) => response.blob());
		const file = new File([fileBlob], 'section-photo', { type: fileBlob.type });
		const data = new DataTransfer();
		data.items.add(file);

		document.getElementById('section-photo').files = data.files;
		document.getElementById('section-photo').classList.add('input-file-active');
		sectionFile = data.files;
	} else {
		document.getElementById('section-photo').removeAttribute('data-url');
		document.getElementById('section-photo').value = '';
		sectionFile = null;
	}

	// Show delete button
	document.querySelector('.section-delete').classList.remove('hidden');
}

// Upload image
document.getElementById('section-photo').addEventListener('change', (e) => {
	const file = e.target.files[0];
	const input = document.getElementById('section-photo');

	if (!file) {
		e.preventDefault();
		input.files = sectionFile;
		input.classList.add('input-file-active');
		return;
	}

	Upload.UploadImage('Contact', file, input)
		.then((url) => {
			// if (articleItemImageTooltip) articleItemImageTooltip.remove();
			// articleItemImageTooltip = new Tooltip(input, `<img src="${url}" alt="article Item Image" style="width: 100%; height: 100%;">`, 'left', 500, true);
		})
		.catch((error) => {
			alert(error);
		});
});

// Add/Update section
document.querySelector('.section-save').addEventListener('click', async () => {
	const [invalidInputs, receipt] = FormShema.CheckInputs(newContactSectionInputConfig);

	receipts['newContactSectionInputConfig'] = receipt;

	if (invalidInputs.length > 0) return;

	const secionRawData = FormShema.GetInputValues(newContactSectionInputConfig);
	let sectionData = {
		Title: secionRawData['#section-title'],
		Content: secionRawData['#section-description'],
		Type: secionRawData['#section-type'],
		Order: parseInt(secionRawData['#section-order']),
	};

	if (sectionData.Type === 'TextWithImage') {
		sectionData.Image = document.getElementById('section-photo').getAttribute('data-url');
	}

	// Check if section order is last
	const sectionOrder = parseInt(sectionData.Order);
	const sections = document.querySelectorAll('.contact-section');
	const isLastSection = sections.length === 0 || sectionOrder > sections.length;

	if (!document.getElementById('section-id').value) {
		// Save section
		await postRequest(
			'/api/contact/add/section',
			{ Section: sectionData, IsLast: isLastSection },
			{ 'Content-Type': 'application/json' },
			false,
			document.querySelector('.section-save')
		).then((response) => {
			window.location.reload();
		});
	} else {
		sectionData.ID = document.getElementById('section-id').value;
		sectionData.CreatedAt = document.getElementById('section-createdat').value;
		sectionData.Timestamp = document.getElementById('section-timestamp').value;

		const oldOrder = parseInt(document.getElementById('section-order').getAttribute('data-old-order'));

		// Update section
		await postRequest(
			'/api/contact/update/section/' + sectionData.ID,
			{ Section: sectionData, IsLast: isLastSection, OldOrder: oldOrder },
			{ 'Content-Type': 'application/json' },
			false,
			document.querySelector('.section-save')
		).then((response) => {
			window.location.reload();
		});
	}
});

// Delete section
document.querySelector('.section-delete').addEventListener('click', async () => {
	const sectionID = document.getElementById('section-id').value;

	if (!sectionID) return;

	// Delete section
	await postRequest('/api/contact/delete/section', { ID: sectionID }, { 'Content-Type': 'application/json' }, false, document.querySelector('.section-delete')).then(
		(response) => {
			window.location.reload();
		}
	);
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

mutationObserver.observe(document.getElementById('section-photo'), { attributes: true, attributeFilter: ['data-url'], attributeOldValue: true });

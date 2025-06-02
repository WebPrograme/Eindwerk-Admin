import Auth from '../modules/Auth.js';
import Upload from '../modules/Upload.js';
import FormShema from '../modules/FormShema.js';
import { getRequest, postRequest } from '../modules/Requests.js';
import { newEventInputConfig } from '../modules/FormShemaConfig.js';
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

let totalevents = 0;
let eventFile = null;

const deleteEventModal = new Modal(document.getElementById('delete-event-modal'), document.querySelector('.event-item-delete'), false, false);
const photoPreviewModal = new Modal(document.getElementById('photo-preview-modal'), document.querySelector('.photo-preview-trigger'));
const neweventItemDrawer = new Drawer(document.getElementById('add-event-item-drawer'), document.getElementById('btn-add-event'), { position: 'right' });
neweventItemDrawer.on('open', async (drawer, signal) => {
	if (signal !== 'edit') {
		document.querySelector('.event-item-id-label').innerHTML = '';
		document.getElementById('event-item-photo').removeAttribute('data-url');
		document.querySelector('.event-item-delete').classList.add('hidden');
	} else {
		document.querySelector('.event-item-delete').classList.remove('hidden');
	}
});

async function main(token) {
	const { status, data } = await getRequest(`/api/blog/events/all`, { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token });
	const eventItems = data?.Events;
	const eventUpcomingCards = document.querySelector('.events-upcoming-cards');
	const eventExpiredCards = document.querySelector('.events-expired-cards');
	const now = new Date();
	let upcomingEvents = 0;
	let expiredEvents = 0;

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

	totalevents = data.Total;

	// Create a card for each event
	Object.values(eventItems).forEach((item) => {
		const card = document.createElement('div');
		card.classList.add('events-card');
		card.innerHTML = `
			<img
				class="events-card-img"
				src="${item.Image}"
				alt="${item.Title}"
			/>
			<div class="events-card-date">
				<span>${new Date(item.Date).getDate()} ${new Intl.DateTimeFormat('nl-BE', { month: 'short' }).format(new Date(item.Date))} '${new Date(item.Date)
			.getFullYear()
			.toString()
			.slice(-2)}</span>
			</div>
			<div class="events-card-title">
				<h3>${item.Title}</h3>
			</div>
			<i class="fa-solid fa-up-right-from-square events-card-open-icon"></i>`;

		card.addEventListener('click', () => openEventDrawer(item));

		if (new Date(item.Date) < now) {
			expiredEvents++;
			eventExpiredCards.appendChild(card);
		} else {
			upcomingEvents++;
			eventUpcomingCards.appendChild(card);
		}
	});

	// If there are no events show a message
	if (upcomingEvents === 0) {
		document.querySelector('.events-upcoming-cards').classList.add('hidden');
		document.querySelector('.events-upcoming-cards').previousElementSibling.classList.add('hidden');
	}
	if (expiredEvents === 0) {
		document.querySelector('.events-expired-cards').classList.add('hidden');
		document.querySelector('.events-expired-cards').previousElementSibling.classList.add('hidden');
	}

	lucide.createIcons();

	document.querySelector('.loader').classList.add('close');
}

async function openEventDrawer(row) {
	neweventItemDrawer.setInputs({
		'#event-item-title': row.Title,
		'#event-item-id': row.ID,
		'#event-item-createdat': row.CreatedAt,
		'#event-item-timestamp': row.Timestamp,
	});

	// Set the date
	document.getElementById('event-item-date').setAttribute('value', row.Date);

	document.querySelector('.event-item-id-label').innerHTML = row.ID ? `#${row.ID}` : '';
	neweventItemDrawer.open('edit');

	document.getElementById('event-item-photo').setAttribute('data-url', row.Image);

	// Set the value of the input
	document.getElementById('event-item-photo').classList.add('input-file-active');

	// Check if the image is cached
	const fileBlob = await fetch(row.Image, { 'Access-Control-Allow-Origin': '*', cache: 'force-cache' }).then((response) => response.blob());
	const file = new File([fileBlob], 'event-item-photo', { type: fileBlob.type });
	const data = new DataTransfer();
	data.items.add(file);

	document.getElementById('event-item-photo').files = data.files;
	eventFile = data.files;
}

document.getElementById('event-item-photo').addEventListener('change', (e) => {
	const file = e.target.files[0];
	const input = document.getElementById('event-item-photo');

	if (!file) {
		e.preventDefault();
		input.files = eventFile;
		input.classList.add('input-file-active');
		return;
	}

	Upload.UploadImage('event', file, input)
		.then((url) => {
			// if (eventItemImageTooltip) eventItemImageTooltip.remove();
			// eventItemImageTooltip = new Tooltip(input, `<img src="${url}" alt="event Item Image" style="width: 100%; height: 100%;">`, 'left', 500, true);
		})
		.catch((error) => {
			alert(error);
		});
});

document.querySelector('.event-item-save').addEventListener('click', () => {
	const [invalidInputs, receipts] = FormShema.CheckInputs(newEventInputConfig);

	if (invalidInputs.length > 0) return;

	const shemaData = FormShema.GetInputValues(newEventInputConfig);
	const data = {
		Title: shemaData['#event-item-title'],
		Image: document.getElementById('event-item-photo').getAttribute('data-url') || '',
		Date: document.getElementById('event-item-date').value,
	};

	const id = document.getElementById('event-item-id').value;
	const createdAt = document.getElementById('event-item-createdat').value;
	const timestamp = document.getElementById('event-item-timestamp').value;

	if (id) {
		postRequest(
			'/api/blog/events/update/' + id,
			{ Event: Object.assign(data, { ID: id, CreatedAt: createdAt, Timestamp: timestamp }) },
			{ 'Content-Type': 'application/json' },
			true,
			document.querySelector('.event-item-save')
		)
			.then((response) => {
				window.location.reload();
			})
			.catch((error) => {
				console.log(error);
			});
	} else {
		postRequest('/api/blog/events/add', { Event: data }, { 'Content-Type': 'application/json' }, true, document.querySelector('.event-item-save'))
			.then((response) => {
				window.location.reload();
			})
			.catch((error) => {
				console.log(error);
			});
	}
});

document.querySelector('.event-item-delete-confirm').addEventListener('click', () => {
	const ids = [document.getElementById('event-item-id').value];

	postRequest('/api/blog/events/delete', { IDs: ids }, { 'Content-Type': 'application/json' }, true, document.querySelector('.event-item-delete'))
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

mutationObserver.observe(document.getElementById('event-item-photo'), { attributes: true, attributeFilter: ['data-url'], attributeOldValue: true });

const formatDate = (date) => {
	const month = new Intl.DateTimeFormat('nl-BE', { month: 'short' }).format(date);
	return `${new Intl.DateTimeFormat('nl-BE', { day: '2-digit' }).format(date)} ${month.charAt(0).toUpperCase() + month.slice(1)} ${new Intl.DateTimeFormat('nl-BE', {
		year: 'numeric',
	}).format(date)}`;
};

lucide.createIcons();
import Select from '../modules/Select.js';
import Popover from '../modules/Popover.js';
import Tooltip from '../modules/Tooltip.js';

if (document.querySelector('.main-title')) document.title = document.title + ' - ' + document.querySelector('.main-title').innerText;

document.querySelectorAll('.btn-icon').forEach((btn) => {
	if (!btn.innerText) btn.style.paddingRight = '.75rem';
});

// First time visit on the page, show popover
if (!localStorage.getItem('page-first-visit')) {
	console.log('First time visit on the archive page, showing popover');
	new Popover(null, {
		content: `
			<h3>Welkom op de Admin Pagina!</h3>
			<p>Op deze pagina kun je de website van HHKW beheren. Je kunt hier artikelen toevoegen, aanpassen en verwijderen.</p>
			<p><strong>Let op:</strong> De server kan enkele minuten nodig hebben om op te starten na een periode van inactiviteit.</p>
		`,
		type: 'info',
		noIcon: true,
		close: true,
	}).show();
	localStorage.setItem('page-first-visit', 'true');
}

document.addEventListener('click', (event) => {
	event.stopPropagation();
	const contextMenus = document.querySelectorAll('.context-menu.open');
	const drawers = document.querySelectorAll('.drawer.open');
	const modals = document.querySelectorAll('.modal.open');
	const selectOptions = document.querySelectorAll('.input-select-options.open');

	// contextMenus.forEach((contextMenu) => {
	// 	if (document.contains(event.target) && !contextMenu.contains(event.target)) {
	// 		contextMenu.classList.remove('open');
	// 	}
	// });

	// drawers.forEach((drawer) => {
	// 	if (document.contains(event.target) && !drawer.contains(event.target) && document.body != event.target) {
	// 		drawer.classList.remove('open');
	// 	}
	// });

	// modals.forEach((modal) => {
	// 	if (document.contains(event.target) && !modal.contains(event.target) && !event.target.classList.contains('input-select-options')) {
	// 		modal.classList.remove('open');
	// 	}
	// });

	selectOptions.forEach((selectOption) => {
		const trigger = document.querySelector('#' + selectOption.getAttribute('for'));
		if (!selectOption.contains(event.target) && !trigger.contains(event.target) && event.target !== selectOption.parentElement) {
			selectOption.classList.remove('open');

			if (!trigger.closest('.modal-body')) {
				const overflowElement = trigger.closest('.drawer-body') || document.body;
				overflowElement.style.overflow = '';
				overflowElement.style.marginRight = '';
			}
		}
	});
});

document.body.style.setProperty('--sidebar-width', '250px');

const mediaQuery = window.matchMedia('(max-width: 1300px)');
if (mediaQuery.matches) {
	document.querySelector('.mobile-header').style.display = 'flex';
	document.querySelector('.sidebar').classList.add('mobile');
	document.querySelector('.main').classList.add('mobile');
	document.body.style.setProperty('--sidebar-width', '0px');
}

if (document.querySelector('.sidebar')) {
	document.querySelector('.mobile-header-sidebar-trigger').addEventListener('click', () => {
		document.querySelector('.sidebar').classList.toggle('open');
	});

	document.querySelector('.sidebar-overlay').addEventListener('click', () => {
		document.querySelector('.sidebar').classList.remove('open');
	});
}

document.querySelectorAll('.toast .toast-close').forEach((close) => {
	close.addEventListener('click', () => {
		close.parentElement.classList.toggle('open');
	});
});

document.querySelectorAll('.sidebar .sidebar-profile .sidebar-profile-img').forEach((img) => {
	img.addEventListener('click', () => {
		document.cookie = `AdminID=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
		window.location.href = '/pages/login.html';
	});
});

document.querySelectorAll('.sidebar .sidebar-menu .sidebar-menu-submenu-trigger').forEach((trigger) => {
	trigger.addEventListener('click', (event) => {
		event.preventDefault();
		const submenu = trigger.nextElementSibling;
		submenu.classList.toggle('open');
	});
});

document.querySelectorAll('*[data-title]').forEach((element) => {
	new Tooltip(element, element.getAttribute('data-title'));
});

const dateObserver = new MutationObserver((mutations) => {
	mutations.forEach((mutation) => {
		if (mutation.attributeName === 'value') {
			const input = mutation.target;
			const value = input.getAttribute('value');
			const day = new Date(value).getDate() > 9 ? new Date(value).getDate() : '0' + new Date(value).getDate();
			const month = new Date(value).getMonth() + 1 > 9 ? new Date(value).getMonth() + 1 : '0' + (new Date(value).getMonth() + 1);
			const year = new Date(value).getFullYear();

			if (!value || value === '') input.style.removeProperty('--date-value');
			else input.style.setProperty('--date-value', `"${day}/${month}/${year}"`);
		}
	});
});

document.querySelectorAll('input[type="date"], .datepicker').forEach((input) => {
	dateObserver.observe(input, {
		attributes: true,
	});

	if (!input.classList.contains('datepicker')) {
		input.addEventListener('change', (e) => {
			input.setAttribute('value', e.target.value);
		});

		input.addEventListener('click', (event) => {
			input.showPicker();
		});
	}
});

document.querySelectorAll('input[type="file"]').forEach((input) => {
	input.addEventListener('change', (event) => {
		if (input.files.length > 0) input.classList.add('input-file-active');
		else input.classList.remove('input-file-active');
	});
});

document.querySelectorAll('.switch-label > *:not(input, label)').forEach((element) => {
	element.addEventListener('click', (e) => {
		const input = element.parentElement.parentElement.querySelector('input[type="checkbox"]');
		if (input.disabled) return;

		input.checked = !input.checked;
	});
});

document.querySelectorAll('.input-date-group input').forEach((input) => {
	input.addEventListener('input', (e) => {
		const type = input.id.split('-').pop();
		const value = input.value;

		if (type === 'day') {
			if (value > 31) input.value = 31;
			if (value < 1 && value != '') input.value = '1';

			if (value.length > 2) input.value = value.slice(0, 2);

			if (value.length === 2) input.parentElement.querySelector('input[type="number"][id$="month"]').focus();
		} else if (type === 'month') {
			if (value > 12) input.value = 12;
			if (value < 1 && value != '') input.value = '1';

			if (value.length > 2) input.value = value.slice(0, 2);

			if (value.length === 2) input.parentElement.querySelector('input[type="number"][id$="year"]').focus();
		} else if (type === 'year') {
			if (value.length > 4) input.value = value.slice(0, 4);
		}
	});
});

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
if (isSafari) {
	document.querySelectorAll('input[type="date"]').forEach((input) => {
		input.classList.add('safari');
	});

	document.querySelectorAll('.drawer-footer').forEach((footer) => {
		const body = footer.parentElement.querySelector('.drawer-body');

		// Add invisible block so the user can scroll to the bottom of the drawer
		const invisibleBlock = document.createElement('div');
		invisibleBlock.classList.add('invisible-block');
		body.appendChild(invisibleBlock);
	});
}

window.addEventListener('resize', () => {
	if (mediaQuery.matches) {
		document.querySelector('.mobile-header').style.display = 'flex';
		document.querySelector('.sidebar').classList.add('mobile');
		document.querySelector('.main').classList.add('mobile');
		document.body.style.setProperty('--sidebar-width', '0px');
	} else {
		document.querySelector('.mobile-header').style.display = 'none';
		document.querySelector('.sidebar').classList.remove('mobile');
		document.querySelector('.main').classList.remove('mobile');
		document.body.style.setProperty('--sidebar-width', '250px');
	}
});

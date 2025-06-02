export default class Drawer {
	constructor(drawer, trigger = null) {
		this.drawer = drawer;
		this.trigger = trigger;

		this.init();
	}

	init() {
		if (this.trigger) {
			this.trigger.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();

				this.open();
			});
		}

		// Setup drawer close button
		this.drawer.querySelectorAll('.drawer-close').forEach((closeBtn) => {
			closeBtn.addEventListener('click', () => {
				this.close();
			});
		});

		// Setup drawer close on overlay click
		this.drawer.addEventListener('click', (e) => {
			if (e.target.classList.contains('drawer-overlay')) {
				this.close();
			}
		});

		// Setup drawer close on escape key
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				this.close();
			}
		});
	}

	open(signal = null) {
		this.drawer.classList.add('open');

		const scrollWidth = this.getScrollWidth();
		const isBodyOverflowing = document.body.clientHeight > window.innerHeight;

		if (isBodyOverflowing) {
			document.body.style.marginRight = scrollWidth + 'px';
		}
		document.body.classList.add('drawer-open');

		if (this.openCallback) {
			this.openCallback(this, signal);
		}
	}

	close(signal = null) {
		this.drawer.classList.remove('open');

		if (this.closeCallback) {
			this.closeCallback(this, signal);
		}

		if (this.drawer.querySelector('.input-select')) {
			this.drawer.querySelectorAll('.input-select').forEach((select) => {
				const optionsContainer = document.querySelector(`.input-select-options[for="${select.id}"]`);
				if (optionsContainer.classList.contains('open')) optionsContainer.classList.remove('open');
			});
		}

		if (this.drawer.querySelector('.datepicker')) {
			this.drawer.querySelectorAll('.datepicker').forEach((datepicker) => {
				if (datepicker.classList.contains('open')) datepicker.classList.remove('open');
			});
		}

		this.drawer.addEventListener(
			'transitionend',
			() => {
				this.resetInputs();
				document.body.classList.remove('drawer-open');
				document.body.style.marginRight = '';
			},
			{ once: true }
		);
	}

	resetInputs() {
		this.drawer.querySelectorAll('input').forEach((input) => {
			if (input.id.includes('-hidden') && input.parentElement && input.parentElement.classList.contains('input-select-container')) this.resetSelect(input);
			else if (input.type === 'checkbox') input.checked = false;
			else if (input.type === 'radio') input.checked = false;
			else if (input.type === 'date') input.removeAttribute('value');
			else input.value = '';

			input.classList.remove('error');
		});

		this.drawer.querySelectorAll('textarea').forEach((textarea) => {
			textarea.value = '';
			textarea.classList.remove('error');
		});

		this.drawer.querySelectorAll('.input-file').forEach((inputFile) => {
			inputFile.dataset.src = '';
			inputFile.querySelector('.input-file-name').innerHTML = '';
			inputFile.classList.remove('error');
		});

		this.drawer.querySelectorAll('.datepicker').forEach((datepicker) => {
			datepicker.removeAttribute('value');
			datepicker.classList.remove('active');
			datepicker.innerHTML = datepicker.dataset.placeholder;
		});
	}

	resetSelect(select) {
		if (select.parentElement.classList.contains('chain-input')) return;

		const trigger = select.nextElementSibling;
		const optionsContainer = document.querySelector(`.input-select-options[for="${trigger.id}"]`);
		const options = optionsContainer.querySelectorAll(`.input-select-option`);
		const placeholder = trigger.dataset.placeholder;

		select.removeAttribute('value');
		trigger.innerHTML = placeholder;
		trigger.removeAttribute('data-value');
		trigger.classList.remove('selected');
		options.forEach((option) => {
			option.classList.remove('selected');
		});
	}

	setInputs(data) {
		for (const key in data) {
			const input = this.drawer.querySelector(`${key}`);
			if (!input) continue;

			if (input.id.includes('-hidden') && input.parentElement && input.parentElement.classList.contains('input-select-container')) this.setSelect(input, data[key]);
			else if (input.type === 'checkbox') input.checked = data[key];
			else if (input.type === 'radio') input.checked = data[key];
			else if (input.type === 'date') input.setAttribute('value', data[key]);
			else input.value = data[key];
		}
	}

	on(event, callback) {
		switch (event) {
			case 'open':
				// Check if there is already a callback
				if (this.openCallback) {
					const oldCallback = this.openCallback;
					this.openCallback = (drawer, signal) => {
						oldCallback(drawer, signal);
						callback(drawer, signal);
					};
				} else {
					this.openCallback = callback;
				}
				break;
			case 'close':
				// Check if there is already a callback
				if (this.closeCallback) {
					const oldCallback = this.closeCallback;
					this.closeCallback = (drawer, signal) => {
						oldCallback(drawer, signal);
						callback(drawer, signal);
					};
				} else {
					this.closeCallback = callback;
				}
				break;
			default:
				break;
		}
	}

	getScrollWidth() {
		const div = document.createElement('div');

		div.style.overflowY = 'scroll';
		div.style.width = '50px';
		div.style.height = '50px';

		document.body.append(div);

		const scrollWidth = div.offsetWidth - div.clientWidth;

		div.remove();

		return scrollWidth;
	}
}

class Select {
	constructor(element, trigger, defaultValue = null) {
		this.element = element;
		this.trigger = trigger;
		this.defaultValue = defaultValue;
		this.placeholder = this.trigger.innerHTML || this.trigger.dataset.placeholder || 'Select an option';

		this.init();
	}

	init() {
		// Move the element to the end of the body to avoid overflow issues and remove it from the original position
		const duplicate = this.element.cloneNode(true);
		this.element.parentNode.removeChild(this.element);
		document.body.appendChild(duplicate);
		this.element = duplicate;

		// Check if there is a hidden input to store the value
		if (!this.trigger.previousElementSibling || this.trigger.previousElementSibling.tagName !== 'INPUT') {
			const input = document.createElement('input');
			input.id = this.trigger.id + '-hidden';
			input.type = 'hidden';
			this.trigger.parentElement.insertBefore(input, this.trigger);
		}

		// Check if there is a floating label
		if (this.trigger.classList.contains('input-select-floating')) {
			const label = document.createElement('label');
			label.innerHTML = this.placeholder;
			label.classList.add('input-select-floating-label');
			label.setAttribute('for', this.trigger.id);
			this.trigger.parentElement.insertBefore(label, this.trigger);
		}

		this.trigger.id = this.trigger.id || 'input-select-' + Math.random().toString(36);
		this.trigger.setAttribute('hasClass', 'true');
		this.element.setAttribute('for', this.trigger.id);

		this.setPositon();

		if (!this.defaultValue) this.trigger.setAttribute('data-placeholder', this.placeholder);

		window.addEventListener('resize', () => {
			this.setPositon();
		});

		window.addEventListener('scroll', () => {
			this.setPositon();
		});

		this.trigger.addEventListener('focus', (event) => {
			event.stopPropagation();
			this.setPositon();
			this.show();
		});

		this.trigger.addEventListener('click', (event) => {
			event.preventDefault();
			this.setPositon();
			this.show();
		});
	}

	setPositon() {
		const triggerParentRect = this.trigger.parentElement.getBoundingClientRect();
		const rawTriggerRect = this.trigger.getBoundingClientRect();
		const triggerRect = {
			top: rawTriggerRect.top,
			bottom: rawTriggerRect.bottom,
			left: triggerParentRect.left,
			width: rawTriggerRect.width,
			height: this.trigger.offsetHeight,
		};
		const limitsElement =
			document.querySelector('.drawer-body') && document.querySelector('.drawer-body').contains(this.trigger) ? document.querySelector('.drawer-body') : document.body;
		const limitsRect = limitsElement == document.body ? { height: window.innerHeight, width: window.innerWidth } : limitsElement.getBoundingClientRect();
		const viewportHeight = window.innerHeight;
		const minHeigth = this.element.offsetHeight;
		const margin = 8;

		if (triggerParentRect.top + triggerRect.height + minHeigth + margin > limitsRect.height) {
			// Limit bottom
			this.element.classList.add('top');
			this.element.style.bottom = viewportHeight - triggerRect.bottom + triggerRect.height + margin + 'px';
			this.element.style.removeProperty('top');
		} else {
			this.element.classList.remove('top');
			this.element.style.removeProperty('bottom');
			this.element.style.top = triggerRect.top + triggerRect.height + margin + 'px';
		}

		this.element.style.width = triggerRect.width + 'px';
		this.element.style.left = triggerRect.left + 'px';
	}

	getValue() {
		return this.trigger.dataset.value;
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

	show() {
		this.setPositon();
		this.element.classList.add('open');
		const scrollWidth = this.getScrollWidth();
		const overflowElement = this.trigger.closest('.drawer-body') || document.body;
		const isParentOverflowing = overflowElement.scrollHeight > overflowElement.clientHeight;

		if (isParentOverflowing && !this.trigger.closest('.modal-body')) {
			overflowElement.style.overflow = 'hidden';
			overflowElement.style.marginRight = scrollWidth + 'px';
		}

		this.element.querySelectorAll('.input-select-option').forEach((option) => {
			option.addEventListener('click', (event) => {
				event.stopPropagation();

				const value = option.dataset.value || option.innerHTML;
				this.setValue(value, option);

				this.element.querySelectorAll('.input-select-option').forEach((option) => {
					if (option !== event.target) {
						option.classList.remove('selected');
					}
				});
			});
		});
	}

	hide() {
		this.element.classList.remove('open');

		if (!this.trigger.closest('.modal-body')) {
			const overflowElement = this.trigger.closest('.drawer-body') || document.body;
			overflowElement.style.overflow = '';
			overflowElement.style.marginRight = '';
		}
	}

	setValue(value, option = null) {
		if (!option) option = this.element.querySelector(`.input-select-option[data-value="${value}"]`);

		this.trigger.previousElementSibling.value = value;
		this.trigger.innerHTML = option.innerHTML;
		this.trigger.dataset.value = value;
		this.trigger.classList.add('selected');
		this.hide();

		option.classList.add('selected');
	}

	createOption(value, firstSelected = false, selected = false, valueIsDate = false) {
		const formatGlobalDate = (date) => {
			if (date === undefined) return 'N/A';
			date = date.replace(/-/g, '/');

			return `${new Intl.DateTimeFormat('nl-BE', {
				day: '2-digit',
				month: '2-digit',
				year: 'numeric',
				formatMatcher: 'basic',
			}).format(new Date(date))}`;
		};

		const option = document.createElement('div');
		option.classList.add('input-select-option');
		option.dataset.value = value;
		option.innerHTML = valueIsDate ? formatGlobalDate(value) : value;

		if (this.element.querySelector('.input-select-option') == null && firstSelected) {
			option.classList.add('selected');
			this.element.dataset.value = value;
			this.element.previousElementSibling.classList.add('selected');
			this.element.previousElementSibling.innerHTML = value;
			this.element.previousElementSibling.dataset.value = value;
			this.element.previousElementSibling.previousElementSibling.value = value;
		} else if (selected) {
			option.classList.add('selected');
			this.element.dataset.value = value;
			this.element.previousElementSibling.classList.add('selected');
			this.element.previousElementSibling.innerHTML = value;
			this.element.previousElementSibling.dataset.value = value;
			this.element.previousElementSibling.previousElementSibling.value = value;
		}

		this.element.appendChild(option);

		if (firstSelected || selected) {
			this.setValue(value);
		}
	}

	reset(resetOptions = false) {
		this.trigger.innerHTML = this.placeholder;
		this.trigger.removeAttribute('data-value');
		this.trigger.classList.remove('selected');
		this.trigger.previousElementSibling.removeAttribute('value');
		this.element.querySelectorAll('.input-select-option').forEach((option) => {
			option.classList.remove('selected');
			if (resetOptions) option.parentElement.removeChild(option);
		});
	}

	resetOptions() {
		this.element.querySelectorAll('.input-select-option').forEach((option) => {
			option.parentElement.removeChild(option);
		});
	}

	onSelect(callback) {
		this.element.querySelectorAll('.input-select-option').forEach((option) => {
			option.addEventListener('click', (event) => {
				const value = option.dataset.value || option.innerHTML;
				callback(value, option);
			});
		});
	}
}

export default Select;

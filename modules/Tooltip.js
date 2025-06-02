export default class Tooltip {
	constructor(element, text, position = 'top', delay = 750, relativeToCursor = false, invalidInput = false) {
		this.element = element;
		this.text = text;
		this.position = position;
		this.delay = delay;
		this.relativeToCursor = relativeToCursor;
		this.invalidInput = invalidInput;

		this.init();
	}

	init() {
		if (!this.invalidInput) {
			this.element.addEventListener('mouseenter', (event) => {
				this.show(event);
			});
			this.element.addEventListener('mouseleave', this.hide.bind(this));
			this.element.addEventListener('click', this.hide.bind(this));
		} else {
			this.element.addEventListener('input', (event) => {
				this.hide();
			});
		}
	}

	show(event = null, modal = null) {
		this.create();
		this.setPosition(event ? event : null);

		if (modal) {
			modal.on('close', this.hide(this));
		}

		setTimeout(() => {
			this.element.classList.add('tooltip-active');
			this.tooltip.classList.add('tooltip-open');
		}, this.delay);
	}

	hide() {
		if (!this.tooltip) return;

		this.element.classList.remove('tooltip-active');
		this.tooltip.classList.add(this.tooltip.classList.contains('tooltip-open') ? 'tooltip-close' : 'tooltip-hidden');
		this.tooltip.classList.remove('tooltip-open');
		setTimeout(() => {
			this.remove();
		}, 200);
	}

	create() {
		this.tooltip = document.createElement('div');
		this.tooltip.classList.add('tooltip', `tooltip-${this.position}`);
		this.tooltip.innerHTML = this.text;
		document.body.appendChild(this.tooltip);
	}

	remove() {
		this.tooltip.remove();
	}

	setPosition(event = null) {
		if (this.relativeToCursor) {
			const cursorX = event.clientX;
			const cursorY = event.clientY;
			const tooltipRect = this.tooltip.getBoundingClientRect();
			const width = tooltipRect.width * 1.05;
			const top = cursorY - tooltipRect.height - 8;
			const left = Math.max(cursorX - width / 2, 8);
			const useRight = left + width > window.innerWidth - 8;

			this.tooltip.style.top = `${top}px`;

			if (useRight) {
				this.tooltip.style.right = `8px`;
			} else {
				this.tooltip.style.left = `${left}px`;
			}
		} else {
			const elementRect = this.element.getBoundingClientRect();
			const tooltipRect = this.tooltip.getBoundingClientRect();
			const width = tooltipRect.width * 1.05;
			const top = elementRect.top - tooltipRect.height - 8;
			const left = Math.max(elementRect.left + elementRect.width / 2 - width / 2, 8);
			const useRight = left + width > window.innerWidth - 8;

			this.tooltip.style.top = `${top}px`;

			if (useRight) {
				this.tooltip.style.right = `8px`;
			} else {
				this.tooltip.style.left = `${left}px`;
			}
		}
	}
}

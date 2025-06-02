export default class Dropdown {
	constructor(dropdown, trigger, triggerEvent = 'contextmenu', role = 'contextmenu', dropdownPosition = 'center', callback = null) {
		this.dropdown = dropdown;
		this.dropdownItems = dropdown.querySelectorAll('.dropdown-item');
		this.trigger = trigger;
		this.triggerEvent = triggerEvent;
		this.role = role;
		this.dropdownPosition = dropdownPosition;
		this.callback = callback;
		this.result = null;
		this.bindFunc = this.triggerEventFunc.bind(this);

		this.dropdown.setAttribute('role', this.role);

		if (this.dropdownItems.length !== 0) this.init();
	}

	init() {
		const hasIcons = Array.from(this.dropdownItems).some((item) => {
			if (item.querySelector('i') && item.children[0] === item.querySelector('i')) return true;
			else if (item.querySelector('svg') && item.children[0] === item.querySelector('svg')) return true;
			else return false;
		});

		const hasSubmenus = Array.from(this.dropdownItems).some((item) => {
			if (item.classList.contains('dropdown-expandable')) return true;
			else return false;
		});

		if (!hasIcons) this.dropdown.classList.add('no-icons');
		if (hasSubmenus) this.dropdown.classList.add('has-submenus');

		this.trigger.addEventListener(this.triggerEvent, this.bindFunc);

		this.dropdownItems.forEach((item) => {
			if (item.classList.contains('dropdown-expandable')) {
				item.querySelector('.dropdown').setAttribute('role', this.role);

				// Show submenu
				item.addEventListener('mouseenter', (e) => {
					e.stopPropagation();
					this.submenu = item.querySelector('.dropdown');
					const { left, top } = this.calcSubmenuPosition(item);

					this.submenu.style.left = left + 'px';
					this.submenu.style.top = top + 'px';
					this.submenu.classList.add('open');
				});

				// Hide submenu
				item.addEventListener('mouseleave', (e) => {
					// Create a timeout to delay the hiding of the submenu
					let timeoutId = setTimeout(() => {
						this.hideMenu(this.submenu);
					}, 300); // 300ms delay

					// Clear the timeout if the mouse enters the submenu
					this.submenu.addEventListener('mouseenter', () => {
						clearTimeout(timeoutId);
					});
				});
			} else {
				item.addEventListener('click', (e) => {
					e.stopPropagation();

					this.result = item;
					this.hideMenu();

					if (this.callback) this.callback(this.result.dataset.value || this.result.textContent.trim(), this.result);
				});
			}
		});

		document.addEventListener('click', (e) => {
			// Hide the menu if the user clicks outside the dropdown
			if (!this.dropdown.contains(e.target) && this.dropdown.classList.contains('open')) this.hideMenu();
		});

		// Hide the menu if the user presses the escape key
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && this.dropdown.classList.contains('open')) this.hideMenu();
		});
	}

	triggerEventFunc(e) {
		e.preventDefault();
		e.stopPropagation();

		// Hide all other dropdowns
		const dropdowns = document.querySelectorAll('.dropdown.open');
		dropdowns.forEach((dropdown) => {
			if (dropdown !== this.dropdown) this.hideMenu(dropdown);
		});

		// Ignore the event if the dropdown is already open
		if (this.dropdown.classList.contains('open')) return;

		this.showMenu(e);
	}

	showMenu(e) {
		const { left, top } = this.calcPosition(e.clientX, e.clientY);

		document.body.style.overflow = 'hidden';

		this.dropdown.style.left = left + 'px';
		this.dropdown.style.top = top + 'px';
		this.dropdown.classList.toggle('open');
	}

	hideMenu(dropdown = this.dropdown) {
		dropdown.classList.remove('open');
		dropdown.classList.add('closing');

		document.body.style.overflow = '';

		// Hide all submenus
		const submenus = dropdown.querySelectorAll('.dropdown');

		submenus.forEach((submenu) => {
			submenu.classList.remove('open');
			submenu.classList.add('closing');
		});

		// Remove the closing class after the animation ends
		dropdown.addEventListener('animationend', () => {
			dropdown.classList.remove('closing');

			// Hide all submenus
			submenus.forEach((submenu) => {
				submenu.classList.remove('closing');
			});
		});
	}

	createDropdownItem(value, text, { icon = false, disabled = false, danger = false, newPart = false } = {}) {
		const item = document.createElement('div');
		item.classList.add('dropdown-item');
		item.setAttribute('data-value', value);
		item.textContent = text;

		if (disabled) item.classList.add('dropdown-item-disabled');
		if (danger) item.classList.add('dropdown-item-danger');
		if (newPart) {
			const divider = document.createElement('div');
			divider.classList.add('dropdown-divider');

			this.dropdown.appendChild(divider);
		}

		this.dropdown.appendChild(item);
		this.dropdownItems = this.dropdown.querySelectorAll('.dropdown-item');
		this.lastAddedItem = item;

		return {
			addSubmenu: (items) => {
				this.lastAddedItem.classList.add('dropdown-expandable');

				const submenu = document.createElement('div');
				submenu.classList.add('dropdown');
				submenu.setAttribute('role', this.role);

				this.lastAddedSubmenu = submenu;

				items.forEach((item) => {
					this.createDropdownItem(item.value, item.text, item.options);
				});
			},
		};
	}

	calcPosition(clientX, clientY) {
		if (this.role === 'dropdown') {
			clientX = this.trigger.getBoundingClientRect().left ? this.trigger.getBoundingClientRect().left : this.trigger.getBoundingClientRect().x;
			clientY = this.trigger.getBoundingClientRect().bottom
				? this.trigger.getBoundingClientRect().bottom
				: this.trigger.getBoundingClientRect().y + this.trigger.offsetHeight;

			if (this.dropdownPosition === 'center') {
				clientX -= (this.dropdown.offsetWidth || this.dropdown.clientWidth) / 2;
				clientX += (this.trigger.offsetWidth || this.trigger.clientWidth) / 2;
			} else if (this.dropdownPosition === 'left') {
				clientX -= this.dropdown.offsetWidth || this.dropdown.clientWidth;
			} else if (this.dropdownPosition === 'right') {
				clientX += this.trigger.offsetWidth || this.trigger.clientWidth;
			}
		}

		const sideMargin = 10;
		const dropdownWidth = this.dropdown.offsetWidth;
		const dropdownHeight = this.dropdown.offsetHeight;
		const windowWidth = window.innerWidth - sideMargin;
		const windowHeight = window.innerHeight - sideMargin;

		let left = clientX;
		let top = clientY;

		if (this.role === 'contextmenu') {
			if (clientX + dropdownWidth > windowWidth) {
				left = windowWidth - dropdownWidth;
				this.dropdown.setAttribute('direction', 'left');
			} else {
				this.dropdown.setAttribute('direction', 'right');
			}
		} else if (this.role === 'dropdown') {
			if (clientX + dropdownWidth > windowWidth) {
				left = windowWidth - dropdownWidth;
				this.dropdown.setAttribute('direction', 'left');
			} else {
				this.dropdown.setAttribute('direction', 'bottom');
			}
		}

		if (clientY + dropdownHeight > windowHeight) top = windowHeight - dropdownHeight;

		return { left, top };
	}

	calcSubmenuPosition(trigger) {
		const triggerWidth = trigger.offsetWidth + 5;
		const triggerLeft = trigger.offsetLeft - 5;
		const triggerTop = trigger.offsetTop;
		const headMenu = this.getHeadMenu(trigger);
		const headMenuTop = headMenu.offsetTop;
		const headMenuLeft = headMenu.offsetLeft;
		const headMenuHeight = headMenu.offsetHeight;
		const submenuWidth = trigger.querySelector('.dropdown').offsetWidth;
		const submenuHeight = trigger.querySelector('.dropdown').offsetHeight;
		const windowWidth = window.innerWidth;
		const windowHeight = window.innerHeight;

		let left = triggerWidth + triggerLeft;
		let top = triggerTop;

		if (left + headMenuLeft + submenuWidth > windowWidth) {
			left = triggerLeft - submenuWidth;
			trigger.querySelector('.dropdown').setAttribute('direction', 'left');
		} else {
			trigger.querySelector('.dropdown').setAttribute('direction', 'right');
		}

		if (triggerTop + headMenuTop + submenuHeight > windowHeight) {
			top = headMenuHeight - submenuHeight;
		}

		return { left, top };
	}

	getHeadMenu(trigger) {
		if (trigger.classList.contains('dropdown')) return trigger;
		else return this.getHeadMenu(trigger.parentElement);
	}

	onSelect(callback) {
		this.callback = callback;
	}

	destroy() {
		// Remove all event listeners
		this.trigger.removeEventListener(this.triggerEvent, this.bindFunc);
		document.removeEventListener('click', () => {});
		document.removeEventListener('keydown', () => {});
		window.removeEventListener('scroll', () => {});

		// Remove all items
		this.dropdownItems.forEach((item) => {
			item.remove();
		});

		// Remove all properties
		this.dropdownItems = NodeList;
		this.result = null;
	}
}

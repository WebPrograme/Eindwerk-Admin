export default class Popover {
	constructor(popover = null, { content = '', type = 'error', buttons = [], trueCenter = false, noIcon = false, close = true }) {
		this.popover = popover;
		this.trueCenter = trueCenter;

		this.icons = {
			error: {
				icon: 'fa-exclamation-triangle',
				color: '#ef4444',
			},
			success: {
				icon: 'fa-check-circle',
				color: '#10b981',
			},
			warning: {
				icon: 'fa-exclamation-triangle',
				color: '#f59e0b',
			},
		};

		if (!this.popover) {
			this.content = content;
			this.type = type;
			this.buttons = buttons;
			this.noIcon = noIcon;
			this.close = close;
			this.create(content, type, buttons, noIcon);
		}

		const sidebar = document.querySelector('.sidebar');

		if (sidebar && !sidebar.classList.contains('mobile') && trueCenter) {
			const width = sidebar.offsetWidth;
			this.popover.style.left = `${width}px`;
		}

		if (this.close) {
			this.popover.querySelector('.popover-close').addEventListener('click', () => {
				if (this.popover.classList.contains('open')) {
					this.hide();
				}
			});

			this.popover.querySelector('.popover-overlay').addEventListener('click', () => {
				if (this.popover.classList.contains('open')) {
					this.hide();
				}
			});

			document.addEventListener('keyup', (e) => {
				if (e.key === 'Escape') {
					if (this.popover.classList.contains('open')) {
						this.hide();
					}
				}
			});
		}
	}

	create(content, type, buttons, noIcon) {
		const popover = document.createElement('div');
		popover.classList.add('popover');
		popover.classList.add('popover-' + type);
		popover.innerHTML = `
            <div class="popover-content">
                ${this.close ? `<i class="fas fa-times popover-close"></i>` : ''}
                ${!noIcon ? `<div class="popover-icon"><i class="fas ${this.icons[type].icon}" style="color: ${this.icons[type].color};"></i></div>` : ''}
                <div class="popover-message">${content}</div>
                ${
					buttons.length > 0
						? `<div class="popover-footer">
                    ${buttons.map((button) => `<a class="btn ${button.class}">${button.text}</a>`).join('')}
                </div>`
						: ''
				}
            </div>

            <div class="popover-overlay"></div>
        `;

		document.body.appendChild(popover);

		this.popover = popover;
	}

	show() {
		this.popover.classList.add('open');
	}

	hide() {
		this.popover.classList.remove('open');
		this.popover.classList.add('hide');

		this.popover.addEventListener('animationend', () => {
			this.popover.classList.remove('hide');
		});
	}

	destroy() {
		this.popover.remove();
	}

	setContent(content) {
		this.popover.querySelector('.popover-message').innerHTML = content;
	}
}

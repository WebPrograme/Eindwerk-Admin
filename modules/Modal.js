export default class Modal {
	constructor(modal, trigger = null, multisteps = false, autoNext = false) {
		this.modal = modal;
		this.trigger = trigger;
		this.multisteps = multisteps;
		this.currentStep = 0;
		this.stepInputs = {};
		this.autoNext = autoNext;

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

		// Setup modal steps
		if (this.multisteps) {
			this.steps = this.modal.querySelectorAll('.modal-body-step');
			this.submitBtn = this.modal.querySelector('.modal-submit');

			this.steps.forEach((step, index) => {
				step.setAttribute('data-step', index + 1);
			});

			this.setStep(1);

			if (this.autoNext) {
				this.submitBtn.addEventListener('click', () => {
					if (this.currentStep === this.steps.length) {
						this.close();
						return;
					}

					this.setStep(this.currentStep + 1);
				});
			}
		}

		// Setup modal close x button
		this.modal.querySelectorAll('.modal-close').forEach((closeBtn) => {
			closeBtn.addEventListener('click', () => {
				this.close();
			});
		});

		// Setup modal close button
		this.modal.querySelectorAll('.btn-modal-close').forEach((closeBtn) => {
			closeBtn.addEventListener('click', () => {
				this.close();
			});
		});

		// Setup modal close on overlay click
		this.modal.addEventListener('click', (e) => {
			if (e.target.classList.contains('modal-overlay')) {
				this.close();
			}
		});

		// Setup modal close on escape key
		document.addEventListener('keydown', (e) => {
			e.stopPropagation();
			if (e.key === 'Escape') {
				this.close();
			}
		});
	}

	open(signal = null) {
		const scrollWidth = this.getScrollWidth();
		const isBodyOverflowing = document.body.clientHeight > window.innerHeight;

		if (isBodyOverflowing) {
			document.body.style.marginRight = scrollWidth + 'px';
		}

		if (this.multisteps) {
			this.setStep(1);
		}

		if (this.openCallback && signal) {
			this.openCallback(this.modal, signal);
		} else if (this.openCallback) {
			this.openCallback(this.modal);
		}

		document.body.classList.add('modal-open');
		this.modal.classList.add('open');
	}

	close() {
		this.modal.classList.remove('open');

		if (this.closeCallback) {
			this.closeCallback(this.modal);
		}

		if (this.modal.querySelector('.input-select')) {
			this.modal.querySelectorAll('.input-select').forEach((select) => {
				const optionsContainer = document.querySelector(`.input-select-options[for="${select.id}"]`);
				if (optionsContainer.classList.contains('open')) optionsContainer.classList.remove('open');
			});
		}

		this.modal.addEventListener(
			'transitionend',
			() => {
				if (!document.body.classList.contains('drawer-open')) document.body.style.marginRight = '';
				document.body.classList.remove('modal-open');

				if (this.multisteps) {
					this.setStep(1);
				}
				this.resetInputs();
			},
			{ once: true }
		);
	}

	setStep(step) {
		this.currentStep = step;

		this.modal.querySelector('.modal-body-step.current').classList.remove('current');
		this.modal.querySelector(`.modal-body-step[data-step="${step}"]`).classList.add('current');

		if (this.modal.querySelector('.modal-body-step.prev')) {
			this.modal.querySelector('.modal-body-step.prev').classList.remove('prev');
		}

		if (step !== 1) {
			this.modal.querySelector(`.modal-body-step[data-step="${step - 1}"]`).classList.add('prev');
		}

		const stepHeight = this.modal.querySelector(`.modal-body-step[data-step="${step}"]`).offsetHeight;
		this.modal.querySelector('.modal-body').style.height = stepHeight + 'px';

		if (step === this.steps.length) {
			this.submitBtn.innerHTML = 'Submit';
		} else {
			this.submitBtn.innerHTML = 'Next';
		}
	}

	nextStep() {
		this.setStep(this.currentStep + 1);
	}

	resetInputs() {
		this.modal.querySelectorAll('input').forEach((input) => {
			if (input.id.includes('-hidden') && input.parentElement && input.parentElement.classList.contains('input-select-container')) this.resetSelect(input);
			else {
				input.value = '';
				input.checked = false;
				input.classList.remove('tooltip-active');
			}
		});

		this.modal.querySelectorAll('textarea').forEach((textarea) => {
			textarea.value = '';
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

		document.querySelector(`.input-select-options[for="${trigger.id}"`).classList.remove('open');
	}

	getStepInputs(step) {
		const inputs = this.modal.querySelectorAll(`.modal-body-step[data-step="${step}"] input`);
		this.stepInputs[step] = Object.assign(
			{},
			Array.from(inputs).map((input, index) => {
				return { value: input.value, checked: input.checked, id: input.id, input: input };
			})
		);

		return this.stepInputs[step];
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

	on(event, callback) {
		switch (event) {
			case 'open':
				// Check if there is already an open callback
				if (this.openCallback) {
					const oldCallback = this.openCallback;
					this.openCallback = (modal, signal) => {
						oldCallback(modal, signal);
						callback(modal, signal);
					};
				} else {
					this.openCallback = callback;
				}
				break;
			case 'close':
				// Check if there is already a close callback
				if (this.closeCallback) {
					const oldCallback = this.closeCallback;
					this.closeCallback = (modal, signal) => {
						oldCallback(modal, signal);
						callback(modal, signal);
					};
				} else {
					this.closeCallback = callback;
				}
				break;
			default:
				break;
		}
	}
}

import Select from './Select.js';

export default class Chain {
	constructor(tree, containsDateValues = false) {
		this.tree = tree;
		this.inputs = [];
		this.inputsClasses = [];
		this.path = [];
		this.containsDateValues = containsDateValues;
		this.init();
	}

	init() {
		const getInput = (tree) => {
			const input = document.querySelector(tree.input);
			input.parentElement.classList.add('chain-input', 'chain-input-locked');

			if (!input || this.inputs.includes(input)) return;

			const inputClass = new Select(input.nextElementSibling, input);
			if (this.inputs.length === 0) {
				input.parentElement.classList.remove('chain-input-locked');
				this.addValues(input, Object.keys(tree.children), inputClass);
			}

			this.inputs.push(input);
			this.inputsClasses.push(inputClass);

			const mutationObserver = new MutationObserver((mutations) => {
				mutations.forEach((mutation) => {
					if (
						mutation.type === 'attributes' &&
						mutation.attributeName === 'data-value' &&
						mutation.target.dataset.value !== '' &&
						mutation.target.dataset.value !== undefined
					) {
						const inputIndex = this.inputs.indexOf(input);
						const previousInputs = this.inputs.slice(0, inputIndex);
						const lockedInputs = this.inputs.slice(inputIndex + 1);
						const isValid = previousInputs.every((input) => input.dataset.value !== '');
						const nextInput = this.inputs[inputIndex + 1];
						const nextInputClass = this.inputsClasses[inputIndex + 1];

						this.path = this.inputs
							.map((input) => input.dataset.value)
							.filter((value) => value !== undefined)
							.slice(0, inputIndex + 1);

						lockedInputs.forEach((input) => {
							input.parentElement.classList.add('chain-input-locked');
							const inputIndex = this.inputs.indexOf(input);
							const inputClass = this.inputsClasses[inputIndex];
							inputClass.reset();
						});

						if (isValid && nextInput) {
							nextInput.parentElement.classList.remove('chain-input-locked');
							nextInputClass.reset(true);
							const values = this.getValues(nextInput);
							this.addValues(nextInput, values, this.inputsClasses[inputIndex + 1]);
						}
					}
				});
			});

			mutationObserver.observe(input, {
				attributes: true,
				attributeFilter: ['data-value'],
			});

			if (tree.children && !Array.isArray(tree.children)) {
				Object.keys(tree.children).forEach((key) => getInput(tree.children[key]));
			}
		};

		getInput(this.tree);
	}

	addValues(input, values, inputClass) {
		values.forEach((value) => {
			// Check if value is a date
			const dateCheck = new Date(value);
			if (this.containsDateValues && dateCheck instanceof Date && !isNaN(dateCheck)) {
				inputClass.createOption(value, false, false, this.containsDateValues);
			} else {
				inputClass.createOption(value, false);
			}
		});
	}

	getValues(input) {
		const tree = this.tree;
		const inputIndex = this.inputs.indexOf(input);
		const previousInputs = this.inputs.slice(0, inputIndex);
		const values = [];

		if (previousInputs.length === 0) return values;

		const recursive = (tree) => {
			const input = document.querySelector(tree.input);
			const inputValue = input.dataset.value;

			if (inputValue) {
				if (tree.children && !Array.isArray(tree.children)) {
					Object.keys(tree.children).forEach((key) => {
						if (key === inputValue) {
							recursive(tree.children[key]);
						}
					});
				} else if (Array.isArray(tree.children)) {
					tree.children.forEach((child) => {
						if (child === inputValue) {
							values.push(inputValue);
						}
					});
				}
			} else {
				if (tree.children && !Array.isArray(tree.children)) {
					values.push(...Object.keys(tree.children));
				} else if (Array.isArray(tree.children)) {
					values.push(...tree.children);
				}
			}
		};

		recursive(tree);

		return values;
	}

	reset() {
		this.inputs.forEach((input) => {
			const inputIndex = this.inputs.indexOf(input);

			this.inputsClasses[inputIndex].reset();
			input.parentElement.classList.add('chain-input-locked');
		});

		this.inputs[0].parentElement.classList.remove('chain-input-locked');

		this.path = [];
	}
}

import Dropdown from './Dropdown.js';

export default class Table {
	constructor(
		element,
		{
			data = [],
			columns = [],
			noDataMessage = 'No data available',
			onRowClick,
			hasWrapper = false,
			pagination = { enabled: false, limit: 10, page: 0, hasAllData: false, dataRetriever: null, total: data.length, prevCallback: null, nextCallback: null },
			more = { enabled: false, limit: 10, page: 0, hasAllData: false, dataRetriever: null, total: data.length },
			columnToggle = { enabled: false, dropdownClass: null, columns: [], defaultColumns: [] },
			rowAttributes = {},
			searchElement = null,
		}
	) {
		this.element = element;
		this.data = data;
		this.columns = columns;
		this.noDataMessage = noDataMessage;
		this.onRowClick = onRowClick;
		this.hasWrapper = hasWrapper;
		this.pagination = pagination;
		this.hasPagination = pagination.enabled;
		this.more = more;
		this.hasMore = more.enabled;
		this.columnToggle = columnToggle;
		this.rowAttributes = rowAttributes;
		this.searchElement = searchElement;

		if (this.hasPagination) {
			this.currentPage = pagination.page || 0;
			this.total = pagination.total || data.length;
			this.hasAllData = pagination.hasAllData || false;
			this.prevCallback = pagination.prevCallback || null;
			this.nextCallback = pagination.nextCallback || null;
		} else if (this.hasMore) {
			this.currentPage = more.page || 0;
			this.total = more.total || data.length;
			this.hasAllData = more.hasAllData || false;
		}

		this.init();
	}

	init() {
		this.element.innerHTML = `${!this.hasWrapper ? '<div class="table-wrapper">' : ''}<table class="table"></table>${!this.hasWrapper ? '</div>' : ''}`;
		this.createHeader();

		// Check and update if necessary the hasAllData property
		if (this.hasPagination || this.hasMore) this.hasAllData = this.total === this.data.length;

		if (this.data.length > 0) {
			const limit = this.pagination.limit || this.data.length;

			if (this.hasPagination && this.hasAllData) {
				const slicedData = this.data.slice(this.currentPage * limit, (this.currentPage + 1) * limit);
				slicedData.forEach((row) => {
					this.addRow(row);
				});
			} else {
				this.data.forEach((row) => {
					this.addRow(row);
				});
			}

			if (this.hasPagination) this.createPagination();
			if (this.hasMore && !this.hasAllData) this.createMore();
		} else {
			this.element.querySelector(
				'table'
			).innerHTML += `<tbody><tr class="table-empty"><td colspan="${this.columns.length}" class="text-center">${this.noDataMessage}</td></tr></tbody>`;
		}

		if (this.searchElement) {
			const input = this.searchElement;
			let timeout = null;

			input.addEventListener('input', (e) => {
				clearTimeout(timeout);
				timeout = setTimeout(() => {
					this.search(e);
				}, 300);
			});
		}

		lucide.createIcons();
	}

	createHeader() {
		const thead = document.createElement('thead');
		const tr = document.createElement('tr');

		if (this.columns.length === 0) {
			Object.keys(this.data[0]).forEach((key) => {
				// Text alignment
				const type = typeof this.data[0][key];
				const isNumber = type === 'number' || type === 'bigint';
				const textAlign = isNumber ? 'text-right' : 'text-left';

				const th = document.createElement('th');
				th.innerHTML = key;
				th.classList.add('table-column');
				th.classList.add('column-string');
				th.classList.add(textAlign);
				tr.appendChild(th);
			});
		} else {
			this.columns.forEach((column, index) => {
				// Add column toggle
				column.default = column.default === undefined ? true : column.default;
				if (this.columnToggle.enabled) {
					if (this.columnToggle.saveState) {
						const savedState = localStorage.getItem(this.columnToggle.saveStateKey) ? JSON.parse(localStorage.getItem(this.columnToggle.saveStateKey)) : {};
						if (savedState[column.key] !== undefined) {
							column.default = savedState[column.key];
						}
					}

					if (this.columnToggle.dropdownClass.dropdownItemsTitles && !this.columnToggle.dropdownClass.dropdownItemsTitles.includes(column.title)) {
						this.columnToggle.dropdownClass.createDropdownItem(column.title, column.title, { icon: false, disabled: false, checkbox: true, checked: column.default });
					} else if (!this.columnToggle.dropdownClass.dropdownItemsTitles) {
						this.columnToggle.dropdownClass.createDropdownItem(column.title, column.title, { icon: false, disabled: false, checkbox: true, checked: column.default });
					}
				}

				// Text alignment
				const type = column.type || typeof this.data[0][column.key];
				const isNumber = type === 'number' || type === 'bigint';
				const textAlign = isNumber ? 'text-right' : 'text-left';

				// Add column to table
				const th = document.createElement('th');
				th.innerHTML = column.title;
				th.dataset.key = column.key;
				th.dataset.sortable = column.sortable && !this.hasPagination ? 'true' : 'false';
				th.dataset.type = column.type || 'string';
				th.classList.add(column.sortable && !this.hasPagination ? 'table-column-sortable' : 'table-column');
				th.classList.add(column.type && column.type === 'date' ? 'column-date' : 'column-string');
				th.classList.add(column.center ? 'text-center' : textAlign);
				th.addEventListener('click', (header) => {
					if (!column.sortable || this.hasPagination) return;
					this.sortColumn(column.key, header.currentTarget);
				});

				if (this.columnToggle.enabled && !column.default) {
					th.classList.add('hidden');
				}

				tr.appendChild(th);
			});
		}

		if (this.columnToggle.enabled) {
			this.columnToggle.dropdownClass.callback = (title) => {
				this.toggleColumn(title);
			};

			// Add button to toggle columns
			this.columnToggle.dropdownClass.createDropdownCloseButton('Opslaan');
			this.columnToggle.dropdownClass.init();
		}

		thead.appendChild(tr);
		this.element.querySelector('table').appendChild(thead);
	}

	addRow(row) {
		const tbody = this.element.querySelector('table tbody') || document.createElement('tbody');
		const tr = document.createElement('tr');
		if (this.onRowClick) {
			this.element.querySelector('table').classList.add('table-clickable');
			tr.addEventListener('click', () => {
				this.onRowClick(row, this.data);
			});
		}

		Object.keys(this.rowAttributes).forEach((key) => {
			tr.setAttribute(key, row[this.rowAttributes[key]]);
		});

		const fragment = document.createDocumentFragment();

		if (this.columns.length === 0) {
			Object.keys(row).forEach((key) => {
				// Text alignment
				const type = typeof row[key];
				const isNumber = type === 'number' || type === 'bigint';
				const textAlign = isNumber ? 'text-right' : 'text-left';

				const td = document.createElement('td');
				td.innerHTML = row[key];
				td.classList.add(textAlign);
				fragment.appendChild(td);
			});
		} else {
			this.columns.forEach((column) => {
				column.default = column.default === undefined ? true : column.default;
				const endValue = column.valueResolver ? column.valueResolver(row[column.key]) : row[column.key];

				// Text alignment
				const type = column.type || typeof endValue;
				const isNumber = type === 'number' || type === 'bigint';
				const textAlign = isNumber ? 'text-right' : 'text-left';

				const td = document.createElement('td');
				td.classList.add(column.center ? 'text-center' : textAlign);
				td.innerHTML = endValue;

				if (column.sortable && column.valueResolver) {
					td.dataset.rawValue = row[column.key];
				} else if (column.sortable) {
					td.dataset.rawValue = endValue;
				}

				if (column.onCellClick) {
					td.addEventListener('click', () => {});
				}

				if (this.columnToggle.enabled && !column.default) {
					td.classList.add('hidden');
				}

				fragment.appendChild(td);
			});
		}

		tr.appendChild(fragment);
		tbody.appendChild(tr);
		if (!this.element.querySelector('table tbody')) {
			this.element.querySelector('table').appendChild(tbody);
		}
	}

	createPagination() {
		const pagination = document.createElement('div');
		pagination.classList.add('table-footer', 'table-footer-pagination');
		const prev = document.createElement('button');
		prev.classList.add('btn', 'btn-secondary', 'btn-only-icon', 'table-footer-prev');
		prev.disabled = this.currentPage === 0;
		prev.innerHTML = '<i data-lucide="chevron-left"></i>';
		prev.addEventListener('click', () => {
			this.currentPage--;
			if (this.prevCallback) {
				this.prevCallback(this.currentPage, this.pagination.limit);
			} else if (this.currentPage > 0) {
				this.updateData(this.currentPage, this.pagination.limit);
			}
		});

		const next = document.createElement('button');
		next.classList.add('btn', 'btn-secondary', 'btn-only-icon', 'table-footer-next');
		next.disabled = this.currentPage >= this.total / this.pagination.limit - 1;
		next.innerHTML = '<i data-lucide="chevron-right"></i>';

		next.addEventListener('click', () => {
			this.currentPage++;
			if (this.nextCallback) {
				this.nextCallback(this.currentPage, this.pagination.limit);
			} else if (this.currentPage < this.total / this.pagination.limit - 1) {
				this.updateData(this.currentPage, this.pagination.limit);
			}
		});

		const page = document.createElement('h3');
		page.classList.add('table-footer-between');
		page.innerHTML = `${Math.min(this.currentPage * this.pagination.limit, this.total)} - ${Math.min(
			this.currentPage * this.pagination.limit + this.pagination.limit,
			this.total
		)} van ${this.total}`;

		pagination.appendChild(prev);
		pagination.appendChild(page);
		pagination.appendChild(next);
		this.element.appendChild(pagination);
	}

	// Create a "more" button to load more data
	// Oppposite of pagination, this will add more data to the table instead of replacing it
	createMore() {
		const tablefooter = document.createElement('div');
		tablefooter.classList.add('table-footer', 'table-footer-more');

		const progress = document.createElement('div');
		progress.classList.add('table-footer-progress');
		progress.innerHTML = `<div class="table-footer-progress-text"><span id="table-footer-progress-current">${
			this.more.limit * (this.currentPage + 1) > this.more.total ? this.more.total : this.more.limit * (this.currentPage + 1)
		}</span> - <span id="table-footer-progress-total">${this.more.total}</span></div><div class="table-footer-progress-bar" style="--progress: ${
			((this.more.limit * (this.currentPage + 1)) / this.more.total) * 100
		}%;"><div class="table-footer-progress-bar-fill" style="width: var(--progress);"></div></div>`;

		tablefooter.appendChild(progress);

		const more = document.createElement('a');
		more.classList.add('btn', 'btn-secondary', 'table-footer-more-btn');
		more.innerHTML = 'Meer laden';

		tablefooter.appendChild(more);
		this.element.appendChild(tablefooter);

		more.addEventListener('click', () => {
			this.currentPage++;

			// Disable the button
			more.classList.add('disabled');
			more.innerHTML = 'Laden...';

			if (this.currentPage < this.total / this.more.limit) {
				this.updateData(this.currentPage, this.more.limit).then(() => {
					more.classList.remove('disabled');
					more.innerHTML = 'Meer laden';
				});

				// Update the progress bar
				const progress = this.element.querySelector('.table-footer-progress-bar');
				const current = this.element.querySelector('#table-footer-progress-current');
				const total = this.element.querySelector('#table-footer-progress-total');

				const progressValue = ((this.more.limit * (this.currentPage + 1)) / this.more.total) * 100;
				progress.style.setProperty('--progress', `${progressValue}%`);
				current.innerHTML = `${Math.min(this.more.limit * (this.currentPage + 1), this.more.total)}`;
				total.innerHTML = `${this.more.total}`;
			}
		});
	}

	sortColumn(key, header) {
		const direction = header.dataset.direction === 'asc' ? 'desc' : 'asc';
		const math = direction === 'asc' ? -1 : 1;
		const column = this.columns.find((column) => column.key === key);
		const type = column.type || 'string';
		const rows = Array.from(this.element.querySelector('table tbody').querySelectorAll('tr'));

		rows.sort((a, b) => {
			let valueA = a.querySelector(`td:nth-child(${this.getColumnIndex(key) + 1})`).dataset.rawValue;
			let valueB = b.querySelector(`td:nth-child(${this.getColumnIndex(key) + 1})`).dataset.rawValue;

			valueA = valueA !== undefined && valueA !== null ? valueA : '';
			valueB = valueB !== undefined && valueB !== null ? valueB : '';

			if (type === 'number') {
				return column.sortable ? (valueA - valueB) * math : 0;
			} else if (type === 'date') {
				return column.sortable ? (new Date(valueA) - new Date(valueB)) * math : 0;
			} else {
				return column.sortable ? valueA.localeCompare(valueB) * math : 0;
			}
		});

		this.element.querySelector('table tbody').innerHTML = '';
		rows.forEach((row) => {
			this.element.querySelector('table tbody').appendChild(row);
		});

		this.element.querySelectorAll('table thead th').forEach((th) => {
			th.dataset.direction = '';

			if (th.dataset.key === key) {
				th.dataset.direction = direction;
			}
		});
	}

	toggleColumn(title) {
		const columnIndex = this.getColumnIndex(title, 'title');
		const th = this.element.querySelector(`table thead th:nth-child(${columnIndex + 1})`);
		const rows = Array.from(this.element.querySelectorAll('table tbody tr:not(.table-empty)'));

		th.classList.toggle('hidden');
		rows.forEach((row) => {
			row.querySelector(`td:nth-child(${columnIndex + 1})`).classList.toggle('hidden');
		});

		if (this.columnToggle.saveState) {
			const savedState = localStorage.getItem(this.columnToggle.saveStateKey) ? JSON.parse(localStorage.getItem(this.columnToggle.saveStateKey)) : {};
			savedState[this.columns[columnIndex].key] = !this.columns[columnIndex].default;
			localStorage.setItem(this.columnToggle.saveStateKey, JSON.stringify(savedState));
		}

		this.columns[columnIndex].default = !this.columns[columnIndex].default;
	}

	getColumnIndex(value, type = 'key') {
		if (type === 'key') return this.columns.findIndex((column) => column.key === value);
		else if (type === 'title') return this.columns.findIndex((column) => column.title === value);
	}

	async updateData(page, limit) {
		if (this.hasAllData) {
			this.currentPage = page;
			this.element.querySelector('table tbody').innerHTML = '';
			this.data.forEach((row) => {
				this.addRow(row);
			});
			return;
		}

		if (this.hasPagination) {
			const data = await this.pagination.dataRetriever(page, limit);
			this.data = data;
		} else if (this.hasMore) {
			const data = await this.more.dataRetriever(page, limit);
			this.data.push(...data);
			this.currentPage = page;
		}

		this.init();
	}

	search(e) {
		const value = e.target.value.toLowerCase();
		const rows = Array.from(this.element.querySelector('table tbody').querySelectorAll('tr'));
		let lastVisibleRow = null;

		rows.forEach((row) => {
			const tds = Array.from(row.querySelectorAll('td'));
			// Filter all unsearchable columns (given by the column.searchable property)
			const searchableColumns = this.columns.filter((column) => column.searchable !== false);
			const found = searchableColumns.some((column) => {
				const td = tds.find((td) => td.innerHTML.toLowerCase().includes(value));
				return td;
			});

			if (found) {
				row.classList.remove('hidden');
				lastVisibleRow = row;
			} else {
				row.classList.add('hidden');
			}
		});

		if (lastVisibleRow) lastVisibleRow.classList.add('hide-border');
	}
}

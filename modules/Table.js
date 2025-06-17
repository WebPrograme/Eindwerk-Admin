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
			selectable = false,
			selectButtons = null,
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
		this.selectable = selectable;
		this.selectButtons = selectButtons;

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
			const colspan = this.columns.length + (this.selectable ? 1 : 0);
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

		// If the table is selectable, add the select header
		if (this.selectable) {
			this.createSelectHeader();
		}

		lucide.createIcons();
	}

	createSelectHeader() {
		const selectHeader = document.createElement('div');
		selectHeader.classList.add('table-select-header');
		selectHeader.innerHTML = `<p class="table-select-header-text"><span class="table-selected-count">0</span> items geselecteerd</p>`;

		this.selectButtons.forEach((button) => {
			const btn = document.createElement('button');
			btn.classList.add(...button.classes);
			btn.innerHTML = button.text;
			btn.addEventListener('click', () => {
				button.onClick(this.getSelectedRows());
			});

			selectHeader.appendChild(btn);
		});

		this.selectHeader = selectHeader;
		this.element.insertBefore(selectHeader, this.element.firstChild);
	}

	createHeader() {
		const thead = document.createElement('thead');
		const tr = document.createElement('tr');

		// Add a checkbox to the header if the table is selectable
		if (this.selectable) {
			const th = document.createElement('th');
			th.innerHTML = '<input type="checkbox" class="table-checkbox">';
			th.classList.add('table-column-select', 'text-center');
			th.addEventListener('click', (e) => {
				const checkboxes = Array.from(this.element.querySelectorAll('table tbody td:first-child input[type="checkbox"]'));
				checkboxes.forEach((checkbox) => {
					checkbox.checked = e.currentTarget.querySelector('input[type="checkbox"]').checked;
				});

				if (this.onSelect) this.onSelect(this.getSelectedRows());
			});

			tr.appendChild(th);
		}

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
				const type = column.type || this.data[0] !== undefined ? typeof this.data[0][column.key] : 'string';
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

		// Add a checkbox to the row if the table is selectable
		if (this.selectable) {
			const td = document.createElement('td');
			td.innerHTML = '<input type="checkbox" class="table-checkbox">';
			td.classList.add('table-column-select');
			td.addEventListener('click', (e) => {
				e.stopPropagation();

				if (this.onSelect) this.onSelect(this.getSelectedRows());
			});
			tr.appendChild(td);
		}

		// Add attributes to the row
		Object.keys(this.rowAttributes).forEach((key) => {
			const path = this.rowAttributes[key].split('.');
			let value = row;
			path.forEach((p) => {
				value = value[p];
			});

			tr.setAttribute(key, value);
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

				if (column.classes) {
					if (typeof column.classes === 'string') {
						td.classList.add(column.classes);
					} else {
						td.classList.add(...column.classes);
					}
				}

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
			this.updateData(this.currentPage, this.pagination.limit);

			if (this.saveInUrl) {
				const url = new URL(window.location.href);
				url.searchParams.set('page', this.currentPage);
				url.searchParams.set('count', this.pagination.limit);
				window.history.pushState({}, '', url);
			}
		});

		const next = document.createElement('button');
		next.classList.add('btn', 'btn-secondary', 'btn-only-icon', 'table-footer-next');
		next.disabled = this.currentPage >= this.total / this.pagination.limit - 1;
		next.innerHTML = '<i data-lucide="chevron-right"></i>';

		next.addEventListener('click', () => {
			this.currentPage++;
			this.updateData(this.currentPage, this.pagination.limit);

			if (this.saveInUrl) {
				const url = new URL(window.location.href);
				url.searchParams.set('page', this.currentPage);
				url.searchParams.set('count', this.pagination.limit);
				window.history.pushState({}, '', url);
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

	getColumnIndex(key) {
		return this.columns.findIndex((column) => column.key === key) + (this.selectable ? 1 : 0);
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

	onSelect(selectedRows) {
		if (selectedRows.length > 0) {
			this.selectHeader.querySelector('.table-selected-count').innerHTML = selectedRows.length;
			this.selectHeader.classList.add('active');
		} else {
			this.selectHeader.classList.remove('active');
		}
	}

	getSelectedRows() {
		return Array.from(this.element.querySelectorAll('table tbody td:first-child input[type="checkbox"]:checked')).map((checkbox) => checkbox.closest('tr'));
	}

	refresh(data) {
		this.data = data;
		this.init();
	}
}

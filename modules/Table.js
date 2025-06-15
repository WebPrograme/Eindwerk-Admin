export default class Table {
	constructor(
		element,
		{
			data = [],
			columns = [],
			noDataMessage = 'No data available',
			onRowClick,
			hasWrapper = true,
			pagination = {
				enabled: false,
				count: 10,
				page: 0,
				showMore: false,
				hasAllData: false,
				dataRetriever: null,
				total: data.length,
				saveInUrl: false,
			},
			rowAttributes = {},
			searchElement = null,
			selectable = false,
			selectButtons = null,
			fixed = false,
		}
	) {
		this.element = element;
		this.data = data;
		this.columns = columns;
		this.noDataMessage = noDataMessage;
		this.onRowClick = onRowClick;
		this.hasWrapper = hasWrapper;
		this.pagination = pagination;
		this.hasPagination = this.pagination.enabled;
		this.hasAllData = this.pagination.hasAllData;
		this.currentPage = this.pagination.page;
		this.total = this.pagination.total;
		this.dataRetriever = this.pagination.dataRetriever;
		this.saveInUrl = this.pagination.saveInUrl;
		this.rowAttributes = rowAttributes;
		this.searchElement = searchElement;
		this.selectable = selectable;
		this.selectButtons = selectButtons;
		this.fixed = fixed;

		this.init();
	}

	init() {
		this.element.innerHTML = `${this.hasWrapper ? '<div class="table-wrapper">' : ''}<table class="table"></table>${this.hasWrapper ? '</div>' : ''}`;
		this.createHeader();

		if (this.data.length > 0) {
			const count = this.pagination.count || this.data.length;

			if (this.hasPagination && this.hasAllData) {
				const data = this.data.slice(this.currentPage * count, (this.currentPage + 1) * count);
				data.forEach((row) => {
					this.addRow(row);
				});
			} else {
				this.data.forEach((row) => {
					this.addRow(row);
				});
			}

			// Default sorting to the first column that is sortable
			const defaultSort = this.columns.find((column) => column.sortable);
			if (defaultSort) {
				this.sortColumn(defaultSort.key, this.element.querySelector(`table thead th[data-key="${defaultSort.key}"]`));
			}

			if (this.hasPagination && !this.pagination.showMore) {
				this.createPagination();
			} else if (this.hasPagination && this.pagination.showMore) {
				this.createShowMore();
			}

			if (this.fixed) {
				this.element.querySelector('table').classList.add('table-fixed');
			}
		} else {
			const colspan = this.columns.length + (this.selectable ? 1 : 0);
			this.element.querySelector('table').innerHTML += `<tbody><tr><td colspan="${colspan}" class="text-center">${this.noDataMessage}</td></tr></tbody>`;
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

		// If the table is selectable and has a wrapper, add the select header
		if (this.selectable && this.hasWrapper) {
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

		// Add the columns to the header
		this.columns.forEach((column) => {
			const th = document.createElement('th');
			th.innerHTML = column.title;
			th.dataset.key = column.key;
			th.dataset.sortable = column.sortable && !this.hasPagination ? 'true' : 'false';
			th.dataset.type = column.type || 'string';
			th.classList.add(column.sortable && !this.hasPagination ? 'table-column-sortable' : 'table-column');
			th.classList.add(column.type && column.type === 'date' ? 'column-date' : 'column-string');
			th.classList.add(column.center ? 'text-center' : 'text-left');

			if (column.width) th.style.width = column.width;
			if (column.minWidth) th.style.minWidth = column.minWidth;

			th.addEventListener('click', (header) => {
				if (!column.sortable || this.hasPagination) return;
				this.sortColumn(column.key, header.currentTarget);
			});

			tr.appendChild(th);
		});

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

		// Add attributes to the row
		Object.keys(this.rowAttributes).forEach((key) => {
			const path = this.rowAttributes[key].split('.');
			let value = row;
			path.forEach((p) => {
				value = value[p];
			});

			tr.setAttribute(key, value);
		});

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

		// Add the columns to the row
		this.columns.forEach((column) => {
			const td = document.createElement('td');
			td.innerHTML = column.valueResolver ? column.valueResolver(row[column.key]) : row[column.key];
			td.classList.add(column.center ? 'text-center' : 'text-left');

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
				td.dataset.rawValue = td.innerHTML;
			}
			td.addEventListener('click', () => {
				if (column.onCellClick) {
					column.onCellClick(td);
				}
			});
			tr.appendChild(td);
		});

		tr.style.setProperty('width', this.element.querySelector('table').offsetWidth + 'px');

		tbody.appendChild(tr);
		this.element.querySelector('table').appendChild(tbody);
	}

	createPagination() {
		const pagination = document.createElement('div');
		pagination.classList.add('table-footer');
		const prev = document.createElement('button');
		prev.classList.add('btn', 'btn-secondary', 'btn-only-icon', 'table-footer-prev');
		prev.disabled = this.currentPage === 0;
		prev.innerHTML = '<i data-lucide="chevron-left"></i>';
		prev.addEventListener('click', () => {
			this.currentPage--;
			this.updateData(this.currentPage, this.pagination.count);

			if (this.saveInUrl) {
				const url = new URL(window.location.href);
				url.searchParams.set('page', this.currentPage);
				url.searchParams.set('count', this.pagination.count);
				window.history.pushState({}, '', url);
			}
		});

		const next = document.createElement('button');
		next.classList.add('btn', 'btn-secondary', 'btn-only-icon', 'table-footer-next');
		next.disabled = this.currentPage >= this.total / this.pagination.count - 1;
		next.innerHTML = '<i data-lucide="chevron-right"></i>';

		next.addEventListener('click', () => {
			this.currentPage++;
			this.updateData(this.currentPage, this.pagination.count);

			if (this.saveInUrl) {
				const url = new URL(window.location.href);
				url.searchParams.set('page', this.currentPage);
				url.searchParams.set('count', this.pagination.count);
				window.history.pushState({}, '', url);
			}
		});

		const page = document.createElement('h3');
		page.classList.add('table-footer-between');
		page.innerHTML = `${Math.min(this.currentPage * this.pagination.count, this.total)} - ${Math.min(
			this.currentPage * this.pagination.count + this.pagination.count,
			this.total
		)} van ${this.total}`;

		pagination.appendChild(prev);
		pagination.appendChild(page);
		pagination.appendChild(next);
		this.element.appendChild(pagination);
	}

	createShowMore() {
		const showMore = document.createElement('div');
		showMore.classList.add('table-footer', 'table-footer-show-more');
		const button = document.createElement('button');
		button.classList.add('btn', 'btn-secondary');
		button.innerHTML = 'Laad Meer';
		button.addEventListener('click', () => {
			this.currentPage++;
			this.appendData(this.currentPage, this.pagination.count);

			if (this.saveInUrl) {
				const url = new URL(window.location.href);
				url.searchParams.set('page', '0');
				url.searchParams.set('count', this.pagination.count * (this.currentPage + 1));
				window.history.pushState({}, '', url);
			}
		});

		if (this.data.length >= this.pagination.total) {
			showMore.style.display = 'none';
		}

		showMore.appendChild(button);
		this.element.appendChild(showMore);
	}

	sortColumn(key, header) {
		const direction = header.dataset.direction === 'desc' ? 'asc' : 'desc';
		const math = direction === 'asc' ? -1 : 1;
		const column = this.columns.find((column) => column.key === key);
		const type = column.type || 'string';
		const rows = Array.from(this.element.querySelector('table tbody').querySelectorAll('tr'));

		rows.sort((a, b) => {
			const valueA = a.querySelector(`td:nth-child(${this.getColumnIndex(key) + 1})`).dataset.rawValue;
			const valueB = b.querySelector(`td:nth-child(${this.getColumnIndex(key) + 1})`).dataset.rawValue;

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

	getColumnIndex(key) {
		return this.columns.findIndex((column) => column.key === key) + (this.selectable ? 1 : 0);
	}

	async updateData(page, count) {
		const data = await this.pagination.dataRetriever(page, count);
		this.data = data;
		this.init();
	}

	async appendData(page, count) {
		const data = await this.pagination.dataRetriever(page, count);
		this.data = [...this.data, ...data];
		this.init();
	}

	search(e) {
		console.log('searching');
		const value = e.target.value.toLowerCase();
		const rows = Array.from(this.element.querySelector('table tbody').querySelectorAll('tr'));

		rows.forEach((row) => {
			const tds = Array.from(row.querySelectorAll('td'));
			// Filter all unsearchable columns (given by the column.searchable property)
			const searchableColumns = this.columns.filter((column) => column.searchable !== false);
			const found = searchableColumns.some((column) => {
				const td = tds.find((td) => td.innerHTML.toLowerCase().includes(value));
				return td;
			});

			if (found) {
				row.style.display = '';
			} else {
				row.style.display = 'none';
			}
		});
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

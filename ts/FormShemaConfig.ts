import type { Config } from './types';

// archive.js
export const newArchiveItemInputConfig: Config = {
	inputs: [
		{
			selector: '#archive-item-title',
			requirements: {
				type: 'string',
				min: 3,
				max: 50,
			},
		},
		{
			selector: '#archive-item-description',
			requirements: {
				type: 'string',
				min: 3,
				max: 1000,
			},
		},
		{
			selector: '#archive-item-date-day',
			requirements: {
				type: 'function',
				function: (value: string) => {
					if (!value) return true;

					// Validate if there is a month and year
					const month = (document.querySelector('#archive-item-date-month') as HTMLInputElement).value;
					const year = (document.querySelector('#archive-item-date-year') as HTMLInputElement).value;

					if (month && year) {
						return true;
					}
					return false;
				},
			},
		},
		{
			selector: '#archive-item-date-month',
			requirements: {
				type: 'function',
				function: (value: string) => {
					if (!value) return true;
					// Validate if there is a year
					const year = (document.querySelector('#archive-item-date-year') as HTMLInputElement).value;

					if (year) {
						return true;
					}

					return false;
				},
			},
		},
		{
			selector: '#archive-item-order',
			requirements: {
				type: 'number',
				min: 1,
			},
		},
	],
	submit: '.archive-item-save',
	showErrors: true,
	update: true,
	additionalTriggers: [
		{
			selector: '#archive-item-date-day',
			event: 'input',
		},
		{
			selector: '#archive-item-date-month',
			event: 'input',
		},
		{
			selector: '#archive-item-date-year',
			event: 'input',
		},
	],
};

// articles.js
export const newArticleInputConfig: Config = {
	inputs: [
		{
			selector: '#article-item-title',
			requirements: {
				type: 'string',
				min: 3,
				max: 50,
			},
		},
		{
			selector: '#article-item-photo',
			requirements: {
				type: 'any',
			},
		},
		{
			selector: '#article-item-description',
			requirements: {
				type: 'string',
				min: 3,
				max: 1000,
			},
		},
	],
	submit: '.article-item-save',
	showErrors: true,
	update: true,
};

// events.js
export const newEventInputConfig: Config = {
	inputs: [
		{
			selector: '#event-item-title',
			requirements: {
				type: 'string',
				min: 3,
				max: 50,
			},
		},
		{
			selector: '#event-item-photo',
			requirements: {
				type: 'any',
			},
		},
		{
			selector: '#event-item-date',
			requirements: {
				type: 'function',
				function: (value: string) => {
					return new Date(value) >= new Date();
				},
			},
		},
	],
	submit: '.event-item-save',
	showErrors: true,
	update: true,
};

// contact.js
export const newContactSectionInputConfig: Config = {
	inputs: [
		{
			selector: '#section-title',
			requirements: {
				type: 'string',
				min: 3,
				max: 50,
			},
		},
		{
			selector: '#section-description',
			requirements: {
				type: 'string',
				min: 3,
				max: 1000,
			},
		},
		{
			selector: '#section-photo',
			requirements: {
				type: 'function',
				function: (value: any) => {
					const sectionType = (document.querySelector('#section-type') as HTMLInputElement).value;

					if (sectionType === 'TextOnly') {
						return true;
					} else if (sectionType === 'TextWithImage' && value) {
						return true;
					} else {
						return false;
					}
				},
			},
		},
		{
			selector: '#section-type',
			requirements: {
				type: 'string',
			},
		},
		{
			selector: '#section-order',
			requirements: {
				type: 'number',
				min: 1,
			},
		},
	],
	submit: '.section-save',
	showErrors: true,
	update: true,
};

// publications.js
export const newPublicationInputConfig: Config = {
	inputs: [
		{
			selector: '#publication-title',
			requirements: {
				type: 'string',
				min: 3,
				max: 50,
			},
		},
		{
			selector: '#publication-cover',
			requirements: {
				type: 'function',
				function: (value: any) => {
					if (value) {
						return true;
					}
					return false;
				},
			},
		},
		{
			selector: '#publication-content',
			requirements: {
				type: 'function',
				function: (value: any) => {
					if (value) {
						return true;
					}
					return false;
				},
			},
		},
	],
	submit: '.publication-save',
	showErrors: true,
	update: true,
};

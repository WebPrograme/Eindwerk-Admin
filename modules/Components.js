import Dropdown from './Dropdown.js';

// Contact Page
export function CreateContactSection(section, parent, clickEvent) {
	// Create contact section
	const type = section.Type;
	const contactSection = document.createElement('div');
	contactSection.classList.add('contact-section', type === 'TextOnly' ? 'contact-text' : 'contact-image');
	contactSection.innerHTML = `
		<div class="contact-section-content">
			<h3 class="contact-section-title">${section.Title}</h3>
			<p class="contact-section-description">${Object.values(section.Content)[0]}</p>
		</div>`;

	// Add image if type is not TextOnly
	if (type !== 'TextOnly') {
		const imageBlock = document.createElement('div');
		imageBlock.classList.add('contact-section-image');
		imageBlock.innerHTML = `<img src="${section.Image}" alt="${section.Title}">`;

		contactSection.appendChild(imageBlock);
	}

	// Add click event
	contactSection.addEventListener('click', clickEvent);

	parent.appendChild(contactSection);
}

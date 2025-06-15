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

// Events Page
export function CreateEventCard(event, parent, clickEvent) {
	// Create event card
	const card = document.createElement('div');
	card.classList.add('events-card');
	card.innerHTML = `
			<img
				class="events-card-img"
				src="${event.Image}"
				alt="${event.Title}"
			/>
			<div class="events-card-date">
				<span>${new Date(event.Date).getDate()} ${new Intl.DateTimeFormat('nl-BE', { month: 'short' }).format(new Date(event.Date))} '${new Date(event.Date)
		.getFullYear()
		.toString()
		.slice(-2)}</span>
			</div>
			<div class="events-card-title">
				<h3>${event.Title}</h3>
			</div>
			<i class="fa-solid fa-up-right-from-square events-card-open-icon"></i>`;

	card.addEventListener('click', clickEvent);

	parent.appendChild(card);
}

// Publications Page
export function CreatePublicationCard(publication, parent, clickEvent) {
	// Create publication card
	const card = document.createElement('div');
	card.classList.add('publications-card');
	card.innerHTML = `
			<img
				class="publications-card-img"
				src="${publication.CoverImage}"
				alt="${publication.Title}"
			/>
			<div class="publications-card-title">
				<h3>${publication.Title}</h3>
			</div>
			<i class="fa-solid fa-up-right-from-square publications-card-open-icon"></i>`;

	card.addEventListener('click', clickEvent);

	parent.appendChild(card);
}

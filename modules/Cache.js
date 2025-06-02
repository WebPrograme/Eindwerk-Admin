export default class Cache {
	constructor(images = []) {
		this.images = [];
		this.files = [];
		this.DataTransfer = new DataTransfer();
	}

	async cache(images) {
		if (typeof images === 'string') images = [images];
		let outputImages = [];
		let outputFiles = [];

		const promises = images.map(async (image) => {
			// Check if the image is already cached
			if (this.images.includes(image)) {
				const index = this.images.indexOf(image);
				outputFiles.push(this.files[index]);
				outputImages.push(image);
				return;
			}

			const fileBlob = await fetch(image, { 'Access-Control-Allow-Origin': '*' }).then((response) => response.blob());
			const file = new File([fileBlob], 'blog-item-photo', { type: fileBlob.type });
			this.DataTransfer.items.add(file);
			outputFiles.push(this.DataTransfer.files);
			outputImages.push(image);

			this.DataTransfer.items.clear();
		});

		await Promise.all(promises);
		this.images = this.images.concat(outputImages);
		this.files = this.files.concat(outputFiles);
		console.log(outputFiles, outputImages);
		return outputFiles && outputFiles.length === 1 ? outputFiles[0] : outputFiles;
	}

	async clear() {
		this.images = [];
		this.files = [];
	}
}

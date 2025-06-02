import { getDownloadURL, ref as storageRef, uploadBytes, getStorage, deleteObject } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js';
import Auth from './Auth.js';

const storage = getStorage(Auth.app);

async function UploadImage(path, image, input) {
	const metadata = {
		contentType: 'image/jpeg',
		cacheControl: 'public, max-age=31536000',
	};
	const ref = storageRef(storage, path + '/' + image.name);

	const url = await uploadBytes(ref, image, metadata).then(function (snapshot) {
		return getDownloadURL(ref);
	});

	input.style.setProperty('--url', 'url(' + url + ')');
	input.setAttribute('data-url', url);

	return url;
}

async function UndoUpload(path, image) {
	const ref = storageRef(storage, path + '/' + image);

	const result = deleteObject(ref);

	return result;
}

export default { UploadImage, UndoUpload };

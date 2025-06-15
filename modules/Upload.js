import { getDownloadURL, ref as storageRef, uploadBytes, getStorage, deleteObject } from 'https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js';
import Auth from './Auth.js';

const storage = getStorage(Auth.app);

async function uploadFile(path, file, input, contentType) {
	const metadata = {
		contentType: contentType,
		cacheControl: 'public, max-age=31536000',
	};
	const ref = storageRef(storage, path + '/' + file.name);

	const url = await uploadBytes(ref, file, metadata).then(function (snapshot) {
		return getDownloadURL(ref);
	});

	input.style.setProperty('--url', 'url(' + url + ')');
	input.setAttribute('data-url', url);

	return url;
}

async function UploadImage(path, image, input) {
	return uploadFile(path, image, input, 'image/jpeg');
}

async function UploadPDF(path, pdf, input) {
	return uploadFile(path, pdf, input, 'application/pdf');
}

async function UndoUpload(path, image) {
	const ref = storageRef(storage, path + '/' + image);

	const result = deleteObject(ref);

	return result;
}

export default { UploadImage, UploadPDF, UndoUpload };

const STORAGE_KEY = '__rlA';
const TIME_KEY = '__rlT';

/**
 * @param {string} storageName
 * @returns {boolean}
 */
export function isStorageSupported(storageName) {
	let storageIsAvailable = false;
	try {
		// at: window[storageName] firefox throws SecurityError: The operation is insecure. when in iframe
		storageIsAvailable = storageName in window && window[storageName] && window[storageName].setItem;
	} catch (e) {} // eslint-disable-line no-empty

	if (storageIsAvailable) {
		const s = window[storageName],
			key = 'testLocalStorage_' + Math.random();

		try {
			s.setItem(key, key);
			if (key === s.getItem(key)) {
				s.removeItem(key);
				return true;
			}
		} catch (e) {} // eslint-disable-line no-empty
	}

	return false;
}

const SESS_STORAGE = isStorageSupported('sessionStorage') ? window.sessionStorage || null : null;
const WIN_STORAGE = window.top || window || null;

const __get = (key) => {
	let result = null;
	if (SESS_STORAGE) {
		result = SESS_STORAGE.getItem(key) || null;
	} else if (WIN_STORAGE) {
		const data =
			WIN_STORAGE.name && '{' === WIN_STORAGE.name.toString()[0]
				? JSON.parse(WIN_STORAGE.name.toString())
				: null;
		result = data ? data[key] || null : null;
	}

	return result;
};

const __set = (key, value) => {
	if (SESS_STORAGE) {
		SESS_STORAGE.setItem(key, value);
	} else if (WIN_STORAGE) {
		let data =
			WIN_STORAGE.name && '{' === WIN_STORAGE.name.toString()[0]
				? JSON.parse(WIN_STORAGE.name.toString())
				: null;
		data = data || {};
		data[key] = value;

		WIN_STORAGE.name = JSON.stringify(data);
	}
};

const timestamp = () => Math.round(Date.now() / 1000);

const setTimestamp = () => __set(TIME_KEY, timestamp());

const getTimestamp = () => {
	const time = __get(TIME_KEY, 0);
	return time ? parseInt(time, 10) || 0 : 0;
};

/**
 * @returns {string}
 */
export function getHash() {
	return __get(STORAGE_KEY);
}

/**
 * @returns {void}
 */
export function setHash() {
	const key = 'AuthAccountHash',
		appData = window.__rlah_data();

	__set(STORAGE_KEY, appData && appData[key] ? appData[key] : '');
	setTimestamp();
}

/**
 * @returns {void}
 */
export function clearHash() {
	__set(STORAGE_KEY, '');
	setTimestamp();
}

/**
 * @returns {boolean}
 */
export function checkTimestamp() {
	if (timestamp() > getTimestamp() + 3600000) {
		// 60m
		clearHash();
		return true;
	}
	return false;
}

// init section
setInterval(setTimestamp, 60000); // 1m

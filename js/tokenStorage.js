function localStorageAvailable() {
    try {
	var storage = window.localStorage,
	    x = '__storage_test__';
	storage.setItem(x, x);
	storage.removeItem(x);
	return true;
    }
    catch(e) {
	return false;
    }
}

function saveToken(api, token) {
    if (! localStorageAvailable()) { return; }
    if (! token) { return; }
    window.localStorage.setItem(api, token);
}

function getTokenFromStorage(api) {
    if (! localStorageAvailable()) { return; }
    return window.localStorage.getItem(api);
}

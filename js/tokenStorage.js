/* exported localStorageAvailable */
/* exported apiStoragePrefix */
/* TODO: Complete the jshint*/

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

var apiStoragePrefix = 'navitiaPlayground.';

function saveToken(api, token) {
    if (! localStorageAvailable()) { return; }
    if (! token) { return; }
    window.localStorage.setItem(apiStoragePrefix + api, token);
}

function getTokenFromStorage(api) {
    if (! localStorageAvailable()) { return; }
    return window.localStorage.getItem(apiStoragePrefix + api);
}

// Copyright (c) 2016 CanalTP
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/* exported localStorageAvailable apiStoragePrefix saveToken getTokenFromStorage*/
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

function setSaveTokenButtonStatus() {
    var api = $('#api input.api').val();
    var token = $('#token input.token').val();
    $('button.save').prop('disabled', getTokenFromStorage(api) === token);
}

function saveTokenFromRequest() {
    var api = $('input.api').val();
    var token = $('input.token').val();
    saveToken(api, token);
}

function saveToken(api, token) {
    if (! localStorageAvailable()) { return; }
    var key = apiStoragePrefix + api
    window.localStorage.setItem(key, token);
    setSaveTokenButtonStatus();
}

function getTokenFromStorage(api) {
    if (! localStorageAvailable()) { return; }
    return window.localStorage.getItem(apiStoragePrefix + api);
}

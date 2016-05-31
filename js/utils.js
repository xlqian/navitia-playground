/* exported isUndefined */
/* TODO: Complete the jshint*/

function isUndefined(val) {
    return typeof val === 'undefined';
}

function isPlaceType(key) {
    return $.inArray(key, ['from', 'to']) !== -1;
}

function isDatetimeType(str) {
    return str.match(/datetime$/);
}

function isAutoCompleteInput(elt) {
    return elt.attr('class').indexOf('ui-autocomplete-input') > -1;
}

function isDatePicker(elt) {
    return elt.attr('class').indexOf('ui-autocomplete-input') > -1;
}

function htmlEncode(value) {
    return $('<div/>').text(value).html();
}

function durationToString(duration) {
    var res = '';
    var seconds = duration % 60;
    var minutes = Math.floor(duration / 60) % 60;
    var hours = Math.floor(duration / (60 * 60)) % 24;
    var days = Math.floor(duration / (24 * 60 * 60));

    if (days !== 0) { res += sprintf('%sd', days); }
    if (hours !== 0) { res += sprintf('%sh', hours); }
    if (minutes !== 0) { res += sprintf('%smin', minutes); }
    if (seconds !== 0) { res += sprintf('%ss', seconds); }

    if (! res) {
        return '0s';
    } else {
        return res;
    }
}

function isTemplate(str) {
    return str.slice(0, 1) === '{' && str.slice(-1) === '}';
}

function flatMap(array, f) {
    var result = [];

    array.forEach(function(obj) {
        result = result.concat(f(obj));
    });
    return result;
}

function notifyOnError(data, typeError) {
    if (data.status === 401) {
        $('#token').addClass('templateInput');
    }
    $.notify(sprintf("%s error: %s", typeError, data.statusText));
}

function getType(key) {
    if (!key || typeof key !== 'string') {
        return null;
    }
    // hardcoded cases:
    switch (key) {
    case 'addresses': return 'address';
    case 'from': return 'place';
    case 'to': return 'place';
    }
    // generic plural
    if (key.slice(-1) === 's') { return key.slice(0, -1); }

    // just the key
    return key;
}

function getTextColor(json) {
    function _toNum(c, i) { return +('0x' + c.slice(i, i + 2)); }

    if ('text_color' in json) {
        return '#' + json.text_color;
    }
    if ('color' in json) {
        var c = json.color;
        var grey = 0.21 * _toNum(c, 0) + 0.72 * _toNum(c, 2) + 0.07 * _toNum(c, 4);
        if (grey < 128) {
            return 'white';
        }
    }
    return 'black';
}

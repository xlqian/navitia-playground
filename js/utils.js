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

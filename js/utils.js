function isUndefined(val) {
    return typeof val == "undefined";
}

function isPlaceType(key) {
    return $.inArray(key, ['from', 'to']) != -1;
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

    if (days != 0) { res += '{0}d'.format(days); }
    if (hours != 0) { res += '{0}h'.format(hours); }
    if (minutes != 0) { res += '{0}min'.format(minutes); }
    if (seconds != 0) { res += '{0}s'.format(seconds); }

    if (! res) {
        return '0s';
    } else {
        return res;
    }
}

String.prototype.format = String.prototype.f = function() {
    var s = this,
        i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};

String.prototype.encodeURI = function() {
    var s = this;

    return encodeURIComponent(s);
};

String.prototype.decodeURI = function() {
    var s = this;

    return decodeURIComponent(s);
};

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
    return elt.attr('class').contains('ui-autocomplete-input');
}

function isDatePicker(elt) {
    return elt.attr('class').contains('hasDatepicker');
}

function isTemplate(str) {
    return str.slice(0, 1) == '{' && str.slice(-1) == '}';
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

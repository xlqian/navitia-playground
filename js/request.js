function removeParent(elt) {
    $(elt).parent().remove();
}

function createDeleteButton() {
    return '<button class="delete" onclick="removeParent(this)">-</button>';
}

function insertRoute(val) {
    $(val).parent().after(createRoute(''));
}

function createRoute(val) {
    return '<span> <input type="text" class="route" value="' + val + '">' +
        createDeleteButton() + ' ' +
        '<button class="add" onclick="insertRoute(this)">+</button></span>';
}

function createParam(key, val) {
    return ' <span><input type="text" class="key" value="' + key + '" />=' +
        '<input class="value" value="' + val + '" />' +
        createDeleteButton() + '</span>'
}

function insertParam() {
    $("#parameterList").append(createParam('', ''));
}

$(document).ready(function() {
    var token = $.url("?token");
    if (isUndefined(token)) { token = ''; }
    $("#token").html('token: <input type="text" class="token" value="' + token + '">');

    var request = $.url("?request");

    var api = isUndefined(request) ? '' : request.replace(/^(.*\/\/[^\/]*)\/.*$/g, "$1");
    var path = $.url('path', request);
    var route = isUndefined(path) ? [] : $.url('path', request).split('/');
    var vxxFound = false;
    for (var i in route) {
        if (! route[i]) { continue; }
        if (vxxFound) {
            $("#route").append(createRoute(route[i]));
        } else {
            api = api + '/' + route[i];
            vxxFound = /^v\d+$/.test(route[i]);
        }
    }
    $("#api").html('API: <input type="text" class="api" value="' + api + '">');

    var params = $.url("?", request);
    if (! isUndefined(params)) {
        var param_elt = $("#parameterList");
        for (var key in params) {
            param_elt.append(createParam(key, params[key]));
        }
    }
});

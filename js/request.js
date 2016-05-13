function removeParent(elt) {
    $(elt).parent().remove();
}

function makeDeleteButton() {
    return '<button class="delete" onclick="removeParent(this)">-</button>';
}

function insertRoute(val) {
    $(val).parent().after(makeRoute(''));
}

function makeRoute(val) {
    return '<span> <input type="text" class="route" value="' + val + '">' +
        makeDeleteButton() + ' ' +
        '<button class="add" onclick="insertRoute(this)">+</button></span>';
}

function makeParam(key, val) {
    return ' <span><input type="text" class="key" value="' + key + '" />=' +
        '<input class="value" value="' + val + '" />' +
        makeDeleteButton() + '</span>'
}

function insertParam() {
    $("#parameterList").append(makeParam('', ''));
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
            $("#route").append(makeRoute(route[i]));
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
            param_elt.append(makeParam(key, params[key]));
        }
    }
});

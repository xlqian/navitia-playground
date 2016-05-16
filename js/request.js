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
    return '<span> <input type="text" class="route" value="' + val + '" onkeyup="updateUrl()" >' +
        makeDeleteButton() + ' ' +
        '<button class="add" onclick="insertRoute(this)">+</button></span>';
}

function makeParam(key, val) {
    return ' <span><input type="text" class="key" value="' + key + '" onkeyup="updateUrl()" />=' +
        '<input class="value" value="' + val + '" onkeyup="updateUrl()" />' +
        makeDeleteButton() + '</span>'
}

function insertParam() {
    $("#parameterList").append(makeParam('', ''));
}

function finalUrl() {
    var finalUrl = $('#api input.api').val();
  
    $("#route input.route").each(function(){
        finalUrl += '/' + this.value.encodeURI();
    });
  
    finalUrl += '?';
  
    $('#parameters input.key, #parameters input.value').each(function(){
        finalUrl += this.value.encodeURI();
        if (this.className == 'key') {
            finalUrl += '=';
        } if (this.className == 'value') {
            finalUrl += '&';
        }
    });
    return finalUrl;
}

function submit() {
    var token = $('#token input.token').val();
    var f = finalUrl();
    window.location = '?request={0}&token={1}'.format(f.encodeURI(), token.encodeURI());
}

function updateUrl() {
    var f = finalUrl();
    $('#requestUrl').html(finalUrl);
}

$(document).ready(function() {
    var token = $.url("?token");
    if (isUndefined(token)) { token = ''; }
    $("#token input.token").attr('value', token);
    $("#urlFormToken").attr('value', token);

    var request = $.url("?request");

    if (isUndefined(request)) { return; }

    var api = request.replace(/^(.*\/\/[^\/]*)\/.*$/g, "$1");
    var path = $.url('path', request);
    
    var routes = isUndefined(path) ? [] : $.url('path', request).split('/');
    
    var vxxFound = false;
    routes.forEach(function(r) {
      if (!r) { return; }
      if (vxxFound) {
        $("#route").append(makeRoute(r.decodeURI()));
      } else {
        api = api + '/' + r.decodeURI();
        vxxFound = /^v\d+$/.test(r);
      }
    })
    $("#api input.api").attr('value', api);

    var params = $.url("?", request);

    if (! isUndefined(params)) {
        var param_elt = $("#parameterList");
        for (var key in params) {
            param_elt.append(makeParam(key.decodeURI(), params[key]));
        }
    }
    $('#requestUrl').html(request);
});

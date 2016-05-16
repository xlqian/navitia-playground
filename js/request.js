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
        } 
        if (this.className == 'value') {
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
    var search = new URI(window.location).search(true);
    var token = search['token'];
    if (isUndefined(token)) { token = ''; }
    $("#token input.token").attr('value', token);
    $("#urlFormToken").attr('value', token);

    var request = search['request'];
    if (isUndefined(request)) { return; }

    var req_uri = new URI(request);
    var origin = req_uri.origin();
    var paths = req_uri.path().split('/');
    // The first element after a split is an empty string("")
    if (paths.length == 1) { return; }
    var api = origin;

    var vxxFound = false;
    paths.slice(1).forEach(function(r) {
      if (!r) { return; }
      if (vxxFound) {
        $("#route").append(makeRoute(r.decodeURI()));
      } else {
        api = api + '/' + r.decodeURI();
        vxxFound = /^v\d+$/.test(r);
      }
    })
    $("#api input.api").attr('value', api);

    var params = req_uri.search(true);

    if (! isUndefined(params)) {
        var param_elt = $("#parameterList");
        for (var key in params) {
          var value = params[key];
          // a list of params, ex.: forbidded_uris[]
          if (Array.isArray(value)) {
              value.forEach(function(v){
                param_elt.append(makeParam(key.decodeURI(), v.decodeURI()));
              });
          } else {
            param_elt.append(makeParam(key.decodeURI(), params[key]));
          }
        }
    }
    $('#requestUrl').html(request);
});

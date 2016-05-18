function removeParent(elt) {
    $(elt).parent().remove();
}

function makeDeleteButton() {
    return '<button class="delete" onclick="removeParent(this), updateUrl(this)">-</button>';
}

function insertRoute(val) {
    $(val).parent().after(makeRoute(''));
}

function makeRoute(val) {
    return '<span> <input type="text" class="route" value="' + val + '" onfocus="updateUrl(this)" onkeyup="updateUrl(this)" >' +
        makeDeleteButton() + ' ' +
        '<button class="add" onclick="insertRoute(this)">+</button></span>';
}

function makeParam(key, val) {
    var res = $('<span class="param" />');
    res.append(' ');

    var attr = {type: 'text', onfocus: 'updateUrl(this)', onkeyup: '"updateUrl(this)"'};

    var intputKeyAttr = Object.assign(attr, {class: 'key', value: key});
    res.append($('<input/>', intputKeyAttr));
    res.append('=');
    var inputValAttr = Object.assign(attr, {class: 'value', value: val});
    var valueElt = $('<input/>', inputValAttr);

    autocomplete(valueElt);
    res.append(valueElt);
    res.append(makeDeleteButton());
    return res;
}

function insertParam() {
    $("#parameterList").append(makeParam('', ''));
}

function getFocusedElemValue(elemToTest, focusedElem, noEncoding) {
    if (focusedElem == elemToTest) {
        return '<span class="focus_params" style="color:red">{0}</span>'
            .format(noEncoding ? elemToTest.value : elemToTest.value.encodeURI());
    }
    return noEncoding ? elemToTest.value : elemToTest.value.encodeURI();
}

function finalUrl(focusedElem) {
    var finalUrl = getFocusedElemValue($('#api input.api')[0], focusedElem, true);
    $("#route input.route").each(function(){
        finalUrl += '/' + getFocusedElemValue(this, focusedElem);
    });

    finalUrl += '?';

    $('#parameters input.key, #parameters input.value').each(function(){
        finalUrl += getFocusedElemValue(this, focusedElem);
        if ($(this).hasClass('key')) {
            finalUrl += '=';
        }
        if ($(this).hasClass('value')) {
            finalUrl += '&';
        }
    });
    return finalUrl;
}

function submit() {
    var token = $('#token input.token').val();
    var f = finalUrl(); // finalUrl can be called without any args
    window.location = '?request={0}&token={1}'.format(f.encodeURI(), token.encodeURI());
}

function updateUrl(focusedElem) {
    var f = finalUrl(focusedElem);
    $('#urlDynamic span').html(f);
}

function getCoverage() {
    return $('.route', $('#route input.route[value="coverage"]').parent().next()).val();
}

function autocomplete(elt) {
    $(elt).autocomplete({
        source: function(request, response) {
            var keyValue = elt.parent().children(".key").val();
            if ($.inArray(keyValue, ['from', 'to']) == -1) {
                response([]);
                return;
            }
            var token = $('#token input.token').val();
            var url = $('#api input.api').val();
            var cov = getCoverage();
            if (cov !== null) {
                url = '{0}/coverage/{1}'.format(url, cov);
            }
            $.ajax({
                url: '{0}/places?q={1}'.format(url, request.term.encodeURI()),
                headers: isUndefined(token) ? {} : { Authorization: "Basic " + btoa(token) },
                success: function(data) {
                    var res = [];
                    if ('places' in data) {
                        data['places'].forEach(function(place) {
                            res.push({ value: place.id, label: place.name });
                        });
                    }
                    response(res);
                },
                error: function() {
                    response([]);
                }
            });
        },
    });
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
    $('#urlDynamic span').html(request);
});

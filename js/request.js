function makeDeleteButton() {
    return $('<button/>')
        .addClass('delete')
        .click(function() { $(this).closest('.toDelete').remove(); updateUrl(this); })
        .text('-');
}

function insertRoute(val) {
    $(val).parent().after(makeRoute(''));
}

function makeRoute(val) {
    if (currentRouteValue == 'coverage') {
        var res = $('<span/>')
        .addClass('toDelete')
        .addClass('routeElt')
        .append(' ')
        .append($('<span/>')
                .addClass('pathElt')
                .append($('<input/>')
                        .attr({id: 'inputCov',
			       type: 'text',
                               onfocus: 'updateUrl(this)',
                               onkeyup: 'updateUrl(this)'})
                        .addClass('route')
                .append(makeDeleteButton()))
        .append('<button class="add" onclick="insertRoute(this)">+</button>')        
	listCoverage(val);
        return res;
    } else {
        return $('<span/>')
        .addClass('toDelete')
        .addClass('routeElt')
        .append(' ')
        .append($('<span/>')
                .addClass('pathElt')
                .append($('<input/>')
                        .attr({type: 'text',
                               onfocus: 'updateUrl(this)',
                               onkeyup: 'updateUrl(this)'})
                        .addClass('route')
                        .val(val))
                .append(makeDeleteButton()))
        .append('<button class="add" onclick="insertRoute(this)">+</button>')
    }
}

function makeParam(key, val) {
    var res = $('<span/>')
        .addClass('param')
        .addClass('toDelete')
        .append(' ');

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

function listCoverage(val) {
    var search = new URI(window.location).search(true);
    var api = $("#api input.api").attr('value');
    var request =  api + "/coverage";
    var token = search["token"];
    var res = [];

    $.ajax({
        headers: isUndefined(token) ? {} : { Authorization: "Basic " + btoa(token + ":" ) },
        dataType: "json",
        url: request,
        success: function(data) {
                for (var dict in data) {
                    for (var cov = 0; cov < data[dict].length; cov++) {
                        res.push(data[dict][cov].id);
                    }
                    if (val) { $("#inputCov").val(val); }
                    var auto = $("#inputCov").autocomplete({source: res, minLength: 0, scroll: true});
                    auto.focus(function() {
                        auto.autocomplete("search", '');
                    });
                    return auto;
                }
            }
    });
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
    var prevIsCoverage = false;
    var coverage = null;
    var covElt = $("#route input.route").each(function() {
        if (prevIsCoverage) {
            coverage = $(this).val();
        }
        prevIsCoverage = $(this).val() == 'coverage';
    });
    return coverage;
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
        $("#route").append(makeRoute(r.decodeURI(), currentRouteValue)));
      } else {
        api = api + '/' + r.decodeURI();
        vxxFound = /^v\d+$/.test(r);
    	$("#api input.api").attr('value', api);
      }
    })

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

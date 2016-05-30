/* global isUndefined */
/* TODO: Complete the jshint*/

function makeDeleteButton() {
    return $('<button/>')
        .addClass('delete')
        .click(function() { $(this).closest('.toDelete').remove(); updateAddPathAC(this); updateUrl(this); })
        .html('<img src="img/delete.svg" class="deleteButton" alt="delete">');
}

function insertPathElt() {
    var key = $('#addPathInput').val();
    if (key.length === 0) { return; }
    $("#feature").before(makeKeyValue(key, '', 'path'));
    autocomplete.addKeyAutocomplete($('#addPathInput'), 'pathKey');
    $('#addPathInput').val('');
    $("#feature").prev().find('input').first().focus();
}

function insertParam() {
    var key = $('#addParamInput').val();
    if (key.length === 0) { return; }
    $('#addParam').before(makeKeyValue(key, '', 'parameters'));
    $('#addParamInput').val('');
    $('#addParam').prev().find('input').first().focus();
}

function makeTemplatePath(val, input) {
    var templateFilled = false;
    input.closest('.inputDiv').addClass('templateInput');
    input.focus(function() { if (!templateFilled) { this.value=''; } })
        .blur(function() {
            if (templateFilled) { return; }
            if ($(this).val() == val || $(this).val() == '') {
                this.value = val;
            } else {
                $(this).closest('.inputDiv').removeClass('templateInput');
                templateFilled = true;
            }
        });
}

function updateAddPathAC(val){
    var input = $(val).prev();
    if (! input.hasClass('path')) {
        return;
    }
    if (! $('input path').length) {
        // No more path inputs, we should update autocomplete of add
        autocomplete.addKeyAutocomplete($('#addPathInput'), 'pathKey');
    }
};

function updateAddParamAC() {
    console.log("focusout");
    autocomplete.addKeyAutocomplete($('#addParamInput'), 'paramKey');
}
function makeKeyValue(key, val, cls) {
    var res = $('<div/>')
        .addClass('inputDiv')
        .addClass('toDelete')
        .append(' ');

    res.append($('<span/>').addClass('key').text(key));

    var valueElt = $('<input/>')
         .attr('type', 'text')
         .attr('placeholder', 'type your value here')
        .addClass('value')
        .addClass(cls)
        .val(val);

    if (isPlaceType(key)) {
        makeAutocomplete(valueElt);
    } else if (isDatetimeType(key)) {
        makeDatetime(valueElt);
    } else if (autocomplete.staticAutocompleteTypes.indexOf(key) > -1) {
        autocomplete.staticAutocomplete(valueElt, key);
    }else if (autocomplete.dynamicAutocompleteTypes.indexOf(key) > -1) {
        autocomplete.dynamicAutocomplete(valueElt, key);
    }
    valueElt.on('input', function() { updateUrl(this); });
    valueElt.focus(function() { updateUrl(this); });
    res.append(valueElt);
    res.append(makeDeleteButton());

    // valueElt must be attached to res to call this
    if (isTemplate(val)) { makeTemplatePath(val, valueElt); }

    return res;
}

function makeCoverageList(val, obj) {
    if (val) { $(obj).val(val); }

    var api = $("#api input.api").attr('value');
    var token = $('#token input.token').val();
    var request =  api + "/coverage";

    $.ajax({
        headers: isUndefined(token) ? {} : { Authorization: "Basic " + btoa(token) },
        dataType: "json",
        url: request,
        success: function(data) {
                var res = [];
                for (var dict in data) {
                    for (var cov = 0; cov < data[dict].length; cov++) {
                        res.push(data[dict][cov].id);
                    }
                    var auto = $(obj).autocomplete({source: res, minLength: 0, scroll: true, delay: 500});
                    auto.focus(function() {
                        auto.autocomplete("search", '');
                    });
                    return auto;
                }
            }
    });
}

function getFocusedElemValue(elemToTest, focusedElem, noEncoding) {
    var value = $(elemToTest).is('input') ? elemToTest.value : $(elemToTest).text();
    if (! noEncoding) { value = encodeURIComponent(value); }
    if (focusedElem == elemToTest) {
        return sprintf('<span class="focusedParam">%s</span>', value);
    } else {
        return value;
    }
}

function finalUrl(focusedElem) {
    var api = getFocusedElemValue($('#api input.api')[0], focusedElem, true);

    var path = '';
    $("#path .key, #path input.value, #featureInput").each(function(){
        path += '/' + getFocusedElemValue(this, focusedElem);
    });

    var parameters = '?';
    $('#parameters .key, #parameters input.value').each(function(){
        parameters += getFocusedElemValue(this, focusedElem);
        if ($(this).hasClass('key')) {
            parameters += '=';
        }
        if ($(this).hasClass('value')) {
            parameters += '&';
        }
    });

    if (focusedElem === undefined) {
        // called without arg, we want pure text
        return api + path + parameters;
    } else {
        // with arg, we want a rendering thing
        return sprintf('<span class="api">%s</span>' +
                       '<span class="path">%s</span>' +
                       '<span class="parameters">%s</span>',
                       api, path, parameters);
    }
    return finalUrl;
}

function submit() {
    var token = $('#token input.token').val();
    var f = finalUrl(); // finalUrl can be called without any args
    window.location = sprintf('?request=%s&token=%s', encodeURIComponent(f), encodeURIComponent(token));
}

function updateUrl(focusedElem) {
    var f = finalUrl(focusedElem);
    $('#requestUrl').html(f);
}

function getCoverage() {
    var prevIsCoverage = false;
    var coverage = null;
    var covElt = $("#path .key, #path input.value").each(function() {
        if (prevIsCoverage) {
            coverage = $(this).val();
        }
        prevIsCoverage = $(this).text() == 'coverage';
    });
    return coverage;
}

function makeAutocomplete(elt) {
    autocomplete.dynamicAutocomplete(elt, 'places');
}

function makeDatetime(elt) {
    $(elt).datetimepicker({
        dateFormat: 'yymmdd',
        timeFormat: 'HHmmss',
        timeInput: true,
        separator: 'T',
        controlType: 'select',
        oneLine: true,
    });
}

function parseUrl() {
    var search = new URI(window.location).search(true);
    var request = search['request'];
    if (isUndefined(request)) { return null; }

    var req_uri = new URI(request);
    var api = req_uri.origin();
    var paths = req_uri.path().split('/');
    paths = paths.length == 1 ? [] : paths.slice(1);
    var api_path = [];

    var vxxFound = false;
    paths.forEach(function(r) {
        if (!r) { return; }
        if (vxxFound) {
            api_path.push(decodeURIComponent(r));
        } else {
            api += '/' + decodeURIComponent(r);
            vxxFound = /^v\d+$/.test(r);
        }
    });

    var params = req_uri.search(true);

    var token = search['token'];
    if (isUndefined(token)) { token = getTokenFromStorage(api); }

    return {
        token: token,
        request: request,
        api: api,
        path: api_path,
        query: isUndefined(params) ? {} : params
    };
}

$(document).ready(function() {
    // Manage add input/button
    $('button.add').prop('disabled', true);
    $('.addInput').on('input', function() {
        $(this).parent().find('button.add').prop('disabled', this.value.length === 0);
    });
    $(".addInput").keyup(function(event) {
        if (event.keyCode == 13) {
            $(this).parent().find("button.add").click();
        }
    });
    $("#featureInput").focusout(updateAddParamAC);

    var request = parseUrl();
    if (request === null) { return; }
    if (isUndefined(request.token)) { request.token = ''; }
    $("#token input.token").attr('value', request.token);
    $("#api input.api").attr('value', request.api);

    var prevPathElt = null;
    request.path.forEach(function(r) {
        if (prevPathElt === null) {
            prevPathElt = r;
        } else {
            $("#feature").before(makeKeyValue(prevPathElt, r, 'path'));
            prevPathElt = null;
        }
    });
    if (prevPathElt !== null) {
        $('#featureInput').val(prevPathElt);
    }

    var addParam = $("#addParam");
    for (var key in request.query) {
        var value = request.query[key];
        // a list of params, ex.: forbidded_uris[]
        if (Array.isArray(value)) {
            value.forEach(function(v){
                addParam.before(makeKeyValue(decodeURIComponent(key), decodeURIComponent(v), 'parameters'));
            });
        } else {
            addParam.before(makeKeyValue(decodeURIComponent(key), decodeURIComponent(value), 'parameters'));
        }
    }
    autocomplete.addKeyAutocomplete($('#featureInput'), 'features');
    autocomplete.addKeyAutocomplete($('#addPathInput'), 'pathKey');
    autocomplete.addKeyAutocomplete($('#addParamInput'), 'paramKey');

    updateUrl(null);
});

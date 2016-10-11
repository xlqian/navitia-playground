// Copyright (c) 2016 CanalTP
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/* TODO: Complete the jshint*/

function makeDeleteButton() {
    return $('<button/>')
        .addClass('delete')
        .click(function() { $(this).closest('.toDelete').remove(); updateAddPathAC(this); updateUrl(this); })
        .html('<img src="img/delete.svg" class="deleteButton" alt="delete">');
}

function insertPathElt() {
    var key = $('#addPathInput').val();
    $("#addPathElt").before(makeKeyValue(key, '', 'path'));
    autocomplete.addKeyAutocomplete($('#addPathInput'), 'pathKey');
    $('#addPathInput').val('').change();
    $("#addPathElt").prev().find('input').first().focus();
}

function insertParam() {
    var key = $('#addParamInput').val();
    $('#addParam').before(makeKeyValue(key, '', 'parameters'));
    $('#addParamInput').val('').change();
    $('#addParam').prev().find('input').first().focus();
}

function makeTemplatePath(val, input) {
    var templateFilled = false;
    var isTemplateFilled = function() {
        var curVal = input.val();
        if (! templateFilled && curVal !== val && curVal !== '') {
            input.closest('.inputDiv').removeClass('templateInput');
            templateFilled = true;
        }
        return templateFilled;
    };
    input.closest('.inputDiv').addClass('templateInput');
    input.focus(function() {
        if (! isTemplateFilled()) { this.value = ''; }
    }).blur(function() {
        if (! isTemplateFilled()) { this.value = val; }
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

    autocomplete.valueAutoComplete(valueElt, key);

    valueElt.on('input', function() { updateUrl(this); });
    valueElt.focus(function() { updateUrl(this); });
    res.append(valueElt);
    res.append(makeDeleteButton());

    // valueElt must be attached to res to call this
    if (isTemplate(val)) { makeTemplatePath(val, valueElt); }

    return res;
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
    if (api.slice(-1) === "/") { api = api.slice(0, -1); }

    var path = '';
    $('#path .key, #path input.value').each(function(){
        path += '/' + getFocusedElemValue(this, focusedElem);
    });
    var feature = getFocusedElemValue($('#featureInput')[0], focusedElem);

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
        return api + path + '/' + feature + parameters;
    } else {
        // with arg, we want a rendering thing
        return sprintf('<span class="api">%s</span>' +
                       '<span class="path">%s</span>' +
                       '<span class="feature">/%s</span>' +
                       '<span class="parameters">%s</span>',
                       api, path, feature, parameters);
    }
    return finalUrl;
}

function submit() {
    var token = $('#token input.token').val();
    var f = finalUrl(); // finalUrl can be called without any args
    window.location = sprintf('?request=%s&token=%s', encodeURIComponent(f), encodeURIComponent(token));
}

function updateUrl(focusedElem) {
    var link = finalUrl();
    var text = finalUrl(focusedElem);
    $('#requestUrl').html($('<a/>').attr('href', link).html(text));
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

function parseUrl() {
    var search = new URI(window.location).search(true);
    var request = search['request'];
    if (request === undefined) { return null; }

    var req_uri = new URI(request);
    var api = req_uri.origin();
    var paths = req_uri.path().split('/');
    paths = paths.length == 1 ? [] : paths.slice(1);
    var api_path = [];

    var vxxFound = false;
    paths.forEach(function(r) {
        if (vxxFound) {
            api_path.push(decodeURIComponent(r));
        } else {
            api += '/' + decodeURIComponent(r);
            vxxFound = /^v\d+$/.test(r);
        }
    });
    if (! vxxFound) {
        api = req_uri.origin();
        api_path = paths.map(decodeURIComponent);
        $.notify('Version not found in the URL. Maybe you forgot "/v1" at the end of the API?');
    }

    var params = req_uri.search(true);

    var token = search['token'];

    if (token === undefined) {
        if (req_uri.username()) {
            token = req_uri.username();
            api = new URI(api).username('').toString();
        } else { token = getTokenFromStorage(api); }
    }

    return {
        token: token,
        request: request,
        api: api,
        path: api_path,
        query: params === undefined ? {} : params
    };
}

function setAutocomplete(){
    autocomplete.addKeyAutocomplete($('#featureInput'), 'features');
    autocomplete.addKeyAutocomplete($('#addPathInput'), 'pathKey');
    autocomplete.addKeyAutocomplete($('#addParamInput'), 'paramKey');
    autocomplete.apiAutocomplete();
}

$(document).ready(function() {
    // Manage add input/button
    $('button.add').prop('disabled', true);
    $('.addInput').on('input change', function() {
        $(this).parent().find('button.add').prop('disabled', this.value.length === 0);
    });
    $(".addInput").keyup(function(event) {
        if (event.keyCode == 13) {
            $(this).parent().find("button.add").click();
        }
    });
    $("#featureInput").focusout(updateAddParamAC);

    var request = parseUrl();

    autocomplete.addKeyAutocomplete($('#featureInput'), 'features');
    autocomplete.addKeyAutocomplete($('#addPathInput'), 'pathKey');
    autocomplete.addKeyAutocomplete($('#addParamInput'), 'paramKey');
    autocomplete.apiAutocomplete();

    if (request === null) {
        setAutocomplete();
        return;
    }

    if (request.token === undefined) { request.token = ''; }
    $("#token input.token").attr('value', request.token);
    $("#api input.api").attr('value', request.api);

    var prevPathElt = null;
    request.path.forEach(function(r) {
        if (prevPathElt === null) {
            prevPathElt = r;
        } else {
            $("#addPathElt").before(makeKeyValue(prevPathElt, r, 'path'));
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
    setAutocomplete();
    updateUrl(null);
});

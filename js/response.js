function setStatus(xhr) {
    $("#status").html('Status: {0} ({1})'.format(xhr.statusText, xhr.status));
}

function responseCollectionName(json) {
    var key = null;
    var notCollectionKeys = ['disruptions', 'links', 'feed_publishers', 'exceptions', 'notes'];
    for (var k in json) {
        if ($.isArray(json[k]) &&
            $.inArray(k, notCollectionKeys) == -1) {
            key = k;
        }
    }
    // disruptions may be an object list only if there is no other object list
    if (key === null && 'disruptions' in json) {
        key = 'disruptions';
    }
    return key;
}

function makeObjectButton(name, handle) {
    // TODO call handle on toggle
    return $('<label>')
        .addClass('objectButton')
        .append($('<input type="checkbox">').change(handle))
        .append($('<span>').html(name));
}

function makeObjectButtonHandle(selector, renderHandle) {
    return function() {
        var div = $(this).closest('div.object').children('div.data').children(selector);
        if ($(this).is(':checked')) {
            div.removeClass('not_filled');
            div.html(renderHandle());
        } else {
            div.addClass('not_filled');
            div.empty();
        }
    };
}

function render(name, type, json) {
    var head = $('<div class="head">');
    head.append($('<div class="name">').html(name));
    head.append($('<div class="summary">').html(summary(type, json)));
    head.append($('<div class="button">')
                .append(makeObjectButton('Ext', makeObjectButtonHandle('div.extended', function() {
                    return extended(type, json);
                })))
                .append(makeObjectButton('Map', makeObjectButtonHandle('div.map', function() {
                    return 'Map not implemented yet';
                })))
                .append(makeObjectButton('{ }', makeObjectButtonHandle('div.code', function() {
                    return renderjson(json);
                }))));

    var data = $('<div class="data">')
        .append($('<div class="extended not_filled">'))
        .append($('<div class="map not_filled">'))
        .append($('<div class="code not_filled">'));

    var result = $('<div class="object">');
    result.append(head);
    result.append(data);
    return result
}

$(document).ready(function() {
    var request = parseUrl();
    if (request === null) {
        $("#data").html("No request");
        return;
    }
    renderjson.set_show_to_level(3);
    renderjson.set_max_string_length(60);
    renderjson.set_sort_objects(true);
    $.ajax({
        headers: isUndefined(request.token) ? {} : { Authorization: "Basic " + btoa(request.token) },
        url: request.request,
        dataType: "json",
    }).then(
        function(data, status, xhr) {
            setStatus(xhr);
            $("#data").html(render("response", "response", data));
            $('#data input').first().click();
            saveToken(request.api, request.token);
        },
        function(xhr, status, error) {
            setStatus(xhr);
            $("#data").html(render("error", "response", xhr.responseJSON));
            $('#data input').last().click();
        }
    );
});

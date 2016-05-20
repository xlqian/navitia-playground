function setStatus(xhr) {
    $("#status").html(xhr.statusText + " (" + xhr.status + ")");
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
        var div = $(this).closest('div.object').find(selector);
        if ($(this).is(':checked')) {
            div.removeClass('not_filled');
            div.html(renderHandle());
        } else {
            div.addClass('not_filled');
            div.empty();
        }
    };
}

function render(name, json) {
    var head = $('<div class="head">');
    head.append($('<div class="type">').html(name));
    head.append($('<div class="summary">').html(summary(name, json)));
    head.append($('<div class="button">')
                .append(makeObjectButton('Ext', makeObjectButtonHandle('div.extended', function() {
                    return extended(name, json);
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
    var search = new URI(window.location).search(true);
    var request = search["request"];
    var token = search["token"];
    if (isUndefined(request)) {
        $("#data").html("No request");
        return;
    }
    renderjson.set_show_to_level(3);
    $.ajax({
        headers: isUndefined(token) ? {} : { Authorization: "Basic " + btoa(token) },
        url: request,
        dataType: "json",
    }).then(
        function(data, status, xhr) {
            setStatus(xhr);
            $("#data").html(render("response", data));
            $('#data input').first().click();
        },
        function(xhr, status, error) {
            setStatus(xhr);
            $("#data").html(render("response", xhr.responseJSON));
            $('#data input').last().click();
        }
    );
});

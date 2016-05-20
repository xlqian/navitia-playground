function setStatus(xhr) {
    $("#status").html(xhr.statusText + " (" + xhr.status + ")");
}

function defaultSummary(json) {
    var result = $('<span/>');
    if ('label' in json) {
        result.html(json['label']);
    } else if ('code' in json) {
        result.html(json['code']);
    }else if ('name' in json) {
        result.html(json['name']);
    } else if ('id' in json) {
        result.html(json['id']);
    }
    if ('color' in json) {
        result.css('background-color', '#' + json.color);
    }
    if ('text_color' in json) {
        result.css('color', '#' + json['text_color']);
    }
    return result;
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

function responseExtended(json) {
    var key = responseCollectionName(json);
    var objs = key ? json[key] : [];
    if (key.slice(-1) == 's') {
        key = key.slice(0, -1);
    }
    var result = $('<div class="list"/>');
    objs.forEach(function(obj) {
        result.append(render(key, obj));
    });
    return result;
}

function extended(name, json) {
    if (name == 'response') {
        return responseExtended(json);
    }
    // add here custom extended
    return 'No extended view yet!';
}

function responseSummary(json) {
    if ('error' in json) {
        return 'Error: {0}'.format(json.error.message);
    }
    var result = '';
    var key = responseCollectionName(json);
    if (key) {
        result = result + ' {0}&nbsp;{1} '.format(json[key].length, key);
    }
    if ('pagination' in json) {
        var p = json.pagination;
        var first_number = p.start_page * p.items_per_page + 1;
        result = result + '({0}-{1} of {2}&nbsp;results)'.format(
            first_number,
            first_number + p.items_on_page - 1,
            p.total_result);
    }
    return result;
}

function summary(name, json) {
    if (name == 'response') {
        return responseSummary(json);
    }
    // add here custom summary
    return defaultSummary(json);
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

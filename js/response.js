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

function responseSummary(json) {
    var key = ''
    var objs = [];
    var notCollectionKeys = ['disruptions', 'links', 'feed_publishers', 'exceptions', 'notes'];
    for (var k in json) {
        if ($.isArray(json[k]) &&
            $.inArray(k, notCollectionKeys) == -1) {
            objs = json[k];
            key = k;
        }
    }
    // disruptions may be an object list only if there is no other object list
    if (objs.length == 0 && 'disruptions' in json) {
        objs = json['disruptions'];
        key = 'disruptions';
    }
    // remove plural of collection type
    if (key.slice(-1) == 's') {
        key = key.slice(0, -1);
    }
    var result = $('<ul/>');
    objs.forEach(function(obj) {
        $('<li/>').html(render(key, obj)).appendTo(result);
    });
    return result;
}

function summary(name, json) {
    if (name == 'response') {
        return responseSummary(json);
    }
    // add here custom summary
    return defaultSummary(json);
}

function render(name, json) {
    var head = $('<div class="head"></span>');
    head.append($('<span class="name">{0}</span>'.format(name)));
    head.append($('<button class="code">{}</button>').click(function() {
        $(this).parent().parent().children(".data").html(renderjson(json));
    }));
    head.append($('<button class="summary">...</button>').click(function() {
        $(this).parent().parent().children(".data").html(summary(name, json));
    }));

    var result = $('<div class="render"></div>');
    result.append(head);
    result.append($('<span class="data"></span>').html(summary(name, json)));
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
    renderjson.set_show_to_level(1);
    $.ajax({
        headers: isUndefined(token) ? {} : { Authorization: "Basic " + btoa(token + ":" ) },
        url: request,
        dataType: "json",
    }).then(
        function(data, status, xhr) {
            setStatus(xhr);
            $("#data").html(render("response", data));
        },
        function(xhr, status, error) {
            setStatus(xhr);
            $("#data").html(renderjson(xhr.responseJSON));
        }
    );
});

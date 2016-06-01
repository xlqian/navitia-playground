function setStatus(xhr) {
    $('#status').html(sprintf('Status: %s (%s)', xhr.statusText, xhr.status));
}

function responseCollectionName(json) {
    var key = null;
    var notCollectionKeys = ['disruptions', 'links', 'feed_publishers', 'exceptions', 'notes'];
    for (var k in json) {
        if ($.isArray(json[k]) &&
            $.inArray(k, notCollectionKeys) === -1) {
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

function render(context, json, type, key, idx) {
    var name = key;
    if (typeof idx === 'number') { name += sprintf('[%s]', idx); }
    name = context.makeLink(key, json, name);

    var head = $('<div class="head">');
    head.append($('<div class="name">').html(name));
    head.append($('<div class="summary">').html(summary.run(context, type, json)));
    head.append($('<div class="button">')
                .append(makeObjectButton('Ext', makeObjectButtonHandle('div.extended', function() {
                    return extended.run(context, type, json);
                })))
                .append(makeObjectButton('Map', makeObjectButtonHandle('div.map', function() {
                    return map.run(type, json);
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
    return result;
}

function Context(data) {
    // the token, used to create links
    this.token = URI(window.location).search(true).token;

    // the regex corresponding to the thing that should be replacced
    // in a templated link
    this.templateRegex = /\{.*\.id\}/;

    // the link map: type -> template
    this.links = {};
    if (data instanceof Object && 'links' in data && $.isArray(data.links)) {
        var self = this;
        data.links.forEach(function(link) {
            if (! link.templated) { return; }
            if (link.type === 'related') { return; }
            if (! link.href.match(self.templateRegex)) { return; }
            self.links[link.type] = link.href;
        });
    }

    this.makeHref = function(href) {
        var res = sprintf('?request=%s', encodeURIComponent(href));
        if (this.token) {
            res += sprintf('&token=%s', encodeURIComponent(this.token));
        }
        return res;
    };

    this.makeLink = function(key, obj, name) {
        if (! (key in this.links) || ! ('id' in obj)) {
            return $(document.createTextNode(name));
        }
        var href = this.links[key].replace(this.templateRegex, obj.id);
        return $('<a>').attr('href', this.makeHref(href)).text(name);
    };
}

$(document).ready(function() {
    var request = parseUrl();
    if (request === null) {
        $('#data').html('No request');
        return;
    }
    renderjson.set_show_to_level(3);
    renderjson.set_max_string_length(60);
    renderjson.set_sort_objects(true);
    $.ajax({
        headers: isUndefined(request.token) ? {} : { Authorization: 'Basic ' + btoa(request.token) },
        url: request.request,
        dataType: 'json',
    }).then(
        function(data, status, xhr) {
            setStatus(xhr);
            $('#data').html(render(new Context(data), data, 'response', 'response'));
            $('#data input').first().click();
            saveToken(request.api, request.token);
        },
        function(xhr, status, error) {
            setStatus(xhr);
            $('#data').html(render('error', 'response', xhr.responseJSON));
            $('#data input').last().click();
            notifyOnError(xhr, 'Response');
        }
    );
});

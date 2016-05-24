function responseExtended(json) {
    var key = responseCollectionName(json);
    var objs = key ? json[key] : [];
    var type = key;
    if (! type) { return 'Unknown request type'; }
    if (type.slice(-1) == 's') {
        type = type.slice(0, -1);
    }
    var result = $('<div class="list"/>');
    if ('links' in json) {
        result.append(render('links', 'links', json.links));
    }
    objs.forEach(function(obj, i) {
        result.append(render('{0}[{1}]'.format(key, i), type, obj));
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

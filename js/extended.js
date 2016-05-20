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

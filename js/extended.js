function responseExtended(json) {
    var key = responseCollectionName(json);
    var objs = key ? json[key] : [];
    var type = key;
    if (! type) { return 'Unknown request type'; }
    if (type.slice(-1) === 's') {
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

function journeyExtended(json) {
    if (! ('sections' in json)) { return $('No extended view for isochron'); }
    var result = $('<div class="list"/>');
    json.sections.forEach(function(section, i) {
        result.append(render('sections[{0}]'.format(i), 'section', section));
    });
    return result;
}

function extended(type, json) {
    switch (type) {
    case 'response': return responseExtended(json);
    case 'journey': return journeyExtended(json);
    // add here custom extended
    default: return 'No extended view yet!';
    }
}

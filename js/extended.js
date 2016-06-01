var extended = {};

// the object that contains the function to make the extended views
extended.make = {}

extended.make.response = function(context, json) {
    var key = responseCollectionName(json);
    var objs = key ? json[key] : [];

    var type = getType(key);
    if (! type) { return 'Unknown request type'; }

    var result = $('<div class="list"/>');
    if ('links' in json) {
        result.append(render(context, json.links, 'links', 'links'));
    }
    objs.forEach(function(obj, i) {
        result.append(render(context, obj, type, key, i));
    });
    return result;
}

extended.make.journey = function(context, json) {
    if (! ('sections' in json)) { return $('No extended view for isochron'); }
    var result = $('<div class="list"/>');
    json.sections.forEach(function(section, i) {
        result.append(render(context, section, 'section', 'sections', i));
    });
    return result;
}

extended.make.stop_schedule = function(context, json) {
    var result = $('<div class="list"/>');
    json.date_times.forEach(function(stop_schedule, i) {
        result.append(render(context, stop_schedule, 'date_time', 'date_times', i));
    });
    return result;
}

// add your extended view by addind:
//   extended.make.{type} = function(context, json) { ... }

extended.defaultExtended = function(context, type, json) {
    var noExt = 'No extended view yet!';
    if (! (json instanceof Object)) {
        return noExt;
    }
    var empty = true;
    var result = $('<div class="list"/>');
    for (var key in context.links) {
        if (! (key in json)) { continue; }
        empty = false;
        var type = getType(key);
        if ($.isArray(json[key])) {
            json[key].forEach(function(obj, i) {
                result.append(render(context, obj, type, key, i));
            });
        } else {
            result.append(render(context, json[key], type, key));
        }
    }
    if (empty) {
        return noExt;
    } else {
        return result;
    }
}

// main method
extended.run = function(context, type, json) {
    if (type in this.make) { return this.make[type](context, json); }
    return extended.defaultExtended(context, type, json);
}

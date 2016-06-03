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
    if (! ('sections' in json)) { return extended.noExtendedMessage; }
    var result = $('<div class="list"/>');
    json.sections.forEach(function(section, i) {
        result.append(render(context, section, 'section', 'sections', i));
    });
    return result;
}

extended.make.section = function(context, json) {
    if (! ('stop_date_times' in json)) { return extended.noExtendedMessage; }
    var result = $('<div class="list"/>');
    json.stop_date_times.forEach(function(stop_date_time, i) {
        result.append(render(context, stop_date_time, 'stop_date_time', 'stop_date_times', i));
    });
    return result;
}

extended.make.stop_schedule = function(context, json) {
    var result = $('<div class="list"/>');
    json.date_times.forEach(function(date_time, i) {
        result.append(render(context, date_time, 'date_time', 'date_times', i));
    });
    return result;
}

extended.make.route_schedule = function(context, json) {
    var result = $('<div class="table"/>');
    var table = $('<table/>');
    // Add the data rows
    json.table.rows.forEach(function(route_schedule, i) {
        var row = $('<tr/>');
        var cellName = $('<td />').addClass('stop-point');
        cellName.html(summary.run(context, 'stop_point', route_schedule.stop_point));
        row.append(cellName);
        route_schedule.date_times.forEach(function(route_schedule, i) {
            var cellValue = $('<td />').addClass('time');
            cellValue.html(summary.formatTime(route_schedule.date_time));
            row.append(cellValue);
        });
        table.append(row);
    });
    result.append(table);
    return result;
}

// add your extended view by addind:
//   extended.make.{type} = function(context, json) { ... }

extended.defaultExtended = function(context, type, json) {
    var noExt = extended.noExtendedMessage;
    if (! (json instanceof Object)) {
        return noExt;
    }
    var empty = true;
    var result = $('<div class="list"/>');
    for (var key in context.links) {
        if (! (key in json)) { continue; }
        empty = false;
        if ($.isArray(json[key])) {
            json[key].forEach(function(obj, i) {
                result.append(render(context, obj, getType(key), key, i));
            });
        } else {
            result.append(render(context, json[key], getType(key), key));
        }
    }
    if (empty) {
        return noExt;
    } else {
        return result;
    }
}

extended.noExtendedMessage = 'No extended view yet!';

extended.hasExtended = function(context, type, json) {
    return extended.run(context, type, json) !== extended.noExtendedMessage;
}

// main method
extended.run = function(context, type, json) {
    if (type in this.make) { return this.make[type](context, json); }
    return extended.defaultExtended(context, type, json);
}

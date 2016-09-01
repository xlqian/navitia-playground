// Copyright (c) 2016 CanalTP
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

var extended = {};

// the object that contains the function to make the extended views
extended.make = {}

extended.make.response = function(context, json) {
    var result = $('<div class="list"/>');

    if ('full_response' in json) {
        result.append(render(context, json.full_response, 'response', 'full_response'));
    }

    if ('links' in json) {
        result.append(render(context, json.links, 'links', 'links'));
    }

    var key = responseCollectionName(json);
    var objs = key ? json[key] : [];
    var type = getType(key);
    if (type) {
        objs.forEach(function(obj, i) {
            result.append(render(context, obj, type, key, i));
        });
    }

    if ('warnings' in json) {
        json.warnings.forEach(function(warning, i) {
            result.append(render(context, warning, 'warning', 'warnings', i));
        });
    }
    return result;
}

extended.make.journey = function(context, json) {
    if (! ('sections' in json)) { return extended.noExtendedMessage; }
    var result = $('<div class="list"/>');
    if ('tags' in json && json.tags.length > 0) {
        result.append(render(context, json.tags, 'tags', 'tags'));
    }
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
    for (var key in json) {
        if (! (getType(key) in context.links)) { continue; }
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
    if (! (json instanceof Object)) { return extended.noExtendedMessage; }
    try {
        if (type in this.make) { return this.make[type](context, json); }
        return extended.defaultExtended(context, type, json);
    } catch (e) {
        console.log(sprintf('extended(%s) thows an exception:', type));
        console.log(e);
        return extended.noExtendedMessage;
    }
}

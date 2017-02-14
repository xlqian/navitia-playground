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

'use strict';

// fake includes
var response;
var summary;
var utils;

var extended = {};

// the object that contains the function to make the extended views
extended.make = {};

extended.make.response = function(context, json) {
    var result = $('<div class="list"/>');

    if ('full_response' in json) {
        result.append(response.render(context, json.full_response, 'response', 'full_response'));
    }

    if (Array.isArray(json.links) && json.links.length) {
        result.append(response.render(context, json.links, 'links', 'links'));
    }

    var key = response.responseCollectionName(json);
    var objs = key ? json[key] : [];
    var type = utils.getType(key);
    if (type) {
        objs.forEach(function(obj, i) {
            result.append(response.render(context, obj, type, key, i));
        });
    }

    if (type !== 'disruption' && $.isArray(json.disruptions)) {
        json.disruptions.forEach(function(disruption, i) {
            result.append(response.render(context, disruption, 'disruption', 'disruptions', i));
        });
    }

    if ($.isArray(json.feed_publishers)) {
        json.feed_publishers.forEach(function(feed_publisher, i) {
            result.append(response.render(context, feed_publisher, 'contributor', 'feed_publishers', i));
        });
    }

    if ('warnings' in json) {
        json.warnings.forEach(function(warning, i) {
            result.append(response.render(context, warning, 'warning', 'warnings', i));
        });
    }
    return result;
};

extended.make.journey = function(context, json) {
    var result = $('<div class="list"/>');
    if ('tags' in json && json.tags.length > 0) {
        result.append(response.render(context, json.tags, 'tags', 'tags'));
    }
    json.sections.forEach(function(section, i) {
        result.append(response.render(context, section, 'section', 'sections', i));
    });
    return result;
};

extended.make.section = function(context, json) {
    var result = $('<div class="list"/>');
    if (Array.isArray(json.links) && json.links.length) {
        result.append(response.render(context, json.links, 'links', 'links'));
    }
    if (json.from) {
        result.append(response.render(context, json.from, 'place', 'from'));
    }
    if (json.to) {
        result.append(response.render(context, json.to, 'place', 'to'));
    }
    if (json.stop_date_times) {
        json.stop_date_times.forEach(function(stop_date_time, i) {
            result.append(response.render(context, stop_date_time, 'stop_date_time', 'stop_date_times', i));
        });
    }
    return result;
};

extended.make.stop_schedule = function(context, json) {
    var result = $('<div class="list"/>');
    if (Array.isArray(json.links) && json.links.length) {
        result.append(response.render(context, json.links, 'links', 'links'));
    }
    json.date_times.forEach(function(date_time, i) {
        result.append(response.render(context, date_time, 'date_time', 'date_times', i));
    });
    return result;
};

extended.make.route_schedule = function(context, json) {
    var result = $('<div class="list"/>');
    if (Array.isArray(json.links) && json.links.length) {
        result.append(response.render(context, json.links, 'links', 'links'));
    }
    result.append(response.render(context, json.table, 'table', 'table'));
    return result;
};

extended.make.table = function(context, json) {
    var result = $('<div class="table"/>');
    var table = $('<table/>');
    // Add the data rows
    json.rows.forEach(function(route_schedule) {
        var row = $('<tr/>');
        var cellName = $('<td />').addClass('stop-point');
        cellName.text(route_schedule.stop_point.name);
        row.append(cellName);
        route_schedule.date_times.forEach(function(route_schedule) {
            var cellValue = $('<td />').addClass('time');
            cellValue.html(summary.formatTime(route_schedule.date_time));
            row.append(cellValue);
        });
        table.append(row);
    });
    result.append(table);
    return result;
};

extended.make.poi = function(context, json) {
    var result = extended.defaultExtended(context, 'poi', json);
    if (json.stands) {
        result.append(response.render(context, json.stands, 'stands', 'stands'));
    }
    return result;
};

extended.make.disruption = function(context, json) {
    var res = $('<div class="list"/>');
    if (json.application_periods) {
        res.append(response.render(context,
                                   json.application_periods,
                                   'application_periods',
                                   'application_periods'));
    }
    if (json.messages) {
        json.messages.forEach(function(obj, i) {
            res.append(response.render(context, obj, 'message', 'messages', i));
        });
    }
    json.impacted_objects.forEach(function(obj, i) {
        res.append(response.render(context, obj, 'impacted_object', 'impacted_objects', i));
    });
    return res;
};

extended.make.impacted_object = function(context, json) {
    var res = $('<div class="list"/>');
    res.append(response.render(context, json.pt_object, 'pt_object', 'pt_object'));
    if ($.isArray(json.impacted_stops)) {
        json.impacted_stops.forEach(function(obj, i) {
            res.append(response.render(context, obj, 'impacted_stop', 'impacted_stops', i));
        });
    }
    return res;
};

extended.make.connection = function(context, json) {
    return $('<div class="list"/>')
        .append(response.render(context, json.origin, 'stop_point', 'origin'))
        .append(response.render(context, json.destination, 'stop_point', 'destination'));
};

// add your extended view by addind:
//   extended.make.{type} = function(context, json) { ... }

extended.defaultExtended = function(context, type, json) {
    var result = $('<div class="list"/>');
    if (Array.isArray(json.links) && json.links.length) {
        result.append(response.render(context, json.links, 'links', 'links'));
    }
    if (Array.isArray(json.codes) && json.codes.length) {
        result.append(response.render(context, json.codes, 'codes', 'codes'));
    }
    for (var key in json) {
        if (! (utils.getType(key) in context.links)) { continue; }
        if ($.isArray(json[key])) {
            json[key].forEach(function(obj, i) {
                result.append(response.render(context, obj, utils.getType(key), key, i));
            });
        } else {
            result.append(response.render(context, json[key], utils.getType(key), key));
        }
    }
    return result;
};

extended.has = {};
extended.has.journey = function(context, type, json) {
    return Boolean(json.sections);
};
extended.has.section = function(context, type, json) {
    return Boolean(json.from) || Boolean(json.to) || Boolean(json.stop_date_times);
};
extended.has.poi = function(context, type, json) {
    return extended.hasDefaultExtended(context, type, json);
};
extended.hasDefaultExtended = function(context, type, json) {
    if (! (json instanceof Object)) { return false; }
    if (Array.isArray(json.links) && json.links.length) { return true; }
    if (Array.isArray(json.codes) && json.codes.length) { return true; }
    for (var key in json) {
        if (utils.getType(key) in context.links) { return true; }
    }
    return false;
};

extended.hasExtended = function(context, type, json) {
    try {
        if (type in extended.make) {
            if (type in extended.has) {
                return extended.has[type](context, type, json);
            }
            return true;
        }
        return extended.hasDefaultExtended(context, type, json);
    } catch (e) {
        console.log(sprintf('hasExtended(%s) thows an exception:', type));// jshint ignore:line
        console.log(e);// jshint ignore:line
    }
    return false;
};

// main method
extended.run = function(context, type, json) {
    try {
        if (type in this.make) { return this.make[type](context, json); }
        return extended.defaultExtended(context, type, json);
    } catch (e) {
        console.log(sprintf('extended(%s) thows an exception:', type));// jshint ignore:line
        console.log(e);// jshint ignore:line
        return 'Error in extended view construction';
    }
};

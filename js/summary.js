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
var modes;
var utils;

var summary = {};

summary.make = {};

summary.make.response = function(context, json) {
    if (! json) {
        return 'Error: response is not JSon';
    }
    if ('message' in json) {
        return sprintf('Message: %s', json.message);
    }
    if ('error' in json && json.error && 'message' in json.error) {
        return sprintf('Error: %s', json.error.message);
    }
    var result = '';
    var key = response.responseCollectionName(json);
    if (key) {
        result = result + sprintf(' %s %s ', json[key].length, key);
    }
    if ('pagination' in json) {
        var p = json.pagination;
        var first_number = p.start_page * p.items_per_page + 1;
        result = result + sprintf('(%s-%s of %s results)',
            first_number,
            first_number + p.items_on_page - 1,
            p.total_result);
    }
    return result;
};

summary.make.journey = function(context, json) {
    var res = $('<span>').append(summary.formatTime(json.departure_date_time));
    function add(s) {
        res.append(' > ');
        res.append(s);
    }

    if ('sections' in json) {
        var first_section_mode = null;
        var last_section_mode = null;
        json.sections.forEach(function(s) {
            switch (s.type) {
            case 'public_transport':
            case 'on_demand_transport':
                if (! first_section_mode) {
                    first_section_mode = last_section_mode;
                }
                last_section_mode = null;
                break;
            case 'street_network':
                switch (s.mode) {
                case 'bike': last_section_mode = 'bike'; break;
                case 'car': last_section_mode = 'car'; break;
                case 'walking':
                    if (! last_section_mode) { last_section_mode = 'walking'; }
                    break;
                }
                break;
            case 'bss_rent':
            case 'bss_put_back':
                last_section_mode = 'bss';
                break;
            }
        });

        if (first_section_mode) {
            add(modes.makeSnPicto(first_section_mode));
        }
        var stayIn = false;
        json.sections.forEach(function(s) {
            if (s.type === 'transfer' && s.transfer_type === 'stay_in') {
                stayIn = true;
            }
            if ($.inArray(s.type, ['public_transport', 'on_demand_transport']) === -1) { return; }
            if (stayIn) {
                res.append('&thinsp;').append(summary.makeLineCode(s.display_informations));
                stayIn = false;
            } else {
                add(summary.makePhysicalModesFromSection(s)
                    .append(summary.makeLineCode(s.display_informations)));
            }
        });
        if (last_section_mode) {
            add(modes.makeSnPicto(last_section_mode));
        }
    } else {
        // isochron
        add(summary.run(context, 'place', json.from));
        add(sprintf('%s transfer(s)', json.nb_transfers));
        add(summary.run(context, 'place', json.to));
    }

    add(summary.formatTime(json.arrival_date_time));
    if ('durations' in json) {
        if (json.durations.total) {
            res.append(', duration: ' + utils.durationToString(json.durations.total));
        }
        if (json.durations.walking) {
            res.append(', ');
            res.append(modes.makeSnPicto('walking'));
            res.append(utils.durationToString(json.durations.walking));
        }
    } else {
        res.append(', duration: ' + utils.durationToString(json.duration));
    }

    if (json.status) { res.append(', status: ' + utils.htmlEncode(json.status)); }

    return res;
};

summary.make.isochrone = function(context, json) {
    var res = $('<span>');
    if ('from' in json) {
      res.append(sprintf('from %s, ', utils.htmlEncode(json.from.name)));
    }
    if ('to' in json) {
      res.append(sprintf('to %s, ', utils.htmlEncode(json.to.name)));
    }
    if ('min_duration' in json && 'max_duration' in json) {
        res.append(sprintf('duration: [%s, %s]',
                          utils.durationToString(json.min_duration),
                          utils.durationToString(json.max_duration)));
    } else {
        res.text('no summary');
    }
    return res;
};

summary.make.heat_map = function(context, json) {
    var res = $('<span>');
    if ('from' in json) {
      res.append(sprintf('from %s, ', utils.htmlEncode(json.from.name)));
    } else if ('to' in json) {
      res.append(sprintf('to %s, ', utils.htmlEncode(json.to.name)));
    } else {
        res.text('no summary');
    }
    return res;
};

summary.make.links = function(context, json) {
    var res = $('<span>');
    function makeData(link) {
        if (link.templated) {
            return sprintf('{%s}', link.type);
        }
        return link.type;
    }
    if ($.isArray(json)) {
        json.forEach(function(link) {
            res.append(' ')
                .append($('<a>')
                        .attr('href', context.makeHref(link.href))
                        .html(makeData(link)));
        });
    } else {
        res.append('Links is not an array!');
    }
    return res;
};

summary.make.warning = function(context, json) {
    return $('<span>').text(json.message);
};

summary.make.pt_object = summary.make.place = function(context, json) {
    var res = $('<span>')
        .text(json.embedded_type)
        .append(': ')
        .append(summary.run(context, json.embedded_type, json[json.embedded_type]));
    if ('distance' in json) {
        res.append(sprintf(' at %dm', json.distance));
    }
    return res;
};

summary.make.section = function(context, section) {
    var res = $('<span>');
    var pt = false;

    switch (section.type) {
    case 'street_network': res.append(modes.makeSnPicto(section.mode)); break;
    case 'bss_rent':
        res.append(modes.makeSnPicto('bss')).append(' rent');
        break;
    case 'bss_put_back':
        res.append(modes.makeSnPicto('bss')).append(' put back');
        break;
    case 'leave_parking':
        res.append(modes.makeSnPicto('car')).append(' leave parking');
        break;
    case 'transfer':
        if (section.transfer_type === 'walking') {
            res.append(modes.makeSnPicto('walking'));
        } else {
            res.append(document.createTextNode(section.transfer_type));
        }
        break;
    case 'on_demand_transport':
        res.append(section.type + ' ');
        pt = true;
        res.append(summary.makeRoutePoint(context, section));
        break;
    case 'public_transport':
        pt = true;
        res.append(summary.makeRoutePoint(context, section));
        break;
    default: res.append(section.type); break;
    }

    if ('from' in section) {
        res.append(sprintf(' from %s', utils.htmlEncode(section.from.name)));
    }
    if (pt) {
        res.append(summary.makeSectionTime(section.departure_date_time,
                                           section.base_departure_date_time));
    }
    if ('to' in section) {
        res.append(sprintf(' to %s', utils.htmlEncode(section.to.name)));
    }
    if (pt) {
        res.append(summary.makeSectionTime(section.arrival_date_time,
                                           section.base_arrival_date_time));
    }
    if ('duration' in section) {
        res.append(sprintf(' during %s', utils.durationToString(section.duration)));
    }
    return res;
};

summary.make.region = function(context, region) {
    function makeDate(d) {
        if (typeof d !== 'string') { return null; }
        var year = + d.slice(0, 4);
        var month = + d.slice(4, 6) - 1;
        var day = + d.slice(6, 8);
        return new Date(year, month, day);
    }
    var res = $('<span/>').text(region.id + (region.name ? sprintf(' (%s)', region.name) : ''));
    var now = new Date();
    var begin = makeDate(region.start_production_date);
    var end = makeDate(region.end_production_date);
    var remaining_days = Math.round((end - now) / 1000 / 60 / 60 / 24);
    if (region.error && region.error.value) {
        res.append(sprintf(', <span class="error">error: %s</span>', utils.htmlEncode(region.error.value)));
    } else if (region.status !== 'running') {
        res.append(sprintf(', <span class="error">status: %s</span>', utils.htmlEncode(region.status)));
    } else if (now < begin || end < now) {
        res.append(', <span class="outofdate">out-of-date</span>');
    } else if (remaining_days <= 21) {
        res.append(sprintf(', <span class="almost_outofdate">%sd remaining</span>', remaining_days));
    }
    return res;
};

summary.make.line = function(context, line) {
    var code = $('');
    if (line.code) {
        code = $('<span>')
            .addClass('line_code')
            .append(line.code);
        summary.setColors(code, line);
    }
    return $('<span>')
        .append(modes.makePtPicto(line.physical_modes))
        .append(code)
        .append(' ')
        .append(document.createTextNode(line.name));
};

summary.make.stop_date_time = function(context, stop_time) {
    var sum = summary.run(context, 'stop_point', stop_time.stop_point);
    var res = $('<span>').append(summary.formatTime(stop_time.arrival_date_time))
                         .append(' > ')
                         .append(summary.formatTime(stop_time.departure_date_time))
                         .append(' ')
                         .append(sum);
    return res;
};

summary.make.departure = function(context, json) {
    var res = $('<span>');
    res.append(sprintf('%s : ', summary.formatTime(json.stop_date_time.departure_date_time)));
    res.append(summary.makeRoutePoint(context, json));
    return res;
};

summary.make.arrival = function(context, json) {
    var res = $('<span>');
    res.append(sprintf('%s : ', summary.formatTime(json.stop_date_time.arrival_date_time)));
    res.append(summary.makeRoutePoint(context, json));
    return res;
};

summary.make.stop_schedule = function(context, json) {
    return summary.makeRoutePoint(context, json);
};

summary.make.date_time = function(context, json) {
    var res = $('<span>');
    res.append(summary.formatTime(json.date_time));
    res.append(' (' + json.data_freshness + ')');
    return res;
};

summary.make.route_schedule = function(context, json) {
    return summary.makeRoutePoint(context, json);
};

summary.make.physical_mode = function(context, json) {
    return $('<span/>')
        .append(modes.makePtPicto(json))
        .append(document.createTextNode(' ' + json.name));
};

summary.make.connection = function(context, json) {
    return $('<span/>').text(sprintf('%s > %s, duration: %s, display_duration: %s',
                                     json.origin.id,
                                     json.destination.id,
                                     utils.durationToString(json.duration),
                                     utils.durationToString(json.display_duration)));
};

summary.make.tags = function(context, json) {
    return $('<span/>').text(json.join(', '));
};

summary.make.contributor = function(context, json) {
    var res = $('<span/>');
    var url = json.url ? json.url : json.website;
    if (url && typeof url === 'string') {
        if (url.indexOf('://') === -1) { url = 'http://' + url; }
        res.append($('<a/>').attr('href', url).text(json.name));
    } else {
        res.text(json.name);
    }
    if (json.license) {
        res.append(', license: ' + utils.htmlEncode(json.license));
    }
    return res;
};

summary.make.dataset = function(context, json) {
    return $('<span/>').text(sprintf('%s (%s - %s): [%s, %s]',
        json.description,
        json.realtime_level,
        json.system,
        summary.formatDatetime(json.start_validation_date),
        summary.formatDatetime(json.end_validation_date)
    ));
};

summary.make.stands = function(context, json) {
    return  $('<span/>').text(sprintf(
        'bikes: %d, places: %d, total: %d',
        json.available_bikes,
        json.available_places,
        json.total_stands
    ));
};

summary.make.disruption = function(context, json) {
    var res = $('<span/>');
    res.append($('<span/>').css('color', json.severity.color).text(json.severity.name));
    if (json.status) { res.append(', status: ' + utils.htmlEncode(json.status)); }
    if (json.cause) { res.append(', cause: ' + utils.htmlEncode(json.cause)); }
    if (json.contributor) { res.append(', contributor: ' + utils.htmlEncode(json.contributor)); }
    return res;
};

summary.make.application_periods = function(context, json) {
    var res = $('<span/>');
    var text = json.map(function(period) {
        return sprintf('[%s, %s]',
                       summary.formatDatetime(period.begin),
                       summary.formatDatetime(period.end));
    }).join(' ∪ ');
    res.text(text);
    return res;
};

summary.make.impacted_object = function(context, json) {
    return summary.run(context, 'pt_object', json.pt_object);
};

summary.make.impacted_stop = function(context, json) {
    var res = $('<span>');
    res.append(summary.run(context, 'stop_point', json.stop_point));
    res.append(': ');
    res.append(summary.makeImpactedTime(json.amended_arrival_time, json.base_arrival_time));
    res.append(' > ');
    res.append(summary.makeImpactedTime(json.amended_departure_time, json.base_departure_time));
    if (json.cause) { res.append(utils.htmlEncode(', cause: ' + json.cause)); }
    return res;
};

// add your summary view by adding:
//   summary.make.{type} = function(context, json) { ... }

summary.setColors = function(elt, json) {
    if ('color' in json) {
        elt.css('background-color', '#' + json.color);
        elt.css('color', utils.getTextColor(json));
    }
};

summary.defaultSummary = function(context, type, json) {
    if (! (json instanceof Object)) { return 'Invalid object'; }

    var res = $('<span/>');
    if ('physical_modes' in json && $.isArray(json.physical_modes)) {
        json.physical_modes.forEach(function(mode) {
            res.append(modes.makePtPicto(mode));
        });
    }
    if ('label' in json) {
        res.append(document.createTextNode(json.label));
    } else if ('name' in json) {
        res.append(document.createTextNode(json.name));
    } else if ('id' in json) {
        res.append(document.createTextNode(json.id));
    } else {
        res.append('no summary');
    }
    return res;
};

summary.formatDatetime = function(datetime) {
    var formated = datetime.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/,
                                    '$1-$2-$3 $4:$5:$6');
    if (formated.slice(-2) === '00') {
        return formated.slice(0, -3);
    } else {
        return formated;
    }
};

summary.formatTime = function(datetime) {
    if (datetime.length === 6) {
        var formated = datetime.replace(/(\d{2})(\d{2})(\d{2})/, '$1:$2:$3');
        if (formated.slice(-2) === '00') {
            return formated.slice(0, -3);
        } else {
            return formated;
        }
    }
    return summary.formatDatetime(datetime).split(' ')[1];
};

summary.makeSectionTime = function(dt, baseDt) {
    var res = $('<span/>');
    res.append(' at ');
    if (baseDt && baseDt !== dt) {
        res.append($('<span/>').addClass('old-datetime').text(summary.formatTime(baseDt)));
    }
    res.append(sprintf(' %s', summary.formatTime(dt)));
    return res;
};

summary.makeImpactedTime = function(amended, base) {
    var res = $('<span/>');
    if (base !== amended) {
        res.append($('<span/>').addClass('old-datetime').text(summary.formatTime(base)));
        res.append(' ');
    }
    res.append(utils.htmlEncode(summary.formatTime(amended)));
    return res;
};

summary.makePhysicalModesFromSection = function(section) {
    if ('links' in section) {
        var pms = section.links
            .map(function(o) {
                if (o.type === 'physical_mode') {
                    return { id: o.id, name: section.display_informations.physical_mode };
                } else {
                    return null;
                }
            });
        return modes.makePtPicto(pms);
    }
};

summary.makeLineCode = function(display_informations) {
    if (! display_informations.code) { return $(''); }
    var elt = $('<span>')
        .addClass('line_code')
        .append(display_informations.code);
    summary.setColors(elt, display_informations);
    return elt;
};

summary.makeRoutePoint = function(context, json) {
    var res = $('<span/>');
    if ('route' in json) {
        res.append(modes.makePtPicto(json.route.physical_modes));
    } else if ('links' in json && 'display_informations' in json) {
        res.append(summary.makePhysicalModesFromSection(json));
    }
    res.append(summary.makeLineCode(json.display_informations));
    res.append(' > ');
    res.append(json.display_informations.direction);
    if (json.stop_point) {
        res.append(' at ');
        res.append(summary.run(context, 'stop_point', json.stop_point));
    }
    return res;
};

summary.run = function(context, type, json) {
    var res;
    try {
        if (type in summary.make) {
            res = summary.make[type](context, json);
        } else {
            res = summary.defaultSummary(context, type, json);
        }
    } catch (e) {
        console.log(sprintf('summary(%s) thows an exception:', type));// jshint ignore:line
        console.log(e);// jshint ignore:line
        res = 'summary error';
    }
    if (res instanceof jQuery) {
        return res.get(0);
    } else if (typeof res === 'string') {
        return $('<span>').text(res).get(0);
    }
    return res;
};

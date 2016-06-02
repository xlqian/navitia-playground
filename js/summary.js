var summary = {};

summary.make = {};

summary.make.response = function(context, json) {
    if (! json) {
        return 'Error: response is not JSon';
    }
    if ('message' in json) {
        return sprintf('Message: %s', htmlEncode(json.message));
    }
    if ('error' in json && json.error && 'message' in json.error) {
        return sprintf('Error: %s', htmlEncode(json.error.message));
    }
    var result = '';
    var key = responseCollectionName(json);
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
        json.sections.forEach(function(s) {
            switch (s.type) {
            case 'transfer':
            case 'waiting':
            case 'crow_fly':
                break;
            case 'street_network': add(s.mode); break;
            case 'public_transport':
                add(summary.makePhysicalModesFromSection(s)
                    .append(summary.makeLineCode(s.display_informations)));
                break;
            default: add(s.type); break;
            }
        });
    } else {
        // isochron
        add(summary('place', json.from));
        add(sprintf('%s transfer(s)', json.nb_transfers));
        add(summary('place', json.to));
    }

    add(summary.formatTime(json.arrival_date_time));
    res.append(', duration: ' + durationToString(json.duration));
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

summary.make.pt_object = summary.make.place = function(context, json) {
    return $('<span>')
        .text(json.embedded_type)
        .append(': ')
        .append(summary.run(context, json.embedded_type, json[json.embedded_type]));
};

summary.make.section = function(context, section) {
    var res = $('<span>');
    var pt = false;

    switch (section.type) {
    case 'street_network': res.append(section.mode); break;
    case 'transfer': res.append(section.transfer_type); break;
    case 'public_transport':
        pt = true;
        res.append(summary.makePhysicalModesFromSection(section));
        res.append(summary.makeLineCode(section.display_informations));
        break;
    default: res.append(section.type); break;
    }

    if ('from' in section) {
        res.append(sprintf(' from %s', htmlEncode(section.from.name)));
    }
    if (pt) {
        res.append(sprintf(' at %s', summary.formatTime(section.departure_date_time)));
    }
    if ('to' in section) {
        res.append(sprintf(' to %s', htmlEncode(section.to.name)));
    }
    if (pt) {
        res.append(sprintf(' at %s', summary.formatTime(section.arrival_date_time)));
    }
    if ('duration' in section) {
        res.append(sprintf(' during %s', durationToString(section.duration)));
    }
    return res;
};

summary.make.region = function(context, region) {
    return region.id + (region.name ? sprintf(' (%s)', region.name) : '');
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
        .append(modes.makePicto(line.physical_modes))
        .append(code)
        .append(' ')
        .append(document.createTextNode(line.name));
};

summary.make.stop_time = function(context, stop_time) {
    return summary.formatTime(stop_time.departure_date_time) +' > '
         + summary.formatTime(stop_time.arrival_date_time)
        + ' ' + summary.defaultSummary(context, 'stop_point', stop_time.stop_point);
};

summary.make.departure = function(context, json) {
    var res = $('<span>');
    res.append(sprintf('%s : ', summary.formatTime(json.stop_date_time.departure_date_time)));
    res.append(summary.makeRoutePoint(context, res, json));
    return res;
};

summary.make.arrival = function(context, json) {
    var res = $('<span>');
    res.append(sprintf('%s : ', summary.formatTime(json.stop_date_time.arrival_date_time)));
    res.append(summary.makeRoutePoint(context, res, json));
    return res;
};

summary.make.stop_schedule = function(context, json) {
    var res = $('<span>');
    return summary.makeRoutePoint(context, res, json);
};

summary.make.date_time = function(context, json) {
    var res = $('<span>');
    res.append(summary.formatTime(json.date_time));
    res.append(' (' + json.data_freshness + ')');
    return res;
};

summary.make.route_schedule = function(context, json) {
    var res = $('<span>');
    return summary.makeRoutePoint(context, res, json);
};

summary.make.physical_mode = function(context, json) {
    return $('<span/>')
        .append(modes.makePicto(json))
        .append(document.createTextNode(' ' + json.name));
};

// add your summary view by addind:
//   summary.make.{type} = function(context, json) { ... }

summary.setColors = function(elt, json) {
    if ('color' in json) {
        elt.css('background-color', '#' + json.color);
        elt.css('color', getTextColor(json));
    }
};

summary.defaultSummary = function(context, type, json) {
    if (! (json instanceof Object)) { return 'Invalid object'; }

    var res = $('<span/>');
    if ('physical_modes' in json && $.isArray(json.physical_modes)) {
        json.physical_modes.forEach(function(mode) {
            res.append(modes.makePicto(mode));
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
    return summary.formatDatetime(datetime).split(' ')[1];
};

summary.makePhysicalModesFromSection = function(section) {
    if ('links' in section) {
        var pms = section.links
            .map(function(o) {
                if (o.type == 'physical_mode') {
                    return { id: o.id, name: section.display_informations.physical_mode };
                } else {
                    return null;
                }
            });
        return modes.makePicto(pms);
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

summary.makeRoutePoint = function(context, res, json) {
    res.append(summary.makeLineCode(json.display_informations));
    res.append(' > ');
    res.append(json.display_informations.direction);
    if (json.stop_point) {
        res.append(' at ');
        res.append(summary.run(context, 'stop_point', json.stop_point));
    }
    return res;
}

summary.run = function(context, type, json) {
    var res;
    if (type in summary.make) {
        res = summary.make[type](context, json);
    } else {
        res = summary.defaultSummary(context, type, json);
    }
    if (res instanceof jQuery) {
        return res.get(0);
    } else if (typeof res === 'string') {
        return $('<span>').text(res).get(0);
    }
    return res;
};

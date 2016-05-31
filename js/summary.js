function _toNum(c, i) { return +('0x' + c.slice(i, i + 2)); }

function getTextColor(json) {
    if ('text_color' in json) {
        return '#' + json.text_color;
    }
    if ('color' in json) {
        var c = json.color;
        var grey = 0.21 * _toNum(c, 0) + 0.72 * _toNum(c, 2) + 0.07 * _toNum(c, 4);
        if (grey < 128) {
            return 'white';
        }
    }
    return 'black';
}

function setColors(elt, json) {
    if ('color' in json) {
        elt.css('background-color', '#' + json.color);
        elt.css('color', getTextColor(json));
    }
}

function defaultSummary(json) {
    if ('label' in json) {
        return json.label;
    } else if ('name' in json) {
        return json.name;
    } else if ('id' in json) {
        return json.id;
    }
    return 'no summary';
}

function responseSummary(json) {
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
        result = result + sprintf(' %s&nbsp;%s ', json[key].length, key);
    }
    if ('pagination' in json) {
        var p = json.pagination;
        var first_number = p.start_page * p.items_per_page + 1;
        result = result + sprintf('(%s-%s of %s&nbsp;results)',
            first_number,
            first_number + p.items_on_page - 1,
            p.total_result);
    }
    return result;
}

function formatDatetime(datetime) {
    var formated = datetime.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/,
                                    '$1-$2-$3 $4:$5:$6');
    if (formated.slice(-2) === '00') {
        return formated.slice(0, -3);
    } else {
        return formated;
    }
}

function formatTime(datetime) {
    return formatDatetime(datetime).split(' ')[1];
}

function makeLineCode(display_informations) {
    var elt = $('<span>')
        .addClass('line_code')
        .append(display_informations.code);
    setColors(elt, display_informations);
    return elt;
}

function journeySummary(json) {
    var res = $('<span>').append(formatTime(json.departure_date_time));
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
                add(makeLineCode(s.display_informations));
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

    add(formatTime(json.arrival_date_time));
    res.append(', duration: ' + durationToString(json.duration));
    return res;
}

function linksSummary(json) {
    var token = URI(window.location).search(true).token;
    var res = $('<span>');
    function makeHref(href) {
        var res = sprintf('?request=%s', encodeURIComponent(href));
        if (token) {
            res += sprintf('&token=%s', encodeURIComponent(token));
        }
        return res;
    }
    function makeData(link) {
        if (link.templated) {
            return sprintf('{%s}', link.type);
        }
        return link.type;
    }
    if ($.isArray(json)) {
        json.forEach(function(link) {
            res.append(' ')
                .append($('<a>').attr('href', makeHref(link.href)).html(makeData(link)));
        });
    } else {
        res.append('Links is not an array!');
    }
    return res;
}

function embeddedSummary(json) {
    return $('<span>')
        .text(json.embedded_type)
        .append(': ')
        .append(summary(json.embedded_type, json[json.embedded_type]));
}

function sectionSummary(section) {
    var res = $('<span>');
    var pt = false;

    switch (section.type) {
    case 'street_network': res.append(section.mode); break;
    case 'transfer': res.append(section.transfer_type); break;
    case 'public_transport':
        pt = true;
        res.append(makeLineCode(section.display_informations));
        break;
    default: res.append(section.type); break;
    }

    if ('from' in section) {
        res.append(sprintf(' from %s', htmlEncode(section.from.name)));
    }
    if (pt) {
        res.append(sprintf(' at %s', formatTime(section.departure_date_time)));
    }
    if ('to' in section) {
        res.append(sprintf(' to %s', htmlEncode(section.to.name)));
    }
    if (pt) {
        res.append(sprintf(' at %s', formatTime(section.arrival_date_time)));
    }
    if ('duration' in section) {
        res.append(sprintf(' during %s', durationToString(section.duration)));
    }
    return res;
}

function regionSummary(region) {
    return region.id + (region.name ? sprintf(' (%s)', region.name) : '');
}

function lineSummary(line) {
    var code = $('<span>')
        .addClass('line_code')
        .append(line.code);
    setColors(code, line);
    return $('<span>')
        .append(code)
        .append(' ')
        .append(document.createTextNode(line.name));
}

function summary(type, json) {
    switch (type) {
    case 'response': return responseSummary(json);
    case 'journey': return journeySummary(json);
    case 'links': return linksSummary(json);
    case 'pt_object':
    case 'place':
        return embeddedSummary(json);
    case 'section': return sectionSummary(json);
    case 'region': return regionSummary(json);
    case 'line': return lineSummary(json);
        // insert here your custom summary
    default: return defaultSummary(json);
    }
}

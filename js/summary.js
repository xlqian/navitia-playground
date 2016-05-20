function defaultSummary(json) {
    var result = $('<span/>');
    if ('label' in json) {
        result.html(json['label']);
    } else if ('code' in json) {
        result.html(json['code']);
    }else if ('name' in json) {
        result.html(json['name']);
    } else if ('id' in json) {
        result.html(json['id']);
    }
    if ('color' in json) {
        result.css('background-color', '#' + json.color);
    }
    if ('text_color' in json) {
        result.css('color', '#' + json['text_color']);
    }
    return result;
}

function responseSummary(json) {
    if ('error' in json) {
        return 'Error: {0}'.format(json.error.message);
    }
    var result = '';
    var key = responseCollectionName(json);
    if (key) {
        result = result + ' {0}&nbsp;{1} '.format(json[key].length, key);
    }
    if ('pagination' in json) {
        var p = json.pagination;
        var first_number = p.start_page * p.items_per_page + 1;
        result = result + '({0}-{1} of {2}&nbsp;results)'.format(
            first_number,
            first_number + p.items_on_page - 1,
            p.total_result);
    }
    return result;
}

function formatDatetime(datetime) {
    return datetime.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/,
                           '$1-$2-$3 $4:$5:$5');
}

function getDate(datetime) {
    return datetime.replace(/(\d{8}).*/, '$1');
}

function journeySummary(json) {
    var res = $('<span>').append(formatDatetime(json.departure_date_time));
    function add(s) {
        res.append(' > ');
        res.append(s);
    }

    json.sections.forEach(function(s) {
        console.log(s);
        switch (s.type) {
        case "transfer":
        case "waiting":
            break;
        case "street_network": add(s.mode); break;
        case "public_transport":
            add($('<span>')
                .addClass('line_code')
                .css('background-color', s.display_informations.color)
                .append(s.display_informations.code));
            break;
        default: add(s.type); break;
        }
    });

    if (getDate(json.departure_date_time) == getDate(json.arrival_date_time)) {
        add(formatDatetime(json.arrival_date_time).split(' ')[1]);
    } else {
        add(formatDatetime(json.arrival_date_time));
    }
    return res;
}

function summary(name, json) {
    if (name == 'response') {
        return responseSummary(json);
    }
    if (name == 'journey') {
        return journeySummary(json);
    }
    // add here custom summary
    return defaultSummary(json);
}

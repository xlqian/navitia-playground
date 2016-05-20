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

function summary(name, json) {
    if (name == 'response') {
        return responseSummary(json);
    }
    // add here custom summary
    return defaultSummary(json);
}

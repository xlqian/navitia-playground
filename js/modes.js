var modes = {};

modes.makePtPicto = function(json) {
    if ($.isArray(json)) {
        var res = $('<span/>');
        json.forEach(function(elt) {
            res.append(modes.makePtPicto(elt));
        });
        return res;
    }

    if (!(json instanceof Object) || !('id' in json)) {
        return $('<span/>');
    }
    var img = 'Unknown';
    switch (json.id) {
    case 'physical_mode:Air': img = 'Air'; break;
    case 'physical_mode:Bike': img = 'Bike'; break;
    case 'physical_mode:BikeSharingService': img = 'BikeSharingService'; break;
    case 'physical_mode:Car': img = 'Car'; break;
    case 'physical_mode:Coach': img = 'Coach'; break;
    case 'physical_mode:Funicular': img = 'Funicular'; break;
    case 'physical_mode:Metro': img = 'Metro'; break;
    case 'physical_mode:Taxi': img = 'Taxi'; break;
    case 'physical_mode:Tramway': img = 'Tramway'; break;
    case 'physical_mode:Walking': img = 'Walking'; break;

    case 'physical_mode:Bus':
    case 'physical_mode:BusRapidTransit':
    case 'physical_mode:Trolleybus':
        img = 'Bus'; break;

    case 'physical_mode:RapidTransit':
    case 'physical_mode:LocalTrain':
    case 'physical_mode:LongDistanceTrain':
    case 'physical_mode:Train':
        img = 'Train'; break;

    case 'physical_mode:Boat':
    case 'physical_mode:Ferry':
        img = 'Boat'; break;

    case 'physical_mode:Shuttle': // What is? Boat? Bus?
    default:
        break;
    }

    return modes.makeImg(img, json.name);
};

modes.makeImg = function(img, name) {
    var tag = $('<img/>')
        .addClass('mode')
        .attr('src', sprintf('img/modes/%s.svg', img));
    if (name) { tag.attr('alt', name); }
    return tag;
};

modes.makeSnPicto = function(mode) {
    var img = 'Unknown';
    if (mode === 'walking') {
        img = 'Walking';
    } else if (mode === 'bike') {
        img = 'Bike';
    } else if (mode.indexOf('bss') === 0) {
        img = 'BikeSharingService';
    } else if (mode === 'car' || mode === 'park' || mode === 'leave_parking') {
        img = 'Car';
    }
    return modes.makeImg(img, mode);
}

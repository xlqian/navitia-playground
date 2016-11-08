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
};

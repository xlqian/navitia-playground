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
var storage;
var summary;
var utils;

var map = {};

map.DrawSectionOption = {
    DRAWSTART: 2, // 10
    DRAWEND: 1, // 01
    DRAWBOTH: 3, // 11
    DRAWNEITHER: 0 // 00
};
map._should_draw_section_start = function(option) {
    return option & 2;// jshint ignore:line
};
map._should_draw_section_end = function(option) {
    return option & 1;// jshint ignore:line
};
map.STARTTEXT = 'Start';
map.ENDTEXT = 'End';
map.makeFeatures = {
    region: function(context, json) {
        if (json.shape) {
            var geoJsonShape = wkt2geojson(json.shape);
            return map._makePolygon(context, 'region', geoJsonShape, json, '#008ACA');
        }
        return [];
    },
    section: function(context, json, draw_section_option) {
        var color = json.display_informations;
        switch (json.type) {
        case 'street_network':
            switch (json.mode) {
            case 'bike': color = map.bikeColor; break;
            case 'car': color = map.carColor; break;
            case 'walking': color = map.walkingColor; break;
            }
            break;
        case 'transfer':
            switch (json.transfer_type) {
            case 'guaranteed': color = map.carColor; break;
            case 'extension': color = map.bikeColor; break;
            case 'walking': color = map.walkingColor; break;
            }
            break;
        case 'crow_fly': color = map.crowFlyColor; break;
        }
        if (draw_section_option === undefined) {
            draw_section_option = map.DrawSectionOption.DRAWBOTH;
        }
        return map._makeString(context, 'section', json, color)
            .concat(map._makeStopTimesMarker(context, json, color, draw_section_option));
    },
    line: function(context, json) {
        return map._makeString(context, 'line', json, json);
    },
    journey: function(context, json) {
        if (! ('sections' in json)) { return []; }
        var bind = function(s, i, array) {
            var draw_section_option = map.DrawSectionOption.DRAWNEITHER;
            if ( i === 0) {
                draw_section_option |= map.DrawSectionOption.DRAWSTART;// jshint ignore:line
            }
            if ( i === (array.length -1) ) {
                draw_section_option |= map.DrawSectionOption.DRAWEND;// jshint ignore:line
            }
            return map.makeFeatures.section(context, s, draw_section_option);
        };
        return utils.flatMap(json.sections, bind);
    },
    isochrone: function(context, json) {
        if (! ('geojson' in json)) { return []; }
        var color = context.getColorFromMinDuration(json.min_duration);
        var draw_section_option = map.DrawSectionOption.DRAWBOTH;
        var color_marker = '#000000';
        return map._makePolygon(context, 'isochrone', json.geojson, json, color)
            .concat(map._makeStopTimesMarker(context, json, color_marker, draw_section_option));
    },
    heat_map: function(context, json) {
        if (! ('heat_matrix' in json)) { return []; }
        var scale = 0;
        json.heat_matrix.lines.forEach(function(lines) {
            lines.duration.forEach(function(duration) {
                if (duration !== null) {
                    scale = Math.max(duration, scale);
                }
            });
        });
        var local_map = [];
        json.heat_matrix.lines.forEach(function(lines/*, i*/) {
            lines.duration.forEach(function(duration, j) {
                var color;
                if (duration !== null) {
                    var ratio = duration / scale;
                    color = utils.getColorFromRatio(ratio);
                } else {
                    color = '#000000';
                    // for the moment, we don't want to print the null duration squares because
                    // it impacts the performances of the navigator.
                    return;
                }
                var rectangle = [
                    [json.heat_matrix.line_headers[j].cell_lat.max_lat, lines.cell_lon.max_lon],
                    [json.heat_matrix.line_headers[j].cell_lat.min_lat, lines.cell_lon.min_lon]
                ];
                local_map.push(map._makePixel(context, 'heat_map', rectangle, json, color, duration));
            });
        });
        var draw_section_option = map.DrawSectionOption.DRAWBOTH;
        var color_marker = '#000000';
        return local_map.concat(map._makeStopTimesMarker(context, json, color_marker, draw_section_option));
    },
    address: function(context, json) {
        return map._makeMarker(context, 'address', json);
    },
    administrative_region: function(context, json) {
        return map._makeMarker('administrative_region', json);
    },
    stop_area: function(context, json) {
        return map._makeMarker(context, 'stop_area', json);
    },
    stop_point: function(context, json) {
        return map._makeMarker(context, 'stop_point', json);
    },
    place: function(context, json) {
        return map._makeMarker(context, 'place', json);
    },
    pt_object: function(context, json) {
        return map.getFeatures(context, json.embedded_type, json[json.embedded_type]);
    },
    poi: function(context, json) {
        return map._makeMarker(context, 'poi', json);
    },
    connection: function(context, json) {
        return utils.flatMap([json.origin, json.destination], function(json) {
            return map._makeMarker(context, 'stop_point', json);
        });
    },
    response: function(context, json) {
        var key = response.responseCollectionName(json);
        if (key === null) {
            return [];
        }
        var type = utils.getType(key);
        if (!(type in map.makeFeatures)) {
            return [];
        }
        var bind = function(s) {
            return map.makeFeatures[type](context, s);
        };
        return utils.flatMap(json[key].slice().reverse(), bind);
    }
};

map.hasMap = function(context, type, json) {
    return map.getFeatures(context, type, json).length !== 0;
};

map.getFeatures = function(context, type, json) {
    if (! (map.makeFeatures[type] instanceof Function)) { return []; }
    if (! (json instanceof Object)) { return []; }
    try {
        return map.makeFeatures[type](context, json);
    } catch (e) {
        console.log(sprintf('map.makeFeatures[%s] thows an exception:', type));// jshint ignore:line
        console.log(e);// jshint ignore:line
        return [];
    }
};

map._makeTileLayers = function() {
    var copyOSM = '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    var courtesy = function(name) {
        return sprintf('%s & %s', copyOSM, name);
    };
    var makeStamenTileLayer = function(name) {
        return L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/' + name + '/{z}/{x}/{y}.png', {
            subdomains: 'abcd',
            attribution: courtesy('<a href="http://maps.stamen.com">Stamen Design</a>'),
            detectRetina: true
        });
    };
    return {
        'Bright': L.tileLayer('https://tile-{s}.navitia.io/osm_bright/{z}/{x}/{y}.png', {
            attribution: courtesy('<a href="https://www.navitia.io/">navitia</a>'),
            detectRetina: true
        }),
        'HOT': L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: courtesy('<a href="http://hot.openstreetmap.org/">Humanitarian OpenStreetMap Team</a>'),
            detectRetina: true
        }),
        'Hydda': L.tileLayer('https://{s}.tile.openstreetmap.se/hydda/full/{z}/{x}/{y}.png', {
            attribution: courtesy('<a href="http://openstreetmap.se/">OpenStreetMap Sweden</a>'),
            detectRetina: true
        }),
        'Mapnik': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: copyOSM,
            detectRetina: true
        }),
        'Terrain': makeStamenTileLayer('terrain'),
        'Toner': makeStamenTileLayer('toner-lite'),
        'Watercolor': makeStamenTileLayer('watercolor'),
    };
};

map._getDefaultLayerName = function() {
    var saved = storage.getLayer();
    if (saved) { return saved; }
    return 'Hydda';
};

map.createMap = function(handle) {
    var div = $('<div/>');
    // setting for default path of images used by leaflet
    L.Icon.Default.imagePath = 'lib/img/leaflet/dist/images/';
    div.addClass('leaflet');
    var m = L.map(div.get(0), {renderer: L.canvas()});
    var tileLayers = map._makeTileLayers();
    tileLayers[map._getDefaultLayerName()].addTo(m);
    L.control.layers(tileLayers).addTo(m);
    m.on('baselayerchange', storage.saveLayer);
    L.control.scale().addTo(m);
    var bounds = handle(m);

    // Cleanly destroying the map
    div.on('npg:remove', function() { m.remove(); });

    // GPS location
    var circle = L.circle([0,0], {radius: 1});
    m.on('locationfound', function(e) {
        circle.setRadius(e.accuracy / 2)
            .setStyle({color: '#3388ff'})
            .setLatLng(e.latlng)
            .bindPopup(sprintf('%.5f;%.5f ±%dm', e.latlng.lng, e.latlng.lat, e.accuracy))
            .addTo(m);
    });
    m.on('locationerror', function(e) {
        circle.setStyle({color: 'red'}).bindPopup(e.message);
    });
    m.on('unload', function() { m.stopLocate(); });
    m.locate({enableHighAccuracy: true, watch: true});

    m.on('moveend', function() { storage.saveBounds(m.getBounds()); });

    setTimeout(function() {
        if (bounds) { m.fitBounds(bounds); } else { m.fitWorld(); }
    }, 100);

    return div;
};

map.run = function(context, type, json) {
    var features = [];
    if ((features = map.getFeatures(context, type, json)).length) {
        return map.createMap(function(m) {
            return L.featureGroup(features).addTo(m).getBounds();
        });
    } else {
        var div = $('<div/>');
        div.addClass('noMap');
        div.append('No map');
        return div;
    }
};

map._makeMarker = function(context, type, json, colorJson, useCustomMarker, label) {
    var lat, lon;
    var obj = json;
    switch (type){
    case 'stop_date_time':
        obj = json.stop_point;
        lat = obj.coord.lat;
        lon = obj.coord.lon;
        break;
    case 'place':
        lat = json[json.embedded_type].coord.lat;
        lon = json[json.embedded_type].coord.lon;
        break;
    default:
        lat = json.coord.lat;
        lon = json.coord.lon;
    }
    var sum = summary.run(context, type, json);
    var t = type === 'place' ? json.embedded_type : type;
    var marker;
    if (! useCustomMarker) {
        marker = L.marker([lat, lon]);
    } else {
        var color = '#000000';
        if (colorJson  && colorJson instanceof Object && colorJson.color) {
            color = '#' + colorJson.color;
        }
        marker = L.circleMarker([lat, lon], {color: color, opacity: 1, fillColor: 'white', fillOpacity: 1});
        marker.setRadius(5);
    }
    if (label) {
        marker.bindTooltip(label, {permanent: true, opacity: 1});
    }
    return [marker.bindPopup(map._makeLink(context, t, obj, sum)[0])];
};

map.bikeColor = { color: 'CED480' };
map.carColor = { color: 'EFBF8F' };
map.walkingColor = { color: '89C6E5' };
map.crowFlyColor = { color: 'CBB6E4' };

map._getCoordFromPlace = function(place) {
    if (place && place[place.embedded_type] && place[place.embedded_type].coord) {
        return place[place.embedded_type].coord;
    }
    return null;
};

map._makeString = function(context, type, json, colorJson) {
    if (! (colorJson instanceof Object) || ! (colorJson.color)) {
        colorJson = { color: '000000' };
    }
    var sum = summary.run(context, type, json);
    var from = map._getCoordFromPlace(json.from);
    var to = map._getCoordFromPlace(json.to);
    var style1 = {
        color: 'white',
        weight: 7,
        opacity: 1
    };
    var style2 = {
        color: '#' + colorJson.color,
        weight: 5,
        opacity: 1
    };
    if (json.geojson && json.geojson.coordinates.length) {
        return [
            L.geoJson(json.geojson, { style: style1 }),
            L.geoJson(json.geojson, { style: style2 }).bindPopup(sum)
        ];
    } else if (from && to) {
        return [
            L.polyline([from, to], style1),
            L.polyline([from, to], style2).bindPopup(sum)
        ];
    } else {
        return [];
    }
};

map._makeStopTimesMarker = function(context, json, color, draw_section_option) {
    var stopTimes = json.stop_date_times;
    var markers = [];
    if (stopTimes) {
        // when section is PT
        stopTimes.forEach(function(st, i) {
            var label = null;
            if (i === 0 &&
                map._should_draw_section_start(draw_section_option)) {
                label = map.STARTTEXT;
            }else if (i === (stopTimes.length -1 ) &&
                      map._should_draw_section_end(draw_section_option)) {
                label = map.ENDTEXT;
            }
            markers = markers.concat(map._makeMarker(context, 'stop_date_time', st, color, true, label));
        });
    } else {
        // when section is Walking
        var from = json.from;
        var to = json.to;
        var label_from = null;
        var label_to = null;
        if (from && map._should_draw_section_start(draw_section_option)) {
            label_from = map.STARTTEXT;
            markers.push(map._makeMarker(context, 'place', from, color, true, label_from)[0]);
        }
        if (to && map._should_draw_section_end(draw_section_option)) {
            label_to = map.ENDTEXT;
            markers.push(map._makeMarker(context, 'place', to, color, true, label_to)[0]);
        }
    }
    return markers;
};
map._makePolygon = function(context, type, geoJsonCoords, json, color) {
    var sum = summary.run(context, type, json);
    // TODO use link when navitia has debugged the ticket NAVITIAII-2133
    var link = map._makeLink(context, type, json, sum)[0];
    return [
        L.geoJson(geoJsonCoords, {
            color:  '#555555',
            opacity: 1,
            weight: 0.5,
            fillColor: color,
            fillOpacity: 0.25
        }).bindPopup(link)
    ];
};
map._makeLink = function(context, type, obj, name) {
    return context.makeLink(type, obj, name);
};
map._makePixel = function(context, type, PolygonCoords, json, color, duration) {
    var sum = 'not accessible';
    if (duration !== null) {
        sum = sprintf('duration: %s', utils.durationToString(duration));
    }
    return L.rectangle(PolygonCoords, {
        smoothFactor: 0,
        color:  '#555555',
        opacity: 0,
        weight: 0,
        fillColor: color,
        fillOpacity: 0.25
    }).bindPopup(sum);
};

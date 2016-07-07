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

var map = {
    SectionPosition: {
        START: 0,
        MIDDLE:1,
        END: 2
    },
    makeFeatures: {
        region: function(context, json) {
            if (json.shape) {
                var geoJsonShape = wkt2geojson(json.shape);
                return map._makePolygon(context, 'region', geoJsonShape, json);
            }
            return [];
        },
        section: function(context, json, section_position) {
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
            }
            return map._makeString(context, 'section', json, color)
                .concat(map._makeStopTimesMarker(context, json, color, section_position));
        },
        line: function(context, json) {
            return map._makeString(context, 'line', json, json);
        },
        journey: function(context, json) {
            if (! ('sections' in json)) { return []; }
            var bind = function(s, i, array) {
                var section_position;
                if ( i === 0) { section_position = map.SectionPosition.START; }
                else if ( i === (array.length -1) ) { section_position = map.SectionPosition.END; }
                else { section_position = map.SectionPosition.MIDDLE; }
                return map.makeFeatures.section(context, s, section_position);
            }
            return flatMap(json.sections, bind);
        },
        isochrone: function(context, json) {
            if (! ('geojson' in json)) { return []; }
            return map._makePolygon(context, 'isochrone', json.geojson, json);
        },
        address: function(context, json) {
            return map._makeMarker(context, 'address', json, null, true);
        },
        administrative_region: function(context, json) {
            return map._makeMarker('administrative_region', json, null, true);
        },
        stop_area: function(context, json) {
            return map._makeMarker(context, 'stop_area', json, null, true);
        },
        stop_point: function(context, json) {
            return map._makeMarker(context, 'stop_point', json, null, true);
        },
        place: function(context, json) {
            return map._makeMarker(context, 'place', json, null, true);
        },
        poi: function(context, json) {
            return map._makeMarker(context, 'poi', json, null, true);
        },
        response: function(context, json) {
            var key = responseCollectionName(json);
            if (key === null) {
                return [];
            }
            var type = getType(key);
            if (!(type in map.makeFeatures)) {
                return [];
            }
            var bind = function(s) {
                return map.makeFeatures[type](context, s);
            }
            return flatMap(json[key], bind);
        }
    },

    hasMap: function(context, type, json) {
        return map.getFeatures(context, type, json).length !== 0;
    },

    getFeatures: function(context, type, json) {
        if (! (map.makeFeatures[type] instanceof Function)) { return []; }
        try {
            return map.makeFeatures[type](context, json);
        } catch (e) {
            console.log(sprintf('map.makeFeatures[%s] thows an exception:', type));
            console.log(e);
            return [];
        }
    },

    run: function(context, type, json) {
        var div = $('<div/>');
        // setting for default path of images used by leaflet
        L.Icon.Default.imagePath='lib/img/leaflet/dist/images';
        var features = [];
        if ((features = map.getFeatures(context, type, json)).length) {
            div.addClass('leaflet');
            var m = L.map(div.get(0)).setView([48.843693, 2.373303], 13);
            mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
            mapquestLink = '<a href="http://www.mapquest.com//">MapQuest</a>';
            mapquestPic = '<img src="http://developer.mapquest.com/content/osm/mq_logo.png">';
            L.tileLayer(
                'http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.png', {
                    attribution: '&copy; '+mapLink+'. Tiles courtesy of '+mapquestLink+mapquestPic,
                    maxZoom: 17,
                    subdomains: '1234',
            }).addTo(m);
            var overlay = L.featureGroup(features).addTo(m);
            setTimeout(function() {
                m.invalidateSize();
                m.fitBounds(overlay.getBounds());
            }, 100);
        } else {
            div.addClass('noMap');
            div.append('No map');
        }
        return div;
    },

    _makeMarker: function(context, type, json, colorJson, useDefaultMarker, label) {
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
        };
        var sum = summary.run(context, type, json);
        var t = type === 'place' ? json.embedded_type : type;
        var marker;
        if (useDefaultMarker) {
            marker = L.marker([lat, lon]);
        } else {
            var color = '#000000';
            if (colorJson  && (colorJson instanceof Object) && (colorJson.color)) {
                color = '#' + colorJson.color;
            }
            var icon = L.divIcon({
                iconSize: L.point(8, 8),
                iconAnchor: L.point(6, 6),
                popupAnchor: L.point(0, -4),
                className: null,
                html: $('<div class="my-div-icon"></div>').css('background-color', 'white').css('border-color', color)[0].outerHTML
            });
            marker = L.marker([lat, lon], {icon: icon});
        }
        if (label) {
            marker.bindLabel(label, {noHide: true, offset: [20, -35] })
        }
        return [marker.bindPopup(map._makeLink(context, t, obj, sum)[0])];
    },

    bikeColor: { color: 'CED480' },
    carColor: { color: 'EFBF8F' },
    walkingColor: { color: '89C6E5' },

    _makeString: function(context, type, json, colorJson) {
        if (! ( "geojson" in json) || ! json.geojson.coordinates.length) {
            return [];
        }
        if (! (colorJson instanceof Object) || ! (colorJson.color)) {
            colorJson = { color: '000000' };
        }
        var sum = summary.run(context, type, json);
        return [
            L.geoJson(json.geojson, {
                style: {
                    color: getTextColor(colorJson),
                    weight: 6,
                    opacity: 1
                }
            }),
            L.geoJson(json.geojson, {
                style: {
                    color: "#" + colorJson.color,
                    weight: 5,
                    opacity: 1
                }
            }).bindPopup(sum)
        ];
    },
    _makeStopTimesMarker: function(context, json, color, section_position) {
        var stopTimes = json['stop_date_times'];
        var markers = []

        if (stopTimes) {
            // when section is PT
            stopTimes.forEach(function(st, i) {
                var useDefaultMarker = false;
                var label = null;
                if (section_position === map.SectionPosition.START && i === 0) {
                    useDefaultMarker = true
                    label = "Start";
                }else if (section_position === map.SectionPosition.END && i === (stopTimes.length -1 )) {
                    useDefaultMarker = true
                    label = "End";
                }
                markers = markers.concat(map._makeMarker(context, 'stop_date_time', st, color, useDefaultMarker, label));
            });
        } else {
            // when section is Walking
            var from = json.from;
            var to = json.to;
            if (! from || ! to) { return markers; }
            var useDefaultMarker_from = false;
            var useDefaultMarker_to = false;
            var label_from= null;
            var label_to= null;

            if (section_position === map.SectionPosition.START) {
                useDefaultMarker_from = true;
                label_from = "Start";
            }else if (section_position === map.SectionPosition.END) {
                useDefaultMarker_to = true;
                label_to = "End";
            }

            markers = markers.concat(map._makeMarker(context, 'place', from, color, useDefaultMarker_from, label_from))
                            .concat(map._makeMarker(context, 'place', to, color, useDefaultMarker_to, label_to));
        }
        return markers;
    },
    _makePolygon: function(context, type, geoJsonCoords, json) {
        var sum = summary.run(context, type, json);
        // TODO use link when navitia has debugged the ticket NAVITIAII-2133
        var link = map._makeLink(context, type, json, sum)[0];
        return [
            L.geoJson(geoJsonCoords, {
                color: '#0000FF',
                opacity: 1.0,
                weight: 3,
                fillColor: '#0000FF',
                fillOpacity: 0.35
            }).bindPopup(link)
        ];
    },
    _makeLink: function(context, type, obj, name) {
        return context.makeLink(type, obj, name);
    }
};

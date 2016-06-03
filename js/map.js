var map = {
    makeFeatures: {
        region: function(context, json) {
            if (json.shape) {
                var geoJsonShape = wkt2geojson(json.shape);
                return map._makePolygon(context, 'region', geoJsonShape, json);
            }
            return [];
        },
        section: function(context, json) {
            var color = json.display_informations;
            if (json.type === 'street_network') {
                switch (json.mode) {
                case 'bike': color = map.bikeColor; break;
                case 'car': color = map.carColor; break;
                }
            }
            return map._makeString(context, 'section', json, color)
                .concat(map._makeStopTimesMarker(context, json));
        },
        line: function(context, json) {
            return map._makeString(text, 'line', json, json);
        },
        journey: function(context, json) {
            if (! ('sections' in json)) { return []; }
            var bind = function(s) {
                return map.makeFeatures.section(context, s);
            }
            return flatMap(json.sections, bind);
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
        poi: function(context, json) {
            return map._makeMarker(context, 'poi', json);
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
        return map.makeFeatures[type] instanceof Function &&
            map.makeFeatures[type](context, json).length !== 0;
    },

    run: function(context, type, json) {
        var div = $('<div/>');
        // setting for default path of images used by leaflet
        L.Icon.Default.imagePath='lib/img/leaflet/dist/images';
        var features = [];
        if (map.makeFeatures[type] instanceof Function &&
            (features = map.makeFeatures[type](context, json)).length) {
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

    _makeMarker: function(context, type, json) {
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
        return [L.marker([lat, lon]).bindPopup(map._makeLink(context, t, obj, sum)[0])];
    },

    bikeColor: { color: 'CED480' },
    carColor: { color: 'EFBF8F' },

    _makeString: function(context, type, json, colorJson) {
        if (! ( "geojson" in json) || ! json.geojson.coordinates.length) {
            return [];
        }
        if (! (colorJson instanceof Object) || ! ('color' in colorJson)) {
            colorJson = { color: '89C6E5' };
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
    _makeStopTimesMarker: function(context, json) {
        var stopTimes = json['stop_date_times'];
        var markers = []

        if (stopTimes) {
            // when section is PT
            stopTimes.forEach(function(st) {
                markers = markers.concat(map._makeMarker(context, 'stop_date_time', st));
            });
        } else {
            // when section is Walking
            var from = json.from;
            var to = json.to;
            if (! from || ! to) { return markers; }
            markers = markers.concat(map._makeMarker(context, 'place', from))
                            .concat(map._makeMarker(context, 'place', to));
        }
        return markers;
    },
    _makePolygon: function(context, type, geoJsonCoords, json) {
        var sum = summary.run(context, type, json);
        // TODO use link when navitia has debugged the ticket NAVITIAII-2133
        // var link = map._makeLink(context, type, json, sum)[0];
        return [
            L.geoJson(geoJsonCoords, {
                color: '#0000FF',
                opacity: 1.0,
                weight: 3,
                fillColor: '#0000FF',
                fillOpacity: 0.35
            }).bindPopup(sum)
        ];
    },
    _makeLink: function(context, type, obj, name) {
        return context.makeLink(type, obj, name);
    }
};

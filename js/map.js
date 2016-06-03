var map = {
    makeFeatures: {
        region: function(json) {
            if (json.shape) {
                var geoJsonShape = wkt2geojson(json.shape);
                return map._makePolygon('region', geoJsonShape, json);
            }
            return [];
        },
        section: function(json) {
            var color = json.display_informations;
            if (json.type === 'street_network') {
                switch (json.mode) {
                case 'bike': color = map.bikeColor; break;
                case 'car': color = map.carColor; break;
                }
            }
            return map._makeString('section', json, color, context)
                .concat(map._makeStopTimesMarker(json, context));
        },
        line: function(json, context) {
            return map._makeString('line', json, json, context);
        },
        journey: function(json, context) {
            var bind = function(s) {
                return map.makeFeatures.section(s, context);
            }
            return flatMap(json.sections, bind);
        },
        address: function(json, context) {
            return map._makeMarker('address', json, context);
        },
        administrative_region: function(json, context) {
            return map._makeMarker('administrative_region', json);
        },
        stop_area: function(json, context) {
            return map._makeMarker('stop_area', json, context);
        },
        stop_point: function(json, context) {
            return map._makeMarker('stop_point', json, context);
        },
        place: function(json, context) {
            return map._makeMarker('place', json, context);
        },
        poi: function(json, context) {
            return map._makeMarker('poi', json, context);
        },
        response: function(json, context) {
            var key = responseCollectionName(json);
            if (key === null) {
                return [];
            }
            var type = getType(key);
            if (!(type in map.makeFeatures)) {
                return [];
            }
            var bind = function(s) {
                return map.makeFeatures[type](s, context);
            }

            return flatMap(json[key], bind);
        }
    },

    run: function(type, json, context) {
        var div = $('<div/>');
        // setting for default path of images used by leaflet
        L.Icon.Default.imagePath='lib/img/leaflet/dist/images';
        var features = [];
        if (map.makeFeatures[type] instanceof Function &&
            (features = map.makeFeatures[type](json, context)).length) {
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

    _makeMarker: function(type, json, context) {
        var lat, lon;
        switch (type){
            case 'stop_time':
                lat = json.stop_point.coord.lat;
                lon = json.stop_point.coord.lon;
                break;
            case 'place':
                lat = json[json.embedded_type].coord.lat;
                lon = json[json.embedded_type].coord.lon;
                break;
            default:
                lat = json.coord.lat;
                lon = json.coord.lon;
        };
        return [L.marker([lat, lon]).bindPopup(summary.run(context, 'stop_points', json))];
    },

    bikeColor: { color: 'CED480' },
    carColor: { color: 'EFBF8F' },

    _makeString: function(type, json, colorJson, context) {
        if (! ( "geojson" in json) || ! json.geojson.coordinates.length) {
            return [];
        }
        if (! (colorJson instanceof Object) || ! ('color' in colorJson)) {
            colorJson = { color: '89C6E5' };
        }
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
            }).bindPopup(summary.run(context, type, json))
        ];
    },
    _makeStopTimesMarker: function(json, context) {
        var stopTimes = json['stop_date_times'];
        var markers = []

        if (stopTimes) {
            // when section is PT
            stopTimes.forEach(function(st) {
                markers = markers.concat(map._makeMarker('stop_time', st, context));
            });
        } else {
            // when section is Walking
            var from = json.from;
            var to = json.to;
            if (! from || ! to) { return markers; }
            markers = markers.concat(map._makeMarker('place', from, context))
                            .concat(map._makeMarker('place', to, context));
        }
        return markers;
    },
    _makePolygon: function(type, geoJsonCoords, json) {
        return [
            L.geoJson(geoJsonCoords, {
                color: '#0000FF',
                opacity: 1.0,
                weight: 3,
                fillColor: '#0000FF',
                fillOpacity: 0.35
            }).bindPopup(summary.run(new Context(), type, json))
        ];         
    },
    _makeLink: function(type, obj, name, context) {
        return context.makeLink(type, obj, 'toto');
    },
};

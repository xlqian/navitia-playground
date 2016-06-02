var map = {
    makeFeatures: {
        section: function(json) {
            var color = json.display_informations;
            if (json.type === 'street_network') {
                switch (json.mode) {
                case 'bike': color = map.bikeColor; break;
                case 'car': color = map.carColor; break;
                }
            }

            return map._makeString('section', json, color)
                .concat(map._makeStopTimesMarker(json));
        },
        line: function(json) {
            return map._makeString('line', json, json);
        },
        journey: function(json) {
            return flatMap(json.sections, map.makeFeatures.section);
        },
        address: function(json) {
            return map._makeMarker('address', json);
        },
        administrative_region: function(json) {
            return map._makeMarker('administrative_region', json);
        },
        stop_area: function(json) {
            return map._makeMarker('stop_area', json);
        },
        stop_point: function(json) {
            return map._makeMarker('stop_point', json);
        },
        place: function(json) {
            return [
                L.marker([json[json.embedded_type].coord.lat, json[json.embedded_type].coord.lon])
                    .bindPopup(summary.run(new Context(json), 'place', json))
            ];
        },
        poi: function(json) {
            return map._makeMarker('poi', json);
        },
        response: function(json) {
            var key = responseCollectionName(json);
            if (key === null) {
                return [];
            }
            var type = getType(key);
            if (!(type in map.makeFeatures)) {
                return [];
            }
            return flatMap(json[key], map.makeFeatures[type]);
        }
    },

    run: function(type, json) {
        var div = $('<div/>');
        // setting for default path of images used by leaflet
        L.Icon.Default.imagePath='lib/img/leaflet/dist/images';
        var features = [];
        if (map.makeFeatures[type] instanceof Function &&
            (features = map.makeFeatures[type](json)).length) {
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

    _makeMarker: function(type, json) {
        var lat, lon;
        if (type === 'stop_time') {
            lat = json.stop_point.coord.lat;
            lon = json.stop_point.coord.lon;
        } else {
            lat = json.coord.lat;
            lon = json.coord.lon;
        }
        return [L.marker([lat, lon]).bindPopup(summary.run(new Context(json), type, json))];
    },

    bikeColor: { color: 'CED480' },
    carColor: { color: 'EFBF8F' },

    _makeString: function(type, json, colorJson) {
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
            }).bindPopup(summary.run(new Context(), type, json))
        ];
    },
    _makeStopTimesMarker: function(json) {
        var stopTimes = json['stop_date_times'];
        var markers = []

        if (stopTimes) {
            // when section is PT
            stopTimes.forEach(function(st) {
                markers = markers.concat(map._makeMarker('stop_time', st));
            });
        } else {
            // when section is Walking
            var from = json.from;
            var to = json.to;
            if (! from || ! to) { return markers; }
            markers = markers.concat(map._makeMarker(from.embedded_type, from[from.embedded_type]))
                            .concat(map._makeMarker(to.embedded_type, to[to.embedded_type]));
        }
        return markers;
    }
};

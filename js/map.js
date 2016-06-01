var map = {
    makeFeatures: {
        section: function(json) {
            return map._makeString('section', json, json.display_informations);
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
        return [L.marker([json.coord.lat, json.coord.lon]).bindPopup(summary.run(new Context(json), type, json))];
    },

    _makeString: function(type, json, colorJson) {
        if (! ( "geojson" in json) || ! json.geojson.coordinates.length) {
            return [];
        }
        if (! (colorJson instanceof Object) || ! ('color' in colorJson)) {
            colorJson = { color: '008ACA' };
        }
        return [
            L.geoJson(json.geojson, {
                style: function() {
                    return {
                        color: getTextColor(colorJson),
                        weight: 6,
                        opacity: 1
                    };
                }
            }),
            L.geoJson(json.geojson, {
                style: function() {
                    var color = "#" + colorJson.color;
                    return {
                        color: color,
                        weight: 5,
                        opacity: 1
                    };
                }
            }).bindPopup(summary.run(new Context(), type, json))
        ];
    }
};

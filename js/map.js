var map = {
    makeFeatures: {
        section: function(json) {
            if (!( "geojson" in json)) {
               return [];
            }
            return [
                L.geoJson(json.geojson, {
                    style: function() {
                        if ("display_informations" in json) {
                            return { color: "#" + json.display_informations.color };
                        }
                        return {};
                    }
                })
            ];
        },
        journey: function(json) {
            return flatMap(json.sections, map.makeFeatures.section);
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
        if (typeof map.makeFeatures[type] == 'function') {
            div.addClass('leaflet');
            var m = L.map(div.get(0)).setView([48.843693, 2.373303], 13);
            L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
            }).addTo(m);
            var overlay = L.featureGroup(map.makeFeatures[type](json)).addTo(m);
            setTimeout(function(){ m.invalidateSize(), m.fitBounds(overlay.getBounds());}, 100);
        } else {
            div.addClass('noMap');
            div.append('No map');
        }
        return div;
    }
};

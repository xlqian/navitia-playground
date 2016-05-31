var _paramValueEverywhere = ['depth'];

var autocomplete = {
    autocompleteTree: {
        pathKey: {
            empty : ['coverage', 'places', 'coord'],
            all : ['addresses',
            'commercial_modes',
            'companies',
            'disruptions',
            'lines',
            'networks',
            'places',
            'poi_types',
            'pois',
            'physical_modes',
            'routes',
            'stop_areas',
            'stop_points',
            'vehicles_journeys',
            ].sort(),
        },
        features: {
            all: ['addresses',
            'commercial_modes',
            'companies',
            'coverage',
            'departures',
            'disruptions',
            'journeys',
            'lines',
            'networks',
            'places_nearby',
            'places',
            'poi_types',
            'pois',
            'physical_modes',
            'pt_objects',
            'route_schedules',
            'routes',
            'stop_areas',
            'stop_points',
            'stop_schedules',
            'vehicles_journeys',
            ].sort(),
        },
        paramKey: {
            departures : ['from_datetime', 'duration', 'forbidden_uris[]', 'data_freshness'].concat(_paramValueEverywhere).sort(),
            journeys : ['from', 'to', 'datetime', 'datetime_represents', 'traveler_type', 'forbidden_uris[]', 'data_freshness', 'count'].concat(_paramValueEverywhere).sort(),
            places_nearby : ['distance', 'type[]', 'admin_uri[]', 'filter'].concat(_paramValueEverywhere).sort(),
            places: ['q', 'type[]', 'count', 'admin_uri[]'].concat(_paramValueEverywhere).sort(),
            pois : ['distance'].concat(_paramValueEverywhere),
            pt_objects: ['q', 'type[]', 'count'].concat(_paramValueEverywhere),
            route_schedule : ['from_datetime', 'duration', 'items_per_schedule', 'forbidden_uris[]', 'data_freshness'].concat(_paramValueEverywhere).sort(),
            stop_schedules : ['from_datetime', 'duration', 'items_per_schedule', 'forbidden_uris[]', 'data_freshness'].concat(_paramValueEverywhere).sort(),
        },
        paramValue : {
            traveler_type : ['cyclist', 'luggage', 'wheelchair', 'standard', 'motorist', 'fast_walker', 'slow_walker'].sort(),
            datetime_represents : ['arrival', 'departure'].sort(),
        }
    },
    valueAutoComplete: function (input, key) {
        if (isDatetimeType(key)) {
            makeDatetime(input);
        } else if (key in this.autocompleteTree.paramValue){
            // TODO : factorize this code
            $(input).autocomplete({
                source: this.autocompleteTree.paramValue[key],
                minLength: 0,
                scroll: true,
                delay: 500
            }).focus(function() {
                    $(this).autocomplete('search', '');
            });
        } else if (this.staticAutocompleteTypes.indexOf(key) > -1) {
            this.staticAutocomplete(input, key);
        } else if (this.dynamicAutocompleteTypes.indexOf(key) > -1) {
            this.dynamicAutocomplete(input, key);
        }
    },
    addKeyAutocomplete: function(input, type) {
        var  source;
        if (type === 'pathKey' && ! $('#pathFrame').find('.value').length) {
            source = this.autocompleteTree[type].empty;
        } else if (type === 'paramKey'){
            var feature = $('#featureInput').val();
            source = this.autocompleteTree[type][feature];
        } else {
            source = this.autocompleteTree[type].all;
        }
        source = source ? source : [];
        $(input).autocomplete({
            source: source,
            minLength: 0,
            scroll: true,
            delay: 500,
            select: function (event, ui) {
                $(input).val(ui.item.value).change();
            }
        }).focus(function() {
            $(this).autocomplete('search', '');
        });
    },
    staticAutocompleteTypes: ['coverage',
        'physical_modes',
        'poi_types',
    ],
    staticAutocomplete : function (input, staticType){
        var api = $('#api input.api').attr('value');
        var token = $('#token input.token').val();
        var cov = getCoverage();
        var request = '';
        if (staticType === 'coverage') {
            request =  api +  '/coverage/';
        } else {
            request =  api +  '/coverage/' + cov + '/' + staticType;
        }
        $.ajax({
            headers: isUndefined(token) ? {} : { Authorization: 'Basic ' + btoa(token) },
            dataType: 'json',
            url: request,
            success: function(data) {
                var res = [];
                staticType = (staticType==='coverage') ? 'regions' :  staticType;
                data[staticType].forEach(function(elt) {
                    res.push({ value: elt.id, label: summary(getType(staticType), elt) });
                });
                res = res.sort(function(a, b) {
                    // TODO: for the moment, it will work only if
                    // summary returns a string, not if it returns a
                    // formated jQuery object.
                    if (a.label < b.label) { return -1; }
                    if (a.label > b.label) { return 1; }
                    return 0;
                });
                $(input).autocomplete({source: res,
                        minLength: 0,
                        scroll: true,
                        delay: 500
                    }).focus(function() {
                        $(input).autocomplete('search', '');
                    });
                    if ($(input).is(':focus')) {
                        $(input).autocomplete('search', '');
                    }
                }
        });
    },
    dynamicAutocompleteTypes: [
        'addresses',
        'administrative_regions',
        'commercial_modes',
        'coord',
        'lines',
        'networks',
        'places',
        'pois',
        'routes',
        'stop_areas',
        'stop_points',
        'from',
        'to',
    ],
    dynamicAutocomplete: function (elt, dynamicType) {
        var formatPtReq = function (v){
            return sprintf('pt_objects/?type[]=%s&q=', v);
        };
        var formatPlacesReq = function (v){
            return sprintf('places/?type[]=%s&q=', v);
        };
        var dynamicTypeRequest = {
            addresses: formatPlacesReq('address'),
            administrative_regions: formatPlacesReq('administrative_region'),
            commercial_modes: formatPtReq('commercial_mode'),
            coord: formatPlacesReq('address'),
            lines: formatPtReq('line'),
            networks: formatPtReq('network'),
            places: 'places/?&q=',
            pois: formatPlacesReq('poi'),
            routes: formatPtReq('route'),
            stop_areas: formatPtReq('stop_area'),
            stop_points: formatPlacesReq('stop_point'),
            from: 'places/?&q=',
            to: 'places/?&q=',
        };
        var httpReq = dynamicTypeRequest[dynamicType];
        if (! httpReq) {
            return;
        }
        $(elt).autocomplete({
            delay: 200,
            source: function (request, response) {
                var token = $('#token input.token').val();
                var url = $('#api input.api').val();
                var cov = getCoverage();
                // cov can be null in case where coverage is not specifeid
                cov = cov ? ('coverage/' + cov) : '';
                $.ajax({
                    url: sprintf('%s/%s/%s%s', url, cov, httpReq, encodeURIComponent(request.term)),
                    headers: isUndefined(token) ? {} : { Authorization: 'Basic ' + btoa(token) },
                    success: function (data) {
                        var res = [];
                        // TODO: use summary
                        var search = null;
                        var type = null;
                        if ('places' in data) {
                            search = data.places;
                            type = 'place';
                        } else if ('pt_objects' in data) {
                            search = data.pt_objects;
                            type = 'pt_object';
                        }
                        if (search) {
                            search.forEach(function(s) {
                                res.push({ value: s.id, label: summary(type, s).get() });
                            });
                        }
                        response(res);
                    },
                    error: function() {
                        response([]);
                    }
                });
            }
        }).autocomplete('instance')._renderItem = function(ul, item) {
            return $('<li>').append(item.label).appendTo(ul);
        };
    }
}

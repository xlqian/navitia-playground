var autocomplete = {
    autocompleteTree: {
        pathKey: {
            empty : ['coverage', 'places', 'journeys', 'coord'],
            all : ['addresses',
            'commercial_modes',
            'companies',
            'departures',
            'disruptions',
            'lines',
            'networks',
            'physical_modes',
            'places',
            'places_nearby',
            'poi_types',
            'pois',
            'route_schedule',
            'routes',
            'stop_areas',
            'stop_points',
            'stop_schedules',
            'vehicles_journeys',
            ],
        },
        features: {
            all: ['addresses',
            'commercial_modes',
            'companies',
            'departures',
            'disruptions',
            'lines',
            'networks',
            'physical_modes',
            'places_nearby',
            'poi_types',
            'pois',
            'route_schedule',
            'routes',
            'stop_areas',
            'stop_points',
            'stop_schedules',
            'vehicles_journeys',
            'places',
            ]
        },
        paramKey: {
            all : ['addresses',
            'commercial_modes',
            'companies',
            'departures',
            'disruptions',
            'networks',
            'lines',
            'physical_modes',
            'places_nearby',
            'poi_types',
            'pois',
            'route_schedule',
            'routes',
            'stop_areas',
            'stop_points',
            'stop_schedules',
            'vehicles_journeys',
            'places',
            'stop_schedules',
            ],
        }
    },
    addKeyAutocomplete: function(input, key) {
        if (key === 'pathKey' && ! $('#pathFrame').find('.toDelete').length) {
            source = this.autocompleteTree[key].empty;
        } else {
            source = this.autocompleteTree[key].all;
        }

        $(input).autocomplete({source: source,
            minLength: 0,
            scroll: true,
            delay: 500}).focus(function() {
                $(this).autocomplete('search', '');
        });

    },
    staticAutocompleteTypes : ['coverage',
        'physical_modes',
        'poi_types'
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
                    summary(staticType, data);
                    staticType = (staticType==='coverage') ? 'regions' :  staticType;
                    data[staticType].forEach(function(elt){
                        res.push({ value: elt.id, label: elt.name });
                    });
                    $(input).autocomplete({source: res,
                        minLength: 0,
                        scroll: true,
                        delay: 500}).focus(function() {
                            $(this).autocomplete('search', '');
                    });
                }
        });
    },
    dynamicAutocompleteTypes : [
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
    ],
    dynamicAutocomplete: function (elt, dynamicType) {
        var formatPtReq = function (v){
            return sprintf('pt_objects/?type[]=%s&q=', v);
        };
        var formatPlacesReq = function (v){
            return sprintf('places/?type[]=%s&q=', v);
        };
        var dynamicTypeRequest = {
            addresses:formatPlacesReq('address'),
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
                        var search = null;
                        if ('places' in data) {
                            search = data.places;
                        }else if ('pt_objects' in data) {
                            search = data.pt_objects;
                        }
                        if (search) {
                            search.forEach(function(s) {
                                res.push({ value: s.id, label: s.name });
                            });
                        }
                        response(res);
                    },
                    error: function() {
                        response([]);
                    }
                });
            }
        });
    }
}

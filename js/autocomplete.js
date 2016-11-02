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

var autocomplete = {};

autocomplete._paramValueEverywhere = [
    'depth', 'count', 'forbidden_uris[]', 'filter', 'bss_stands'
];

autocomplete._collections = [
    'addresses', 'commercial_modes', 'companies', 'contributors', 'coord', 'coverage',
    'datasets', 'disruptions', 'lines', 'networks', 'places', 'poi_types', 'pois',
    'physical_modes', 'routes', 'stop_areas', 'stop_points', 'vehicle_journeys'
];

autocomplete._additionalFeatures = [
    'departures', 'journeys', 'places_nearby', 'pt_objects', 'route_schedules',
    'stop_schedules', 'arrivals', 'isochrones', 'heat_maps'
];

autocomplete._paramJourneyCommon = [
    'from', 'to', 'datetime','traveler_type', 'data_freshness',
    'first_section_mode[]', 'last_section_mode[]'
].concat(autocomplete._paramValueEverywhere);

autocomplete._depArrParams = [
    'from_datetime', 'duration', 'data_freshness'
].concat(autocomplete._paramValueEverywhere);

autocomplete._schedulesParams = [
    'from_datetime', 'duration', 'items_per_schedule', 'data_freshness'
].concat(autocomplete._paramValueEverywhere);

autocomplete._placesParams = [
    'q', 'type[]', 'admin_uri[]'
].concat(autocomplete._paramValueEverywhere);

autocomplete._fallbackMode = ['walking', 'car', 'bike', 'bss'];

autocomplete._booleanValues = ['true', 'false'];

autocomplete.autocompleteTree = {
    pathKey: {
        empty : ['coverage', 'places', 'coord'],
        all : autocomplete._collections,
    },
    features: {
        all: autocomplete._collections.concat(autocomplete._additionalFeatures),
    },
    paramKey: {
        arrivals: autocomplete._depArrParams,
        coord: autocomplete._paramValueEverywhere,
        coverage: autocomplete._paramValueEverywhere,
        departures: autocomplete._depArrParams,
        journeys: ['datetime_represents'].concat(autocomplete._paramJourneyCommon),
        isochrones: ['max_duration', 'min_duration', 'boundary_duration[]'].concat(autocomplete._paramJourneyCommon),
        heat_maps: ['max_duration', 'resolution'].concat(autocomplete._paramJourneyCommon),
        lines: autocomplete._paramValueEverywhere,
        places_nearby: autocomplete._placesParams,
        places: autocomplete._placesParams,
        pois: ['distance'].concat(autocomplete._paramValueEverywhere),
        pt_objects: ['q', 'type[]'].concat(autocomplete._paramValueEverywhere),
        stop_areas: autocomplete._paramValueEverywhere,
        stop_points: autocomplete._paramValueEverywhere,
        routes: autocomplete._paramValueEverywhere,
        route_schedules: autocomplete._schedulesParams,
        stop_schedules: autocomplete._schedulesParams,
        empty: autocomplete._paramValueEverywhere,
    },
    paramValue : {
        traveler_type : ['luggage', 'standard', 'fast_walker', 'slow_walker'],
        datetime_represents : ['arrival', 'departure'],
        data_freshness: ['base_schedule', 'adapted_schedule', 'realtime'],
        debug: autocomplete._booleanValues,
        wheelchair: autocomplete._booleanValues,
        disable_geojson: autocomplete._booleanValues,
        bss_stands: autocomplete._booleanValues,
        'first_section_mode[]': autocomplete._fallbackMode,
        'last_section_mode[]': autocomplete._fallbackMode,
    }
};

autocomplete.apiAutocomplete = function() {
    var input = $("#api input.api");
    var apis = storage.getApis();
    autocomplete._customAutocompleteHelper(input, apis, {
        close: setSaveTokenButtonStatus,
        select: function (event, ui) {
            $(input).val(ui.item.value);
            $("#token input.token").val(storage.getToken(ui.item.value));
        }
    });
};

autocomplete.valueAutoComplete = function (input, key) {
    if (isDatetimeType(key)) {
        autocomplete._makeDatetime(input);
    } else if (key in this.autocompleteTree.paramValue){
        autocomplete._customAutocompleteHelper(input, this.autocompleteTree.paramValue[key]);
    } else if (this.staticAutocompleteTypes.indexOf(key) > -1) {
        this.staticAutocomplete(input, key);
    } else if (this.dynamicAutocompleteTypes.indexOf(key) > -1) {
        this.dynamicAutocomplete(input, key);
    }
};

autocomplete.addKeyAutocomplete = function(input, type) {
    var source;
    if (type === 'pathKey' && ! $('#pathFrame').find('.value').length) {
        source = this.autocompleteTree[type].empty;
    } else if (type === 'paramKey'){
        var feature = $('#featureInput').val();
        source = this.autocompleteTree[type][feature] || this.autocompleteTree[type].empty;
    } else {
        source = this.autocompleteTree[type].all;
    }
    source = source || [];
    autocomplete._customAutocompleteHelper(input, source, {
        select: function(event, ui) { $(input).val(ui.item.value).change(); }
    });
};

autocomplete.staticAutocompleteTypes = [
    'coverage',
    'physical_modes',
    'poi_types',
];

autocomplete.staticAutocomplete = function(input, staticType) {
    var old_request = '';
    var old_token = '';
    var handle = function() {
        var api = $('#api input.api').val();
        var token = $('#token input.token').val();
        var cov = getCoverage();
        var request = api +  '/coverage/';
        if (staticType !== 'coverage') {
            request +=  cov + '/' + staticType;
        }
        request += '?disable_geojson=true'
        if (request !== old_request || token !== old_token) {
            old_request = request;
            old_token = token;
            autocomplete.updateStaticAutocomplete(input, staticType, request, token);
        } else if ($(input).is(':focus') && $(input).autocomplete('instance')) {
            $(input).autocomplete('search', '');
        }
    };
    handle();
    $(input).focus(handle);
};

autocomplete.updateStaticAutocomplete = function(input, staticType, request, token) {
    if ($(input).autocomplete('instance')) {
        // be shure that out-of-date autocompletion will not be active
        $(input).autocomplete('destroy');
    }
    $.ajax({
        headers: manageToken(token),
        dataType: 'json',
        url: request,
        success: function(data) {
            var res = [];
            staticType = (staticType==='coverage') ? 'regions' :  staticType;
            data[staticType].forEach(function(elt) {
                var s = summary.run(new response.Context(data), getType(staticType), elt);
                res.push({ value: elt.id, label: s.textContent, desc: s });
            });
            res = res.sort(function(a, b) {
                if (a.label < b.label) { return -1; }
                if (a.label > b.label) { return 1; }
                return 0;
            });
            $(input).autocomplete({
                close: function() { updateUrl($(input)[0]); },
                source: res,
                minLength: 0,
                scroll: true,
                delay: 500
            }).focus(function() {
                this.select();
            }).autocomplete('instance')._renderItem = function(ul, item) {
                return $('<li>').append(item.desc).appendTo(ul);
            };
            $(input).autocomplete('enable');
            if ($(input).is(':focus') && $(input).autocomplete('instance')) {
                $(input).autocomplete('search', '');
            }
        },
        error: function(data, status, xhr) {
            notifyOnError(data, 'Autocomplete');
        }
    });
};

autocomplete.dynamicAutocompleteTypes = [
    'addresses',
    'administrative_regions',
    'commercial_modes',
    'coord',
    'forbidden_uris[]',
    'lines',
    'networks',
    'places',
    'pois',
    'routes',
    'stop_areas',
    'stop_points',
    'from',
    'to',
];

autocomplete.dynamicAutocomplete = function (elt, dynamicType) {
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
        'forbidden_uris[]': 'pt_objects/?q=',
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
        close: function() { updateUrl($(elt)[0]); },
        source: function (request, res) {
            var token = $('#token input.token').val();
            var url = $('#api input.api').val();
            var cov = getCoverage();
            // cov can be null in case where coverage is not specified
            cov = cov ? ('coverage/' + cov) : '';
            $.ajax({
                url: sprintf('%s/%s/%s%s&display_geojson=false', url, cov, httpReq, encodeURIComponent(request.term)),
                headers: manageToken(token),
                success: function (data) {
                    var result = [];
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
                            var sum = summary.run(new response.Context(data), type, s);
                            result.push({ value: s.id, label: sum });
                        });
                    }
                    res(result);
                },
                error: function(data, status, xhr) {
                    res([]);
                    notifyOnError(data, 'Autocomplete');
                }
            });
        }
    }).focus(function() {
        this.select();
    }).autocomplete('instance')._renderItem = function(ul, item) {
        return $('<li>').append(item.label).appendTo(ul);
    };
};

autocomplete._customAutocompleteHelper = function(input, source, customOptions) {
    if (source.length && source[0] instanceof Object) {
        source = source.sort(function(a, b) {
            if (a.value < b.value) { return -1; }
            if (a.value > b.value) { return 1; }
            return 0;
        });
    } else {
        source = source.sort();
    }
    var options = {
        close: function() { updateUrl($(input)[0]); },
        source: source,
        minLength: 0,
        scroll: true,
        delay: 500
    };
    if (customOptions) { $.extend(true, options, customOptions); }
    $(input).autocomplete(options).focus(function() {
        this.select();
        $(this).autocomplete('search', '');
    });
};

autocomplete._makeDatetime = function(elt) {
    $(elt).datetimepicker({
        dateFormat: 'yymmdd',
        timeFormat: 'HHmmss',
        timeInput: true,
        separator: 'T',
        controlType: 'select',
        oneLine: true,
    });
};

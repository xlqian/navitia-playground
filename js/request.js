$(document).ready(function() {
    var request = $.url("?request");
    var token = $.url("?token");

    if (isUndefined(token)) { token = ''; }
    $("#token").html('token: <input type="text" class="token" value="' + token + '">');

    var params = $.url("?", request);
    if (! isUndefined(params)) {
        var param_elt = $("#parameters");
        for (var key in params) {
            param_elt.append('<input type="text" class="key" value="' + key + '">=');
            param_elt.append('<input class="value" value="' + params[key] + '">, ');
        }
    }
});

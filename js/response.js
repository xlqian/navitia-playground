function setStatus(xhr) {
    $("#status").html(xhr.statusText + " (" + xhr.status + ")");
}

$(document).ready(function() {
    var request = $.url("?request");
    var token = $.url("?token");
    if (isUndefined(request)) {
        $("#data").html("No request");
        return;
    }
    $.ajax({
        headers: isUndefined(token) ? {} : { Authorization: "Basic " + btoa(token + ":" ) },
        url: request,
        dataType: "json",
    }).then(
        function(data, status, xhr) {
            setStatus(xhr);
            $("#data").html(renderjson(data));
        },
        function(xhr, status, error) {
            setStatus(xhr);
            $("#data").html(renderjson(xhr.responseJSON));
        }
    );
});

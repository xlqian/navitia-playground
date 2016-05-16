function setStatus(xhr) {
    $("#status").html(xhr.statusText + " (" + xhr.status + ")");
}

$(document).ready(function() {
  var search = new URI(window.location).search(true);

  var request = search["request"];
  var token = search["token"];
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

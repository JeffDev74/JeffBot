require([ '/socket.io/socket.io.js', 'jquery' ], function(io) {
  $(document).ready(function() {
    var audioElement = document.createElement('audio');
    audioElement.setAttribute('src', '/sounds/AirPlaneDing.mp3');
      
    var socket = io.connect('http://192.168.1.3:8081');

    socket.on('shoutout_caster', function(data) {
      console.log("here");
      
      $('#textHeader').html('CASTER SHOUTOUT:');
      $('#textDesc').html(data.message);
      var defaultLogo = 'https://static-cdn.jtvnw.net/jtv_user_pictures/xarth/404_user_70x70.png';
      var logo = data.logo ? data.logo : defaultLogo;
      $('#userLogo').attr("src", logo);
      
      audioElement.play();
      $( "#reminderContainer").addClass('animateContainer');
          setTimeout(function(){
          // do something after 1000ms (or same as animation duration)
          $( "#reminderContainer").removeClass('animateContainer');
      },21000);

    });
  });
});
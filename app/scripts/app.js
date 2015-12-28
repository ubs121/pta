/*
Copyright (c) 2015 ubs121.
*/

(function(document) {
  'use strict';

  // Grab a reference to our auto-binding template
  // and give it some initial binding values
  // Learn more about auto-binding templates at http://goo.gl/Dx1u2g
  var app = document.querySelector('#app');

  // Sets app default base URL
  app.baseUrl = '/';
  if (window.location.port === '') {  // if production
    // Uncomment app.baseURL below and
    // set app.baseURL to '/your-pathname/' if running from folder in production
    // app.baseUrl = '/polymer-starter-kit/';
  }

  app.displayInstalledToast = function() {
    // Check to make sure caching is actually enabled—it won't be in the dev environment.
    if (!Polymer.dom(document).querySelector('platinum-sw-cache').disabled) {
      Polymer.dom(document).querySelector('#caching-complete').show();
    }
  };

  // Listen for template bound event to know when bindings
  // have resolved and content has been stamped to the page
  app.addEventListener('dom-change', function() {
    console.log('Our app is ready to rock!');
  });

  // See https://github.com/Polymer/polymer/issues/1381
  window.addEventListener('WebComponentsReady', function() {
    // imports are loaded and elements have been registered
  });

  
  window.ds = new DataService();
  ds.connect().then(function(){
    console.log("connected !");
    
    ds.getStopNames().then(function(rs) {
      app.stops = rs;
    });

    // available services for today
    ds.availableServices().then(function(ss) {
      app.services = ss.map(function(s) { return s.service_id; });
      console.log("availableServices", app.services);
    });
  });
  

  app.filter = function(e) {
    if (app.$.from.value == "") {
      app.$.toast.text = "Please enter departure!";
      app.$.toast.show();
      return;
    }

    if (app.$.from.value == app.$.to.value) {
      app.$.toast.text = "Please enter different stations!";
      app.$.toast.show();
      return;
    }

    app.$.noData.style.display = 'block';

    ds.find(app.services, app.$.from.value, app.$.to.value).then(function(rs) {
        var arr = new Array();
        var fromStop, toStop;

        //console.log(rs.map(function(r) { return r.stop_times; } ));

        // match from and to stops
        for (var i=0; i<rs.length; i++) {
          if (rs[i].stops.stop_name == app.$.from.value) {
            fromStop = rs[i].stop_times;
            continue;
          }

          toStop = rs[i].stop_times;

          if (fromStop && fromStop.trip_id == toStop.trip_id
            && fromStop.departure_time < toStop.arrival_time) {
            
            arr.push({
              'trip_id': toStop.trip_id,
              'departure_time': fromStop.departure_time,
              'arrival_time': toStop.arrival_time,
              'duration': calcDuration(fromStop.departure_time, toStop.arrival_time)
            });

            fromStop = null;
            toStop = null;
          }
        }

        app.stop_times = arr;
        
        if (arr.length > 0) {
          app.$.noData.style.display = 'none';
        }
    });
  };

  app.noDataFound = function() {
    return (app.stop_times && app.stop_times.length == 0);
  };



})(document);

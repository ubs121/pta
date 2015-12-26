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
    console.log("Inited !");
    
    ds.getStopNames().then(function(rs) {
      app.stops = rs;
    });
  });


  app.find = function(e) {
    console.log("find");
    //app.trips = ds.find(app.$.from.value, app.$.to.value);
    app.trips = [{'departure': 'sss'}];
    app.noResult = false;
    // TODO: render trips
  };

  app.selected = 0;
  app.noResult = true;
  app.get_service_id = function(calendar, calendar_dates) {
    switch(app.selected) {
      case 'now': {
        var date = now_date();
        var day = (new Date().getDay() + 6) % 7; // getDay starts from Sunday

        // calendar:
        //   service_id => [monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date]
        // calendar_dates:
        //   service_id => [date,exception_type]
        var service_ids = Object.keys(calendar).filter(function(service_id) {
          // check calendar start/end dates
          var item = calendar[service_id];
          return (item[7] <= date) && (date <= item[8]);
        }).filter(function(service_id) {
          // check calendar available days
          return calendar[service_id][day] === 1;
        }).filter(function(service_id) {
          // check calendar_dates with exception_type 2 (if any to remove)
          return calendar_dates[service_id].filter(function(exception_date) {
            return (exception_date[0] === date) && (exception_date[1] === 2);
          }).length === 0;
        }).concat(Object.keys(calendar_dates).filter(function(service_id) {
          // check calendar_dates with exception_type 1 (if any to add)
          return calendar_dates[service_id].filter(function(exception_date) {
            return (exception_date[0] === date) && (exception_date[1] === 1);
          }).length !== 0;
        }));

        if (service_ids.length !== 1) {
          console.log("Can't get service for now.", service_ids);
        }
        return service_ids[0];
      }
      // Hard-coded service_id selection
      case 'weekday': return 'CT-14OCT-Combo-Weekday-01';
      case 'saturday': return 'CT-14OCT-Caltrain-Saturday-02';
      case 'sunday': return 'CT-14OCT-Caltrain-Sunday-02';
      default: return '';
    }
  };

})(document);

/**
 * Copyright 2015 ubs121. Data service for PTA
 */

 (function(){
   "use strict";

  var DataService = function() {
   this.services = new Array();

   this.calendar = new Array();
   this.calendar_dates = new Array();
   this.stops = new Array();
   this.routes = new Array();

   // global object
   window.ds = this;
  };

  DataService.prototype.initialize = function(dataUrl) {
    this.fetchData(dataUrl + "/calendar_dates.txt", function(data) {
      console.log(data);
      // TODO: parse csv and assign into this.calendar_dates
    });
  }

  DataService.prototype.fetchData = function(url, onResponse) {
    var xmlhttp = new XMLHttpRequest();

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            onResponse(xmlhttp.responseText);
        }
    };
    xmlhttp.open("GET", url, true);
    xmlhttp.send();
  }

  // load csv
  DataService.prototype.loadCsv = function(dataArray, csvString) {
    var lines = csvString.split('\n');
    var headerLine = lines[0];
    var fields = headerLine.split(',');

    for (var i = 1; i < lines.length; i++) {
      var line = lines[i];

      // The csvString that comes from the server has an empty line at the end,
      // need to ignore it.
      if (line.length == 0) {
        continue;
      }

      var values = line.split(/[,|;\t]/);

      var obj = {};
      for (var j = 0; j < values.length; j++) {
        obj[fields[j]] = values[j];
      }

      dataArray.push(obj);

    }
  }

  DataService.prototype.find = function(from, to) {
    var from_ids = this.stops[from],
        to_ids = this.stops[to],
        services = get_available_services(routes, calendar, calendar_dates);

    var trips = this.getTrips(services, from_ids, to_ids);

    console.log(trips);
  }



  DataService.prototype.getTrips =  function(services, from_ids, to_ids) {
    var result = [];

    Object.keys(services)
      .forEach(function(service_id) {
        var trips = services[service_id];
        Object.keys(trips)
          .forEach(function(trip_id) {
            var trip = trips[trip_id];
            var trip_stop_ids = trip.map(function(t) { return t[0]; });
            var from_indexes = search_index(trip_stop_ids, from_ids);
            var to_indexes = search_index(trip_stop_ids, to_ids);
            if (!is_defined(from_indexes) || !is_defined(to_indexes) ||
                from_indexes.length === 0 || to_indexes.length === 0) {
              return;
            }
            var from_index = Math.min.apply(this, from_indexes);
            var to_index = Math.max.apply(this, to_indexes);
            // must be in order
            if (from_index >= to_index) {
              return;
            }

            result.push({
              departure_time: trip[from_index][1],
              arrival_time: trip[to_index][1]
            });
          });
      });

    return result.sort(compare_trip);
  }


  DataService.prototype.get_available_services = function(routes, calendar, calendar_dates) {
    var availables = {};
    var service_id = get_service_id(calendar, calendar_dates);
    if (!is_defined(service_id)) { return {}; }

    Object.keys(routes)
      .forEach(function(route_name) {
        var services = routes[route_name];
        var trips = services[service_id];

        if (!is_defined(availables[route_name])) {
          availables[route_name] = {};
        }
        Object.extend(availables[route_name], trips);
      });

    return availables;
  }

  DataService.prototype.is_defined = function(obj) {
    return typeof(obj) !== "undefined";
  }


}());
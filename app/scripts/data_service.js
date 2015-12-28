/**
 * Copyright 2015 ubs121. Data service for PTA
 */

'use strict';

var DataService = function() {
  this.db_ = null;
  this.services = [];
  this.schemaBuilder = this._buildSchema();

  window.ds = this;
};


DataService.prototype.connect = function() {
    if (this.db_ !== null) {
      return Promise.resolve(this.db_);
    }

    // connect to db
    //var opts = {storeType: lf.schema.DataStoreType.INDEXED_DB};
    return this.schemaBuilder.connect().then(function(db){
      this.db_ = db;
      this.routes = db.getSchema().table('routes');
      this.trips = db.getSchema().table('trips');
      this.calendar = db.getSchema().table('calendar');
      this.calendarDates = db.getSchema().table('calendar_dates');
      this.stops = db.getSchema().table('stops');
      this.stopTimes = db.getSchema().table('stop_times');

      console.log('Connected to db !');

      // FIXME: import if online & not local data exists
      var dataNames = ['trips',  'calendar', 'calendar_dates', 'stops', 'stop_times'];
      dataNames.forEach(function(name) {
        var that = this;
        var tbl = db.getSchema().table(name);

        fetch('data/' + name + '.txt')
          .then(function(response) {
            return response.text();
          })
          .then(function(csvText) {
            that.importCsv(tbl, csvText).then(function() {
              console.log(name + " imported!");
            });
          });
      }.bind(this));

      return db;
    }.bind(this));

};

DataService.prototype._buildSchema = function() {
    var schemaBuilder = lf.schema.create('pta', 1);
    console.log('_buildSchema succeeded !');

    schemaBuilder.createTable('routes').
        addColumn('route_id', lf.Type.STRING).
        addColumn('route_short_name', lf.Type.STRING).
        addColumn('route_long_name', lf.Type.STRING).
        addColumn('route_desc', lf.Type.STRING).
        addColumn('route_type', lf.Type.STRING).
        addPrimaryKey(['route_id']);

    schemaBuilder.createTable('trips').
        addColumn('trip_id', lf.Type.STRING).
        addColumn('trip_short_name', lf.Type.STRING).
        addColumn('route_id', lf.Type.STRING).
        addColumn('service_id', lf.Type.STRING).
        addPrimaryKey(['trip_id']);

    schemaBuilder.createTable('calendar').
        addColumn('service_id', lf.Type.STRING).
        addColumn('monday', lf.Type.INTEGER).
        addColumn('tuesday', lf.Type.INTEGER).
        addColumn('wednesday', lf.Type.INTEGER).
        addColumn('thursday', lf.Type.INTEGER).
        addColumn('friday', lf.Type.INTEGER).
        addColumn('saturday', lf.Type.INTEGER).
        addColumn('sunday', lf.Type.INTEGER).
        addColumn('start_date', lf.Type.STRING).
        addColumn('end_date', lf.Type.STRING).
        addPrimaryKey(['service_id']);

    schemaBuilder.createTable('calendar_dates').
        addColumn('service_id', lf.Type.STRING).
        addColumn('date', lf.Type.STRING).
        addColumn('exception_type', lf.Type.INTEGER).
        addPrimaryKey(['service_id']);

    schemaBuilder.createTable('stops').
        addColumn('stop_id', lf.Type.STRING).
        addColumn('stop_code', lf.Type.STRING).
        addColumn('stop_name', lf.Type.STRING).
        addPrimaryKey(['stop_id']);

    schemaBuilder.createTable('stop_times').
        addColumn('trip_id', lf.Type.STRING).
        addColumn('stop_id', lf.Type.STRING).
        addColumn('stop_sequence', lf.Type.INTEGER).
        addColumn('arrival_time', lf.Type.STRING).
        addColumn('departure_time', lf.Type.STRING).
        addPrimaryKey(['stop_id', 'trip_id']);

    return schemaBuilder;
};

// Get stop/station names for autocomplete
DataService.prototype.getStopNames = function() {
  return this.db_
    .select(lf.fn.distinct(this.stops.stop_name).as('name'))
    .from(this.stops)
    .exec();
};

// Find possible stop times for given stations
DataService.prototype.find = function(services, from, to) {
  var st = this.stopTimes;
  var tr = this.trips;
  var s = this.stops;

  var now = formatTime(new Date());

  // DEBUG
  //var now = '19:00:00'; 

  return this.db_
    .select(st.trip_id, st.stop_id, st.departure_time, st.arrival_time, s.stop_name)
    .from(st, tr, s)
    .where(
      lf.op.and(
        // inner joins
        st.trip_id.eq(tr.trip_id),
        st.stop_id.eq(s.stop_id),
        // take from, to stations both
        s.stop_name.in([from, to]),
        // from now on
        st.departure_time.gt(now),
        // available trips
        tr.service_id.eq(services[0])
      )
    
    )
    .orderBy(st.trip_id)
    .orderBy(st.departure_time)
    .limit(20) // FIXME: show only first 20 stop times
    .exec();
};

// Find available services for today
DataService.prototype.availableServices = function() {
  var today = new Date();
  var date = formatDate(today);
  var day = weekday[today.getDay()]

  var cal = this.calendar;
  var cald = this.calendarDates;

  return this.db_
    .select(lf.fn.distinct(cal.service_id).as('service_id'))
    .from(cal, cald)
    .leftOuterJoin(cald, cald.service_id.eq(cal.service_id))
    .where(
      lf.op.or(
        // add calendar_dates with exception_type 1
        lf.op.and (
          cald.date.eq(date), 
          cald.exception_type.eq(1)
        ),

        lf.op.and (
          // check calendar available days
          cal[day].eq(1),
          // check calendar start/end dates
          cal.start_date.lte(date),  
          cal.end_date.gte(date),
          // remove calendar_dates with exception_type 2
          cald.exception_type.neq(2)
        )
      )
    )
    .exec();
};

// parse csv & import
DataService.prototype.importCsv = function(table, csvString) {
  var re = /\r|\n/;
  var lines = csvString.split(re);
  var headerLine = lines[0];
  var fields = headerLine.split(',');

  var rows = new Array();

  for (var i = 1; i < lines.length; i++) {
    var line = lines[i];

    if (line.length == 0) {
      continue;
    }

    var values = line.trim().split(',');
    var obj = {};

    for (var j = 0; j < values.length; j++) {
      obj[ fields[j] ] = unqoute(values[j].trim());
    }

    rows.push(table.createRow(obj));

  }

  return this.db_
    .insertOrReplace()
    .into(table)
    .values(rows).exec();
};




  /**
  *   Helper functions
  *
  **/

function unqoute(str) {
  if (str.startsWith('"')) {
    str = str.slice(1, str.length-1);
  }
  return str;
}

var weekday = new Array(7);
weekday[0]=  'sunday';
weekday[1] = 'monday';
weekday[2] = 'tuesday';
weekday[3] = 'wednesday';
weekday[4] = 'thursday';
weekday[5] = 'friday';
weekday[6] = 'saturday';

function formatDate(d) {
  // getMonth starts from 0
  return parseInt([d.getFullYear(), d.getMonth() + 1, d.getDate()].map(function(n){
    return n.toString().rjust(2, '0');
  }).join(''));
}

function formatTime(d) {
  return d.getHours().toString().rjust(2, '0') + ':' + 
        d.getMinutes().toString().rjust(2, '0') + ':' +
        d.getSeconds().toString().rjust(2, '0');
}

String.prototype.rjust = function(width, padding) {
  padding = (padding || " ").substr(0, 1); // one and only one char
  return padding.repeat(width - this.length) + this;
}

String.prototype.repeat = function(num) {
  return (num <= 0) ? "" : this + this.repeat(num - 1);
}


function calcDuration (t1, t2) {
  var secs1 = str2seconds(t1);
  var secs2 = str2seconds(t2);

  return second2str(secs2 - secs1);
}

function str2seconds(t) {
  var parts = t.split(":");

  return parseInt(parts[0])* 3600 + parseInt(parts[1])*60 + parseInt(parts[2]);
}

function second2str(seconds) {
  if (seconds < 60 ) {
    return seconds + ' secs';
  }
  if (seconds < 3600) {
    return Math.floor(seconds / 60) + ' min' 
  }

  var minutes = Math.floor(seconds / 60);
  return [
    Math.floor(minutes / 60),
    minutes % 60
  ].map(function(item) {
    return item.toString().rjust(2, '0');
  }).join(':');
}
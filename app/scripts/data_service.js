/**
 * Copyright 2015 ubs121. Data service for PTA
 */

 "use strict";

var DataService = function() {
  this.data = {};
  this.db_ = null;

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
      this.calendar_dates = db.getSchema().table('calendar_dates');
      this.stops = db.getSchema().table('stops');
      this.stop_times = db.getSchema().table('stop_times');

      console.log('Connected to db !');

      // import data if not exists
      var data_names = ["trips",  "routes", "calendar", "calendar_dates", "stops"];
      data_names.forEach(function(name) {
        var that = this;
        var tbl = db.getSchema().table(name)

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

}

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
        addPrimaryKey(['trip_id', 'stop_id']);

    return schemaBuilder;
}

// Stop/station names for datalist
DataService.prototype.stopNames = function() {
  return this.db_
    .select(lf.fn.distinct(this.stops.stop_name).as('name'))
    .from(this.stops)
    .exec();
}

DataService.prototype.find = function(from, to) {
  
}


// parse csv & import
DataService.prototype.importCsv = function(table, csvString) {
  var lines = csvString.split('\n');
  var headerLine = lines[0];
  var fields = headerLine.split(',');

  var rows = new Array();

  for (var i = 1; i < lines.length; i++) {
    var line = lines[i];

    if (line.length == 0) {
      continue;
    }

    var values = line.split(/[,|;\t]/);

    var obj = {};
    for (var j = 0; j < values.length; j++) {
      obj[fields[j]] = unqoute(values[j]);
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


function second2str(seconds) {
  var minutes = Math.floor(seconds / 60);
  return [
    Math.floor(minutes / 60),
    minutes % 60
  ].map(function(item) {
    return item.toString().rjust(2, '0');
  }).join(':');
};

function is_defined(obj) {
  return typeof(obj) !== "undefined";
}
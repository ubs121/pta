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
      this.stops = db.getSchema().table('stops');
      this.stop_times = db.getSchema().table('stop_times');

      console.log('Connected to db !');


      // insert data
      load('data/stops.txt').then(function(text) {
        this.importData(this.stops, text).then(function() {
          console.log("importData!");
        });
      }.bind(this));


      return db;
    }.bind(this));

}

DataService.prototype._buildSchema = function() {
    var schemaBuilder = lf.schema.create('pta', 1);
    console.log('_buildSchema succeeded !');

    schemaBuilder.createTable('stops').
        addColumn('stop_id', lf.Type.STRING).
        addColumn('stop_code', lf.Type.STRING).
        addColumn('stop_name', lf.Type.STRING).
        addPrimaryKey(['stop_id']);

    schemaBuilder.createTable('stop_times').
        //addColumn('id', lf.Type.INTEGER).
        addColumn('trip_id', lf.Type.STRING).
        addColumn('arrival_time', lf.Type.STRING).
        addColumn('departure_time', lf.Type.STRING).
        addColumn('stop_id', lf.Type.STRING).
        addColumn('stop_sequence', lf.Type.INTEGER);
        //addIndex('idx_stop_times', ['id'], false, lf.Order.DESC);

    return schemaBuilder;
}

DataService.prototype.stopNames = function() {
  return this.db_
    .select(lf.fn.distinct(this.stops.stop_name).as('name'))
    .from(this.stops)
    .exec();
}

DataService.prototype.find = function(from, to) {
  
}


// parse csv & import
DataService.prototype.importData = function(table, csvString) {
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

function load(dataUrl, name) {
  return fetch(dataUrl)
    .then(function(response) {
      return response.text();
    });
};



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
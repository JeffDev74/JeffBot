if (typeof define !== 'function') {
  var define = require('amdefine')(module);
}

/**
 *  The DataParser provides helper function for reading entities data.
 *
 * @class DataParser
 * @constructor 
 */
define([ 'fs', 'requirejs' ], function( fs, requirejs ) {

  var DataParser = function(app) {
    this.app = app;
    this.parsers = {};
  };

  DataParser.prototype.GetParsersList = function() {
      var methods = [];
      for (var m in this) {
        // console.log(m);
        if (typeof this[m] == "function" && m !== 'GetParsersList' && m !== 'app' && m !== 'ParseData') {
            methods.push(m);
        }
      }
      return methods;
  };

  DataParser.prototype.ParseData = function(functionName, data, callback) {

    var fn = this[functionName];
    if(typeof fn === 'function') {
        return fn(data, callback);
    } else {
      console.log('DataParser parser [' + functionName + '] is not implemented.');
      return callback('Fail');
    }
  };

  // DEFINE CUSTOM PARSERS AFTER THIS 
  DataParser.prototype.ParseRaw = function (data, callback) {
    return callback(data);
  };

  DataParser.prototype.ParseDHTCelcius = function (data, callback) {
    var array = data.split(',');
    var output = '';
    if(array[0] != null && array[0] != '') {
      output += '<span><i class="fa fa-thermometer-half" aria-hidden="true"></i>&nbsp;</span>' + parseFloat(array[0]).toFixed(2) + '&deg;C &nbsp;'; //(Math.round(array[0] * 100) / 100) + '&deg;C ';
    }

    if(array[1] != null && array[1] != '') {
      output += '<span><i class="fa fa-tint" aria-hidden="true"></i>&nbsp;</span>' + parseFloat(array[1]).toFixed(2) + '% &nbsp;'; //(Math.round(array[1] * 100) / 100) + '% ';
    }

    return callback(output);
  };

  DataParser.prototype.ParseDHTFahrenheit  = function (data, callback) {
    //(50°F - 32) x .5556 = 10°C
    //30°C x 1.8 + 32 = 86°F
    var array = data.split(',');
    var output = '';
    if(array[0] != null && array[0] != '') {
      var celciusValue = parseFloat(array[0]);
      var farValue = (celciusValue * 1.8) + 32;
      farValue = Math.round(farValue * 100) / 100;
      farValue = farValue.toFixed(2);
      output += '<span><i class="fa fa-thermometer-half" aria-hidden="true"></i>&nbsp;</span>' + farValue + '&deg;F &nbsp;';
    }

    if(array[1] != null && array[1] != '') {
      output += '<span><i class="fa fa-tint" aria-hidden="true"></i>&nbsp;</span>' + (parseFloat(array[1])).toFixed(2) + '% &nbsp;';
    }

    return callback(output);
  };

  DataParser.prototype.ParseMyESPJson = function (data, callback) {

    data = {"GPIO0": "26.20,35.00"};
    data = "26.20&deg;C 35.00% JSON";
    return callback(data);
  };

  

  var exports = DataParser;

  return exports;

});

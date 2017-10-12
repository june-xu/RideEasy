// Setting up

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var driverSchema = new Schema({
  fbID: Number, 
  fbProfile: String, 
  leavingDateTime: String,
  leavingLocation: String, 
  arrivingLocation: String, 
  price: Number, 
  step: Number
});

var Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver;

// Setting up

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var riderSchema = new Schema({
  fbID: Number, 
  fbProfile: String, 
  foundRide: Boolean,
  step: Number, 
  requestedDateTime: String, 
  requestedFromLocation: String,
  requestedToLocation: String, 
});

var Rider = mongoose.model('Rider', riderSchema);

module.exports = Rider;

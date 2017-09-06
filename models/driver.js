// setting up
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// a collection is a grouping of MongoDB documents, collection is like table except with no aligned columns each 
// row can use varying dymamic schemas, with unique key-value pairs
// each row is called a document (document based objects)


// defining schema types, instance of a model is a document 
var driverSchema = new Schema({
  name: String,
  fbProfile: String, 
  phoneNumber: Number,
  leavingDateTime: String,
  leavingLocation: String, 
  arrivingLocation: String, 
  price: Number, 
  step: Number
});

var Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver;

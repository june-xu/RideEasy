// setting up
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// a collection is a grouping of MongoDB documents, collection is like table except with no aligned columns each 
// row can use varying dymamic schemas, with unique key-value pairs
// each row is called a document (document based objects)


// defining schema types, instance of a model is a document 
// only taking rides for one person atm 

var riderSchema = new Schema({
  fbID: Number, 
  fbProfile: String, 
  foundRide: Boolean,
  step: Number, 
  requestedDateTime: String, 
  requestedFromLocation: String,
  requestedToLocation: String, 
  createdAt: Date
});

var Rider = mongoose.model('Rider', riderSchema);

module.exports = Rider;

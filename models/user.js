// setting up
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


// a collection is a grouping of MongoDB documents, collection is like table except with no aligned columns each 
// row can use varying dymamic schemas, with unique key-value pairs
// each row is called a document (document based objects)


// defining schema types, instance of a model is a document 
var userSchema = new Schema({
  fbID: Number, 
  rdID: String, 
  type: String, 
  createdAt: Date
});

var User = mongoose.model('User', userSchema);

module.exports = User;

// Setting up

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  fbID: Number, 
  rdID: String, 
  type: String, 
  createdAt: Date
});

var User = mongoose.model('User', userSchema);

module.exports = User;

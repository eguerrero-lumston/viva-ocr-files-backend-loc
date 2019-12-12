var connection = require('icomm-mongo').connection;
var mongoose = require('icomm-mongo').mongoose;
var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

var Users  = new Schema({
    name: { type : String, default:''},
    oid: { type : String, default:''},
    email: { type : String, default:''}
});

module.exports = connection.model('users',Users, 'users')
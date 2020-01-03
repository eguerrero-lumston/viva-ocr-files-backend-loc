var connection = require('icomm-mongo').connection;
var mongoose = require('icomm-mongo').mongoose;
var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;
var mongoosePaginate = require('mongoose-paginate');

var Users  = new Schema({
    name: { type : String, default:''},
    oid: { type : String, default:''},
    email: { type : String, default:'', index: { unique: true }},
    created: { type : Date, default: Date.now() },
    deleted: { type : Date, default: null }
});
Users.plugin(mongoosePaginate);

module.exports = connection.model('users',Users, 'users')
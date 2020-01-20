var connection = require('icomm-mongo').connection;
var mongoose = require('icomm-mongo').mongoose;

var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

/**
    type
    position
*/

var Position = new Schema({
    name: { type: String, default: ''},
    created: { type: Date, default: new Date },
    deleted: { type: Date, default: null }
});
Position.pre('save', function (next) {
    if (!this.created) this.created = new Date;
    next();
});
Position.plugin(mongoosePaginate);

module.exports = connection.model('positions', Position, 'positions');
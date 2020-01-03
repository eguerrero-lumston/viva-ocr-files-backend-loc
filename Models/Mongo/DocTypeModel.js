var connection = require('icomm-mongo').connection;
var mongoose = require('icomm-mongo').mongoose;

var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

/**
    type
    position
*/

var DocType = new Schema({
    name: { type: String, default: '' },
    position: { type: Number, default: '' },
    positionName: { type: String, default: '' },
    textToRecognize: { type: String, default: '' },
    created: { type: Date, default: new Date },
    deleted: { type: Date, default: null }
});
DocType.pre('save', function (next) {
    if (!this.created) this.created = new Date;
    next();
});
DocType.plugin(mongoosePaginate);

module.exports = connection.model('docTypes', DocType, 'docTypes');
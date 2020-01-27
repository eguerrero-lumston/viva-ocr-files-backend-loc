var connection = require('icomm-mongo').connection;
var mongoose = require('icomm-mongo').mongoose;

var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

/**
    Fecha
    Siglas de aeropuerto
    Matrícula

    No de vuelo
    Origen
    Destino
*/

var Doc = new Schema({
    name: { type: String, default: '' },
    fatherLastname: { type: String, default: '' },
    motherLastname: { type: String, default: '' },
    courseName: { type: String, default: null },
    year: { type: Number, default: null },
    jobId: { type: String, default: '' },
    originalJobId: { type: String, default: '' },
    key: { type: String, default: '' },
    jobStatus: { type: String, default: 'NOT_PROCESSING' }, //IN_PROGRESS | SUCCEEDED | FAILED | PARTIAL_SUCCESS
    checkStatus: { type: Number, default: 0 }, // 0. none, 1. yellow, 2. blue, 3. green
    pages: { type: Number },
    page: { type: Number },
    uploaded_at: { type: Date, default: Date.now() },
    course: { type: Schema.Types.ObjectId, ref: "docTypes" },
    position: { type: Schema.Types.ObjectId, ref: "positions" },
    format: { type: String, default: "azteca" }
});

Doc.pre('save', function (next) {
    this.uploaded_at = new Date;
    next();
});
Doc.plugin(mongoosePaginate);

module.exports = connection.model('docs', Doc, 'docs')
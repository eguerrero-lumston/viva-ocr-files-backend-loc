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

var Doc  = new Schema({
    name: { type : String, default:''},
    jobId: { type : String, default:''},
    originalJobId:{ type : String, default:''},
    manifestType: {type:Number,default:null}, // 1. Llegada, 2. Salida
    key:{ type : String, default:''},
    jobStatus: { type : String, default:'NOT_PROCESSING'}, //IN_PROGRESS | SUCCEEDED | FAILED | PARTIAL_SUCCESS
    checkStatus: { type : Number, default:0}, // 0. none, 1. yellow, 2. blue, 3. green
    pages:{type:Number},
    page:{type:Number},
    uploaded_at: {type:Date, default:Date.now()},
    folio: { type : String, default:''},
    date: {
        day: String,
        month: String,
        year: String
    },
    formatted_date: String,
    date_query:String,
    airport: {name:{type:String,default:""}, acronym:{type:String,default:""}},
    company: {name:{type:String,default:""}, acronym:{type:String,default:""}},
    equipment: String,
    registration: String,
    acronyms: [String],
    licences: [String],
    flightNumber: Number,
    commander: {name:{type:String,default:""},licence:{type:String,default:""}},
    officerOne: {name:{type:String,default:""},licence:{type:String,default:""}},
    officerTwo: {name:{type:String,default:""},licence:{type:String,default:""}},
    officerThree: {name:{type:String,default:""},licence:{type:String,default:""}},
    senior: {name:{type:String,default:""},licence:{type:String,default:""}},
    surchargeOne: {name:{type:String,default:""},licence:{type:String,default:""}},
    surchargeTwo: {name:{type:String,default:""},licence:{type:String,default:""}},
    surchargeThree: {name:{type:String,default:""},licence:{type:String,default:""}},
    surcharges: [],
    origin: {name:{type:String,default:""},acronym:{type:String,default:""}},
    destination: {name:{type:String,default:""},acronym:{type:String,default:""}},
    nextScale: {name:{type:String,default:""},acronym:{type:String,default:""}},
    intineraryHour: String,
    realHour: String,
    delayReason: String,
    matches:{
        registrations:[String],
        destinations:[String],
        origins:[String],
        dates:[String],
        acronyms:[String],
        flightNumbers:[Number],
        names:[String],
        passengers:{
            children:[{type:Number,default:0}],
            total:[{type:Number,default:0}]
        }
    }
});
Doc.plugin(mongoosePaginate);

module.exports = connection.model('docs',Doc, 'docs')
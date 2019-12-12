var connection = require('icomm-mongo').connection;
var mongoose = require('icomm-mongo').mongoose;
var mongoosePaginate = require('mongoose-paginate');
var Schema = mongoose.Schema, ObjectId = Schema.ObjectId;

var Flight  = new Schema({
    id: { type : Number},
    flightNumber: { type : Number},
    matriculation: { type : String},
    from: { type : String, default:''},
    to: { type : String, default:''},
    std:{ type :Date, default:null},
    date:{ type :Date},
    date_query:String,
    fromICAO: { type : String, default:''},
    toICAO: { type : String, default:''},
    stdUTC: { type :Date, default:null},
    staUTC: { type :Date, default:null},
    etdUTC: { type :Date, default:null},
    etaUTC: { type :Date, default:null},
    atdUTC: { type :Date, default:null},
    ataUTC: { type :Date, default:null},
    capacity: { type : Number, default:null},
    status: { type : String, default:null},
    arrivalManifest:{ type : Boolean, default:false}, 
    departureManifest:{ type : Boolean, default:false},
    manifests:{type:Number, default: 0}
});
Flight.plugin(mongoosePaginate);
module.exports = connection.model('flights',Flight, 'flights')
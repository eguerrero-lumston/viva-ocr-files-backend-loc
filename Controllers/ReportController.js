var mongoose = require('icomm-mongo').mongoose;
//var socketio = require('../sockets/server').io
var Flight = model("FlightModel","Mongo");
var Document = model("DocModel","Mongo");

var Schema = mongoose.Schema, ObjectId = mongoose.Types.ObjectId;

module.exports = class ReportController{
  
    constructor(){
      
    }
    
    async create(req,res,next) {
        
    }
    
    /**
     * get the report, given 2 dates of range
     * 
     */
    async all(req,res){
        const {start,end,type} = req.query;
        
        if(!start || !end || !type){
            return res.status(400).json({message:"bad request"})
        }
        
        var arrivalOrDeparture;
        var fid;
        if(type == "origin"){
            fid = "$from";
            arrivalOrDeparture = "departureManifest"
        }else{
            fid = "$to";
            arrivalOrDeparture = "arrivalManifest"
        }
        
        var match2 = {"date_query": { $gte: start, $lte: end }}

        var total_manifests = await Flight.aggregate([
            {
                $match: match2
            },
            {
                $group:{
                    _id:fid,
                    count:{$sum:1}
                }
            }
        ]);

        match2[arrivalOrDeparture] = true;
        
        var fligths = await Flight.aggregate([
            {
                $match: match2
            },
            {
                $group:{
                    _id:fid,
                    count:{$sum:1}
                }
            }
        ])
        var report = []
        var general = {
            noGenerated:{
                manifest:0,
                percent:0
            },
            generated:{
                manifest:0,
                percent:0
            },
            total:{
                manifest:0,
                percent:100
            }
        }
        
        total_manifests.forEach(fligth => {
            var found = false;
            general.total.manifest += fligth.count;
            fligths.forEach(stored => {
                if(fligth._id == stored._id){
                    found = true;
                    general.generated.manifest += stored.count;
                    report.push({
                        airport:fligth._id,
                        noGenerated:(fligth.count - stored.count),
                        generated:stored.count,
                        total:fligth.count,
                        percent:(stored.count * 100 / fligth.count)
                    })
                }
            });

            if(!found){
                
                report.push({
                    airport:fligth._id,
                    noGenerated:fligth.count,
                    generated:0,
                    total:fligth.count,
                    percent:0
                })
            }
        });
        
        general.noGenerated.manifest = general.total.manifest - general.generated.manifest;
        general.generated.percent = general.generated.manifest * 100 / general.total.manifest;
        general.noGenerated.percent = general.noGenerated.manifest * 100 / general.total.manifest;

        return res.status(200).json({
            "general":general,
            "flights":report
        });

    }


    async notGenerated(req,res){

        const {start,end,type} = req.query;

        if(!start || !end || !type){
            return res.status(400).json({message:"bad request"})
        }
        var match2 = {"date_query": { $gte: start, $lte: end }}
        var arrivalOrDeparture;
        if(type == "origin"){
            arrivalOrDeparture = "departureManifest"
        }else{
            arrivalOrDeparture = "arrivalManifest"
        }
        match2[arrivalOrDeparture] = false;
        var flights = await Flight.find(match2).select(["flightNumber","from","to",arrivalOrDeparture])
        return res.status(200).json(flights)
    }
    
}
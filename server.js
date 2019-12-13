global.model = function(name,db){ return require('./Models/'+db+'/'+name) }
var app = require('ic-server')
var cron = require("node-cron")
var SyncSql = require('./util/syncSqlSchedule')
var Document = model('DocModel','Mongo')
var DocCont = require("./Controllers/DocumentController")
//var control = new DocCont();
var sync = new SyncSql();

/**
 * Schedule for analyze documents not analyzed yet
 */
cron.schedule("*/20 * * * * *",async () => {
    var pend = await Document.find({checkStatus:0,jobStatus:"NOT_PROCESSING"}).limit(1);
    pend.forEach(element => {
        console.log("Analyze ",element.jobId)
        var control = new DocCont();
        control.analyzeDoc(element.jobId);
    });
});

/**
 * Schedule for update flights in database from mssql AIMS
 */
// cron.schedule("*/1 * * * *",async () => {
//     console.log("Updating flights database")
//     sync.getFlightsSQLServer()
// });
//sync.getFlightsSQLServer()
app.runServer();
//Descomentar para iniciar el servicio de sockets
//app.runSocketServer();
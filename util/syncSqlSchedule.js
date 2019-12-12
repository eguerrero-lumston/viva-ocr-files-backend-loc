
var mssql = require("mssql");
var Flight = model("FlightModel","Mongo");
//module.exports = 
/**
 *  ID: 66406,
    ORIGEN: 'GDL ',
    DESTINO: 'REX ',
    MATRICULA: 'XA-VIM      ',
    VUELO: 3012,
    STD: 2019-11-11T11:20:00.000Z,
    From_ICAO: 'MMGL',
    To_ICAO: 'MMRX',
    STD_UTC: 2019-11-11T17:20:00.000Z,
    STA_UTC: 2019-11-11T18:55:00.000Z,
    ETD_UTC: 2019-11-11T17:22:00.000Z,
    ETA_UTC: 2019-11-11T19:13:00.000Z,
    ATD_UTC: 2019-11-11T17:29:00.000Z,
    ATA_UTC: 2019-11-11T19:03:00.000Z,
    cap: 186,
    XQPiezas: 112,
    XQPeso: 1753,
    ESTADO: 'Aterrizado' }
 */
module.exports = class SyncSQLSchedule{

    constructor(){
        // this.MSSQL_USER = "usrLumston1" 
        // this.MSSQL_PASS = "Nana.2019+"
        // this.MSSQL_HOST = "192.168.1.30\\AIMSREPL"
        // this.MSSQL_DB = "vbAerolum"
        
        this.MSSQL_USER = process.env.MSSQL_USER;
        this.MSSQL_PASS = process.env.MSSQL_PASS;
        this.MSSQL_HOST = process.env.MSSQL_HOST
        this.MSSQL_DB = process.env.MSSQL_DB;
        
    }

    async getFlightsSQLServer(){
        let myPool;
        const config = {
            user: this.MSSQL_USER,
            password: this.MSSQL_PASS,
            server: this.MSSQL_HOST, 
            database: this.MSSQL_DB,
        };
        
        let mssqlResult, mongoResult = [];
        let nowDate, utcDate;
        nowDate = new Date();
        let xdate = new Date().toISOString().
        replace(/T/, ' ').      // replace T with a space
        replace(/\..+/, '')
        xdate = xdate.split(" ")[0]
        //xdate = "2019-10-22"
        let ex = await Flight.find({date_query:xdate}).distinct("id")
        var ex_str = ex.join(",")
        
        utcDate = new Date(nowDate.getTime() + (nowDate.getTimezoneOffset() * 60000));
        
        //console.log(ex_str)
        new mssql.ConnectionPool(config).connect().then(async pool => {
            myPool = pool;
            /**
             * pool.query(`SELECT id, origen [from], destino [to], matricula matriculation, vuelo flightNumber, std, 
                from_icao fromICAO, to_icao toICAO, STD_UTC, STA_UTC, ETD_UTC, ETA_UTC, ATD_UTC, ATA_UTC, cap, estado [status]
                FROM dbo.vw_Operacion WHERE (convert(date, std)) >= convert(date,'${xdate}') AND id NOT IN (${ex_str})`);

            */
            var query = `SELECT id, origen [from], destino [to], matricula matriculation, vuelo flightNumber, std, 
                from_icao fromICAO, to_icao toICAO, STD_UTC, STA_UTC, ETD_UTC, ETA_UTC, ATD_UTC, ATA_UTC, cap, estado [status]
                FROM dbo.vw_Operacion WHERE (convert(date, std)) = convert(date,'${xdate}')`;
            if(ex_str){
                query += `AND id NOT IN (${ex_str})`
            }
            return pool.query(query);
            
        }).then(result => {
            mssqlResult = result.recordset.map(record => {
                return {
                    id: record.id,
                    flightNumber: record.flightNumber,
                    matriculation: (record.matriculation) ? record.matriculation.trim() : "",
                    from: (record.from) ? record.from.trim() : "",
                    to: (record.to) ? record.to.trim() : "",
                    date:xdate,
                    date_query:xdate,
                    std:record.std,
                    fromICAO: (record.fromICAO) ? record.fromICAO.trim() : "",
                    toICAO: (record.toICAO) ? record.toICAO.trim() : "",
                    stdUTC: record.STD_UTC,
                    staUTC: record.STA_UTC,
                    etdUTC: record.ETD_UTC,
                    etaUTC: record.ETA_UTC,
                    atdUTC: record.ATD_UTC,
                    ataUTC: record.ATA_UTC,
                    capacity: record.cap,
                    status: record.status,
                    arrivalManifest:false, 
                    departureManifest:false,
                    manifests:0
                };
            });
            if(mssqlResult.length > 0)
                Flight.collection.insertMany(mssqlResult).then(res=>res).catch(err=>console.log(err)); // insert all records from mssql to mongo collection
            console.log("Flights database updated");
            myPool.close();
        })
        .catch(err=>{
            //console.log(err)
            console.log({
                message:"Flights database can't be updated",
                error:err.code
            })
        })

    }
}
/*
var sync = new SyncSQLSchedule();
sync.getFlightsSQLServer();
*/
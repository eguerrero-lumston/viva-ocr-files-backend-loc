
var _data = Symbol()
var regex = new ( require("./regex"))


/**
 *                  Manifest parser class
 * this class was made for parse all data retrieved from 
 * amazon textract, parsed in a json, and depending of the 
 * fields in json, determine by key name, fill the neccessary 
 * data for manifest
 * 
 */
module.exports = class ManifestParser{
    
    constructor(data, matches = {}){
        this[_data] = data
        this.folio = ""
        this.date = {}
        this.formatted_date = ""
        this.date_query = "";
        this.airport = {name:"",acronym:""}
        this.company = {name:"",acronym:""} //required
        this.equipment = ""
        this.registration = "" // matricula
        this.acronyms = [] // siglas
        this.licences = [] // required for officer one
        this.flightNumber = ""
        this.commander = {name:"",licence:""} 
        this.officerOne = {name:"",licence:""}  //required
        this.officerTwo = {name:"",licence:""} 
        this.officerThree = {name:"",licence:""} 
        this.senior = {name:"",licence:""}  // Mayor
        this.surchargeOne = {name:"",licence:""}
        this.surchargeTwo = {name:"",licence:""}
        this.surchargeThree = {name:"",licence:""}
        this.surcharges = []
        this.origin = {name:"",acronym:""}
        this.destination = {name:"",acronym:""}
        this.nextScale = {name:"",acronym:""}
        this.intineraryHour = ""
        this.realHour = ""
        this.delayReason = ""
        this.passengers = {
            children:[],
            total:[]
        }
        
        this.matches = matches
        
        this._parser()
    }

    _parser(){
        
        var date = "";
        var day = "",month = "",year = "";
        this[_data].forEach(element => {
            var keys = Object.keys(element)
            
            for (let index = 0; index < keys.length; index++) {
                const key = keys[index];
                
                switch(key){
                    case 'FOLIO': this.folio = element[key]; break;
                    case 'FECHA': this.formatted_date = element[key]; break;
                    case 'MES': month = element[key]; break;
                    case 'DIA': day = element[key]; break;
                    case 'ANO': year = element[key]; break;

                    case 'AEROPUERTO': 
                    case 'Aeropuerto':
                    this.airport.name = element[key]; break;

                    case 'COMPANIA': 
                    case 'Compania':
                    this.company.name = element[key]; break;

                    case 'EQUIPO': 
                    case 'Equipo':
                    this.equipment = element[key]; break;

                    case 'SIGLAS':
                    case 'Siglas':
                    case 'AEROPUERTO DE SALIDA':
                    case 'Codigo 3 Leras': 
                    !(this.acronyms.includes(element[key]))? this.acronyms.push(element[key]):""; break;
                    
                    case 'LIC.':
                    case 'LIC':
                    case 'No.LIC': 
                    case 'No. LIC': 
                    case 'Licencia':
                    !(this.licences.includes(element[key]))? this.licences.push(element[key]):""; break;

                    case 'MATRICULA':
                    case 'Matricula':
                    this.registration = element[key]; break;

                    case 'No. VUELO': 
                    case 'No.VUELO':
                    case 'No DE VLO':
                    case 'Num.de vuelo':
                    case 'Num. de vuelo':
                        if(!isNaN(element[key]))
                            this.flightNumber = element[key];
                        else
                            this.flightNumber = ""; 
                        break;
                    
                    case 'COMANDANTE': 
                    case 'Comandante':
                    this.commander.name = element[key]; break;

                    case '1er. OFICIAL': 
                    case '1er. Oficial':
                    this.officerOne.name = element[key]; break;

                    case '2do. OFICIAL': 
                    case '2do. Oficial': 
                    this.officerTwo.name = element[key]; break;

                    case '3er. OFICIAL': 
                    case '3er. Oficial': 
                    this.officerThree.name = element[key]; break;

                    case 'MAYOR': this.senior.name = element[key]; break;
                    case 'SOBRECARGOS': this.surcharges = element[key]; break;
                    case 'SORECARGO1' : this.surchargeOne.name = element[key]; break;
                    case 'SORECARGO2' : this.surchargeTwo.name = element[key]; break;
                    case 'SORECARGO3' : this.surchargeThree.name = element[key]; break;
                    
                    case 'Num.':
                    case 'NUM.':
                    case 'TOTAL':
                    case 'No. PAX':
                    case 'Num. de pasajeros':
                        if(!this.matches.passengers){
                            this.matches.passengers = {}
                            this.matches.passengers.total = []
                        }else if(!this.matches.passengers.total)
                            this.matches.passengers.total = []
                        this.matches.passengers.total.push(element[key]); break;
                    
                    case 'INFANTES':
                    case 'BOLETO DE INFANTE':
                    case 'Boletos de infante':
                        if(!this.matches.passengers){
                            this.matches.passengers = {}
                            this.matches.passengers.children = []
                        }
                        this.matches.passengers.children.push(element[key]); break;
                    
                    case 'ORIGEN':
                    case 'ORIGEN DEL VUELO':
                    case 'Origen':
                    this.origin.name = element[key]; break;
                    
                    case 'DESTINO':
                    case 'DESTINO DEL VUELO':
                    case 'Destino':
                    this.destination.name = element[key]; break;
                    
                    case 'PROXIMA ESCALA': 
                    case 'Proxima escala':
                    this.nextScale.name = element[key]; break;
                    
                    case 'HORA ITINERARIO': 
                    case 'Hora itinerario':
                    this.intineraryHour = element[key]; break;
                    
                    case 'HORA REAL': 
                    case 'Hora real':
                    this.realHour = element[key]; break;
                    case 'CAUSA DE LA DEMORA': this.delayReason = element[key]; break;
                }  
            } 
            this.date = {
                day: day,
                month:month,
                year:year
            }
            
        });
        
        if(this.formatted_date == "" || this.formatted_date == null){
            this.formatted_date = day + "/" + month + "/" + year;
            this.date_query = year + "-" + month + "-" + day;
        }
        
        // validate if is correct the date format.
        if(!regex.regexDate(this.formatted_date)){
            if(this.matches.dates)
                if(this.matches.dates.length > 0) {
                    this.formatted_date = this.matches.dates[0]
                    var splitted = this.formatted_date.split("/")
                    this.date_query = splitted[2] + "-" + splitted[1] + "-" + splitted[0];
                }
        }
        
        var used = [];
        var tmp_ac = [];
        this.acronyms.forEach(el=>{
            tmp_ac.push(el)
        })
        
        this.acronyms.forEach(elem=>{
            
            if(regex.regexContains(this.airport.name,elem)){
                this.airport.acronym = elem;
                used.push(elem);
                tmp_ac.splice(tmp_ac.indexOf(elem),1);
            }

            if( regex.regexContains(this.origin.name,elem)){
                this.origin.acronym = elem;
                used.push(elem);
                tmp_ac.splice(tmp_ac.indexOf(elem),1);
            }
            
            if(regex.regexContains(this.destination.name,elem)){
                this.destination.acronym = elem;
                used.push(elem)
                tmp_ac.splice(tmp_ac.indexOf(elem),1);
            }
        })
        if(tmp_ac.length > 0)
            this.company.acronym = tmp_ac[0];

    }
    
    hasNumber(string) {
        return /\d/.test(string);
    }
}
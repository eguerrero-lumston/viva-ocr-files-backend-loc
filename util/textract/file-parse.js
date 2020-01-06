
var _data = Symbol()
var regex = new ( require("./regex"))


/**
 *                  File parser class
 * this class was made for parse all data retrieved from 
 * amazon textract, parsed in a json, and depending of the 
 * fields in json, determine by key name, fill the neccessary 
 * data for manifest
 * 
 */
module.exports = class FileParser{
    
    constructor(data, matches = {}){
        this[_data] = data
        this.year = matches.year || null;
        this.name = matches.name || "";
        this.fatherLastname = matches.fatherLastname || "";
        this.motherLastname = matches.motherLastname || "";
        this.courseName = matches.courseName || "";
        this.passengers = {
            children:[],
            total:[]
        }
        
        this.matches = matches
        
        // this._parser()
    }

    _parser(){
        var year = "";
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
            
        });
        

    }
    
    hasNumber(string) {
        return /\d/.test(string);
    }
}
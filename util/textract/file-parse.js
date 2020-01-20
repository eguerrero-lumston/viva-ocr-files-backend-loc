
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
                
                // switch(key){
                //     case 'FOLIO': this.folio = element[key]; break;
                //     case 'FECHA': this.formatted_date = element[key]; break;
                //     case 'MES': month = element[key]; break;
                //     case 'DIA': day = element[key]; break;
                //     case 'ANO': year = element[key]; break;

                //     case 'AEROPUERTO': 
                //     case 'Aeropuerto':
                //     this.airport.name = element[key]; break;

                //     case 'COMPANIA': 
                //     case 'Compania':
                //     this.company.name = element[key]; break;

                //     case 'EQUIPO': 
                //     case 'Equipo':
                //     this.equipment = element[key]; break;

                //     case 'SIGLAS':
                //     case 'Siglas':
                //     case 'AEROPUERTO DE SALIDA':
                //     case 'Codigo 3 Leras': 
                //     !(this.acronyms.includes(element[key]))? this.acronyms.push(element[key]):""; break;
                    
                //     case 'LIC.':
                //     case 'LIC':
                //     case 'No.LIC': 
                //     case 'No. LIC': 
                //     case 'Licencia':
                //     !(this.licences.includes(element[key]))? this.licences.push(element[key]):""; break;

                //     case 'MATRICULA':
                //     case 'Matricula':
                //     this.registration = element[key]; break;
                // }  
            } 
            
        });
        

    }
    
    hasNumber(string) {
        return /\d/.test(string);
    }
}
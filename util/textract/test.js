//var Block = require("./block")
var Textract = require("./textract");
const TextractParser = require("./parser");
var Manifest = require("./manifest");

var AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
var AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
var tt = new Textract(AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, "");
tt.bucket = 'textract-lumston-us-east-2';

async function test() {
    /*
    // analyze jpg or png document
    await tt.analizeDocument('manifiesto_page_3.jpg')

    // create parser object for document analyzed given the name
    var parser = new TextractParser(null,'manifiesto_page_3.jpg')
    
    // store in database if necessary
    //await parser.storeInDB(tt.pages)
    
    // get data from parser /forms/tables/lines...
    var forms = await parser.forms(1)

    // create manifest object with renamed properties
    var ob = new Manifest(forms)

    console.log(ob)
    */
    //var parser = new TextractParser(null,'manifest.pdf')
    //var forms = await parser.forms(1)
    //var ob = new Manifest(forms)
    //console.log(ob)
    //console.log(tt.pages)

    //let job = await tt.analizeDocumentAsync('manifest.pdf')
    //console.log(job)
    var jid = '13fce3ed0bd9acacb8cfdcace1c006923502f555c6b4e874c66552145cb0e3f8'
    var docRef = 'manifest.pdf'

    await tt.getDocumentAnalyzedRecursively(jid, 1000)
    var parser = new TextractParser(jid, docRef)
    await parser.storeInDB(tt.pages)
    var forms = await parser.forms(1)
    var ob = new Manifest(forms)
    console.log(ob)
    //console.log(forms)


    /*
    var parser = new TextractParser('manifest.pdf')
    //await parser.storeInDB(tt.pages)

    var forms = await parser.forms(3)
    var ob = new Manifest(forms)
    console.log(ob)
    */

}

test()
const HummusRecipe = require('hummus-recipe');
const imagesToPdf = require("images-to-pdf")
const path = require('path');
var fs = require('fs');
var touch = require("touch")

module.exports = class PDFManager{

    constructor(){}

    /**
     * separate a pdf by pages in individual documents
     * 
     * @param {String} output the path where folder with separated PDFs will be created
     * @param {String} input the PDF file path that will be separated by pages
     */
    async split(output,input){
        
        const inp = path.join(__dirname,"pdfuploads", input);
        const outputDir = path.join(__dirname, output);
        
        const pdfDoc = new HummusRecipe(inp);   
        
        if (!fs.existsSync(outputDir)){
            fs.mkdirSync(outputDir);
        }
        pdfDoc.split(outputDir, 'file-page').endPDF();
        
        return outputDir;
    }

    /**
     * iterate a folder with the files to will be returned
     * 
     * @param {String} directoryPath the folder's path to iterate
     */
    async iterate(directoryPath){

        return new Promise((resolve, reject)=>{

            fs.readdir(directoryPath, function (err, files) {
                
                if (err) {
                    return reject([])
                } 
                var files_path = [];
                for (let index = 0; index < files.length; index++) {
                    // console.log('isOdd(index)', page % 2 == 1, index, page);
                    const file = files[index];
                    var file_p = path.join(directoryPath,file);
                    var pdf = fs.readFileSync(file_p);
                    // console.log('file_p', file, file.match(/\d+/));
                    var page = Number(file.match(/\d+/)[0]);
                    if (page % 2 == 1) {
                        var npdf = {path:file_p,data:pdf}
                        files_path.push(npdf);
                    }
                }
                return resolve(files_path)
            });

        })
        
    }

    /**
     * move a file to an specific path, given the file
     * 
     * @param {String} to path where file will be moved
     * @param {File} doc the file uploaded that will be moved
     */
    async moveFile(to,doc){
        
        return new Promise((resolve,reject)=>{
            doc.mv(to, function(err) {
                if (err)
                    reject(null);
                console.log("MOVED FILE");
                resolve(to);
            });
        });
    }

    /**
     * delete a folder, recursively
     * 
     * @param {String} path the folder's path to delete
     */
    deleteFolderRecursive(path) {
        if( fs.existsSync(path) ) {
          fs.readdirSync(path).forEach(function(file,index){
            var curPath = path + "/" + file;
            if(fs.lstatSync(curPath).isDirectory()) { // recurse
              deleteFolderRecursive(curPath);
            } else { // delete file
              fs.unlinkSync(curPath);
            }
          });
          fs.rmdirSync(path);
        }
    }

    deleteFile(path){
        fs.unlinkSync(path);
    }
    
    /**
     * convert an image to pdf file
     * 
     * @param {String} image image's path to converto pdf
     * @param {String} pdf the pdf's name (by default, auto-generated name)
     * 
     */
    async imageToPDF(image,pdf){
        
        const inp = path.join(__dirname,image);
        const outputDir = path.join(__dirname, pdf);
        
        
        if (!fs.existsSync(outputDir)){
            touch.sync(outputDir)
        }
        let resPath = await imagesToPdf([inp], outputDir)
        return resPath
    }

}
const HummusRecipe = require('hummus-recipe');
const imagesToPdf = require("images-to-pdf")
const path = require('path');
var fs = require('fs');
var touch = require("touch");

module.exports = class PDFManager{

    constructor(){}

    /**
     * separate a pdf by pages in individual documents
     * 
     * @param {String} output the path where folder with separated PDFs will be created
     * @param {String} input the PDF file path that will be separated by pages
     * @param {String} format the PDF file format that will be separated by pages of 1 or 2
     */
    async split(output, input, sheets){
        
        const inp = path.join(__dirname,"pdfuploads", input);
        const outputDir = path.join(__dirname, output);
        
        // const pdfDoc = new HummusRecipe(inp);   
        
        if (!fs.existsSync(outputDir)){
            fs.mkdirSync(outputDir);
        }
        // pdfDoc.split(outputDir, 'file-page').endPDF();
        const pdfDoc = new HummusRecipe(inp, 'output.pdf');
        console.log('pdfDoc.metadata.pages', pdfDoc.metadata.pages);
        for (let index = 0; index < pdfDoc.metadata.pages; index++) {
            // const element = pdfD[index];
            var page = (index + 1);
            var completePdf = outputDir + '/file-page' + page + '.pdf';
            console.log('page--->', page, completePdf);
            if (page % 2 == 1 && sheets === '2') {
                var pages = [page];
                const newpdfDoc = new HummusRecipe('new', completePdf);
                if (pdfDoc.metadata.pages > 1){
                    pages.push(page + 1);
                }
                console.log('newpdfDoc--->', newpdfDoc.isNewPDF);
                newpdfDoc
                .appendPage(inp, pages)
                .endPDF();
            } else if (sheets === '1') {
                var pages = [page];
                const newpdfDoc = new HummusRecipe('new', completePdf);
                
                console.log('newpdfDoc--->', newpdfDoc.isNewPDF);
                newpdfDoc
                .appendPage(inp, pages)
                .endPDF();
            }
        }
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
                    console.log('file_p------>', file_p);
                    
                    var page = Number(file.match(/\d+/)[0]);
                    // if (page % 2 == 1) {
                    var npdf = {path:file_p,data:pdf}
                    files_path.push(npdf);
                    // }
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
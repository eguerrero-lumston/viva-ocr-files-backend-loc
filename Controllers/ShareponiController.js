var spsave = require("spsave").spsave;

module.exports = class DocumentController {
    upload(req, res) {
        var coreOptions = {
            siteUrl: 'https://lumston.sharepoint.com/sites/Softwareengineering'
        };
        var creds = {
            username: 'eguerrero@lumston.com',
            password: 'shericksam1996A'
        };

        var fileOptions = {
            folder: 'Documentos compartidos/OCR Expedientes',
            fileName: 'file.txt',
            fileContent: 'hello world'
        };
        spsave(coreOptions, creds, fileOptions)
            .then(function () {
                console.log('saved');
                return res.status(200).json({ message: "files saved" })
            })
            .catch(function (err) {
                console.log(err);
                res.status(err.statusCode).json({ message: "An error has ocurred", error: err });
            });
    }
}
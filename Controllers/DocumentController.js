
var Document = model('DocModel', 'Mongo');
var DocType = model('DocTypeModel', 'Mongo');
var Flight = model('FlightModel', 'Mongo');
var Block = require("../util/textract/block");
var S3 = require("../util/s3");
var PDFManager = require("../util/pdfmanager");
var fs = require('fs');

var Textract = require("../util/textract/textract");
const TextractParser = require("../util/textract/parser");
var FileParser = require("../util/textract/file-parse");
var RegExpFileParser = require("../util/textract/regex");
var spsave = require("spsave").spsave;

var regexp = new RegExpFileParser();

var cleanBucket = process.env.AWS_CLEAN_BUCKET;
var docsBucket = process.env.AWS_CLEAN_BUCKET;
var awsRegion = process.env.AWS_REGION;

var AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
var AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

var tt = new Textract(AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, "", awsRegion);
tt.bucket = docsBucket;

var s3 = new S3(AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, awsRegion);
s3.bucket = docsBucket;


const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}


const confirmAndShare = async (jobId, res) => {
    var doc = await Document.findOne({ jobId: jobId }).populate('course').populate('position');

    if (doc.checkStatus === 4) {
        if (res)
            return res.status(403).json({ message: "document has been already moved" });
        else
            return;
    } else if (doc.checkStatus != 3) {
        return res.status(403).json({ message: "document can't be moved without be checked before" })
    }
    const obj = await s3.getObject(doc.key, cleanBucket);
    var courseName = doc.course != null ? doc.course.name : '';
    var nameFile = `${doc.year}-${toCapitalize(doc.fatherLastname)} ${toCapitalize(doc.motherLastname)}-${toCapitalize(courseName)}` + `.pdf`;
    var fullname = `${doc.fatherLastname} ${doc.motherLastname} ${doc.name}`.toUpperCase();
    var folder = doc.position.name;

    doc.checkStatus = 4;
    await doc.save();
    var coreOptions = {
        siteUrl: 'https://vivaaerobus.sharepoint.com/Operaciones'
    };
    var creds = {
        username: 'soporte.lumston@vivaaerobus.com',
        password: 'S0p0rt3Lum$ton'
    };
    var fileOptions = {
        folder: 'Expedientes/' + folder + '/' + fullname + '/CERTIFICADOS',
        fileName: nameFile,
        fileContent: obj.Body
    };
    console.log('paaath------>', 'Expedientes/' + folder + '/' + fullname + '/CERTIFICADOS' + '/' + nameFile);
    // spsave(coreOptions, creds, fileOptions)
    //     .then(function () {
    //         console.log('saved');

    //         if (res)
    //             return res.status(200).json({ message: "files saved" });
    //         else
    //             return;
    //     })
    //     .catch(function (err) {
    //         console.log(err);
    //         if (res)
    //             return res.status(err.statusCode).json({ message: "An error has ocurred", error: err });
    //         else
    //             return;
    //     });
}

function toCapitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = class DocumentController {

    constructor() {
        this.upload = this.upload.bind(this)
        this.uploadDoc = this.uploadDoc.bind(this)
    }

    /**
     * Upload a document, in pdf and then splits it to get
     * a document for each page individualy and upload each one
     * 
     */
    async uploadDoc(req, res) {
        let doc = req.files.document;
        let { position, sheets } = req.body;
        let pdf = new PDFManager();

        var tmp = "./util/pdfuploads/";
        if (!fs.existsSync(tmp)) {
            fs.mkdirSync(tmp);
        }

        var i = doc.name.lastIndexOf('.');
        var ext = doc.name.substr(i);

        // creating the new name based on date and time
        let d = new Date();
        var fname_no_ext = "File" + d.getDay() + d.getMonth() + d.getFullYear() + d.getMilliseconds();

        if (ext == ".jpg" || ext == ".png") {
            tmp = "./util/imageuploads/";
        }

        if (!fs.existsSync(tmp)) {
            fs.mkdirSync(tmp);
        }

        var fname = fname_no_ext + ext;
        var to = tmp + fname;
        await pdf.moveFile(to, doc);
        let outPdf = "";
        if (ext == ".jpg" || ext == ".png") {
            outPdf = await pdf.imageToPDF("imageuploads/" + fname, "pdfuploads/" + fname_no_ext + ".pdf") // convert image to pdf
            //pdf.deleteFile(out)
        }

        let out = await pdf.split(fname_no_ext, fname_no_ext + ".pdf", sheets);
        let files = await pdf.iterate(out);
        new Promise(async (resolve, reject) => {

            for (let index = 0; index < files.length; index++) {
                const file = files[index];
                await sleep(5000);
                await this.upload(file.data, ".pdf", position);
            }
            pdf.deleteFolderRecursive(out)
            fs.unlinkSync(to);

            if (ext == ".jpg" || ext == ".png") {
                await sleep(5000); // wait 5 sec until method finish and release the resource file to delete
                fs.unlinkSync(outPdf)
            }
            resolve("ok")
        }).then(res => res)
        // {uploaded:status200,errors:status400}
        return res.status(200).json({ message: "document uploaded successfully " + fname_no_ext });
    }

    /**
     * Upload documents to S3 bucket where they will be analyzed
     * when document is uploaded, starts to analayze it and store 
     * record in database od this document
     */
    async upload(data, ext, position) {

        let d = new Date();
        var fname = "File" + d.getDay() + d.getMonth() + d.getFullYear() + d.getMilliseconds() + ext;
        let result = await s3.uploadFile(fname, data);
        if (result.status == 400)
            return result;

        let new_doc = new Document();
        new_doc.name = fname;
        new_doc.key = fname;
        new_doc.position = position;

        if (ext == ".pdf") {
            const job = await tt.analizeDocumentAsync(fname)
            new_doc.jobId = job.JobId;
            new_doc.originalJobId = job.JobId;
            await new_doc.save()
            return { status: 200 }//res.status(200).json({"result":result,jobId:job})
        }
        else if (ext == ".jpg" || ext == ".png") {
            // this condition shouldn't happen because the service just process PDFs
            await tt.analizeDocument(fname)

            var parser = new TextractParser(null, fname)
            await parser.storeInDB(tt.pages)
            var forms = await parser.forms(1)
            var matches = await parser.regex(1)

            var ob = new FileParser(forms)
            var obj = new Document(ob)
            obj.jobId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            obj.originalJobId = obj.jobId;
            obj.name = fname;
            obj.key = fname;
            //obj.originalJobId = job.JobId;
            obj.checkStatus = 1;
            obj.matches = matches;
            await obj.save();

            return { status: 200 } //res.status(200).json({manifest:obj})
        } else {
            return { status: 400 }//res.status(400).json({message:"not valid extension"})
        }
    }

    /**
     * This method analyze the document of given jobId 
     * and save data in an existent document in database
    */
    async analyzeDoc(jid) {

        var obj = await Document.findOne({ jobId: jid }).populate('position');
        if (obj.checkStatus != 0) {
            return null;
        }

        // create another instance of textract, it's because the data stored in the instance
        // makes conflicts
        var tt = new Textract(AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, "", awsRegion)
        tt.bucket = docsBucket
        var result = await tt.getDocumentAnalyzedRecursively(jid, 1000)

        if (result.analyzed == false) {
            return null;
        }

        obj.jobStatus = "IN_PROGRESS";
        await obj.save();

        try {
            var parser = new TextractParser(jid)
            await parser.storeInDB(tt.pages)

            var forms = await parser.forms(1) // Get FORMS
            var matches = await parser.regex(1) // Get matches with regular expresion from LINES
            // console.log(tt.pages);
            var ob = new FileParser(forms, matches);
            await obj.updateOne(ob);
            obj.originalJobId = jid;
            obj.matches = matches;
            obj.jobStatus = result.status;
            obj.pages = 1;
            obj.page = 1;
            // obj.
            // await Block.deleteMany({ jobId: jid }) // delete blocks, these won't be used anymore
            const accentsTidy = function (s) {
                var r = s.toLowerCase();
                r = r.replace(new RegExp(/\s/g), "");
                r = r.replace(new RegExp(/[àáâãäå]/g), "a");
                r = r.replace(new RegExp(/æ/g), "ae");
                r = r.replace(new RegExp(/ç/g), "c");
                r = r.replace(new RegExp(/[èéêë]/g), "e");
                r = r.replace(new RegExp(/[ìíîï]/g), "i");
                r = r.replace(new RegExp(/ñ/g), "n");
                r = r.replace(new RegExp(/[òóôõö]/g), "o");
                r = r.replace(new RegExp(/œ/g), "oe");
                r = r.replace(new RegExp(/[ùúûü]/g), "u");
                r = r.replace(new RegExp(/[ýÿ]/g), "y");
                r = r.replace(new RegExp(/\W/g), "");
                return r;
            };
            // var arrayOfTags = ob.matches.courseName.split(" ");
            // console.log('arrayOfTags', arrayOfTags); , $language: 'es', $caseSensitive: false, $diacriticSensitive: false 
            await DocType.find({ textToRecognize: { $ne: null } }, function (err, doctypes) {
                // await DocType.findOne( { $text: { $search: ob.matches.courseName } } , function (err, doctype) {
                // await DocType.findOne( { textToRecognize: { $elemMatch: arrayOfTags, $exists: true } } , function (err, doctype) {
                if (err) {
                    console.log(err);
                } else {
                    doctypes.forEach(doctype => {
                        if (doctype.textToRecognize !== '') {
                            var textToRecognize = accentsTidy(doctype.textToRecognize);
                            var text = accentsTidy(ob.matches.courseName);

                            if (text.length >= textToRecognize.length && text !== '' && textToRecognize !== '') {
                                console.log('doctype---->', text, text.includes(textToRecognize), textToRecognize);
                                if (text.includes(textToRecognize)) {
                                    obj.course = doctype._id;
                                }
                            } else if (text !== '' && textToRecognize !== '') {
                                console.log('doctype t2r 1---->', text, textToRecognize.includes(text), textToRecognize);
                                if (textToRecognize.includes(text)) {
                                    obj.course = doctype._id;
                                }
                            }

                        }
                        // if (doctype){
                        //     obj.course = doctype._id;
                        // }
                    });
                    if (result.status == "SUCCEEDED") {
                        if (ob.matches.year != 0 &&
                            ob.matches.name != "" &&
                            ob.matches.motherLastname != "" &&
                            ob.matches.fatherLastname != "" &&
                            (obj.course !== null && obj.course !== undefined && obj.course !== '')) {
                            obj.checkStatus = 3;
                        } else {
                            obj.checkStatus = 1;
                        }
                    }
                    // console.log('saved------------>', obj.course)
                    obj.save();
                }
            });
            if (obj.checkStatus == 3) {
                confirmAndShare(jid);
            } 

        } catch (error) {
            //if throws error, revert checkStatus
            console.log(error);
            obj.jobStatus = "NOT_PROCESSING";
            obj.checkStatus = 0;
            await obj.save();
        }
        return obj;
    }

    /**
     * @deprecated
     * Analyze a document given its jobId
     * 
     */
    async analyze(req, res) {
        return res.status(404).json({ message: "deprecated function" })
        // var jid = req.query.JobId
        // var obj = await this.analyzeDoc(jid);
        // if(!obj)
        //     return res.status(403).json({message:"Document already analyzed"});
        // return res.status(200).json(obj) 
    }

    /**
     * this function gets uploaded documents
     * and stored in database
     * 
     */
    async find(req, res) {

        const { jobId, name } = req.query
        if (!jobId && !name) {
            var options = {
                page: 1,
                populate: 'course',
                select: "name year fatherLastname motherLastname key jobId checkStatus jobStatus uploaded_at",
                limit: 10
            };
            var docs = await Document
                .paginate({ checkStatus: { $in: [0, 1, 2, 3] } }, options);
            return res.status(200).json(docs)
        }
        var doc;
        if (jobId) {
            doc = await Document.findOne({ jobId: jobId }).populate('course');
        }
        else if (name) {
            doc = await Document.findOne({ name: name }).populate('course');
        } else {
            doc = {}
        }
        var typeDoc = await DocType.find({ textToRecognize: { $ne: null } })
        return res.status(200).json({ doc, typeDoc })
    }

    /**
     * Filtrate documents by name, by checkStatus or both
     * also this receive page and limit params to paginate data
     */
    async tableFilter(req, res) {
        const { checkStatus, name } = req.query;
        var { page, limit } = req.query;
        var query = {}
        var select = "name year fatherLastname motherLastname key jobId checkStatus jobStatus uploaded_at";

        if (!page) page = 1;
        if (!limit) limit = 10;
        else {
            try {
                limit = parseInt(limit);
                if (limit < 0)
                    limit = 10
            } catch (error) {
                limit = 10;
            }
        }
        if (name) {
            query["name"] = { "$regex": name, "$options": "i" };
            query["checkStatus"] = { $in: [0, 1, 2, 3] };
        }

        if (checkStatus) {
            var sta = checkStatus.split(",").map(el => { return parseInt(el) })

            query["checkStatus"] = { $in: sta };
        }

        var options = {
            page: parseInt(page),
            populate: 'course',
            select: "name year fatherLastname motherLastname key jobId checkStatus jobStatus uploaded_at",
            limit: limit
        };
        if (!name && !checkStatus) {
            var docs = await Document.paginate({ checkStatus: { $in: [0, 1, 2, 3] } }, options);
            return res.status(200).json(docs)
        }
        var docs = await Document.paginate(query, options)
        return res.status(200).json(docs)
    }

    /**
     * Filtrate documents by given specific parameters
     * this is just for documents that have been confirmed and moved to 
     * S3 clean folders
     */
    async filter(req, res) {

        const origin = req.query.origin
        const destination = req.query.destination
        const registration = req.query.registration
        const hour = req.query.hour
        const date = req.query.date
        var query = {}

        if (origin) query["origin.acronym"] = origin;
        if (destination) query["destination.acronym"] = destination;
        if (registration) query["registration"] = registration;
        if (hour) query["realHour"] = hour;
        if (date) query["formatted_date"] = date;
        query["checkStatus"] = 4;

        var docs = await Document.find(query).select(["name", "key"])

        return res.status(200).json(docs)
    }

    /**
     * updates data of document
     * 
     */
    async update(req, res) {

        const { jobId, name, courseId } = req.body;
        var query = {}
        query['jobId'] = jobId;

        let doc = await Document.findOne(query)
        doc.course = courseId;
        await doc.updateOne(req.body)

        doc.checkStatus = 3;
        await doc.save();
        return res.status(200).json({ message: "updated successfully" })
    }

    /**
     * Delete a document given the jobId
     * this function deletes register in database 
     * and the file in s3 bucket
     */
    async delete(req, res) {
        const { jobId } = req.params;

        var doc = await Document.findOne({ jobId: jobId });
        if (!doc)
            return res.status(404).json({ message: "document doesn't exists" })

        const key = (doc.key != "") ? doc.key : doc.name;
        const result = await s3.deleteFile(key);
        doc.checkStatus = 5;
        await doc.save();
        //await doc.remove();

        return res.status(200).json({ message: "document deleted successfully" });
    }

    /**         
     * Confirm that the document have been checked and is ready to
     * be moved to folder
     */
    async confirm(req, res) {
        const { jobId } = req.body;

        confirmAndShare(jobId, res);
        // return res.status(200).json({ message: "document was moved" });
    }

    async getFile(req, res) {
        const { jobId } = req.body;

        var doc = await Document.findOne({ jobId: jobId });
        const obj = await s3.getObject(doc.key, cleanBucket);
        console.log(obj);
        return res.status(200).json({ obj: obj.Body });
    }

    /**
     * navegate through the folders in s3 bucket
     * all request have to end with '/'
     * e.g /folders/XV-DRE/subfolder/
    */
    async files(req, res) {

        var folder = req.params.folder
        var params = (req.params.arr + req.params[0]).split('/')
        var current = (req.params.arr + req.params[0])
        //var cleanBucket = process.env.aws_clean_bucket

        folder = params.join('/')

        if (folder === 'undefined')
            folder = "/"

        var list = await s3.filesFromFolder(folder, cleanBucket);
        if (list == null) {
            return res.status(400).json({ message: "files not found" })
        }

        var folders = []
        var files = []
        folders = list.CommonPrefixes.map(elem => {
            return elem.Prefix.substr(0, elem.Prefix.lastIndexOf("/"))
        })

        list = list.Contents.map(elem => {
            var paths = elem.Key.replace(current, "")
                .split("/")
                .filter(el => {
                    return el != ""
                })

            if (paths.length == 1) {
                if (paths[0].lastIndexOf(".pdf") == -1 &&
                    paths[0].lastIndexOf(".jpg") == -1 &&
                    paths[0].lastIndexOf(".png") == -1)
                    folders.push(paths[0])
                else
                    files.push({ name: paths[0], key: elem.Key })
            } else {
                folders.push(paths[0]);
            }

            var i = elem.Key.lastIndexOf("/")
            if (elem.Key.substr(i + 1).lastIndexOf(".") == -1) {
                folders.push()
                return;
            } else if (elem.Key.substr(i + 1).lastIndexOf(".") == -1 && paths.length == 1) {
                files.push(elem.Key.substr(i + 1))
            }
            return { name: elem.Key.substr(i + 1), path: elem.Key }
        })
        return res.status(200).json({ folders: folders, files: files })
    }

    /**
     * Get a signed url to get a pdf file
     * given the key of file in bucket
     * works for temporal files.
     * 
     */
    async getTmpUrl(req, res) {
        var { key } = req.query
        const url = await s3.getUrlObject(key, s3.bucket);
        return res.status(200).json({ url: url })
    }

    /**
     * Get a signed url to get a pdf file
     * given the key of file in bucket
     * works for moved files to clean bucket.
     * 
     */
    async getCleanUrl(req, res) {
        var { key } = req.query
        const url = await s3.getUrlObject(key, cleanBucket);
        return res.status(200).json({ url: url })
    }

    /**
     * Get the suggestions of table's filters
     * search in stored docs and get the data from them
     */
    async getFilterSuggestions(req, res) {
        var origins = await Document.find({ "origin.acronym": { $ne: "" } }).distinct("origin.acronym")//.select(["origin.acronym","destination.acronym"])
        var destinations = await Document.find({ "destination.acronym": { $ne: "" } }).distinct("destination.acronym")
        var registrations = await Document.find({ "registration": { $ne: "" } }).distinct("registration")
        return res.status(200).json({
            "origins": origins,
            "destinations": destinations,
            "registrations": registrations
        });
    }

}
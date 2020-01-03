
var DocumentType = model('DocTypeModel', 'Mongo');

module.exports = class DocumentTypeController {

    constructor() {
    }


    /**
     * Add document type in database 
     */
    async add(req, res) {
        // return res.status(200).json(req.body);

        const { position, name, textToRecognize } = req.body;

        let doc = new DocumentType();
        doc.textToRecognize = textToRecognize;
        doc.name = name;
        doc.position = position;

        await doc.save(function (err) {
            if (err) return res.status(409).json({ message: "An error has ocurred", error: err });
            return res.status(200).json({ doc });
        });
    }

    /**
     * this function gets uploaded documents
     * and stored in database
     * 
     */
    async find(req, res) {

        const { id, name } = req.query
        
        if (!id && !name) {
            var docs = await DocumentType.paginate({ deleted: null }, { page: 1, limit: 10, select: "_id name position", virtuals: true  })
            return res.status(200).json(docs)
        }
        var doc;
        if (id) {
            doc = await DocumentType.findOne({ _id: id })
        }
        else if (name) {
            doc = await DocumentType.findOne({ name: name })
        } else {
            doc = {}
        }
        doc.toObject({ virtuals: true });
        return res.status(200).json(doc)
    }

    /**
     * Filtrate documents by name, by checkStatus or both
     * also this receive page and limit params to paginate data
     */
    async tableFilter(req, res) {
        const { name } = req.query;
        var { page, limit } = req.query;
        var query = {}

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

        }

        if (!name) {
            var docs = await DocumentType.paginate({ deleted: null }, { page: parseInt(page), limit: limit, select: "_id name position" })
            return res.status(200).json(docs)
        }
        var docs = await DocumentType.paginate(query, { page: parseInt(page), limit: limit, select: "_id name position" })
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

        var docs = await DocumentType.find(query).select(["name", "key"])

        return res.status(200).json(docs)
    }

    /**
     * updates data of document
     * 
     */
    async update(req, res) {
        const { _id, textToRecognize } = req.body;
        var query = { _id}
        // query['_id'] = id;

        let doc = await DocumentType.findOne(query)
        doc.textToRecognize = textToRecognize;
        await doc.updateOne(req.body, function (err, result) {
            if (err) return res.status(409).json({ message: "An error has ocurred", error: err });
            return res.status(200).json({ message: `updated successfully ${result.n} documents` })
        });

    }

    /**
     * Delete a document given the jobId
     * this function deletes register in database 
     * and the file in s3 bucket
     */
    async delete(req, res) {
        const { id } = req.params;

        var doc = await DocumentType.findOne({ _id: id });
        if (!doc)
            return res.status(404).json({ message: "document doesn't exists" })

        doc.deleted = new Date;
        await doc.save(function (err) {
            if (err) return res.status(409).json({ message: "An error has ocurred", error: err });
            return res.status(200).json({ message: "document deleted successfully" });
        });
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
        var origins = await DocumentType.find({ "origin.acronym": { $ne: "" } }).distinct("origin.acronym")//.select(["origin.acronym","destination.acronym"])
        var destinations = await DocumentType.find({ "destination.acronym": { $ne: "" } }).distinct("destination.acronym")
        var registrations = await DocumentType.find({ "registration": { $ne: "" } }).distinct("registration")
        return res.status(200).json({
            "origins": origins,
            "destinations": destinations,
            "registrations": registrations
        });
    }

}
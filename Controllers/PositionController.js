var Position = model('PositionModel', 'Mongo');

module.exports = class PositionController {
    
    constructor() {
    }


    /**
     * Add position type in database 
     */
    async add(req, res) {
        // return res.status(200).json(req.body);

        const { name } = req.body;

        let position = new Position();
        position.name = name;
        await position.save(function (err) {
            if (err) return res.status(409).json({ message: "An error has ocurred", error: err });
            return res.status(200).json({ position });
        });
    }

    /**
     * this function gets uploaded positions
     * and stored in database
     * 
     */
    async find(req, res) {

        const { id, name } = req.query
        
        if (!id && !name) {
            var positions = await Position.paginate({ deleted: null }, { page: 1, limit: 10, select: "_id name", virtuals: true  })
            return res.status(200).json(positions)
        }
        var position;
        if (id) {
            position = await Position.findOne({ _id: id })
        }
        else if (name) {
            position = await Position.findOne({ name: name })
        } else {
            position = {}
        }
        return res.status(200).json(position)
    }

    /**
     * this function gets uploaded documents
     * and stored in database
     * 
     */

    async all(req, res) {
        var positions = await Position.find({ name: { $ne: null } })
        return res.status(200).json(positions)
    }

    /**
     * Filtrate positions by name, by checkStatus or both
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
            var positions = await Position.paginate({ deleted: null }, { page: parseInt(page), limit: limit, select: "_id name" })
            return res.status(200).json(positions)
        }
        var positions = await Position.paginate(query, { page: parseInt(page), limit: limit, select: "_id name" })
        return res.status(200).json(positions)
    }

    /**
     * updates data of position
     * 
     */
    async update(req, res) {
        const { _id } = req.body;
        var query = { _id }
        // query['_id'] = id;

        let position = await Position.findOne(query)
        await position.updateOne(req.body, function (err, result) {
            if (err) return res.status(409).json({ message: "An error has ocurred", error: err });
            return res.status(200).json({ message: `updated successfully ${result.n} positions` })
        });

    }

    /**
     * Delete a position given the jobId
     * this function deletes register in database 
     * and the file in s3 bucket
     */
    async delete(req, res) {
        const { id } = req.params;

        var position = await Position.findOne({ _id: id });
        if (!position)
            return res.status(404).json({ message: "position doesn't exists" })

        position.deleted = new Date;
        await position.save(function (err) {
            if (err) return res.status(409).json({ message: "An error has ocurred", error: err });
            return res.status(200).json({ message: "position deleted successfully" });
        });
    }
}
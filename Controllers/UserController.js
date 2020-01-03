var mongoose = require('icomm-mongo').mongoose;
var Schema = mongoose.Schema, ObjectId = mongoose.Types.ObjectId;
var azure = require("../util/azureADFS")
var jwt = require("jsonwebtoken");
var jwt_secret = process.env.JWT_SECRET;
var User = require("../Models/Mongo/UsersModel")

module.exports = class UserController {

    constructor() {

    }

    // login function
    async auth(req, res) {
        var { tkn_az, email } = req.body;

        if (!tkn_az)
            return res.status(400).json({ message: "bad request" });

        var user = await User.findOne({ email: email });

        if (!user) {
            user = new User();
            user.email = email;
            user.oid = tkn_az;
            await user.save();
        }
        //return res.status(401).json({message:"unauthorized"});

        var token = jwt.sign({ oid: tkn_az, email: user.email }, jwt_secret);
        return res.status(200).json({ token: token });
        /**
         * let result = await azure.getAccessToken();
        
        if(result.status == 1){
            
            var q = ["users",tkn_az];
            let conn = await azure.connectToGraph(q);
            if(conn.status == 0)
                return res.status(401).json({message:"unauthorized",error:conn});

            console.log(conn);
            var token = jwt.sign({ user: 'john@doe.com' },jwt_secret);
            return res.status(200).json({token:token});
        }
         */
    }


    /**
     * Add user in database 
     */
    async add(req, res) {
        // return res.status(200).json(req.body);

        const { email, name } = req.body;

        let user = new User();
        user.name = name;
        user.email = email;

        await user.save(function (err) {
            if (err) {
                if (err.code === 11000)
                    return res.status(409).json({ message: "Correo duplicado", error: err });
                return res.status(409).json({ message: "An error has ocurred", error: err });
            }
            return res.status(200).json({ user });
        });
    }

    /**
     * this function gets users
     * stored in database
     * 
     */
    async find(req, res) {

        const { id } = req.query;
        if (!id ) {
            var users = await User.paginate({ deleted: null }, { page: 1, limit: 10, select: "name created _id email" })
            return res.status(200).json(users)
        }
        var user;
        if (id) {
            user = await User.findOne({ _id: id })
        } else {
            user = {}
        }
        return res.status(200).json(user)
    }

    /**
     * Filtrate users by name
     * also this receive page and limit params to paginate data
     */
    async tableFilter(req, res) {
        const { name } = req.query;
        var { page, limit } = req.query;
        var query = { deleted: null }

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
            query["deleted"] = null;
        }

        if (!name) {
            var users = await User.paginate({ deleted: null }, { page: parseInt(page), limit: limit, select: "name created _id email" })
            return res.status(200).json(users)
        }
        var users = await User.paginate(query, { page: parseInt(page), limit: limit, select: "name created _id email" })
        return res.status(200).json(users)
    }

    /**
     * Filtrate users by given specific parameters
     * this is just for users that have been confirmed and moved to 
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

        var users = await User.find(query).select(["name", "key"])

        return res.status(200).json(users)
    }

    /**
     * updates data of document
     * 
     */
    async update(req, res) {

        const { _id } = req.body;
        var query = {}
        query['_id'] = _id;

        let user = await User.findOne(query)

        await user.updateOne(req.body, function (err) {
            if (err) {
                if (err.code === 11000)
                    return res.status(409).json({ message: "Correo duplicado", error: err });
                return res.status(409).json({ message: "An error has ocurred", error: err });
            }
        });

        await user.save();
        return res.status(200).json({ message: "updated successfully" })
    }

    /**
     * Delete a document given the jobId
     * this function deletes register in database 
     * and the file in s3 bucket
     */
    async delete(req, res) {
        const { id } = req.params;

        var user = await User.findOne({ _id: id });
        if (!user)
            return res.status(404).json({ message: "user doesn't exists" })

        const key = (user.key != "") ? user.key : user.name;
        user.deleted = Date.now();
        await user.save();
        //await user.remove();

        return res.status(200).json({ message: "user deleted successfully" });
    }


}
var mongoose = require('icomm-mongo').mongoose;
var Schema = mongoose.Schema, ObjectId = mongoose.Types.ObjectId;
var azure = require("../util/azureADFS")
var jwt = require("jsonwebtoken");
var jwt_secret = process.env.JWT_SECRET;
var User = require("../Models/Mongo/UsersModel")

module.exports = class UserController{
    
    constructor(){
      
    }
    
    // login function
    async auth(req,res){
        var {tkn_az, email} = req.body;
        
        if(!tkn_az)
            return res.status(400).json({message:"bad request"});
        
        var user = await User.findOne({email:email});
        
        if(!user){
            user = new User();
            user.email = email;
            user.oid = tkn_az;
            await user.save();
        }
            //return res.status(401).json({message:"unauthorized"});
        
        var token = jwt.sign({ oid: tkn_az,email:user.email },jwt_secret);
        return res.status(200).json({token:token});
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
    
}
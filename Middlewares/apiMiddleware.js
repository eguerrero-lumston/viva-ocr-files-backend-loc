var jwt = require('jsonwebtoken');
var secert = process.env.JWT_SECRET;

module.exports = (req,res,next) =>{
    
    var {authorization} = req.headers;
    
    if(authorization){
        var token = authorization.split(" ")[1]
        
        try {
            var decoded = jwt.verify(token, secert);
            req.decoded = decoded;
            next();
          } catch(err) {
              console.log(err)
            return res.status(401).json({message:"unauthorized token"});
          }
    }else{
        console.log("Error");
        return res.status(400).json({message:"missing token"})
    }
    
}

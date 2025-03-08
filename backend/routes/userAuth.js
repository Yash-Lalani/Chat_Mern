const jwt=require("jsonwebtoken");

const authenticateToken=(req,res,next)=>{
    const authHeader=req.headers['authorization'];
    const token=authHeader.split(' ')[1];
    if(authHeader==null){
        return res.status(401).json({message:'No token provided'});
    }
    
    jwt.verify(token,"bookstore123",(err,user)=>{
        if(err){
            return res.status(403).json({message:'Invalid token'});
        }
        req.user=user;
        next();
    });
    }
    
module.exports={authenticateToken};

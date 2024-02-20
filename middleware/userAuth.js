const {userCollection}=require("../model/usermodel");


const isblock = async (req, res, next) => {
    
  try {
    let userid;
   
    if (req.session.userId) {
        console.log("check")
       userid = req.session.userId.email

    }else{
      userid = req.body.email
    }
    if (userid) {
      const check = await userCollection.findOne({ email: userid });
  

      if (check && check.isBlocked === false) {
        req.session.destroy((err) => {
          if (err) {
              console.error('Error', err);
          } 
      });
         
        res.render('user/login', { error: "Please contact Your Admin You are no longer able to access this account",msg:'' });
        
      } else {
        next();
      

      }
    } else {
      res.redirect('/')
    }

  } catch (err) {
    console.log(err);
    res.status(500).send('Internal Server Error');
  }
}

module.exports = isblock;
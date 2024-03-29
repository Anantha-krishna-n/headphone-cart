const { userCollection } = require("../model/usermodel");
const {categoryCollection}=require("../model/catagorymodel")
const {productCollection}=require("../model/productModel")
const {cart}=require("../model/cartModel");
const orderCollection=require('../model/oderModel');
const addressCollection=require('../model/addressModel');

const nodemailer=require("nodemailer");

const bcrypt=require('bcrypt');


exports.loginGet=(req,res)=>{
   if(req.session.userId){
    res.render('user/home')
   }else{
    if(req.session.invalid){
        req.session.invalid=false;
        res.render('user/login',{msg:req.session.errmsg,error:''})
    }else{

        res.render('user/login',{msg:"",error:''})
    }
   }

}


exports.logoutGet = (req, res) => {
    if (req.session.userId) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Error', err);
            } res.redirect('/');
        });
    } else {
        res.redirect('/')
    }
};

  
exports.signupGet=(req,res)=>{
   if(req.session.userId){
    return res.redirect('/home')
   }else{
    if(req.session.invalid){
        res.render('user/signup',{msg:req.session.error})
    }else{
        req.session.invalid=false
        res.render('user/signup',{msg:"", otpVerificationSuccess: req.session.otpVerificationSuccess })
    }
   }
}





exports.loginPost= async (req,res)=>{
       try{
        const check=await userCollection.findOne({email:req.body.email})
        if(check){
            const isPasswordMatch=await bcrypt.compare(req.body.password,check.password)
            if(isPasswordMatch){
                req.session.userId=check;
                console.log(req.session.userId)
                res.redirect('/home')
            }else{
                req.session.invalid=true;
                req.session.errmsg="Incorrect Password"
                res.redirect('/')
            }
        }else{
            req.session.invalid=true
            req.session.errmsg="Invalid User"
            res.redirect('/')
        }
       }catch(err){
        console.log(err)
       }
 
     }

exports.homeGet=async (req,res)=>{
    const products=await productCollection.find().populate('category')
    const category=await categoryCollection.find();
      
    res.render('user/home',{products,category})
} 
exports.shopGet = async (req, res) => {
    const PAGE_SIZE = 6; // Number of products per page
    const page = parseInt(req.query.page) || 1; // Get the page number from query parameters, default to 1 if not provided
    let sort = 1; // Default sorting order

    // Check if sorting order is specified in query parameters
    if (req.query.sort === 'desc') {
        sort = -1; // Set sorting order to descending if specified
    }

    try {
        const count = await productCollection.countDocuments({ blocked: false }); // Get total count of products
        const totalPages = Math.ceil(count / PAGE_SIZE); // Calculate total pages

        const products = await productCollection.find({ blocked: false })
            .populate('category')
            .sort({ price: sort }) // Sort products by price
            .skip((page - 1) * PAGE_SIZE) // Skip products based on page number
            .limit(PAGE_SIZE); // Limit number of products per page

        const categories = await categoryCollection.find();
        const userId = req.session.userId ? req.session.userId._id : null; // Assuming userId is stored in req.session.userId

        res.render("user/shop", { products, categories, userId, totalPages, currentPage: page,req });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};



exports.forgotPassword=async (req,res)=>{
    res.render("user/emailverification")
}










exports.signupPost = async (req, res) => {
    try {
        const userData = {
            name: req.body.username,
            email: req.body.email,
            number: req.body.number,
            confirmpassword: req.body.confirmpassword,
            password: req.body.password,
        };

        // Check if the email already exists in the database
        const existingUser = await userCollection.findOne({ email: userData.email });

        if (userData.name.trim() === "") {
            req.session.error = "space not allowed";
            req.session.invalid = true;
            return res.redirect('/signup');
        }

        if (existingUser) {
            req.session.error = "email already exists";
            req.session.invalid = true;
            return res.redirect('/signup');
        }

        if (userData.confirmpassword === userData.password) {
            // Hashing password
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
            userData.password = hashedPassword;

            // Generate a random 6-digit OTP
            const otpCode = Math.floor(100000 + Math.random() * 900000);

            // Save user data with OTP
            const userWithOtp = {
                ...userData,
                otp: {
                    code: otpCode.toString(),
                    expiration: new Date(Date.now() + 1 * 60 * 1000),
                },
            };
        
            await userCollection.insertMany([userWithOtp]);

            // Send OTP via email
            await sendOtpEmail(userData.email, otpCode);
        // Store email in session for OTP verification
        req.session.verifyEmail = userData.email;

            console.log(userData);

            // Redirect to OTP verification page
            return res.render("user/otpsignup");
        } else {
            req.session.error = "password not matched";
            return res.redirect('/signup');
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error for signup' });
    }
};




let verifyEmail = ""

exports.signupVerifyOtp = async (req, res) => {
    try {
    
        const {  otp } = req.body;
        console.log(otp)
        if(req.session.verifyEmail){
         verifyEmail=req.session.verifyEmail
         console.log(verifyEmail, "this message from signupVerifyOtp side")
        }
        const user = await userCollection.findOne({email:verifyEmail });
      console.log(user,"verifyEmail in verifyOtp")
  
        if (!user) {
           console.log( 'User not found signupVerifyOtp')
        }
  
        // Check if OTP is expired
        if (user.otp.expiration && user.otp.expiration < new Date()) {
            return res.status(401).json({ message: 'OTP has expired' });
        }
  
        // Check if the entered OTP matches the stored OTP
        if (user.otp.code !== otp) {
          console.log('Invalid OTP, Recheck Your OTP')
        return  res.redirect('/signup')
            
        }
  
        // Clear the OTP details after successful verification
        user.otp = {
            code: null,
            expiration: null
        };
  
        await user.save();
  console.log('OTP verified successfully in verifyOtp. Please Login Again')
  req.session.otpVerificationSuccess = true;

        res.redirect('/')
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error while verifying OTP' });
    }
  } 


  //forgot password resend post 
 exports.emailResendOtp = async (req, res) => {
  try {
    if (req.session.verifyEmail) {
      verifyEmail = req.session.verifyEmail;
    }

    const user = await userCollection.findOne({ email: verifyEmail });
      
    if (!user) {
      console.log('User not found emailResendOtp');
    }

    // Check if 60 seconds have passed since the last OTP request
    const lastOtpRequestTime = user.otp.lastRequestTime || 0;
    const currentTime = new Date().getTime();

    if (currentTime - lastOtpRequestTime < 60000) {
      return res.status(429).json({ message: 'Wait for 60 seconds before requesting a new OTP' });
    }

    // Generate a new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000);

    // Set the new OTP in the user document and update the last request time
    user.otp = {
      code: otpCode.toString(),
      expiration: new Date(currentTime + 1 * 60 * 1000),
      lastRequestTime: currentTime
    };
       
    await user.save();

    // Send the new OTP via email
    await sendOtpEmail(verifyEmail, otpCode);
    console.log('New OTP sent successfully');

    res.render('user/otpsignup'); // Redirect to the verification page
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error while resending OTP' });
  }
};









const sendOtpEmail = async (email, otp) => {
    // Replace the following with your nodemailer setup
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'ananthakrishnan053@gmail.com',
            pass: 'kdzqweucncgtxhti'
        }
    });

    const mailOptions = {
        from: 'ananthakrishnan053@gmail.com',
        to: email,
        subject: 'this is the otp',
        text: `Your verification code is: ${otp}`
    };

    return transporter.sendMail(mailOptions);
};


   
exports.productDetails= async (req,res)=>{
    try{
        if(req.session.userId){
const user = req.session.userId
const userId = user._id

            const productId = req.params.productId;
        const product = await productCollection.findById(productId);
        if (!product) {
            // Handle case where product is not found
            return res.status(404).send('Product not found');
        }

        res.render('user/productDetails', { product,userId});
        }
        


    }catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

exports.singleProductGet=(req,res)=>{
    res.render('/user/singleproductpage')
}


exports.forgotPasswordGET=(req,res)=>{
    res.render("user/verifyemail")
}  



     
// Function to generate a random OTP
function generateOTP() {
    // Length of the OTP
    const digits = 6;

    // Possible characters in the OTP
    const characters = '0123456789';

    let OTP = '';
    for (let i = 0; i < digits; i++) {
        OTP += characters[Math.floor(Math.random() * characters.length)];
    }
    return OTP;
}


exports.forgotPasswordPost = async (req, res) => {
    try {
        console.log("entered forgotPasswordPost");
        const { email } = req.body;
        console.log("Email:", email);

        const user = await userCollection.findOne({ email });

        if (!user) {
            console.log("User not found");
            return res.status(404).send("There is no such user.");
        }

        const otp = generateOTP(); // Assuming this function generates an OTP
        const otpExpiry = Date.now() + 300000; // OTP expiry time (5 minutes)

        // Store OTP and expiry time in session
        req.session.resetPasswordOTP = otp;
        req.session.resetPasswordOTPExpires = otpExpiry;

        // Send OTP to user's email (assuming you have a sendOtp function)
        sendOtpEmail(user.email, otp);
        console.log("OTP sent to", user.email, ":", otp);

        // Redirect to the OTP verification page
        res.render("user/otpVerification", { email });
    } catch (error) {
        console.error("Error in forgotPasswordPost:", error);
        res.status(500).send("Server Error");
    }
};
exports.verifyOTP = async (req, res) => {
    try {
        console.log("entered verifyOTP");
        const { email, otp } = req.body;
        console.log("Email:", email);

        // Retrieve OTP and its expiry time from session
        const sessionOTP = req.session.resetPasswordOTP;
        const otpExpiry = req.session.resetPasswordOTPExpires;

        // Check if OTP exists in session and is not expired
        if (!sessionOTP || otpExpiry < Date.now()) {
            console.log("OTP not found or expired in session");
            return res.status(400).send("Invalid or expired OTP.");
        }

        // Remove OTP and expiry time from session
        // delete req.session.resetPasswordOTP;
        // delete req.session.resetPasswordOTPExpires;

        // Retrieve user from database
        const user = await userCollection.findOne({ email });
        console.log("User:", user);

        if (!user) {
            console.log("User not found");
            return res.status(404).send("There is no such user.");
        }

        // Check if the received OTP matches the one stored in the session
        if (sessionOTP !== otp) {
            console.log("Invalid OTP");
            return res.status(400).send("Invalid OTP.");
        }

        // Redirect to set new password page
        res.render("user/newpassword", { email,otp });
    } catch (error) {
        console.error("Error in verifyOTP:", error);
        res.status(500).send("Server Error");
    }
};

exports.setNewPassword = async (req, res) => {
    try {
        console.log("entered into setnewpassword");
        const { email, password, confirmpassword, otp } = req.body;
        
        // Validate if passwords match
        if (password !== confirmpassword) {
            return res.status(400).send("Passwords do not match.");
        }

        // Retrieve OTP and its expiry time from session
        const sessionOTP = req.session.resetPasswordOTP;
        const otpExpiry = req.session.resetPasswordOTPExpires;
  
  console.log(sessionOTP,"here")
  console.log(otpExpiry,"kk");
        // Check if OTP exists in session and is not expired
        if (!sessionOTP || otpExpiry < Date.now()) {
            console.log("OTP not found or expired in session");
            return res.status(400).send("Invalid or expired OTP.");
        }
     console.log(otp,"in setnew")
        // Check if the received OTP matches the one stored in the session
        if (sessionOTP !== otp) {
            console.log("Invalid OTP");
            return res.status(400).send("Invalid OTP.");
        }

        // Find the user by email
        const user = await userCollection.findOne({ email });

        // If user not found, return error
        if (!user) {
            return res.status(404).send("There is no such user.");
        }  

        // Hash the new password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update user's password and remove reset password fields
        user.password = hashedPassword;
        user.resetPasswordOTP = undefined;
        user.resetPasswordOTPExpires = undefined;

        // Save the updated user
        await user.save();

        // Redirect to login page or any other page
        res.redirect("/");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
};



exports.saveAddressPost = async (req, res) => {
    try {
      // Get user ID from request or session
      const userId = req.session.userId
  
      // Create a new address object
      const newAddress = new addressCollection({
        user: userId,
        address:req.body.address, 
        street: req.body.street,
        city: req.body.city,
        state: req.body.state,
        country: req.body.country,
        zipCode: req.body.zipCode
      });
  
      // Save the address to the database
      await newAddress.save();
  
      // Assuming you want to associate the address with the user
      // You can push the address to the user's addresses array
      const user = await userCollection.findById(userId);
      user.addresses.push(newAddress);
      await user.save();
  res.redirect('/checkout?success=true')
    //   res.status(201).json({ message: 'Address saved successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
  exports.deleteAddress = async (req, res) => {
    try {
        const userId = req.session.userId; // Get user ID from session
        const addressId = req.params.addressId; // Get address ID from request parameters

        // Find the address in the address collection
        const address = await addressCollection.findOne({ _id: addressId, user: userId });

        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // Delete the address from the address collection
        await addressCollection.deleteOne({ _id: addressId });

        // Remove the address reference from the user's addresses array
        const user = await userCollection.findById(userId);
        user.addresses = user.addresses.filter(addr => addr.toString() !== addressId.toString());
        await user.save();

        return res.status(200).json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
// Controller to render edit address form with existing address details
exports.editAddressGet = async (req, res) => {
    try {
        const userId = req.session.userId; // Get user ID from session
        const addressId = req.params.id; // Get address ID from request parameters
        
         
        // console.log('hjkhjk',addressId);
        // Find the address in the address collection
        const address = await addressCollection.findOne({ _id: addressId, user: userId });
                                        
        if (!address) {
            return res.status(404).json({ message: 'Address not found' });
        }
                   
        // Render the edit address form with the address details
        res.render('user/addressEdit', { address });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
/////edit controller post
// Controller to handle editing the address
exports.editAddressPost = async (req, res) => {
    try {
        const userId = req.session.userId; // Get user ID from session
        const addressId = req.params.id; // Get address ID from request parameters

        // Update the address in the database
        await addressCollection.findOneAndUpdate(
            { _id: addressId, user: userId }, // Filter criteria
            { $set: { 
                address: req.body.address,
                street: req.body.street,
                city: req.body.city,
                state: req.body.state,
                country: req.body.country,
                zipCode: req.body.zipcode
            }},
            { new: true } // Return the updated document
        );

        // Redirect the user to a success page or another appropriate route
        res.redirect('/checkout'); // Change this to your desired route
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
 exports.sucessOrder=async(req,res)=>{
    res.render("user/sucessOrder")
 }
 exports.userProfileGet = async (req, res) => {
    if (req.session.userId) {
        const userId = req.session.userId;

        try {
            // Find the user's addresses
            const addresses = await addressCollection.find({ user: userId });
            // Find the user 
            const User=await userCollection.findById(userId).populate("addresses")
            // Find the user's orders 
            const Orders = await orderCollection.find({ user: userId })
                .populate('items.product')
                .populate('addresses'); // Populate addresses as well
                console.log(Orders,"oo")

            console.log(User,"user")

             // Log orders to check the retrieved data structure
             console.log(addresses,'add');

            res.render("user/userProfile", { addresses, Orders,User });
        } catch (error) {
            console.error('Error fetching user profile:', error);
            res.status(500).send('Internal Server Error');
        }
    }
};
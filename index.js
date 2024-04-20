// require modules
const express = require('express');
const app = express();
const path=require('path')
const swal = require('sweetalert2');


const session=require('express-session');
const userRouter = require('./routes/userroutes');
const adminRouter=require('./routes/adminroutes')
const crypto=require('crypto');
const bcrypt=require('bcrypt');
const userCollection=require('./model/usermodel')
const categoryCollection=require("./model/catagorymodel")
const productCollection=require("./model/productModel")
const cart=require("./model/cartModel");
const orderCollection=require('./model/oderModel');
const addressCollection=require('./model/addressModel');
const whishListCollection=require('./model/whishList')
const couponCollection=require('./model/couponModel')
const offerCollection=require('./model/offerModel')
const WalletModel=require('./model/walletModel')

const mongoose=require('mongoose');
const env=require('dotenv');
const morgan = require('morgan');
const nodemailer=require("nodemailer");
require('dotenv').config();



// Use Morgan middleware for logging HTTP requests
// app.use(morgan('dev'));



//setting the views
app.set('view engine','ejs');
app.set('views', path.join(__dirname, 'views'));



//using of css files to connect
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({extended:false}))


//applying session
const randomUUID=crypto.randomUUID();
app.use(session({
    secret:randomUUID,
    resave:false,
    saveUninitialized:false
}))


app.use((req,res,next)=>{
    //set cache related headers to control catching behaviour
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate'); // HTTP 1.1.
    res.setHeader('Pragma', 'no-cache'); // HTTP 1.0.
    res.setHeader('Expires', '0'); // Proxies.
    next();
});



//database connecting
//const mongoose=require('mongoose')
mongoose.connect(process.env.MongoDB)
.then((data)=>{
    console.log("mongodb connected");
})
.catch(()=>{
    console.log("failed to connect")
})



app.use('/',userRouter)
app.use('/',adminRouter)


//port settings
const PORT=process.env.PORT || 3000;
app.listen(PORT,()=>{
    console.log("server connect","http://127.0.0.1:3000")
})

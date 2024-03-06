const express = require('express');
const router = express.Router()
const session=require('../middleware/usersession')
const checkBlocked=require("../middleware/userAuth")
const {categoryCollection}=require("../model/catagorymodel")
const {cart}=require("../model/cartModel");
const {addToCart, cartGet,removeFromCart,updateCartItemQuantity}=require('../controller/cartController.js')


const { loginGet, signupGet, loginPost,homeGet, signupPost,logoutGet,singleProductGet, shopGet,signupVerifyOtp,emailResendOtp, forgotPasswordGET, productDetails,forgotPassword,forgotPasswordPost,verifyOTP,setNewPassword,saveAddressPost,deleteAddress,editAddressGet,editAddressPost,sucessOrder,userProfileGet,editUserDetails}=require('../controller/usercontroller')




const{ checkOutGet,placeOrderPost,cancelOrder,returnOrder}=require("../controller/orderController")




  
 


router.get('/',loginGet);
router.post('/',checkBlocked,loginPost)
router.get('/signup',signupGet)
router.post('/signup',signupPost)

router.post('/signupVerifyOtp', signupVerifyOtp);
router.post('/signResendOtp', emailResendOtp);



router.get('/forgotpassword',forgotPassword)
router.post('/forgotpassword', forgotPasswordPost);
router.post('/otpVerification', verifyOTP)
router.post('/setNewPassword', setNewPassword);

router.get('/home',checkBlocked,homeGet)
router.get('/logout',logoutGet)
router.get('/singleProductpage',checkBlocked,singleProductGet)
router.get('/shop',checkBlocked,shopGet)
router.get('/productDetails/:productId',checkBlocked,productDetails)

// router.post('/forgotpassword',forgotPasswordPOST)
router.get('/forgotpassword',forgotPasswordGET)


router.post('/cart',addToCart)
router.get('/cart',checkBlocked,cartGet)
router.post('/cart/remove', removeFromCart);
router.post('/cart/updateQuantity', updateCartItemQuantity);



router.get('/checkout',checkBlocked,checkOutGet)
router.post('/save-address', saveAddressPost);
router.delete('/addresses/:addressId', deleteAddress);
router.get('/addresses/:id', editAddressGet);
router.post('/addresses/:id', editAddressPost);

router.post('/place-order', placeOrderPost);
router.get('/sucessOrder',sucessOrder)


router.get('/userProfile',checkBlocked,userProfileGet)
router.post('/editUser', editUserDetails);
router.post('/cancelOrder/:orderId', cancelOrder);
router.post('/returnOrder/:orderId', returnOrder);


                  

module.exports=router;
  
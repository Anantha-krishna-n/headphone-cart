const express=require('express');
const router=express.Router();
const {categoryCollection}=require("../model/catagorymodel")
const multer=require('multer')
const path=require("path");
const fs = require('fs');




// Configure multer to handle file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/') // Adjust the destination folder as needed
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024, // 1 MB limit
    },
    fileFilter: function (req, file, cb) {
        // Add your file filter logic here
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed.'));
        }
    },
});


const { loginGet, dashboardGet, loginPost,userGet,productManagementGet ,categoryManagementGet ,userBlockedGet, logoutGet,addcatagoryGet,addProductGet,createCategoryPOST,createproductPOST,editproductGET,editproductPOST,editcatagoryPOST,editcatagoryGET,deleteCategory, toggleBlockProduct, orderManagementGet,updateOrderStatus }=require('../controller/admincontroller');



router.get('/admin',loginGet)
router.post('/adminlogin',loginPost)
router.get('/logoutadmin',logoutGet)
router.get('/adminDashboard',dashboardGet)
router.get('/usermanagement',userGet)
router.get('/productManagement',productManagementGet )
router.get('/catagoryManagement',categoryManagementGet )
router.get('/blockUser',userBlockedGet)
router.get('/addcatagory',addcatagoryGet) 
router.get('/addProduct',addProductGet)
router.get('/editproduct/:id',editproductGET)
router.get('/editcatagory/:id',editcatagoryGET)
router.get('/deletecatagory/:id',deleteCategory)

router.post('/editcatagory/:id',upload.fields([{ name: 'logo_image', maxCount: 1 }]),editcatagoryPOST)


router.post('/editproduct/:id',upload.array("image",4), editproductPOST)
router.post('/createProduct',upload.array("image",4),createproductPOST )
router.post('/createCategory',upload.fields([{ name: 'logo_image', maxCount: 1 }]),createCategoryPOST)
router.post('/toggleblockproduct/:id', toggleBlockProduct)



router.get("/orderManagement",orderManagementGet)
router.post('/orders/:orderId/status', updateOrderStatus);


module.exports=router;     



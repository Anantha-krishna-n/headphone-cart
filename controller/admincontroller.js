const { render } = require('ejs');
const {userCollection}=require('../model/usermodel');
const {categoryCollection}=require("../model/catagorymodel")
const {productCollection}=require("../model/productModel")
const {cart}=require("../model/cartModel");
const orderCollection=require('../model/oderModel');
const addressCollection=require('../model/addressModel');


const bcrypt = require("bcrypt");




exports.loginGet=(req,res)=>{
    if(req.session.adminID){
     
        // console.log('from login get dfghj');
        res.render("admin/adminDashboard")
    }else{
        // console.log('from login get jkjkj   ');
        res.render("admin/adminlogin")
    }
}



//post methods 



exports.loginPost=(req,res)=>{
    console.log("gg")
    let admindata={
        adminEmail: "admin@gmail.com",
        passcode:'123'
    };
const {email,password }=req.body;
if(admindata.adminEmail===email && admindata.passcode===password){
    req.session.adminID=true;
    console.log('1sr');
    res.redirect('/adminDashboard');
}else{
req.session.adminID=false
    console.log('2nd');  
    res.render('admin/adminlogin',{wrong:"wrong crentials"})
}
};
 



exports.dashboardGet=(req,res)=>{
    res.render("admin/adminDashboard")

}
exports.logoutGet=(req,res)=>{
    
    if(req.session.adminID){
        req.session.destroy((err)=>{
            if(err){
                console.error("Error",err)
            }
            
        })
        req.session=null;
        res.redirect("/admin")
    }
}


exports.userGet=async (req,res)=>{
    if(req.session.adminID){
        const Users=await userCollection.find();
        res.render("admin/usermanagement",{Users})
        console.log(req.session.adminID,"gggguytftd") 
    }else{
        res.redirect("/admin") 
    }
};
const ITEMS_PER_PAGE = 3; // Number of items per page
exports.categoryManagementGet = async (req, res) => {
    if (req.session.adminID) {
        try {
            const page = parseInt(req.query.page) || 1; // Get current page from query parameter or default to 1
            const totalCategories = await categoryCollection.countDocuments();
            const totalPages = Math.ceil(totalCategories / ITEMS_PER_PAGE);
            const offset = (page - 1) * ITEMS_PER_PAGE;
            const categories = await categoryCollection.find().skip(offset).limit(ITEMS_PER_PAGE);

            res.render("admin/catagoryManagement", { categories, currentPage: page, totalPages });
        } catch (error) {
            console.error("Error fetching categories:", error);
            res.status(500).send("Internal Server Error");
        }
    } else {
        console.log(req.session.adminID, "Category not loading");
        res.redirect("/adminDashboard");
    }
};      






exports.productManagementGet = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Current page number, default to 1 if not provided
        const perPage = 4; // Number of products per page

        // Calculate the number of documents to skip based on the current page
        const skip = (page - 1) * perPage;

        // Fetch products for the current page
        const products = await productCollection.find().skip(skip).limit(perPage).populate('category');

        // Fetch all categories for filtering options, if needed
        const categories = await categoryCollection.find();

        // Calculate total number of products (for pagination)
        const totalProducts = await productCollection.countDocuments();

        res.render('admin/productManagement', { products, categories, currentPage: page, totalPages: Math.ceil(totalProducts / perPage) });
    } catch (error) {
        console.error("Error getting products:", error);
        res.status(500).send("Internal Server Error");
    }
};






exports.userBlockedGet= async (req,res)=>{
try{
    const users=await userCollection.findOne({email:req.query.email});
    const block=users.isBlocked;
    if(block){
        await userCollection.updateOne(
            {email:req.query.email},
            {$set:{isBlocked:false}}
        );
    }else{
        await userCollection.updateOne(
            {email:req.query.email},
            {$set:{isBlocked:true}}
        )
    }
    res.redirect("/usermanagement")
}catch(error){
    console.log(error)
    res.status(500).send("Error occured")
}
};


exports.addcatagoryGet=(req,res)=>{
    res.render("admin/addcatagory")

}

exports.createCategoryPOST = async (req, res) => {
    const { category_name, description } = req.body;
    console.log('name',category_name);
    const logo_image  = req.files['logo_image'] ? req.files['logo_image'][0].path : null;

    try {
        console.log('name',category_name);
        const newCategory = new categoryCollection({category_name,description,logo_image });
        await newCategory.save();
        res.redirect('/catagoryManagement'); // Redirect to the category listing page
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};




exports.addProductGet=async (req,res)=>{
    if(req.session.adminID){
        const catagories=await categoryCollection.find();
        res.render("admin/addProduct",{catagories})
    }
}
  




exports.createproductPOST = async (req, res) => {
    try {
        console.log('Entered to createproductPOST')
      // Check if an admin is logged in
      if (req.session.adminID) {
        
        // console.log('Unauthorized. Please log in.')
        // return res.redirect('/admin')

        const {
            name, 
           description,
           price,
           offer_price,     
           delivery_charge,
           color_status,   
           category,
           quantity,
                } = req.body;

                
                // Get the file paths from the uploaded images
                // const images = req.files['image'] ? req.files['image'].map(file => file.path) : [];
                let images = req.files.map((file)=>{
                   return file.path.substring(6)
                })
                
                console.log('from img' , images);
        
         // Create a new product
         const newProduct = new productCollection({
           name, 
           description,
           price,
           offer_price,
           delivery_charge,
           color_status,   
           category,
           quantity,
           image: images,//assign array of images
         });
        //  console.log(newProduct,'hgjhgjgghvh');
     
         // Save the product to the database
         await newProduct.save();
     
         res.redirect('/productManagement');
       } 

      }catch (error) {
              console.error('Error creating product:', error);
              console.log(error);
              res.send(error.message);
            }
    }





  
    exports.editproductGET = async (req, res) => {
        try {
            const productID = req.params.id;
            const product = await productCollection.findById(productID);
            const products = await productCollection.find().populate('category');
            const catagories = await categoryCollection.find();
    
            res.render('admin/productEdit', { products, catagories, product });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error', error.message);
        }
    };

 
    exports.editproductPOST = async (req, res) => {
        try {
          console.log('Entered to editproductPOST');
      console.log(req.session.adminID,'admin here');
          // Check if an admin is logged in
          if (req.session.adminID) {
            const productId = req.params.id;
      
            const {
              name,
              description,
              price,
              offer_price,
          
              delivery_charge,
              color_status,
              category,
              quantity,
            } = req.body;
      
            // Get the file paths from the uploaded images
            let images = [];
            if (req.files && req.files.length > 0) {
                images = req.files.map((file) => file.path.substring(6));
            }

            console.log('from img', images);
      
            // Find the existing product by ID
            const existingProduct = await productCollection.findById(productId);
      console.log(existingProduct,'ep');

            if (!existingProduct) {
              return res.status(404).send('Product not found');
            }



             // Check if the new name is different from the existing name
             if (name !== existingProduct.name) {
                // Check if a product with the same name already exists
                const duplicateProduct = await productCollection.findOne({ name });

                // If a product with the same name exists and has a different ID, reject the update
                if (duplicateProduct && duplicateProduct._id.toString() !== productId) {
                    return res.status(400).send('<script>alert("product with this name already exists. Please choose a different name."); window.location="/productManagement";</script>');
                }
            }
      
        
            // Update the product details
            existingProduct.name = name;
            existingProduct.description = description;
            existingProduct.price = price;
            existingProduct.offer_price = offer_price;
            // existingProduct.stock_status = stock_status;
            existingProduct.delivery_charge = delivery_charge;
            existingProduct.color_status = color_status;
            existingProduct.category = category;
            existingProduct.quantity=quantity;
            if (images.length > 0) {
                existingProduct.image = images;
            } // Update array of images
      
            // Save the updated product to the database
            await existingProduct.save();
      
            res.redirect('/productManagement');
          }
          console.log("hkhkh");
        } catch (error) {
          console.error('Error editing product:', error);
          console.log(error);
          res.send(error.message);
        }
      };





  exports.editcatagoryGET=async (req,res)=>{
    const catagoryID=req.params.id
    const catagories=await categoryCollection.findById(catagoryID)


    res.render("admin/editcatagory",{catagories})
  }


  exports.editcatagoryPOST = async (req, res) => {
    try {
        
        const categoryId = req.params.id;
                
        // Fetch the user's details by ID
        const catId = await categoryCollection.findById(categoryId);
        const {category_name, description} = req.body;
        // console.log(req.body);
        
        // Get the existing category by ID
        const existingCategory = await categoryCollection.findOne({category_name : catId.category_name});
  
        if (!existingCategory) {
            return res.status(404).send('Category not found for update');
        } 
         //find any catagoryname exist
        // const duplicateCategory = await categoryCollection.findOne({
        //     category_name: category_name,
        //     _id: { $ne: existingCategory._id }
        // });

        if (existingCategory) {
            return res.status(400).send('<script>alert("Category with this name already exists. Please choose a different name."); window.location="/catagoryManagement";</script>');
        }
        
        const logo_imagePath = req.files['logo_image'] ? req.files['logo_image'][0].path : existingCategory.logo_image;
        
        if (logo_imagePath !== existingCategory.logo_image) {
            fs.unlinkSync(logo_imagePath); // Delete the invalid image
            return res.status(400).send('Invalid image dimensions. Please upload images that meet the criteria.');
        }
        
        // Update the existing category
        existingCategory.categoryname = categoryname;
        existingCategory.description = description;
        existingCategory.logo_image = logo_imagePath;
        
        // Save the updated category to the database
        await existingCategory.save();
        
        res.redirect('/catagoryManagement');
    } catch (error) {
        console.error('Error updating category:', error.message);
        res.status(500).send('Internal Server Error for Updating',error.message);
    }
};
// delete catagory

exports.deleteCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;

        // Fetch the category by ID
        const categoryToDelete = await categoryCollection.findById(categoryId);

        if (!categoryToDelete) {
            return res.status(404).send('Category not found for deletion');
        }

        // Delete the category from the database
        await categoryCollection.deleteOne({ _id: categoryId });

        res.redirect('/catagoryManagement'); // Redirect to the category management page after deletion
    } catch (error) {
        console.error('Error deleting category:', error.message);
        res.status(500).send('Internal Server Error for Deletion', error.message);
    }
}

exports.toggleBlockProduct=async(req, res)=> {
    const productId = req.params.id;

    try {
        const product = await productCollection.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Toggle the block status
        product.blocked = !product.blocked;
        await product.save();

        const action = product.blocked ? 'blocked' : 'unblocked';
        res.json({ success: true, message: `Product ${action} successfully` });
    } catch (error) {
        console.error('Error toggling block status:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}     

    

exports.orderManagementGet = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Current page number, default to 1 if not provided
        const perPage = 5; // Number of orders per page

        // Calculate the number of documents to skip based on the current page
        const skip = (page - 1) * perPage;

        // Fetch orders for the current page
        const orders = await orderCollection.find().skip(skip).limit(perPage).populate('user').populate('items.product').populate('addresses');

        // Calculate total number of orders (for pagination)
        const totalOrders = await orderCollection.countDocuments();

        res.render('admin/orderManagement', { orders, currentPage: page, totalPages: Math.ceil(totalOrders / perPage) });
    } catch (error) {
        console.error("Error getting orders:", error);
        res.status(500).send("Internal Server Error");
    }
};

exports.updateOrderStatus = async (req, res) => {
    console.log("update");
    const { orderId } = req.params;
    const { status } = req.body;

    try {
        // Update order status in the database
        await orderCollection.findByIdAndUpdate(orderId, { status }, { new: true });

        // Respond with success message
        res.json({ success: true, message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};
  
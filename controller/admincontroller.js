const { render } = require("ejs");
const { userCollection } = require("../model/usermodel");
const { categoryCollection } = require("../model/catagorymodel");
const { productCollection } = require("../model/productModel");
const { cart } = require("../model/cartModel");
const orderCollection = require("../model/oderModel");
const addressCollection = require("../model/addressModel");
const whishListCollection = require("../model/whishList");
const couponCollection = require("../model/couponModel");
const bannerCollection = require("../model/bannerModel");
const offerCollection = require("../model/offerModel");
const WalletModel = require("../model/walletModel");

const bcrypt = require("bcrypt");

exports.loginGet = (req, res) => {
  if (req.session.adminID) {
    // console.log('from login get dfghj');
    res.render("admin/adminDashboard");
  } else {
    // console.log('from login get jkjkj   ');
    res.render("admin/adminlogin");
  }
};

//post methods

exports.loginPost = (req, res) => {
  let admindata = {
    adminEmail: process.env.AdminId,
    passcode: process.env.AdminPass,
  };
  const { email, password } = req.body;
  if (admindata.adminEmail === email && admindata.passcode === password) {
    req.session.adminID = true;
    res.redirect("/adminDashboard");
  } else {
    req.session.adminID = false;
    res.render("admin/adminlogin", { wrong: "wrong crentials" });
  }
};

exports.dashboardGet = async (req, res) => {
  try {
    // Retrieve monthly total revenue data
    const monthlyTotalRevenue = await orderCollection.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            $lte: new Date(),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" }, // Sum the total price of orders
        },
      },
    ]);

    // Retrieve yearly total revenue data
    const yearlyTotalRevenue = await orderCollection.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(new Date().getFullYear(), 0, 1),
            $lte: new Date(),
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" }, // Sum the total price of orders
        },
      },
    ]);

    // Fetch top 5 most sold products with their quantities
    const top5Products = await orderCollection.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalQuantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
    ]);
    // fetch the category also
    const top5Categories = await productCollection.aggregate([
      { $match: { _id: { $in: top5Products.map((product) => product._id) } } },
      { $unwind: "$category" },
      { $group: { _id: "$category", totalQuantity: { $sum: "$quantity" } } },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
    ]);

    // Extract product IDs from top 5 products
    const productIds = top5Products.map((product) => product._id);

    // Fetch product details for the top 5 products
    const top5ProductDetails = await productCollection.find({
      _id: { $in: productIds },
    });

    // Create an object to map product IDs to product names
    const productIdToNameMap = {};
    top5ProductDetails.forEach((product) => {
      productIdToNameMap[product._id.toString()] = product.name;
    });

    // Map product IDs to product names
    const top5ProductNames = top5Products.map(
      (product) => productIdToNameMap[product._id.toString()]
    );
    const top5ProductQuantities = top5Products.map(
      (product) => product.totalQuantity
    );

    //map category ID's to category names
    const productsIds = top5Categories.map((category) => category._id);
    const top5CategoryDetails = await categoryCollection.find({
      _id: { $in: productsIds },
    });
    const categoryIdToNameMap = {};
    top5CategoryDetails.forEach((category) => {
      categoryIdToNameMap[category._id.toString()] = category.category_name;
    });
    const top5CategoryQuantities = top5Categories.map(
      (category) => category.totalQuantity
    );

    // Map category IDs to category names
    const top5CategoryNames = top5Categories.map(
      (category) => categoryIdToNameMap[category._id.toString()]
    );

    // Extract total revenue from aggregation results
    const monthlyTotalRevenueAmount =
      monthlyTotalRevenue.length > 0 ? monthlyTotalRevenue[0].totalRevenue : 0;
    const yearlyTotalRevenueAmount =
      yearlyTotalRevenue.length > 0 ? yearlyTotalRevenue[0].totalRevenue : 0;

    // Render admin dashboard view with data
    res.render("admin/adminDashboard", {
      monthlyTotalRevenue: monthlyTotalRevenueAmount,
      yearlyTotalRevenue: yearlyTotalRevenueAmount,
      top5ProductNames: top5ProductNames,
      top5ProductQuantities: top5ProductQuantities,
      top5CategoryNames: top5CategoryNames,
      top5CategoryQuantities: top5CategoryQuantities,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.logoutGet = (req, res) => {
  if (req.session.adminID) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error", err);
      }
    });
    req.session = null;
    res.redirect("/admin");
  }
};

exports.userGet = async (req, res) => {
  if (req.session.adminID) {
    const Users = await userCollection.find();
    res.render("admin/usermanagement", { Users });
  } else {
    res.redirect("/admin");
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
      const categories = await categoryCollection
        .find()
        .skip(offset)
        .limit(ITEMS_PER_PAGE);

      res.render("admin/catagoryManagement", {
        categories,
        currentPage: page,
        totalPages,
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
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
    const products = await productCollection
      .find()
      .skip(skip)
      .limit(perPage)
      .populate("category");

    // Fetch all categories for filtering options, if needed
    const categories = await categoryCollection.find();

    // Calculate total number of products (for pagination)
    const totalProducts = await productCollection.countDocuments();

    res.render("admin/productManagement", {
      products,
      categories,
      currentPage: page,
      totalPages: Math.ceil(totalProducts / perPage),
    });
  } catch (error) {
    console.error("Error getting products:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.userBlockedGet = async (req, res) => {
  try {
    const users = await userCollection.findOne({ email: req.query.email });
    const block = users.isBlocked;
    if (block) {
      await userCollection.updateOne(
        { email: req.query.email },
        { $set: { isBlocked: false } }
      );
    } else {
      await userCollection.updateOne(
        { email: req.query.email },
        { $set: { isBlocked: true } }
      );
    }
    res.redirect("/usermanagement");
  } catch (error) {
    console.log(error);
    res.status(500).send("Error occured");
  }
};

exports.addcatagoryGet = (req, res) => {
  res.render("admin/addcatagory");
};
const fs = require('fs');

exports.createCategoryPOST = async (req, res) => {
  const { category_name, description } = req.body;
  console.log("name", category_name);
  let  logo_image = req.files["logo_image"]
    ? req.files["logo_image"][0].path
    : null;



  try {
    // Check if a category with the same name already exists
 logo_image = logo_image.replace(/\\/g, "/");
    const existingCategory = await categoryCollection.findOne({
      category_name,
    });
    if (existingCategory) {
      // Category with the same name already exists
      return res
        .status(400)
        .send(
          '<script>alert("Category with this name already exists. Please choose a different name."); window.location="/catagoryManagement";</script>'
        );
    }
    const newCategory = new categoryCollection({
      category_name,
      description,
      logo_image,
    });
    await newCategory.save();
    res.redirect("/catagoryManagement"); // Redirect to the category listing page
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};




exports.addProductGet = async (req, res) => {
  if (req.session.adminID) {
    const catagories = await categoryCollection.find();
    res.render("admin/addProduct", { catagories });
  }
};

exports.createproductPOST = async (req, res) => {
  try {
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
      let images = req.files.map((file) => {
        return file.path.substring(6);
      });

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
        image: images, //assign array of images
      });

      // Save the product to the database
      await newProduct.save();

      res.redirect("/productManagement");
    }
  } catch (error) {
    console.error("Error creating product:", error);
    console.log(error);
    res.send(error.message);
  }
};

exports.deleteProductImage = async (req, res) => {
  
  try {
    const productId = req.params.productId;
    const imageIndex = req.params.imageIndex; // Assuming you pass the image index in the URL

    // Find the product by ID
    const product = await productCollection.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    // Remove the image from the array based on the index
    product.image.splice(imageIndex, 1);

    // Save the updated product
    await product.save();

    res.status(200).json({ success: true, message: "Image deleted successfully" })

  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

exports.editproductGET = async (req, res) => {
  try {
    const productID = req.params.id;
    const product = await productCollection.findById(productID);
    const products = await productCollection.find().populate("category");
    const catagories = await categoryCollection.find();

    res.render("admin/productEdit", { products, catagories, product });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error", error.message);
  }
};

exports.editproductPOST = async (req, res) => {
  try {
    // Check if an admin is logged in
    if (req.session.adminID) {
      const productId = req.params.id;

      const {
        name,
        description,
        price,
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

      console.log("from img", images);

      // Find the existing product by ID
      const existingProduct = await productCollection.findById(productId);

      if (!existingProduct) {
        return res.status(404).send("Product not found");
      }

      // Check if the new name is different from the existing name
      if (name !== existingProduct.name) {
        // Check if a product with the same name already exists
        const duplicateProduct = await productCollection.findOne({ name });

        // If a product with the same name exists and has a different ID, reject the update
        if (duplicateProduct && duplicateProduct._id.toString() !== productId) {
          return res
            .status(400)
            .send(
              '<script>alert("product with this name already exists. Please choose a different name."); window.location="/productManagement";</script>'
            );
        }
      }

      // Update the product details
      existingProduct.name = name;
      existingProduct.description = description;
      existingProduct.price = price;
      // existingProduct.stock_status = stock_status;
      existingProduct.delivery_charge = delivery_charge;
      existingProduct.color_status = color_status;
      existingProduct.category = category;
      existingProduct.quantity = quantity;
      if (images.length > 0) {
        existingProduct.image = existingProduct.image.concat(images);
      } // Update array of images
      

      // Save the updated product to the database
      await existingProduct.save();

      res.redirect("/productManagement");
    }
  } catch (error) {
    console.error("Error editing product:", error);
    console.log(error);
    res.send(error.message);
  }
};   

exports.editcatagoryGET = async (req, res) => {
  const catagoryID = req.params.id;
  const catagories = await categoryCollection.findById(catagoryID);

  res.render("admin/editcatagory", { catagories });
};



exports.editcatagoryPOST = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Fetch the category details by ID
    const existingCategory = await categoryCollection.findById(categoryId);
    if (!existingCategory) {
      return res.status(404).send("Category not found for update");
    }

    // Extract updated details from the request body
    const { categoryname, description } = req.body;

    // Check if the category name is being updated and it already exists
    if (existingCategory.category_name !== categoryname) {

      const duplicateCategory = await categoryCollection.findOne({  category_name: categoryname});
      if (duplicateCategory) {
        return res.status(400).send(`<script>
          alert("Category with this name already exists. Please choose a different name.");
          window.location="/catagoryManagement";
        </script>`);
      }
    }

    // Determine the new logo image path
    let logo_imagePath = existingCategory.logo_image;
    if (req.files && req.files["logo_image"]) {
      logo_imagePath = req.files["logo_image"][0].path;
    }

    // Update category details
    existingCategory.category_name = categoryname;
    existingCategory.description = description;
    existingCategory.logo_image = logo_imagePath;

    // Save the updated category to the database
    await existingCategory.save();

    // If the logo image has been changed, delete the old image file
    // if (req.files && req.files["logo_image"]) {
    //   fs.unlinkSync(existingCategory.logo_image); // Delete the old image file
    // }
 
    res.redirect("/catagoryManagement");
  } catch (error) {
    console.error("Error updating category:", error.message);
    res.status(500).send("Internal Server Error for Updating", error.message);
  }
};










// delete catagory

exports.deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Fetch the category by ID
    const categoryToDelete = await categoryCollection.findById(categoryId);

    if (!categoryToDelete) {
      return res.status(404).send("Category not found for deletion");
    }

    // Delete the category from the database
    await categoryCollection.deleteOne({ _id: categoryId });

    res.redirect("/catagoryManagement"); // Redirect to the category management page after deletion
  } catch (error) {
    console.error("Error deleting category:", error.message);
    res.status(500).send("Internal Server Error for Deletion", error.message);
  }
};

exports.toggleBlockProduct = async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await productCollection.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Toggle the block status
    product.blocked = !product.blocked;
    await product.save();

    const action = product.blocked ? "blocked" : "unblocked";
    res.json({ success: true, message: `Product ${action} successfully` });
  } catch (error) {
    console.error("Error toggling block status:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.orderManagementGet = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; // Current page number, default to 1 if not provided
    const perPage = 5; // Number of orders per page

    // Calculate the number of documents to skip based on the current page
    const skip = (page - 1) * perPage;

    // Fetch orders for the current page
    const orders = await orderCollection
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(perPage)
      .populate("user")
      .populate("items.product")
      .populate("addresses");

    // Calculate total number of orders (for pagination)
    const totalOrders = await orderCollection.countDocuments();

    res.render("admin/orderManagement", {
      orders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / perPage),
    });
  } catch (error) {
    console.error("Error getting orders:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    // Update order status in the database
    await orderCollection.findByIdAndUpdate(orderId, { status }, { new: true });

    // Respond with success message
    res.json({ success: true, message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const { userCollection } = require("../model/usermodel");
const { categoryCollection } = require("../model/catagorymodel");
const { productCollection } = require("../model/productModel");
const cartCollection = require("../model/cartModel");
const orderCollection = require("../model/oderModel");
const addressCollection = require("../model/addressModel");
const whishListCollection = require("../model/whishList");
const couponCollection = require("../model/couponModel");
const offerCollection = require("../model/offerModel");
const WalletModel = require("../model/walletModel");

exports.offerManagementGet = async (req, res) => {
  const perPage = 4; // Number of offers per page
  const page = parseInt(req.query.page) || 1; // Current page number, default to 1

  try {
    const totalOffers = await offerCollection.countDocuments(); // Get total number of offers
    const totalPages = Math.ceil(totalOffers / perPage); // Calculate total number of pages

    const offers = await offerCollection
      .find()
      .skip((page - 1) * perPage) // Skip offers based on page number
      .limit(perPage); // Limit number of offers per page

    res.render("admin/offerManagement", { offers, page, totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.addofferGet = async (req, res) => {
  try {
    let allProducts = await productCollection.find();
    let allCategory = await categoryCollection.find();

    res.render("admin/addoffer", { allProducts, allCategory });
  } catch (error) {
    console.log("Error in addoffer Get", error);
  }
};
exports.addofferPOst = async (req, res) => {
  try {
    let allProducts = await productCollection.find();
    let allCategory = await categoryCollection.find();
    let addBy = req.body.addBy;
    let newoffer;

    if (addBy == "product") {
      const existingProduct = await offerCollection.findOne({
        productName: req.body.product,
      });

      if (existingProduct) {
        return res.render("admin/addoffer", {
          allProducts,
          allCategory,
          msg: "Offer already added",
        });
      } else {
        // Fetch the product to calculate the offer percentage
        const product = await productCollection.findOne({
          name: req.body.product,
        });
        const originalPrice = product.price;

        newoffer = new offerCollection({
          productName: req.body.product,
          discount: req.body.discount,
          percentage: ((req.body.discount / originalPrice) * 100).toFixed(2), // Calculate offer percentage
          expiryDate: req.body.expiryDate,
        });
      }
    } else if (addBy == "category") {
      const category = await categoryCollection.findOne({
        category_name: req.body.category,
      });

      if (!category) {
        return res.render("admin/addoffer", {
          allProducts,
          allCategory,
          msg: "Category not found",
        });
      }

      const existingCategory = await offerCollection.findOne({
        categoryName: category.category_name,
      });
      if (existingCategory) {
        return res.render("admin/addoffer", {
          allProducts,
          allCategory,
          msg: "Offer already added for this category",
        });
      } else {
        // Fetch products in the category to calculate the offer percentage
        const categoryProducts = await productCollection.find({
          category: category._id,
        });
        const originalTotalPrice = categoryProducts.reduce(
          (total, product) => total + product.price,
          0
        );

        newoffer = new offerCollection({
          categoryName: category.category_name,
          discount: req.body.discount,
          percentage: ((req.body.discount / originalTotalPrice) * 100).toFixed(
            2
          ), // Calculate offer percentage
          expiryDate: req.body.expiryDate,
        });
      }
    }

    await newoffer.save();
    res.redirect("/offerManagement");
  } catch (error) {
    console.log("Error in the Add offer Post", error);
  }
};

exports.editofferGet = async (req, res) => {
  try {
    const offerid = req.params._id;
    const selectedOffer = await offerCollection.findById(offerid);
    res.render("admin/editoffer", { selectedOffer });
  } catch (error) {
    console.log(error);
  }
};

exports.editofferPost = async (req, res) => {
  try {
    const offerid = req.params._id;

    const updateoffer = await offerCollection.findByIdAndUpdate(offerid, {
      discount: req.body.discount,
      count: req.body.count,
      expiryDate: req.body.expiryDate,
    });
    res.redirect("/offerManagement");
  } catch (error) {
    console.log("Error in edit coupon post", error);
  }
};

exports.toggleOffer = async (req, res) => {
  try {
    const offerId = req.params.id; // Get the offer ID from the request parameters
    const action = req.query.action; // Get the action (list/unlist) from the query parameters

    // Find the offer by ID
    const offer = await offerCollection.findById(offerId);


    // Check if the offer exists
    if (!offer) {
      return res.status(404).send("Offer not found");
    }
    // Toggle the isActive field based on the action
    offer.isActive = action === "list";

    await offer.save(); // Save the updated offer

    // Respond with success message or any other data if needed
    res.status(200).send("Offer status updated successfully");
  } catch (error) {
    console.log("Error toggling offer:", error);
    res.status(500).send("Error toggling offer");
  }
};

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
      .limit(perPage) // Limit number of offers per page
      .populate('product','name') // Populate the product field
      .populate('category','category_name'); // Populate the category field
console.log(offers)
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
exports.addofferPost = async (req, res) => {
  try {
    let addBy = req.body.addBy;
    let newOffer;

    if (addBy === "product") {
      const product = await productCollection.findOne({ name: req.body.product });

      if (!product) {
        return res.render("admin/addoffer", {
          msg: "Product not found",
        });
      }

      newOffer = new offerCollection({
        product: product._id,
        discount: req.body.discount,
        expiryDate: req.body.expiryDate,
      });
    } else if (addBy === "category") {
      const category = await categoryCollection.findOne({ category_name: req.body.category });

      if (!category) {
        return res.render("admin/addoffer", {
          msg: "Category not found",
        });
      }

      newOffer = new offerCollection({
        category: category._id,
        discount: req.body.discount,
        expiryDate: req.body.expiryDate,
      });
    }

    await newOffer.save();
    res.redirect("/offerManagement");
  } catch (error) {
    console.log("Error in the Add offer Post", error);
    res.status(500).json({ message: 'Internal Server Error' });
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
  const { offerId } = req.params;
  const { action } = req.query;
 console.log(offerId,"in the controller")
  try {
    console.log("enetred.. into unlist")
    const offer = await offerCollection.findById(offerId);
     console.log(offer,"is offer.")
    if (!offer) {
      return res.status(404).json({ message: "Offer not found" });
    }

    offer.isActive = action === "list";

    await offer.save();

    res.json({ message: `Offer ${action === "list" ? "listed" : "unlisted"} successfully` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


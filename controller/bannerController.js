const { userCollection } = require("../model/usermodel");
const { categoryCollection } = require("../model/catagorymodel");
const { productCollection } = require("../model/productModel");
const cartCollection = require("../model/cartModel");
const orderCollection = require("../model/oderModel");
const addressCollection = require("../model/addressModel");
const whishListCollection = require("../model/whishList");
const couponCollection = require("../model/couponModel");
const bannerCollection = require("../model/bannerModel");
const offerCollection = require("../model/offerModel");
const WalletModel = require("../model/walletModel");

exports.bannerManagementGet = async (req, res) => {
  try {
    const banners = await bannerCollection.find(); // Fetch all banners from the database
    res.render("admin/bannerManagement", { banners }); // Pass banners to the EJS template
  } catch (error) {
    console.error(error);
    res.status(500).send("Error in getting banners");
  }
};
exports.addbannerGet = async (req, res) => {
  res.render("admin/addbanner");
};

exports.addbannerPost = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files were uploaded.");
    }

    let img = req.files.map((val) => {
      return val.filename;
    });

    const banner = new bannerCollection({
      bannerImage: img,
      bannerTitle: req.body.bannerTitle,
      bannerSubTitle: req.body.bannerSubTitle,
      bannerUrl: req.body.bannerUrl,
    });

    await banner.save();
    res.redirect("/bannerManagement");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error while adding a new banner");
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const bannerId = req.params.id;
    // Find the banner by ID and delete it
    const deletedBanner = await bannerCollection.findByIdAndDelete(bannerId);
    if (!deletedBanner) {
      // If banner with given ID is not found, send error response
      return res.status(404).send("Banner not found");
    }
    // Send success response
    res.status(200).send("Banner deleted successfully");
  } catch (error) {
    console.error("Error deleting banner:", error);
    // Send error response
    res.status(500).send("Error deleting banner");
  }
};

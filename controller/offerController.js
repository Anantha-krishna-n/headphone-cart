



const { userCollection } = require("../model/usermodel");
const { categoryCollection } = require("../model/catagorymodel");
const { productCollection } = require("../model/productModel");
const cartCollection = require("../model/cartModel");
const orderCollection = require("../model/oderModel");
const addressCollection = require("../model/addressModel");
const whishListCollection=require('../model/whishList')
const couponCollection=require('../model/couponModel')
const offerCollection=require('../model/offerModel')
const WalletModel=require('../model/walletModel')







exports.offerManagementGet= async (req,res)=>{
    res.render("admin/offerManagement")
}
exports.addofferGet=async (req,res)=>{
    try {
        let allProducts = await productCollection.find()
        let allCategory = await categoryCollection.find()

        res.render('admin/addoffer',{allProducts,allCategory}) 
    } catch (error) {
        console.log('Error in addoffer Get',error);
    }  
}
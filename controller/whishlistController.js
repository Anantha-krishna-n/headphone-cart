const { userCollection } = require("../model/usermodel");
const { categoryCollection } = require("../model/catagorymodel");
const { productCollection } = require("../model/productModel");
const cartCollection = require("../model/cartModel");
const orderCollection=require('../model/oderModel');
const addressCollection=require('../model/addressModel');
const whishListCollection=require('../model/whishList')
const couponCollection=require('../model/couponModel')
const offerCollection=require('../model/offerModel')
const WalletModel=require('../model/walletModel')




// const Wishlist = require('../model/whishList'); // Import the Wishlist model
exports.addToWishlist = async (req, res) => {
    try {
        console.log(req.session.userId,"session")
        const { userId, productId } = req.body;

        // Check if the product is already in the wishlist
        const existingWishlist = await whishListCollection.findOne({ userId });
        if (existingWishlist) {
            if (existingWishlist.items.some(item => item.productId.equals(productId))) {
                return res.status(400).json({ message: 'Product already in wishlist' });
            } else {
                existingWishlist.items.push({ productId }); // Push productId as an object
                await existingWishlist.save();
                return res.status(200).json({ message: 'Product added to wishlist successfully' });
            }
        } else {
            // If wishlist doesn't exist for the user, create a new wishlist
            const newWishlist = new Wishlist({
                userId,
                items: [{ productId }] // Push productId as an object
            });
            await newWishlist.save();
            return res.status(200).json({ message: 'Product added to wishlist successfully' });
        }                 
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

exports.WishlistGet=async(req,res)=>{
    try{
        if (!req.session.userId) {
            return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
  
        const userId = req.session.userId._id;
        const wishlist = await whishListCollection.findOne({ userId: userId }).populate("items.productId");
    
 
        res.render("user/wishlist",{wishlist,userId})
    }catch (error) {
        console.error("Error getting cart:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
}
exports.removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.session.userId; // Assuming you're using sessions

        // Find the wishlist item and remove it
        const wishlist = await whishListCollection.findOneAndUpdate(
            { userId },
            { $pull: { items: { productId } } },
            { new: true }
        );
   
        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }

        return res.status(200).json({ message: 'Product removed from wishlist successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
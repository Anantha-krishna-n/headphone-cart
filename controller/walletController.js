const { userCollection } = require("../model/usermodel");
const {categoryCollection}=require("../model/catagorymodel")
const {productCollection}=require("../model/productModel")
const {cart}=require("../model/cartModel");
const orderCollection=require('../model/oderModel');
const addressCollection=require('../model/addressModel');
const whishListCollection=require('../model/whishList')
const bannerCollection=require('../model/bannerModel')
const offerCollection=require('../model/offerModel')
const WalletModel=require('../model/walletModel')


exports.addToWallet = async (req, res) => {
    const userId = req.session.userId; // Access userId from the session or wherever it's stored

    try {
      if(!user){
        res.status(400).send("usernot found")
      }
      const order=await orderCollection.findOne({userId:userId})
      orderTotal=order.totalprice
      console.log(order.totalprice,"hgf")
      const walletCheck=await WalletModel.find({userId:userId})
      if(!walletCheck){
        return res.status(404).send({ message: "Wallet not found." });
      }else{
        let walletAmount = await WalletModel.findOne({ userId }, { balance: 1 });
  
        if(walletAmount.balance>=orderTotal)
        {
            
            await WalletModel.findOneAndUpdate(
                {userId:userId},
                {$inc:{balance:-orderTotal}},
                {new:true,upsert:true}
            );
            await WalletModel.findOneAndUpdate(
                {userId:userId},
                {
                    $push:{
                        wallethistory:{
                            process:"Debited for wallet payment",
                            amount:orderTotal,
                            date:Date.now(),
                        }
                    }
                },
                {new:true}
            );
            return res.status(200).send({ message: "Sufficient balance." });
            } else {
            // Send an error response
            return res.status(400).send({ message: "Insufficient balance." });
            }
      }

        
    } catch (error) {
        // If any error occurs, log the error and send an error response
        console.error('Error adding amount to wallet:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};
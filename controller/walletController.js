const { userCollection } = require("../model/usermodel");
const { categoryCollection } = require("../model/catagorymodel");
const { productCollection } = require("../model/productModel");
const { cart } = require("../model/cartModel");
const orderCollection = require("../model/oderModel");
const addressCollection = require("../model/addressModel");
const whishListCollection = require("../model/whishList");
const bannerCollection = require("../model/bannerModel");
const offerCollection = require("../model/offerModel");
const WalletModel = require("../model/walletModel");

exports.addToWallet = async (req, res) => {
  const userId = req.session.userId; // Access userId from the session or wherever it's stored
  const orderId = req.body.orderId; // Access orderId from the request body

  try {
    // Find the order by userId and orderId
    const order = await orderCollection.findOne({ user: userId, _id: orderId });

    if (!order) {
      return res.status(404).send({ message: "Order not found for the user." });
    }

    // Calculate the order total price
    const orderTotal = order.total;

    // Find the wallet for the user
    const wallet = await WalletModel.findOne({ user: userId });

    if (!wallet) {
      return res.status(404).send({ message: "Wallet not found." });
    }

    // Check if the wallet balance is sufficient
    if (wallet.balance >= orderTotal) {
      // Deduct the order total from the wallet balance
      wallet.balance -= orderTotal;
      // Push the transaction details to the wallet history
      wallet.wallethistory.push({
        process: `Debited for order ${orderId}`,
        amount: orderTotal,
        date: Date.now(),
        orderId: orderId, // Add orderId to the transaction details
      });

      // Save the updated wallet
      await wallet.save();

      return res.status(200).send({ message: "Sufficient balance." });
    } else {
      return res.status(400).send({ message: "Insufficient balance." });
    }
  } catch (error) {
    // If any error occurs, log the error and send an error response
    console.error("Error adding amount to wallet:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

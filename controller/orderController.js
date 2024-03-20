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


const Razorpay=require("razorpay")

const { render } = require("ejs");





exports.checkOutGet = async (req, res) => {
    try {
        req.session.addressOrigin = "checkout";

        console.log("entered into check out")
        if (req.session.userId) {
            // Find the user's cart
            const cart = await cartCollection.findOne({ userId: req.session.userId }).populate('items.productId');
            console.log(cart,'gd');
             // Find the user's address
             const addresses = await addressCollection.find({ user: req.session.userId });
              // Retrieve available coupons
        const coupons = await couponCollection.find();

            if (cart&& addresses) {
                res.render('user/checkOut', { userId: req.session.userId,cart,addresses,coupons}); // Pass the cart details to the checkout page
            } else {
                res.status(404).send('Cart not found');
            }
        } else {
            res.status(401).send('Unauthorized'); // User not logged in
        }
    } catch (error) {
        console.error('Error retrieving cart:', error);
        res.status(500).send('Internal Server Error');
    }
};

exports.placeOrderPost = async (req, res) => {
    try {
        console.log("enter to place order");
        const { addressId, paymentMethod } = req.body; // Get addressId and paymentMethod from the request body
        const userId = req.session.userId;

        console.log(addressId, "addressId");
        console.log(userId, "userId");
        console.log(paymentMethod,"payment");

        // Validate the received data
        if (!userId || !addressId || !paymentMethod) {
            return res.status(400).json({ success: false, error: 'Missing required data' });
        }

        // Retrieve the user's cart
        const cart = await cartCollection.findOne({ userId: userId });
        console.log(cart.items, 'items');

        // Validate cart
        if (!cart) {
            return res.status(404).json({ success: false, error: 'Cart not found' });
        }
   
        const totalprice = cart.totalprice;
        console.log(totalprice, "real");

        // Create a new order document
        const order = new orderCollection({
            user: userId,
            addresses: addressId,
            items: cart.items.map(item => ({
                product: item.productId, 
                quantity: item.qty
                
            })),
            total: totalprice,
            paymentMethod: paymentMethod,
            status: "pending" // Setting a default status 
        }); 
        
        console.log(order, "order");


        // Save the new order to the database
        await order.save();

             // Update product quantity based on items in the cart
             for (const item of cart.items) {
                await productCollection.findOneAndUpdate(
                    { _id: item.productId },
                    { $inc: { quantity: -item.qty } } // Decrease quantity by item.qty
                );
            }

        // Clear the user's cart after placing the order
        await cartCollection.findOneAndDelete({ userId: userId });
        res.json({response:true})

    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};
exports.cancelOrder = async (req, res) => {
    const orderId = req.params.orderId;
    const userId=req.session.userId

    try {
        console.log("entered into the cancel")
        // Find the order by ID
        const order = await orderCollection.findById(orderId);
           console.log(order,"hah");
        // Check if the order exists
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

       

        // Update the order status to 'cancelled'
        order.status = 'cancelled';
        await order.save();
        
        for (const item of order.items) {
            await productCollection.findOneAndUpdate(
                { _id: item.product },
                { $inc: { quantity: item.quantity } } // Increase quantity by item.quantity
            );
        }

        if(order.paymentMethod!='cashOnDelivery'){
            await WalletModel.findOneAndUpdate(
                {user:userId},
                {$inc:{balance:order.total}},
                {new:true,upsert:true}
            );
            await WalletModel.findOneAndUpdate(
                {user:userId},
                {
                    $push:{
                        wallethistory:{
                            process:"Refund for Cancelled Order",
                            amount:order.total,
                            date:Date.now()

                        }
                    }
                }, 
                {new:true}
            );
        }



        // Respond with success message
        res.status(200).json({ success: true, message: 'Order canceled successfully' });

    } catch (error) {
        console.error('Error canceling order:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};
exports.returnOrder = async (req, res) => {
    const orderId = req.params.orderId;

    try {
        const order = await orderCollection.findById(orderId);

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.status !== 'success') {
            return res.status(400).json({ success: false, message: 'Order cannot be returned as it is not in success status' });
        }

        order.status = 'returned';
        await order.save();

            // Update product quantity based on items in the order
            for (const item of order.items) {
                await productCollection.findOneAndUpdate(
                    { _id: item.product },
                    { $inc: { quantity: item.quantity } } // Increase quantity by item.quantity
                );
            }
            const userId = req.session.userId;
            await WalletModel.findOneAndUpdate(
                { user: userId },
                { $inc: { balance: order.total } }, // Increase wallet balance by the order total
                { new: true, upsert: true }
            );
    
            await WalletModel.findOneAndUpdate(
                { user: userId },
                {
                    $push: {
                        wallethistory: {
                            process: "Refund for Returned Order",
                            amount: order.total,
                            date: Date.now()
                        }
                    }
                },
                { new: true }
            );
    
        res.status(200).json({ success: true, message: 'Order returned successfully' });
    } catch (error) {
        console.error('Error returning order:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

exports.createOrder = async (req, res) => {
    try {
        
var instance = new Razorpay({
    key_id: 'rzp_test_ccxHgWWTrm3eOa',
    key_secret: '19rQW81DMnDzYCrZEoyPeC3p',
  });
        console.log("entered..");
        const userId = req.session.userId;
        let cart = await cartCollection.findOne({ userId: userId });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        
        const amount = cart.totalprice
        const currency = 'INR';

        const options = {
            amount: amount*100,
            currency: currency,
            receipt: 'order_rcptid_' + Date.now()
        };

        instance.orders.create(options, function (err, order) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            res.json(order);
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};





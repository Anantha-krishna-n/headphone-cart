const { userCollection } = require("../model/usermodel");
const { categoryCollection } = require("../model/catagorymodel");
const { productCollection } = require("../model/productModel");
const cartCollection = require("../model/cartModel");
const orderCollection = require("../model/oderModel");
const addressCollection = require("../model/addressModel");
const whishListCollection=require('../model/whishList')
const couponCollection=require('../model/couponModel')
const WalletModel=require('../model/walletModel')




exports.couponManagementGet = async (req, res) => {

    
    const perPage = 4; // Number of coupons per page
    const page = parseInt(req.query.page) || 1; // Current page number, default to 1 if not provided

    try {
        // Fetch coupons for the current page
        const coupons = await couponCollection
            .find()
            .skip((page - 1) * perPage)
            .limit(perPage);

        // Calculate total number of coupons (for pagination)
        const totalCoupons = await couponCollection.countDocuments();

        res.render('admin/couponManagement', {
            coupons,
            currentPage: page,
            totalPages: Math.ceil(totalCoupons / perPage)
        });
    } catch (error) {
        console.error('Error in fetching coupons:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
  


exports.addcouponPost =async (req,res)=>{
    try {
             // Extract the start date from the request body
             const startDate = new Date(req.body.startdate);
        
     // Get the current date and set the time to the beginning of the day (midnight)
     const currentDate = new Date();
     currentDate.setHours(0, 0, 0, 0);

     // Check if the start date is before the current date
     if (startDate < currentDate) {
         return res.status(400).send('<script>alert("Cannot create a coupon with a start date in the past."); window.location="/couponManagement";</script>');
     }




        const newcoupon = new couponCollection({
            couponName: req.body.couponname,
            couponCode: req.body.couponcode,
            discountType: req.body.discounttype,
            discountValue: req.body.discountvalue,
            minimumPurchase: req.body.minimumpurchase,
            startDate: req.body.startdate,
            endDate: req.body.enddate
        })
        await newcoupon.save()
        res.redirect('/couponManagement')
    } catch (error) {
        console.log('Error in add coupon',error);
    }
};
exports.editCouponPost = async (req, res) => {
    try {
        console.log("entered into editcoupon");
        const { couponname,couponId, couponcode, discounttype, discountvalue, minimumpurchase,startdate, enddate } = req.body;
        console.log("couponid",couponId)
        console.log(couponname, couponcode, discounttype, discountvalue, minimumpurchase, startdate, enddate);
        // Find the coupon by its ID and update its fields
        const updatedCoupon = await couponCollection.findByIdAndUpdate(couponId, {
            couponName:couponname,
            couponCode:couponcode,
            discountType:discounttype,
            discountValue:discountvalue,
            minimumPurchase: minimumpurchase,
            startDate: startdate,
            endDate:enddate
        }, { new: true });
      
        console.log(updatedCoupon);
        res.redirect('/couponManagement')
    
    } catch (error) {
        console.error('Error editing coupon:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
   
exports.deleteCoupon = async (req, res) => {
    try {
        const couponId = req.params.id;
        await couponCollection.findByIdAndDelete(couponId);
        res.status(200).send('Coupon deleted successfully.');
    } catch (error) {
        console.error('Error deleting coupon:', error);
        res.status(500).send('Internal server error');
    }
};
exports.applyCoupon = async (req, res) => {
    try {
        console.log("entered...");
        const userId = req.session.userId;
        const { couponCode } = req.body;
        
        // Find the user in the database
        const user = await userCollection.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if the user has already used any coupons
        if (user.usedCoupons.length > 0) {
            return res.status(400).json({ error: 'You have already used a coupon.' });
        }

        // Find the cart associated with the user
        let cart = await cartCollection.findOne({ userId: userId });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Find the coupon in the database
        const coupon = await couponCollection.findOne({ couponCode });
        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }
                                                                                      
        const currentDate = new Date();
        if (currentDate < coupon.startDate || currentDate > coupon.endDate) {
            return res.status(400).json({ error: 'Coupon has expired' });
        }
                                                        
        // Check if the user has already used this coupon
        if (user.usedCoupons.includes(coupon._id)) {
            return res.status(400).json({ error: 'You have already used this coupon.' });
        }
       // Check if the total price meets the minimum purchase requirement
       if (cart.totalprice < coupon.minimumPurchase) {
        return res.status(400).json({ error: 'Total price does not meet the minimum purchase requirement for this coupon.' });
    }


        let discountAmount;
        if (coupon.discountType === 'Percentage') {
            discountAmount = (coupon.discountValue / 100) * cart.totalprice;
        } else if (coupon.discountType === 'Fixed Amount') {
            discountAmount = coupon.discountValue;
        } else {
            return res.status(400).json({ error: 'Invalid discount type' });
        }

        // Ensure discount doesn't exceed total price
        discountAmount = Math.min(discountAmount, cart.totalprice);

        // Deduct the discount amount from the total price
        cart.discount = discountAmount;
        cart.totalprice -= discountAmount;

        // Add the used coupon to the user's list of used coupons
        user.usedCoupons.push(coupon._id);
        await user.save();

        // Save the updated cart document back to the database
        cart = await cart.save();

        // Send the updated total price back to the client
        res.json({ updatedTotalPrice: cart.totalprice,discountAmount: discountAmount });
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


exports.removeCoupon = async (req, res) => {
    try {
        const userId = req.session.userId;

        // Find the user in the database
        const user = await userCollection.findOne({ _id: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Find the cart associated with the user
        let cart = await cartCollection.findOne({ userId: userId });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Get the last used coupon
        const lastUsedCouponId = user.usedCoupons.pop(); // Remove the last used coupon from the list
        if (!lastUsedCouponId) {
            return res.status(400).json({ error: 'No coupon to remove' });
        }

        // Find the coupon in the database
        const coupon = await couponCollection.findOne({ _id: lastUsedCouponId });
        if (!coupon) {
            return res.status(404).json({ error: 'Coupon not found' });
        }

        // Calculate the discount amount to add back to the total price
        let discountAmountToAddBack;
if (coupon.discountType === 'Percentage') {
    // Calculate the original price before applying the discount
    const originalPrice = cart.totalprice / (1 - coupon.discountValue / 100);
    // Calculate the discount amount based on the original price
    discountAmountToAddBack = originalPrice - cart.totalprice;
} else if (coupon.discountType === 'Fixed Amount') {
    discountAmountToAddBack = coupon.discountValue;
} else {
    return res.status(400).json({ error: 'Invalid discount type' });
}

        // Add the discount amount back to the total price
        cart.totalprice += discountAmountToAddBack;
         cart.discount=0
        // Remove the coupon from the user's list of used coupons
        await user.save();

        // Save the updated cart document back to the database
        cart = await cart.save();

        // Send the updated total price back to the client
        res.json({ updatedTotalPrice: cart.totalprice });
    } catch (error) {
        console.error('Error removing coupon:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
   
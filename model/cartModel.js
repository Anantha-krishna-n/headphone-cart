const mongoose = require('mongoose');
const { Schema } = mongoose;

const cartSchema = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'Usercollections',
        required: true
    },
    items: [{
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'productDetails',
            required: true
        },
        qty: {
            type: Number,
            default: 1
        },
        price:{
            type:Number
        }
    }],
    totalprice:{
           type:Number,
    },
    discount: {  // New field for discount amount
        type: Number,
        default: 0 // Default value is 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});                             

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;

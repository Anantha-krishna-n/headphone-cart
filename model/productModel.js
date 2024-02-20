const mongoose = require('mongoose');
const { Schema } = mongoose;

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
  
    description: {
        type: String
    },
    price: {
        type: Number
    },
    offer_price: {
        type: Number
    },
    color_status: {
        type: String,
        enum: ['White', 'Black']
    },
    quantity: {
        type: Number,
        required: true,
    },
    delivery_charge: {
        type: Number
    },
    image: [{
        type: String,
        required: true,
    }],
    category: [{
        type: Schema.Types.ObjectId,
        ref: 'categoryDetails'
    }],
    blocked: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

const productCollection = mongoose.model('productDetails', productSchema);

module.exports ={productCollection}
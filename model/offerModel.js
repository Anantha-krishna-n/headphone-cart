const mongoose = require('mongoose');
const { Schema } = mongoose;

const offerSchema = new mongoose.Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'productDetails',
        required: true
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'categoryDetails',
        required: true
    },
    discount_percentage: { 
        type: Number,
        required: true
    },
    start_date: {
        type: Date,
        required: true
    },
    end_date: {
        type: Date,
        required: true
    },
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const offerCollection = mongoose.model('offerDetails', offerSchema);

module.exports = { offerCollection };

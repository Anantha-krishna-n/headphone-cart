const mongoose = require('mongoose');
const { Schema } = mongoose;

const wishlistSchema = new Schema({
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
        addedAt: {
            type: Date,
            default: Date.now
        }
    }]
});

const whishListCollection = mongoose.model('Wishlist', wishlistSchema);

module.exports = whishListCollection;

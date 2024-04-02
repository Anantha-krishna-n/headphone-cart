const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    categoryName: {
        type: String
    },
    productName: {
        type: String
    },
    discount: {
        type: Number 
    },
  
    expiryDate: {
        type: Date,
        default: function() {
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            return currentDate;
        },
        get: function(val) {
            return val ? new Date(val).toLocaleDateString('en-GB') : '';
        }
    },    
    isActive: {  
        type: Boolean,
        default: true
    } 
});

const offerCollection = mongoose.model('offerCollection', offerSchema);
module.exports = offerCollection;

// category.js (category schema/model)
const mongoose = require('mongoose');
const { Schema } = mongoose;


const categorySchema = new mongoose.Schema({
    category_name: { 
        type: String,
    },
    description: { 
        type: String 
    },
    logo_image: { 
        type: String 
    } // You might store the image path or URL
  
},  { timestamps: true });

const categoryCollection = mongoose.model('categoryDetails', categorySchema);

module.exports = {categoryCollection}

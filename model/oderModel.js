const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usercollections', // Reference to the user who placed the order
    required: true
  },
  addresses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Address', // Reference to the address associated with the order
    required: true
  }],
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref:'productDetails',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    price:{
      type:Number,
    }
  }],
  status:{
         type:String,
         required:true
  },
  total: {
    type: Number,
    required: true
  },
  paymentMethod:{
      type:String,
      default:"COD"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
   
  
const orderCollection= mongoose.model('Order', orderSchema);
module.exports=orderCollection
 
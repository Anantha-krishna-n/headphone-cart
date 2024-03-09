const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    number: {
        type: Number,
        required: false
    },
    otp: {
        code: {
            type: String,
            default: null
        },
        expiration: {
            type: Date,
            default: null
        }

        
    },
    
    isBlocked: {
        type: Boolean,
        default: true
    },
    password: {
        type: String,
        required: true
    },
resetToken:String,
resetTokenExpires:Date,
addresses: [{
     type: mongoose.Schema.Types.ObjectId,
     ref: 'Address' }],
    
    
});

const userCollection = new mongoose.model('Usercollections', UserSchema);
module.exports = { userCollection };

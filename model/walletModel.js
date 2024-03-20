const mongoose = require('mongoose');

const WalletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usercollections',
        required: true
    },
    balance: {
        type: Number,
        default: 0
    },
   wallethistory: [{
        process: {
            type: String
        },
        amount: {
            type: Number
        },
        date: {
            type: Date,
            default: Date.now
        }
    }]
});

const WalletModel = mongoose.model('Wallet', WalletSchema);

module.exports = WalletModel;

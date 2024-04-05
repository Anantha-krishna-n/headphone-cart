const { render } = require('ejs');
const {userCollection}=require('../model/usermodel');
const {categoryCollection}=require("../model/catagorymodel")
const {productCollection}=require("../model/productModel")
const {cart}=require("../model/cartModel");
const orderCollection=require('../model/oderModel');
const addressCollection=require('../model/addressModel');
const whishListCollection=require('../model/whishList')
const couponCollection=require('../model/couponModel')
const bannerCollection=require('../model/bannerModel')
const offerCollection=require('../model/offerModel')
const WalletModel=require('../model/walletModel')
const  PDFDocument=require('pdfkit');
const fs = require('fs');
const path = require('path');


exports.salesReportGet = async (req, res) => {
    const perPage = 4; // Number of orders per page
    const page = parseInt(req.query.page) || 1; // Current page number, default to 1
    const filter = req.query.filter || 'daily'; // Default filter is set to 'daily'

    let startDate, endDate;

    // Set start and end dates based on the selected filter
    if (filter === 'daily') {
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
    } else if (filter === 'weekly') {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7); // Get date from 7 days ago
        endDate = new Date();
    } else if (filter === 'monthly') {
        startDate = new Date();
        startDate.setDate(1); // Set date to the first day of the current month
        endDate = new Date();
    }

    try {
        const totalOrders = await orderCollection.countDocuments({ status: 'success', createdAt: { $gte: startDate, $lte: endDate } }); // Get total number of orders based on filter
        const totalPages = Math.ceil(totalOrders / perPage); // Calculate total number of pages

        const orders = await orderCollection.find({ status: 'success', createdAt: { $gte: startDate, $lte: endDate } })
            .populate({
                path: 'user',
                model: 'Usercollections',
                select: 'name addresses'
            })
            .populate({
                path: 'items.product',
                model: 'productDetails',
                select: 'name'
            })
            .populate({
                path: 'addresses',
                model: 'Address'
            })
            .skip((page - 1) * perPage) // Skip orders based on page number
            .limit(perPage); // Limit number of orders per page

        res.render("admin/salesreport", { orders, page, totalPages,filter });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


  

exports.generateSalesReportPDF = async (req, res) => {
    const perPage = 4; // Number of orders per page
    const page = parseInt(req.query.page) || 1; // Current page number, default to 1
    const filter = req.query.filter || 'daily'; // Default filter is set to 'daily'

    let startDate, endDate;

    // Set start and end dates based on the selected filter
    if (filter === 'daily') {
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        
        endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
    } else if (filter === 'weekly') {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7); // Get date from 7 days ago
        endDate = new Date();
    } else if (filter === 'monthly') {
        startDate = new Date();
        startDate.setDate(1); // Set date to the first day of the current month
        endDate = new Date();
    }

    try {
        const orders = await orderCollection.find({ status: 'success', createdAt: { $gte: startDate, $lte: endDate } })
            .populate({
                path: 'user',
                model: 'Usercollections',
                select: 'name number email'
            })
            .populate({
                path: 'items.product',
                model: 'productDetails',
                select: 'name price' // Include price in the product details population
            })
            .populate({
                path: 'addresses',
                model: 'Address'
            })
            .skip((page - 1) * perPage) // Skip orders based on page number
            .limit(perPage); // Limit number of orders per page
            console.log(orders,"vbhsfvfffffffffffffffffffffffffffffffffffffffffffffffffffffffs")
        // Create a new PDF document
        const doc = new PDFDocument();
        
        // Set the path for the PDF file
        const pdfPath = path.join('D:', 'project', 'sales_report.pdf');

        // Pipe the PDF output to a writable stream
        doc.pipe(fs.createWriteStream(pdfPath));
        
        // Add content to the PDF document
        doc.text('Sales Report');
console.log(orders,"vbhsfvs")
        // Loop through orders and add them to the PDF document
        orders.forEach((order, index) => {
            doc.text(`Order ${index + 1}`);
            doc.text(`Order Date: ${order.createdAt.toLocaleString()}`);
            doc.text(`Customer: ${order.user.name}`);
            doc.text(`Phone Number: ${order.user.number}`);
            doc.text(`Email: ${order.user.email}`);
            doc.moveDown(); // Move down for spacing
        
            // Add address information
            doc.text('Address:');
            order.addresses.forEach(address => {
                doc.text(`- ${address.address}, ${address.street}, ${address.city}, ${address.country}, ${address.zipCode}`);
            });
        
            doc.moveDown(); // Move down for spacing
        
            // Add order items information
            doc.text('Order Items:');
            order.items.forEach(item => {
                doc.text(`- Product: ${item.product.name}, Quantity: ${item.quantity}, Price: ${item.product.price}`);
            });
        
            doc.text(`Total Price: ${order.total}`);
            doc.text('----------------------------------------');
        });
        
        // Finalize the PDF document
        doc.end();
        
        res.json({ success: true, message: 'Sales report PDF generated successfully' });
    } catch (error) {
        console.error('Error generating sales report PDF:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
};

exports.getTopSellingProducts = async (req, res) => {
    try {
        // Aggregate pipeline to group orders by product and sum the quantities sold
        const topSellingProducts = await orderCollection.aggregate([
            {
                $unwind: "$items" // Deconstruct the items array
            },
            {
                $group: {
                    _id: "$items.product", // Group by product
                    totalQuantitySold: { $sum: "$items.quantity" } // Sum the quantities sold
                }
            },
            {
                $sort: { totalQuantitySold: -1 } // Sort by total quantity sold in descending order
            },
            {
                $limit: 5 // Limit the result to top 5 selling products
            }
        ]);

        // Extract product IDs from the result
        const productIds = topSellingProducts.map(product => product._id);

        // Assuming you have a Product model, you can populate the product details using product IDs
        // const products = await Product.find({ _id: { $in: productIds } });

        // Render the EJS template with the top selling products data
        res.render('topSellingProducts', { topSellingProducts });
    } catch (error) {
        console.error("Error retrieving top selling products:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};
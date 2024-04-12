const { render } = require("ejs");
const { userCollection } = require("../model/usermodel");
const { categoryCollection } = require("../model/catagorymodel");
const { productCollection } = require("../model/productModel");
const { cart } = require("../model/cartModel");
const orderCollection = require("../model/oderModel");
const addressCollection = require("../model/addressModel");
const whishListCollection = require("../model/whishList");
const couponCollection = require("../model/couponModel");
const bannerCollection = require("../model/bannerModel");
const offerCollection = require("../model/offerModel");
const WalletModel = require("../model/walletModel");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

exports.salesReportGet = async (req, res) => {
  const perPage = 4; // Number of orders per page
  const page = parseInt(req.query.page) || 1; // Current page number, default to 1
  const filter = req.query.filter || "daily"; // Default filter is set to 'daily'
  let startDate, endDate;

  // Set start and end dates based on the selected filter
  if (filter === "daily") {
    startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
  } else if (filter === "weekly") {
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Get date from 7 days ago
    endDate = new Date();
  } else if (filter === "monthly") {
    // Get the current date
    const currentDate = new Date();

    // Calculate the first day of the current month
    startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // Calculate the first day of the next month
    endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  } else if (filter === "custom") {
    // If filter is custom, get start and end dates from query parameters
    startDate = new Date(req.query.startDate);
    endDate = new Date(req.query.endDate);
    console.log(req.query.startDate,"hg");
    // Ensure end date is set to the end of the day
    endDate.setHours(23, 59, 59, 999);
   
    
  }
 
  try {
    const totalOrders = await orderCollection.countDocuments({
      status: "success",
      createdAt: { $gte: startDate, $lte: endDate },
    }) // Get total number of orders based on filter
    const totalPages = Math.ceil(totalOrders / perPage);
       console.log(totalPages,"pp")
       console.log( totalOrders,"cc");
    const orders = await orderCollection
      .find({
        status: "success",
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .populate({
        path: "user",
        model: "Usercollections",
        select: "name addresses",
      })
      .populate({
        path: "items.product",
        model: "productDetails",
        select: "name",
      })
      .populate({
        path: "addresses",
        model: "Address",
      })
      .skip((page - 1) * perPage) // Skip orders based on page number
      .limit(perPage); // Limit number of orders per page

    res.render("admin/salesreport", { orders, page, totalPages, filter,startDate,endDate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};





exports.generateSalesReportPDF = async (req, res) => {
  const perPage = 4; // Number of orders per page
  const page = parseInt(req.query.page) || 1; // Current page number, default to 1
  const filter = req.query.filter || "daily"; // Default filter is set to 'daily'

  let startDate, endDate;

  // Set start and end dates based on the selected filter
  if (filter === "daily") {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
  } else if (filter === "weekly") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Get date from 7 days ago
      endDate = new Date();
  } else if (filter === "monthly") {
      startDate = new Date();
      startDate.setDate(1); // Set date to the first day of the current month
      endDate = new Date();
      console.log(startDate,"fine2")
      console.log(endDate,"ff2")
  } else if (filter === "custom") {
      // If filter is custom, get start and end dates from query parameters
      startDate = new Date(req.query.startDate);
      endDate = new Date(req.query.endDate);
      // Ensure end date is set to the end of the day
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        // Handle invalid dates, e.g., by sending an error response
        return res.status(400).send({ error: 'Invalid startDate or endDate' });
    }

    // Ensure end date is set to the end of the day
    endDate.setHours(23, 59, 59, 999)
  }
  console.log(startDate,"fine")
  console.log(endDate,"ff");
  try {
      const orders = await orderCollection
          .find({
              status: "success",
              createdAt: { $gte: startDate, $lte: endDate },
          })
          .populate({
              path: "user",
              model: "Usercollections",
              select: "name number email",
          })
          .populate({
              path: "items.product",
              model: "productDetails",
              select: "name price", // Include price in the product details population
          })
          .populate({
              path: "addresses",
              model: "Address",
          })
          .skip((page - 1) * perPage) // Skip orders based on page number
          .limit(perPage); // Limit number of orders per page
 
      // Create a new PDF document
      const doc = new PDFDocument();

      // Set the path for the PDF file
      const pdfPath = path.join("D:", "project", "sales_report.pdf");

      // Pipe the PDF output to a writable stream
      doc.pipe(fs.createWriteStream(pdfPath));

      // Add content to the PDF document
      doc.text("Sales Report").moveDown();

      // Add table headers
      doc.text("SL.No", { width: 50, align: "center" });
      doc.text("Name", { width: 100, align: "center" });
      doc.text("Address", { width: 200, align: "center" });
      doc.text("Product", { width: 150, align: "center" });
      doc.text("Quantity", { width: 70, align: "center" });
      doc.text("Payment Method", { width: 100, align: "center" });
      doc.text("Total Price", { width: 90, align: "center" });
      doc.text("Order Status", { width: 90, align: "center" });
      doc.text("Purchase Date", { width: 100, align: "center" });
      doc.moveDown();

      // Add table rows
      let rowIndex = 1;
      orders.forEach(order => {
          doc.text(rowIndex.toString(), { width: 50, align: "center" });
          doc.text(order.user.name, { width: 100, align: "center" });
          const addressText = order.addresses.map(address => `${address.address}, ${address.city}, ${address.state}, ${address.country}, ${address.zipCode}`).join("\n");
          doc.text(addressText, { width: 200, align: "center" });
          const productText = order.items.map(item => item.product.name).join("\n");
          doc.text(productText, { width: 150, align: "center" });
          const quantityText = order.items.map(item => item.quantity).join("\n");
          doc.text(quantityText, { width: 70, align: "center" });
          doc.text(order.paymentMethod, { width: 100, align: "center" });
          doc.text(order.total.toString(), { width: 90, align: "center" });
          doc.text(order.status, { width: 90, align: "center" });
          doc.text(order.createdAt.toDateString(), { width: 100, align: "center" });

          rowIndex++;
      }); 

      // Finalize the PDF document
      doc.end();

      // Send the generated PDF file as a response
      res.download(pdfPath, "sales_report.pdf");
  } catch (error) {
      console.error("Error generating sales report PDF:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

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



const logoPath = path.join("D:", "project", "public", "logo.png"); 

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
      console.log(req.query.startDate,"fine")
      console.log(req.query.endDate,"ff");
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        // Handle invalid dates, e.g., by sending an error response
        return res.status(400).send({ error: 'Invalid startDate or endDate' });
    }

    // Ensure end date is set to the end of the day
    endDate.setHours(23, 59, 59, 999)
  }
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
      const directory = path.join("D:", "project", "public", "invoices");
      if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true });
      }

      // Set the path for the PDF file
      const pdfPath = path.join(directory, "sales_report.pdf");

      // Log the PDF path
      console.log("PDF Path:", pdfPath);

      // Pipe the PDF output to a writable stream
      const writeStream = fs.createWriteStream(pdfPath);

      // Handle stream errors
      writeStream.on("error", (error) => {
          console.error("Error creating PDF file:", error);
          res.status(500).json({ success: false, error: "Internal Server Error" });
      });

      const doc = new PDFDocument();

      // Pipe the PDF output to the writable stream
      doc.pipe(writeStream);

      doc.image(logoPath, 10, 20, { width: 200,height:100 }); // Adjust position and size as needed

      const currentDate = new Date().toLocaleString(); // Get current date and time
      const textWidth = doc.widthOfString(currentDate);
      const topPadding = 10; // Adjust top padding as needed
      const rightPadding = 20; // Adjust right padding as needed
      const textXPosition = doc.page.width - textWidth - rightPadding;
      doc.text(currentDate, textXPosition, topPadding);
      // Add content to the PDF document
      const headers = [
        "SL.No", "Name", "Address", "Product", "Quantity", "Payment Method", "Total Price", "Order Status", "Purchase Date"
      ];

      // Define the width of each column
      const columnWidths = [35, 60, 125, 80, 45, 65, 40, 50, 90];

      // Add table headers
      let x = 10; // Starting x position
      headers.forEach((header, index) => {
        doc.text(header, x, 100, { width: columnWidths[index], align: 'center' });
        x += columnWidths[index];
      });
      doc.moveDown(2);

      // Add table rows
      let rowIndex = 1;
      const rowHeight = 50; // Adjust this value to increase or decrease space between rows
      orders.forEach(order => {
          let y = 100 + rowIndex * rowHeight; // Starting y position for each row
          let x = 10; // Starting x position
          doc.text(rowIndex.toString(), x, y, { width: columnWidths[0], align: 'center' });
          x += columnWidths[0];
      
          doc.text(order.user.name, x, y, { width: columnWidths[1], align: 'center' });
          x += columnWidths[1];
      
          const addressText = order.addresses.map(address => `${address.address}, ${address.city}, ${address.state}, ${address.country}, ${address.zipCode}`).join("\n");
          doc.text(addressText, x, y, { width: columnWidths[2], align: 'center' });
          x += columnWidths[2];
       
          const productText = order.items.map(item => item.product.name).join("\n");
          doc.text(productText, x, y, { width: columnWidths[3], align: 'center' });
          x += columnWidths[3];
      
          const quantityText = order.items.map(item => item.quantity).join("\n");
          doc.text(quantityText, x, y, { width: columnWidths[4], align: 'center' });
          x += columnWidths[4];
      
          doc.text(order.paymentMethod, x, y, { width: columnWidths[5], align: 'center' });
          x += columnWidths[5];
      
          doc.text(order.total.toString(), x, y, { width: columnWidths[6], align: 'center' });
          x += columnWidths[6];
      
          doc.text(order.status, x, y, { width: columnWidths[7], align: 'center' });
          x += columnWidths[7];
      
          doc.text(order.createdAt.toDateString(), x, y, { width: columnWidths[8], align: 'center' });
          doc.moveDown();
      
          rowIndex++;
      });


      // Finalize the PDF document
      doc.end();

      writeStream.on('finish', () => {
        // Send the generated PDF file as a response
        res.download(pdfPath, "sales_report.pdf", (err) => {
          if (err) {
            console.error("Error downloading PDF:", err);
            res.status(500).json({ success: false, error: "Internal Server Error" });
          } else {
            console.log("PDF sent successfully");
          }
        });
      });
  } catch (error) {
      console.error("Error generating sales report PDF:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const { userCollection } = require("../model/usermodel");
const { categoryCollection } = require("../model/catagorymodel");
const { productCollection } = require("../model/productModel");
const { cart } = require("../model/cartModel");
const orderCollection = require("../model/oderModel");
const addressCollection = require("../model/addressModel");
const whishListCollection = require("../model/whishList");
const bannerCollection = require("../model/bannerModel");
const offerCollection = require("../model/offerModel");
const WalletModel = require("../model/walletModel");

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const toastr = require("toastr");

const nodemailer = require("nodemailer");

const bcrypt = require("bcrypt");
const swal = require("sweetalert2");
const { log } = require("console");

exports.loginGet = (req, res) => {
  if (req.session.userId) {
    res.render("user/home");
  } else {
    if (req.session.invalid) {
      req.session.invalid = false;
      res.render("user/login", { msg: req.session.errmsg, error: "" });
    } else {
      res.render("user/login", { msg: "", error: "" });
    }
  }
};

exports.logoutGet = (req, res) => {
  if (req.session.userId) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error", err);
      }
      res.redirect("/");
    });
  } else {                                                               
    res.redirect("/");
  }
};

exports.signupGet = (req, res) => {
  if (req.session.userId) {
    return res.redirect("/home");
  } else {
    if (req.session.invalid) {
      res.render("user/signup", { msg: req.session.error });
    } else {
      req.session.invalid = false;
      res.render("user/signup", {
        msg: "",
        otpVerificationSuccess: req.session.otpVerificationSuccess,
      });
    }
  }
};

exports.loginPost = async (req, res) => {
  try {
    const check = await userCollection.findOne({ email: req.body.email });
    if (check) {
      const isPasswordMatch = await bcrypt.compare(
        req.body.password,
        check.password
      );
      if (isPasswordMatch) {
        req.session.userId = check;
        console.log(req.session.userId);
        res.redirect("/home");
      } else {
        req.session.invalid = true;
        req.session.errmsg = "Incorrect Password";
        res.redirect("/");
      }
    } else {
      req.session.invalid = true;
      req.session.errmsg = "Invalid User";
      res.redirect("/");
    }
  } catch (err) {
    console.log(err);
  }
};

exports.homeGet = async (req, res) => {
  const products = await productCollection.find().populate("category");
  const category = await categoryCollection.find();
  const banners = await bannerCollection.find(); // Fetch banner images

  res.render("user/home", { products, category, banners });
};
exports.shopGet = async (req, res) => {
  const PAGE_SIZE = 6; // Number of products per page
  const page = parseInt(req.query.page) || 1; // Get the page number from query parameters, default to 1 if not provided
  let sort = 1; // Default sorting order

  // Check if sorting order is specified in query parameters
  if (req.query.sort === "desc") {
    sort = -1; // Set sorting order to descending if specified
  }

  try {
    let query = { blocked: false };

    // Check if search query is provided
    if (req.query.search) {
      // Construct regex pattern for case-insensitive search
      const searchRegex = new RegExp(req.query.search, "i");
      query.$or = [
        { name: searchRegex }, // Search by product name
      ];
    }

    // Check if category query is provided
    if (req.query.category) {
      const category = await categoryCollection.findOne({
        category_name: req.query.category,
      });
      if (category) {
        query.category = category._id; // Filter products by category ObjectId
      }
    }

    const count = await productCollection.countDocuments(query); // Get total count of products based on query
    const totalPages = Math.ceil(count / PAGE_SIZE); // Calculate total pages

    let products = await productCollection
      .find(query)
      .populate("category")
      .sort({ price: sort }); // Sort products by price

    // Apply offer prices to products
    products = await Promise.all(
      products.map(async (product) => {
        const productOffer = await offerCollection.findOne({
          product: product._id,
          isActive: true,
        });
        const categoryOffer = await offerCollection.findOne({
          category: product.category[0]._id,
          isActive: true,
        });
        console.log(productOffer, "pro offer");
        console.log(categoryOffer, "category offer");
        if (
          productOffer &&
          (!categoryOffer || productOffer.discount > categoryOffer.discount)
        ) {
          // Apply product offer only if it exists and is greater than category offer
          product.offerPrice =
            product.price - product.price * (productOffer.discount / 100);
        } else if (categoryOffer) {
          // Apply category offer if product offer does not exist or category offer is greater
          product.offerPrice =
            product.price - product.price * (categoryOffer.discount / 100);
        } else {
          // If no product offer or category offer, or if both exist with category offer being greater, keep the original price
          product.offerPrice = null;
        }

        return product;
      })
    );

    // Paginate products
    products = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const categories = await categoryCollection.find();
    const userId = req.session.userId ? req.session.userId._id : null; // Assuming userId is stored in req.session.userId

    res.render("user/shop", {
      products,
      categories,
      userId,
      totalPages,
      currentPage: page,
      req,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.forgotPassword = async (req, res) => {
  res.render("user/emailverification");
};

exports.signupPost = async (req, res) => {
  try {
    // Function to generate unique referral code
    const generateReferralCode = async () => {
      let referralCode;
      let existingReferral; // Define existingReferral variable here
      do {
        // Generate a random alphanumeric string
        referralCode = Math.random().toString(36).substring(2, 15);
        // Check if the generated referral code already exists in the database
        existingReferral = await userCollection.findOne({
          referralCode: referralCode,
        });
      } while (existingReferral);
      return referralCode;
    };
       
    // Function to credit wallet  
    const creditWallet = async (user, amount) => {  

      const wallet = await WalletModel.findOne({ user:user});
      if (wallet) {
        wallet.balance += amount;
        wallet.wallethistory.push({
          process: "Referral for now Bonus",
          amount: amount,
        });
        await wallet.save();
    } else {
        // If the user does not have a wallet, create a new one
        const newWallet = new WalletModel({
            user: user, // Provide the user ID here
            balance: amount,
            wallethistory: [{ process: "Referral Bonussss", amount: amount }]
        });
        await newWallet.save();
    }

    };

    const userData = {
      name: req.body.username,
      email: req.body.email,
      number: req.body.number,
      confirmpassword: req.body.confirmpassword,
      password: req.body.password,
      referralCode: req.body.referralCode, // Assuming referral code is provided in the signup form
    };

    // Check if a referral code is provided
    let referrer = null;
    if (userData.referralCode) {
    referrer = await userCollection.findOne({
        referralCode: userData.referralCode,
      });
      console.log(referrer,"one");
      console.log(userData,"two");
      
      const old=referrer.referralCode
      console.log(old,"hihih");
      if(referrer.referralCode===userData.referralCode){
              userData.referralCode=await generateReferralCode();
      }
      if (!referrer) {
        req.session.error = "Invalid referral code";
        return res.redirect("/signup");
      }
    }

    // Check if the email already exists in the database
    const existingUser = await userCollection.findOne({
      email: userData.email,
    });

    if (userData.name.trim() === "") {
      req.session.error = "space not allowed";
      req.session.invalid = true;
      return res.redirect("/signup");
    }

    if (existingUser) {
      req.session.error = "email already exists";
      req.session.invalid = true;
      return res.redirect("/signup");
    }

    if (!userData.referralCode) {
      userData.referralCode = await generateReferralCode(); // Generate referral code if not provided
    }

    if (userData.confirmpassword === userData.password) {
      // Hashing password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
      userData.password = hashedPassword;

      // Generate a random 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000);

      // Save user data with OTP
      const userWithOtp = {
        ...userData,
        otp: {
          code: otpCode.toString(),
          expiration: new Date(Date.now() + 1 * 60 * 1000),
        },
      };

      
      // Send OTP via email
      await sendOtpEmail(userData.email, otpCode);
      
      const userDataOfTheUser = await userCollection.insertMany([userWithOtp]);
      // Store email in session for OTP verification
      req.session.verifyEmail = userData.email;
      
      
      if (referrer) {
          userData.referralCode=await generateReferralCode()
        // Credit referrer's wallet with the referral bonus
        await creditWallet(userDataOfTheUser[0].id, 50); // for cuurent user
      
        
        
        // Credit new user's wallet with the referral bonus
        // await creditWallet(userWithOtp, 50);
    }
    
      // Redirect to OTP verification page
      return res.render("user/otpsignup", {
        msg: "Signup successful! Please verify your email.",
      });
    } else {
      req.session.error = "password not matched";
      return res.redirect("/signup");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error for signup" });
  }
};



let verifyEmail = "";

exports.signupVerifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    console.log(otp, "this is the otp.........................");
    if (req.session.verifyEmail) {
      verifyEmail = req.session.verifyEmail;
      console.log(verifyEmail, "this message from signupVerifyOtp side");
    }
    const user = await userCollection.findOne({ email: verifyEmail });
    console.log(user, "verifyEmail in verifyOtp");

    if (!user) {
      console.log("User not found signupVerifyOtp");
    }

    // Check if OTP is expired
    if (user.otp.expiration && user.otp.expiration < new Date()) {
      return res.status(401).json({ message: "OTP has expired" });
    }

    // Check if the entered OTP matches the stored OTP
    if (user.otp.code !== otp) {
      console.log("Invalid OTP, Recheck Your OTP");
      return res.redirect("/signup");
    }

    // Clear the OTP details after successful verification
    user.otp = {
      code: null,
      expiration: null,
    };

    await user.save();
    console.log("OTP verified successfully in verifyOtp. Please Login Again");
    req.session.otpVerificationSuccess = true;

    res.redirect("/");
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error while verifying OTP" });
  }
};

//forgot password resend post
exports.emailResendOtp = async (req, res) => {
  try {
    if (req.session.verifyEmail) {
      verifyEmail = req.session.verifyEmail;
    }

    const user = await userCollection.findOne({ email: verifyEmail });

    if (!user) {
      console.log("User not found emailResendOtp");
    }

    // Check if 60 seconds have passed since the last OTP request
    const lastOtpRequestTime = user.otp.lastRequestTime || 0;
    const currentTime = new Date().getTime();

    if (currentTime - lastOtpRequestTime < 60000) {
      return res
        .status(429)
        .json({ message: "Wait for 60 seconds before requesting a new OTP" });
    }

    // Generate a new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000);

    // Set the new OTP in the user document and update the last request time
    user.otp = {
      code: otpCode.toString(),
      expiration: new Date(currentTime + 1 * 60 * 1000),
      lastRequestTime: currentTime,
    };

    await user.save();

    // Send the new OTP via email
    await sendOtpEmail(verifyEmail, otpCode);
    console.log("New OTP sent successfully");

    res.render("user/otpsignup"); // Redirect to the verification page
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Internal Server Error while resending OTP" });
  }
};

const sendOtpEmail = async (email, otp) => {
  // Replace the following with your nodemailer setup
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "ananthakrishnan053@gmail.com",
      pass: "kdzqweucncgtxhti",
    },
  });

  const mailOptions = {
    from: "ananthakrishnan053@gmail.com",
    to: email,
    subject: "this is the otp",
    text: `Your verification code is: ${otp}`,
  };

  return transporter.sendMail(mailOptions);
};

exports.productDetails = async (req, res) => {
  try {
    if (req.session.userId) {
      const user = req.session.userId;
      const userId = user._id;

      const productId = req.params.productId;
      const product = await productCollection.findById(productId);
      if (!product) {
        // Handle case where product is not found
        return res.status(404).send("Product not found");
      }
      const productOffer = await offerCollection.findOne({
        product: productId,
        isActive: true,
      });
      const category = product.category[0];
      const categoryOffer = await offerCollection.findOne({
        category: category,
        isActive: true,
      });

      if (productOffer && productOffer.discount) {
        // Calculate offer price as a percentage discount from the original price
        const offerPercentage = productOffer.discount;
        const offerPrice =
          product.price - product.price * (offerPercentage / 100);
        product.offerPrice = offerPrice;
      } else if (categoryOffer && categoryOffer.discount) {
        // Apply category offer discount to the product
        const offerPercentage = categoryOffer.discount;
        const offerPrice =
          product.price - product.price * (offerPercentage / 100);
        product.offerPrice = offerPrice;
      } else {
        // If no offer is applied, set offerPrice to null
        product.offerPrice = null;
      }

      res.render("user/productDetails", { product, userId });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.singleProductGet = (req, res) => {
  res.render("/user/singleproductpage");
};

exports.forgotPasswordGET = (req, res) => {
  res.render("user/verifyemail");
};

// Function to generate a random OTP
function generateOTP() {
  // Length of the OTP
  const digits = 6;

  // Possible characters in the OTP
  const characters = "0123456789";

  let OTP = "";
  for (let i = 0; i < digits; i++) {
    OTP += characters[Math.floor(Math.random() * characters.length)];
  }
  return OTP;
}

exports.forgotPasswordPost = async (req, res) => {
  try {
    console.log("entered forgotPasswordPost");
    const { email } = req.body;
    console.log("Email:", email);

    const user = await userCollection.findOne({ email });

    if (!user) {
      console.log("User not found");
      return res.status(404).send("There is no such user.");
    }

    const otp = generateOTP(); // Assuming this function generates an OTP
    const otpExpiry = Date.now() + 300000; // OTP expiry time (5 minutes)

    // Store OTP and expiry time in session
    req.session.resetPasswordOTP = otp;
    req.session.resetPasswordOTPExpires = otpExpiry;

    // Send OTP to user's email (assuming you have a sendOtp function)
    sendOtpEmail(user.email, otp);
    console.log("OTP sent to", user.email, ":", otp);

    // Redirect to the OTP verification page
    res.render("user/otpVerification", { email });
  } catch (error) {
    console.error("Error in forgotPasswordPost:", error);
    res.status(500).send("Server Error");
  }
};
exports.verifyOTP = async (req, res) => {
  try {
    console.log("entered verifyOTP");
    const { email, otp } = req.body;
    console.log("Email:", email);

    // Retrieve OTP and its expiry time from session
    const sessionOTP = req.session.resetPasswordOTP;
    const otpExpiry = req.session.resetPasswordOTPExpires;

    // Check if OTP exists in session and is not expired
    if (!sessionOTP || otpExpiry < Date.now()) {
      console.log("OTP not found or expired in session");
      return res.status(400).send("Invalid or expired OTP.");
    }

    // Remove OTP and expiry time from session
    // delete req.session.resetPasswordOTP;
    // delete req.session.resetPasswordOTPExpires;

    // Retrieve user from database
    const user = await userCollection.findOne({ email });
    console.log("User:", user);

    if (!user) {
      console.log("User not found");
      return res.status(404).send("There is no such user.");
    }

    // Check if the received OTP matches the one stored in the session
    if (sessionOTP !== otp) {
      console.log("Invalid OTP");
      return res.status(400).send("Invalid OTP.");
    }

    // Redirect to set new password page
    res.render("user/newpassword", { email, otp });
  } catch (error) {
    console.error("Error in verifyOTP:", error);
    res.status(500).send("Server Error");
  }
};

exports.setNewPassword = async (req, res) => {
  try {
    console.log("entered into setnewpassword");
    const { email, password, confirmpassword, otp } = req.body;

    // Validate if passwords match
    if (password !== confirmpassword) {
      return res.status(400).send("Passwords do not match.");
    }

    // Retrieve OTP and its expiry time from session
    const sessionOTP = req.session.resetPasswordOTP;
    const otpExpiry = req.session.resetPasswordOTPExpires;

    console.log(sessionOTP, "here");
    console.log(otpExpiry, "kk");
    // Check if OTP exists in session and is not expired
    if (!sessionOTP || otpExpiry < Date.now()) {
      console.log("OTP not found or expired in session");
      return res.status(400).send("Invalid or expired OTP.");
    }
    console.log(otp, "in setnew");
    // Check if the received OTP matches the one stored in the session
    if (sessionOTP !== otp) {
      console.log("Invalid OTP");
      return res.status(400).send("Invalid OTP.");
    }

    // Find the user by email
    const user = await userCollection.findOne({ email });

    // If user not found, return error
    if (!user) {
      return res.status(404).send("There is no such user.");
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password and remove reset password fields
    user.password = hashedPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;

    // Save the updated user
    await user.save();

    // Redirect to login page or any other page
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

exports.saveAddressPost = async (req, res) => {
  try {
    // Get user ID from request or session
    const userId = req.session.userId;
    //   req.session.addressOrigin = "profile";

    // Create a new address object
    const newAddress = new addressCollection({
      user: userId,
      address: req.body.address,
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      country: req.body.country,
      zipCode: req.body.zipCode,
    });

    // Save the address to the database
    await newAddress.save();

    // Assuming you want to associate the address with the user
    // You can push the address to the user's addresses array
    const user = await userCollection.findById(userId);
    user.addresses.push(newAddress);
    await user.save();

    if (req.session.addressOrigin === "checkout") {
      res.redirect("/checkout");
    } else {
      res.redirect("/userProfile");
    }
    //   res.status(201).json({ message: 'Address saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.session.userId; // Get user ID from session
    const addressId = req.params.addressId; // Get address ID from request parameters

    // Find the address in the address collection
    const address = await addressCollection.findOne({
      _id: addressId,
      user: userId,
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Delete the address from the address collection
    await addressCollection.deleteOne({ _id: addressId });

    // Remove the address reference from the user's addresses array
    const user = await userCollection.findById(userId);
    user.addresses = user.addresses.filter(
      (addr) => addr.toString() !== addressId.toString()
    );
    await user.save();

    return res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
// Controller to render edit address form with existing address details
exports.editAddressGet = async (req, res) => {
  try {
    const userId = req.session.userId; // Get user ID from session
    const addressId = req.params.id; // Get address ID from request parameters

    const address = await addressCollection.findOne({
      _id: addressId,
      user: userId,
    });

    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }

    // Render the edit address form with the address details
    res.render("user/addressEdit", { address });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
/////edit controller post
// Controller to handle editing the address
exports.editAddressPost = async (req, res) => {
  try {
    const userId = req.session.userId; // Get user ID from session
    const addressId = req.params.id; // Get address ID from request parameters
    // Update the address in the database
    await addressCollection.findOneAndUpdate(
      { _id: addressId, user: userId }, // Filter criteria
      {
        $set: {
          address: req.body.address,
          street: req.body.street,
          city: req.body.city,
          state: req.body.state,
          country: req.body.country,
          zipCode: req.body.zipcode,
        },
      },
      { new: true } // Return the updated document
    );
    if (req.session.addressOrigin === "checkout") {
      res.redirect("/checkout");
    } else {
      res.redirect("/userProfile");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.sucessOrder = async (req, res) => {
  res.render("user/sucessOrder");
};

exports.userProfileGet = async (req, res) => {
  if (req.session.userId) {
    req.session.addressOrigin = "profile";
    const userId = req.session.userId;
    const page = req.query.page || 1; // Get the current page from query parameters or default to page 1
    const ordersPerPage = 6; // Number of orders per page

    try {
      // Find the user's addresses
      const addresses = await addressCollection.find({ user: userId });

      // Find the user
      const User = await userCollection.findById(userId).populate("addresses");

      // Find the total count of orders
      const totalOrders = await orderCollection.countDocuments({
        user: userId,
      });
      const wallet = await WalletModel.findOne({ user: userId });

      // Calculate the skip value based on the current page and orders per page
      const skip = (page - 1) * ordersPerPage;

      // Find the user's orders for the current page
      const Orders = await orderCollection
        .find({ user: userId })
        .populate("items.product")
        .populate("addresses")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(ordersPerPage);

      // Calculate the total number of pages
      const totalPages = Math.ceil(totalOrders / ordersPerPage);

      res.render("user/userProfile", {
        addresses,
        Orders,
        User,
        currentPage: page,
        totalPages,
        wallet,
      });
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).send("Internal Server Error");
    }
  }
};

exports.editUserDetails = async (req, res) => {
  console.log("hdhdh");
  const { editName, editEmail, editPhoneNumber } = req.body;
  console.log(editName, "jjd");

  try {
    // Find the user by their ID
    const userId = req.session.userId;

    const user = await userCollection.findByIdAndUpdate(
      userId,
      {
        name: editName,
        email: editEmail,
        number: editPhoneNumber,
      },
      { new: true }
    );

    res.redirect("/userProfile");
  } catch (error) {
    console.error("Error editing user details:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.resetPasswordGet = (req, res) => {
  res.render("user/resetPassword", { error: null, success: null });
};

exports.resetPasswordPost = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.session.userId;

    const user = await userCollection.findById(userId);

    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordMatch) {
      return res.render("user/resetPassword", {
        error: "Current password is incorrect",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.render("user/resetPassword", {
        error: "New password and confirmation password do not match",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.redirect("/userProfile");
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.downloadInvoice = async (req, res) => {
  try {
    const orderId = req.query.orderId; // Retrieve orderId from query parameters
    const order = await orderCollection
      .findById(orderId)
      .populate("user")
      .populate("addresses")
      .populate("items.product");

    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Create a new PDF document
    const userDirectory = path.join("D:", "project", "public", "invoices");
    if (!fs.existsSync(userDirectory)) {
      fs.mkdirSync(userDirectory, { recursive: true });
    }

    // Create a new PDF document
    const doc = new PDFDocument();
     
    const fileName = `invoice_${order._id}.pdf`;
    const filePath = path.join(userDirectory, fileName);

    doc.pipe(fs.createWriteStream(filePath));


 
    // Write content to the PDF document
    doc.fontSize(16).text("Invoice", { align: "center" }).moveDown();

    doc.fontSize(12).text(`Order ID: ${order._id}`).moveDown();

    // Add order details
    doc.text(`User: ${order.user.name}`).moveDown();
    order.addresses.forEach((address) => {
      doc
        .text(
          `Address: ${address.address}, ${address.city}, ${address.state}, ${address.country}, ${address.zipCode}`
        )
        .moveDown();
    });
    doc.moveDown();

    doc.text("Products:");
    order.items.forEach((item) => {
      doc.text(
        `- ${item.product.name}: ${item.quantity} x $${item.product.price}`
      );
    });
    doc.moveDown();

    doc.text(`Total Price: $${order.total}`).moveDown();
    doc.text(`Payment Method: ${order.paymentMethod}`).moveDown();
    doc.text(`Status: ${order.status}`).moveDown();
    doc.end();

    // Send the PDF file as a response for download
 
    res.download(filePath);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

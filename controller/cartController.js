const { userCollection } = require("../model/usermodel");
const { categoryCollection } = require("../model/catagorymodel");
const { productCollection } = require("../model/productModel");
const cartCollection = require("../model/cartModel");
const orderCollection=require('../model/oderModel');
const addressCollection=require('../model/addressModel');
const { render } = require("ejs");

exports.addToCart = async (req, res) => {
  const { userId, productId, quantity } = req.body;
  try {
    // Retrieve the product from the database
    const product = await productCollection.findById(productId);
    console.log("Existing product",product);
    if (!product) {
      return res.status(400).send("Product not found to add to cart");
    }

    // Calculate the total price for the item
    let price = product.price * quantity;
    console.log(price,'dfjd');

    // Find the user's cart
    let cart = await cartCollection.findOne({ userId: userId });

    // Initialize totalprice as 0 if the cart doesn't exist
    let totalprice
  console.log("cart total",cart);
    if (cart) {
      // If the cart exists, get its current totalprice
      totalprice = cart.totalprice || 0;
    }

    if (!cart) {
      // If the cart doesn't exist, create a new cart with the item
      console.log(price,'nerrere');
      cart = new cartCollection({
        userId: userId,
        items: [{ productId: productId, qty: quantity, price: price }],
        totalprice:product.price
      });
    } else {
      // Check if the item already exists in the cart
      const existingItemIndex = cart.items.findIndex(item => item.productId.equals(productId));

      if (existingItemIndex !== -1) {
        // If the item already exists, update its quantity and total price
        const newQty = cart.items[existingItemIndex].qty + quantity;
        if (newQty <= product.quantity) {
          cart.items[existingItemIndex].qty += quantity;
          cart.items[existingItemIndex].price += price;
          totalprice += price;
        } else {
          return res.status(400).json({ outOfStock: true, message: 'Requested quantity exceeds available stock' });
        }
      } else {
        // If the item doesn't exist, add it to the cart
        cart.items.push({ productId, qty: quantity, price: price });
        totalprice += price;
      }
    }

    // Set the totalprice in the cart
    cart.totalprice = totalprice;

    // Save the cart to the database
    await cart.save();
  
    res.status(201).json({ success: true, cart });
  } catch (error) {
    console.error("Error adding item to cart:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}


exports.cartGet = async (req, res) => {
  try {
      if (!req.session.userId) {
          return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const userId = req.session.userId._id;
      const cart = await cartCollection.findOne({ userId: userId }).populate("items.productId");
     
      // Check if any product in the cart is out of stock and update the cart accordingly
      if (cart) {
          for (const item of cart.items) {
              const product = await productCollection.findById(item.productId);
            if(!product){
              res.status(400).send("product not found in the cartget")
            }
          }
      }

      res.render("user/cart", { cart, userId });
  } catch (error) {
      console.error("Error getting cart:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};


exports.removeFromCart = async (req, res) => {
  const { userId } = req.session;
  const { productId } = req.body;

  try {
    if (userId) {
      const cart = await cartCollection.findOne({ userId: userId });
      if (cart) {
        // Filter out the item to remove
        cart.items = cart.items.filter(item => !item.productId.equals(productId));
      let product=await productCollection.findById(productId)
      let realPrice=product.price   
      cart.totalprice=cart.totalprice-realPrice
      console.log(cart.totalprice);

        if(cart.items.length===0){
          cart.totalprice=0
        }
        await cart.save();
        res.status(200).json({ success: true, message: "Product removed from cart successfully" });
      } else {
        res.status(404).json({ success: false, message: "Cart not found" });
      }
    } else {
      res.status(403).json({ success: false, message: "User not authenticated" });
    }
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
      
     //update quantity of products in cart
     exports.updateCartItemQuantity = async (req, res) => {
      try {
        const { userId } = req.session;
        const { productId, quantity } = req.body;
    
        if (!userId) {
          return res.status(401).json({ success: false, error: 'User not authenticated' });
        }
    
        // Find the product
        const product = await productCollection.findById(productId);
        if (!product) {
          return res.status(404).json({ success: false, error: 'Product not found' });
        }
    
        // Check if the requested quantity exceeds available stock
        if (quantity > product.quantity) {
          return res.status(400).json({ success: false, error: 'Requested quantity exceeds available stock' });
        }
    
        // Find the user's cart
        const cart = await cartCollection.findOne({ userId: userId });
        if (!cart) {
          return res.status(404).json({ success: false, error: 'Cart not found' });
        }
    
        // Find the item in the cart
        const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (itemIndex === -1) {
          return res.status(404).json({ success: false, error: 'Item not found in cart' });
        }
    
        // Update the quantity and price of the item
        cart.items[itemIndex].qty = quantity;
        cart.items[itemIndex].price = product.price * quantity;
    
        // Recalculate the total price of the cart
        let totalprice = 0;
        for (const item of cart.items) {
          totalprice += item.price;
        }
        cart.totalprice = totalprice;
    
        // Save the updated cart
        await cart.save();
    
        res.json({ success: true, message: 'Quantity updated successfully', updatedCart: cart });
      } catch (error) {
        console.error('Error updating cart item quantity:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
      }
    };
    



const { userCollection } = require("../model/usermodel");
const { categoryCollection } = require("../model/catagorymodel");
const { productCollection } = require("../model/productModel");
const cartCollection = require("../model/cartModel");
const { render } = require("ejs");

exports.addToCart = async (req, res) => {
  const { userId, productId, quantity } = req.body;
  try {
    // Retrieve the product from the database
    const product = await productCollection.findById(productId);
     
    if (!product ) {
     res.status(400).send("product not found to add cart")
    }
    console.log(productId,"pro")
    console.log(quantity,"ahah")
    console.log(product.quantity,"hhhahh")
     // Check if the requested quantity exceeds the available stock

    let isCart 
       isCart = await cartCollection.findOne({ userId: userId });
    
    

      if (!isCart) {
        const newCart = {
          userId: userId,
          items: [{ productId: productId, qty: quantity }],
        };
  
        await cartCollection.insertMany(newCart);
      } else {
        const existingItemIndex = isCart.items.findIndex((item) =>
          item.productId.equals(productId)
        );
        if (existingItemIndex !== -1) {
            let newQty=isCart.items[existingItemIndex].qty + quantity
            if(newQty<=product.quantity){
              isCart.items[existingItemIndex].qty += quantity;

            }else{
              return res.status(201).json({ outOfStock: true, isCart ,mess : 'dfghj' });
            }
        } else {
          isCart.items.push({ productId, qty:quantity });
        }
      }

      await isCart.save();
      res.status(201).json({ success: true, isCart });
    } 
   
   catch (error) {
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
    console.log("entered into updateitem quantity")
    const { userId } = req.session;
    const { productId, quantity } = req.body;
console.log(userId,"updatecartitemquantity1")
console.log(productId,"updatecartitemquantity2")
console.log(quantity,"updatecartitemquantity3")


    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
      // Find the product
      const product = await productCollection.findById(productId);
      console.log(product,"product");
      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      if (quantity > product.quantity) {
        return res.status(400).json({ success: false, error: 'Requested quantity exceeds available stock' });
      }

    const cart = await cartCollection.findOne({ userId: userId });
    if (!cart) {
      return res.status(404).json({ success: false, error: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, error: 'Item not found in cart' });
    }

    cart.items[itemIndex].qty = quantity;
    await cart.save();

    res.json({ success: true, message: 'Quantity updated successfully', updatedCart: cart });
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
};

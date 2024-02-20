// document.addEventListener('DOMContentLoaded', function() {
//   const minusButtons = document.querySelectorAll('.qt-minus');
//   minusButtons.forEach(button => {
//       button.addEventListener('click', function() {
//           updateQuantity(button, -1);
//       });
//   });

//   const plusButtons = document.querySelectorAll('.qt-plus');
//   plusButtons.forEach(button => {
//       button.addEventListener('click', function() {
//           updateQuantity(button, 1);
//       });
//   });

//   function updateQuantity(button, change) {
//       const quantityElement = button.parentElement.querySelector('.qt');
//       let quantity = parseInt(quantityElement.textContent);
//       const productId = button.dataset.proId;

//       // Update quantity
//       quantity += change;
//       quantity = Math.max(1, quantity); // Ensure quantity is never less than 1

//       quantityElement.textContent = quantity; // Update quantity display

//       // Update subtotal
//       const priceElement = button.parentElement.querySelector('.price');
//       const price = parseFloat(priceElement.textContent);
//       const fullPriceElement = button.parentElement.querySelector('.full-price');
//       const fullPrice = price * quantity;
//       fullPriceElement.textContent = fullPrice.toFixed(2); // Update full price display

//       // Update cart item quantity on the server
//       updateCartItemQuantity(productId, quantity);
//   }

//   function updateCartItemQuantity(productId, quantity) {
//       fetch('/cart/updateQuantity', {
//           method: 'POST',
//           headers: {
//               'Content-Type': 'application/json'
//           },
//           body: JSON.stringify({ productId, quantity })
//       })
//           .then(response => response.json())
//           .then(data => {
//               if (!data.success) {
//                   console.error('Failed to update quantity:', data.error);
//                   alert('Failed to update quantity. Please try again later.');
//               }
//           })
//           .catch(error => {
//               console.error('Error updating quantity:', error);
//               alert('An error occurred. Please try again later.');
//           });
//   }
// });
// document.addEventListener('DOMContentLoaded', function() {
//   const minusButtons = document.querySelectorAll('.qt-minus');
//   minusButtons.forEach(button => {
//       button.addEventListener('click', function() {
//           updateQuantity(button, -1);
//           updateSubtotal();
//       });
//   });

//   const plusButtons = document.querySelectorAll('.qt-plus');
//   plusButtons.forEach(button => {
//       button.addEventListener('click', function() {
//           updateQuantity(button, 1);
//           updateSubtotal();
//       });
//   });

//   function updateQuantity(button, change) {
//       const quantityElement = button.parentElement.querySelector('.qt');
//       let quantity = parseInt(quantityElement.textContent);
//       const productId = button.dataset.proId;

//       // Update quantity
//       quantity += change;
//       quantity = Math.max(1, quantity); // Ensure quantity is never less than 1

//       quantityElement.textContent = quantity; // Update quantity display

//       // Update subtotal
//       const priceElement = button.parentElement.querySelector('.price');
//       const price = parseFloat(priceElement.textContent);
//       const fullPriceElement = button.parentElement.querySelector('.full-price');
//       const fullPrice = price * quantity;
//       fullPriceElement.textContent = fullPrice.toFixed(2); // Update full price display

//       // Calculate and update total subtotal
//       updateSubtotal();
      
//       // Update cart item quantity on the server
//       updateCartItemQuantity(productId, quantity);
//   }

//   function updateSubtotal() {
//     const fullPriceElements = document.querySelectorAll('.full-price');
//     let subtotal = 0;
//     fullPriceElements.forEach(element => {
//         subtotal += parseFloat(element.textContent);
//     });

//     const subtotalElement = document.querySelector('.subtotal span');
//     subtotalElement.textContent = subtotal.toFixed(2);

//     // Calculate total including taxes and shipping
//     const taxes = subtotal * 0.05;
//     const shipping = 5.00;
//     const total = subtotal + taxes + shipping;

//     const totalElement = document.querySelector('.total span');
//     totalElement.textContent = total.toFixed(2);

//     // Store subtotal and total in session storage
//     sessionStorage.setItem('subtotal', subtotal.toFixed(2));
//     sessionStorage.setItem('total', total.toFixed(2));
// }

// // Call the updateSubtotal function when the page loads
// document.addEventListener('DOMContentLoaded', function() {
//     // Retrieve subtotal and total from session storage
//     const subtotal = sessionStorage.getItem('subtotal');
//     const total = sessionStorage.getItem('total');

//     if (subtotal && total) {
//         // Update subtotal and total if stored values exist
//         const subtotalElement = document.querySelector('.subtotal span');
//         subtotalElement.textContent = subtotal;

//         const totalElement = document.querySelector('.total span');
//         totalElement.textContent = total;
//     }
// });



//   function updateCartItemQuantity(productId, quantity) {
//       fetch('/cart/updateQuantity', {
//           method: 'POST',
//           headers: {
//               'Content-Type': 'application/json'
//           },
//           body: JSON.stringify({ productId, quantity })
//       })  
//           .then(response => response.json())
//           .then(data => {
//               if (!data.success) {
//                   console.error('Failed to update quantity:', data.error);
//                   alert('Failed to update quantity. Please try again later.');
//               }
//           })
//           .catch(error => {
//               console.error('Error updating quantity:', error);
//               alert('An error occurred. Please try again later.');
//           });
//   }
// });
       
document.addEventListener('DOMContentLoaded', function() {
  const minusButtons = document.querySelectorAll('.qt-minus');
  minusButtons.forEach(button => {
      button.addEventListener('click', function() {
          updateQuantity(button, -1);
      });
  });

  const plusButtons = document.querySelectorAll('.qt-plus');
  plusButtons.forEach(button => {
      button.addEventListener('click', function() {
          updateQuantity(button, 1);
      });
  });

  function updateQuantity(button, change) {
      const quantityElement = button.parentElement.querySelector('.qt');
      let quantity = parseInt(quantityElement.textContent);
      const productId = button.dataset.proId;

      // Update quantity
      quantity += change;
      quantity = Math.max(1, quantity); // Ensure quantity is never less than 1

      quantityElement.textContent = quantity; // Update quantity display

      // Update subtotal and total
      const priceElement = button.parentElement.querySelector('.price');
      const price = parseFloat(priceElement.textContent);
      const fullPriceElement = button.parentElement.querySelector('.full-price');
      const fullPrice = price * quantity;
      fullPriceElement.textContent = fullPrice.toFixed(2); // Update full price display

      // Calculate subtotal
      let subtotal = 0;
      const fullPriceElements = document.querySelectorAll('.full-price');
      fullPriceElements.forEach(element => {
          subtotal += parseFloat(element.textContent);
      });

      const subtotalElement = document.querySelector('.subtotal span');
      subtotalElement.textContent = subtotal.toFixed(2);

      // Calculate taxes
      const taxes = subtotal * 0.05;
      const taxElement = document.querySelector('.tax span');
      taxElement.textContent = taxes.toFixed(2);

      // Calculate total including taxes and shipping
      const shipping = 5.00;
      const total = subtotal + taxes + shipping;

      const totalElement = document.querySelector('.total span');
      totalElement.textContent = total.toFixed(2);

      // Update cart item quantity on the server
      updateCartItemQuantity(productId, quantity);
  }

  function updateCartItemQuantity(productId, quantity) {
      fetch('/cart/updateQuantity', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ productId, quantity })
          })
          .then(response => response.json())
          .then(data => {
              if (!data.success) {
                  console.error('Failed to update quantity:', data.error);
                  alert('Failed to update quantity. Please try again later.');
              }
              window.location.reload();
          })
          .catch(error => {
              console.error('Error updating quantity:', error);
              alert('An error occurred. Please try again later.');
          });
  }
});

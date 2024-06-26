
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

      const total = subtotal 

      const totalElement = document.querySelector('.total span');
      totalElement.textContent = total.toFixed(2);

      // Update cart item quantity on the server
      updateCartItemQuantity(productId, quantity);
  }

  function updateCartItemQuantity(productId, quantity) {
    console.log('dfjidhif');
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
                    window.location.reload();
              }
           
          })
          .catch(error => {
              console.error('Error updating quantity:', error);
              alert('An error occurred. Please try again later.');
          });
  }

});

// Modal helpers
function showCheckoutModal(msg, success = false) {
  const modal = document.getElementById("checkout-modal");
  const msgEl = document.getElementById("checkout-modal-msg");
  if (msgEl) msgEl.textContent = msg;
  if (modal) modal.style.display = "flex";
  if (success) msgEl.classList.add("text-green-600");
  else msgEl.classList.remove("text-green-600");
}

function closeCheckoutModal() {
  const modal = document.getElementById("checkout-modal");
  if (modal) modal.style.display = "none";
}

// Initialize modal close buttons
document
  .getElementById("checkout-modal-close")
  ?.addEventListener("click", closeCheckoutModal);
document
  .getElementById("checkout-modal-close2")
  ?.addEventListener("click", closeCheckoutModal);

// Load and display cart items
function displayCartItems() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const itemsContainer = document.getElementById("checkout-items");
  let subtotal = 0;

  if (!cart.length) {
    itemsContainer.innerHTML =
      '<p class="text-gray-500 text-center py-4">Your cart is empty.</p>';
    return;
  }

  itemsContainer.innerHTML = cart
    .map((item) => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      return `
      <div class="flex items-center gap-4 py-4">
        <img src="${item.image}" alt="${
        item.name
      }" class="w-16 h-16 object-cover rounded-xl border">
        <div class="flex-1">
          <div class="font-bold text-[#CA2E0A]">${item.name}</div>
          <div class="text-gray-600 text-sm">Qty: ${item.quantity}</div>
        </div>
        <div class="font-bold">KES ${itemTotal.toLocaleString()}</div>
      </div>
    `;
    })
    .join("");

  // Calculate and display totals
  const shipping = subtotal > 0 ? 150 : 0; // Example shipping cost
  const total = subtotal + shipping;

  document.getElementById(
    "checkout-subtotal"
  ).textContent = `KES ${subtotal.toLocaleString()}`;
  document.getElementById(
    "checkout-shipping"
  ).textContent = `KES ${shipping.toLocaleString()}`;
  document.getElementById(
    "checkout-total"
  ).textContent = `KES ${total.toLocaleString()}`;
}

// Handle form submission
document
  .getElementById("checkout-form")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const btn = document.getElementById("checkout-btn");
    btn.disabled = true;
    const oldText = btn.textContent;
    btn.textContent = "Processing...";

    // Get form data
    const formData = {
      name: document.getElementById("name").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      address: document.getElementById("address-select").value,
      mpesa_phone: document.getElementById("mpesa-phone").value,
      cart: JSON.parse(localStorage.getItem("cart") || "[]"),
    };

    try {
      const res = await fetch("/store/checkout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCSRFToken(),
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.success) {
        showCheckoutModal(
          "Order placed successfully! Proceeding to M-Pesa payment...",
          true
        );
        // Handle M-Pesa payment initiation here
        // localStorage.removeItem('cart');
        // setTimeout(() => window.location.href = '/store/orders/', 2000);
      } else {
        showCheckoutModal(
          data.error || "Failed to place order. Please try again."
        );
      }
    } catch (err) {
      showCheckoutModal("An error occurred. Please try again.");
    }

    btn.disabled = false;
    btn.textContent = oldText;
  });

// Get CSRF token
function getCSRFToken() {
  const name = "csrftoken";
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(name + "=")) {
      return decodeURIComponent(cookie.substring(name.length + 1));
    }
  }
  return "";
}

// Initialize page
document.addEventListener("DOMContentLoaded", function () {
  displayCartItems();
});

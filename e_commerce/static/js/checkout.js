console.log("✅ Checkout.js loaded successfully!");

// =================================================================================
// MAIN INITIALIZATION
// =================================================================================
document.addEventListener("DOMContentLoaded", function () {
  // Setup all event listeners for the page
  initializeEventListeners();
  // Display cart items and totals on page load
  displayOrderSummary();
  // Load any saved addresses for the user
  loadSavedAddresses();
});

// =================================================================================
// EVENT LISTENERS
// =================================================================================
function initializeEventListeners() {
  // Main checkout form submission
  const checkoutForm = document.getElementById("checkout-form");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", submitOrder);
  }
  // Address modal buttons
  document
    .getElementById("add-address-btn")
    ?.addEventListener("click", showAddressModal);
  document
    .getElementById("close-modal")
    ?.addEventListener("click", hideAddressModal);
  document
    .getElementById("save-address")
    ?.addEventListener("click", saveAddress);
  document
    .getElementById("address-modal")
    ?.addEventListener("click", function (e) {
      if (e.target === this) hideAddressModal();
    });
  // Order status modal buttons
  document
    .getElementById("order-modal-close")
    ?.addEventListener("click", closeOrderModal);
  document
    .getElementById("order-modal-close2")
    ?.addEventListener("click", closeOrderModal);
}

// =================================================================================
// ORDER SUBMISSION
// =================================================================================
async function submitOrder(e) {
  e.preventDefault();
  const btn = document.getElementById("checkout-btn");
  const oldText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "Placing Order...";

  // --- 1. Gather Data ---
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const addressSelect = document.getElementById("shipping-address");
  const shipping_address =
    addressSelect.options[addressSelect.selectedIndex]?.text || "";
  const paymentMethod =
    document.querySelector('input[name="payment"]:checked')?.value || "mpesa";

  const orderData = {
    cart,
    shipping_address,
    payment_method: paymentMethod,
    mpesa_phone: document.getElementById("mpesa-phone").value,
    name: document.getElementById("name").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
  };

  // --- 2. Validate Data ---
  if (!orderData.cart.length) {
    showOrderModal('<p class="text-red-600">Your cart is empty.</p>');
    btn.disabled = false;
    btn.textContent = oldText;
    return;
  }
  if (!orderData.shipping_address || addressSelect.value === "") {
    showOrderModal(
      '<p class="text-red-600">Please select a shipping address.</p>'
    );
    btn.disabled = false;
    btn.textContent = oldText;
    return;
  }
  if (!orderData.mpesa_phone) {
    showOrderModal(
      '<p class="text-red-600">Please enter your M-Pesa phone number.</p>'
    );
    btn.disabled = false;
    btn.textContent = oldText;
    return;
  }

  // --- 3. Submit to Backend ---
  try {
    const response = await fetch("/store/order/create/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCSRFToken(),
      },
      body: JSON.stringify(orderData),
    });
    const data = await response.json();

    if (data.success) {
      localStorage.removeItem("cart"); // Clear the cart on success
      updateCartCounter(); // Update the cart icon in the header
      displayOrderSummary(); // Re-render summary to show it's empty
      showOrderModal(
        `<div class="text-green-600 font-bold">Order placed successfully!</div>
                 <div class="mt-4 text-sm">
                    <p><b>Order ID:</b> ${data.order_id}</p>
                    <p><b>Total:</b> KES ${data.total}</p>
                    <p><b>Status:</b> ${data.status}</p>
                 </div>`
      );
    } else {
      showOrderModal(
        `<p class="text-red-600">${data.error || "Failed to place order."}</p>`
      );
    }
  } catch (error) {
    showOrderModal(
      '<p class="text-red-600">An error occurred. Please try again.</p>'
    );
  } finally {
    btn.disabled = false;
    btn.textContent = oldText;
  }
}

// =================================================================================
// ORDER SUMMARY / CART DISPLAY
// =================================================================================
function displayOrderSummary() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const itemsContainer = document.getElementById("checkout-items");
  const subtotalEl = document.getElementById("checkout-subtotal");
  const shippingEl = document.getElementById("checkout-shipping");
  const totalEl = document.getElementById("checkout-total");

  if (!itemsContainer || !subtotalEl || !shippingEl || !totalEl) return;

  itemsContainer.innerHTML = "";
  let subtotal = 0;

  if (cart.length === 0) {
    itemsContainer.innerHTML =
      '<p class="text-gray-500 text-center py-4">Your order is complete. The cart is now empty.</p>';
  } else {
    cart.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;
      const itemElement = document.createElement("div");
      itemElement.className = "flex justify-between items-center py-2";
      itemElement.innerHTML = `
                <div class="flex items-center gap-4">
                    <img src="${item.image}" alt="${
        item.name
      }" class="w-12 h-12 object-cover rounded-md">
                    <div>
                        <p class="font-semibold">${item.name}</p>
                        <p class="text-sm text-gray-600">Qty: ${
                          item.quantity
                        }</p>
                    </div>
                </div>
                <span class="font-semibold">KES ${itemTotal.toLocaleString()}</span>
            `;
      itemsContainer.appendChild(itemElement);
    });
  }

  const shipping = subtotal > 0 ? 150 : 0;
  const total = subtotal + shipping;

  subtotalEl.textContent = `KES ${subtotal.toLocaleString()}`;
  shippingEl.textContent = `KES ${shipping.toLocaleString()}`;
  totalEl.textContent = `KES ${total.toLocaleString()}`;
}

// Dummy function to be replaced with actual cart counter logic from another file if needed.
function updateCartCounter() {
  const counter = document.querySelector('a[aria-label="Cart"] span.absolute');
  if (counter) {
    counter.textContent = "0";
    counter.style.display = "none";
  }
}

// =================================================================================
// ADDRESS MANAGEMENT
// =================================================================================
async function saveAddress() {
  const saveBtn = document.getElementById("save-address");
  const originalText = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  const addressData = {
    county: document.getElementById("modal-county").value.trim(),
    subcounty: document.getElementById("modal-subcounty").value.trim(),
    town: document.getElementById("modal-town").value.trim(),
    address_line1: document.getElementById("modal-line1").value.trim(),
    address_line2: document.getElementById("modal-line2").value.trim() || "",
  };

  const requiredFields = ["county", "subcounty", "town", "address_line1"];
  const missingFields = requiredFields.filter((field) => !addressData[field]);
  if (missingFields.length > 0) {
    showOrderModal(
      `<p class="text-red-600">Please fill in all required fields: ${missingFields.join(
        ", "
      )}</p>`
    );
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
    return;
  }

  try {
    const response = await fetch("/store/address/add/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCSRFToken(),
      },
      body: JSON.stringify(addressData),
    });
    const data = await response.json();

    if (data.success) {
      await loadSavedAddresses();
      const select = document.getElementById("shipping-address");
      if (select) select.value = data.address_id;
      hideAddressModal();
      showOrderModal(
        '<p class="text-green-600">Address saved successfully!</p>'
      ); // Use order modal for consistency
    } else {
      showOrderModal(
        `<p class="text-red-600">${data.error || "Failed to save address."}</p>`
      );
    }
  } catch (error) {
    showOrderModal(
      '<p class="text-red-600">An error occurred while saving the address.</p>'
    );
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
}

async function loadSavedAddresses() {
  const select = document.getElementById("shipping-address");
  if (!select) return;

  const userAddresses = Array.from(
    select.querySelectorAll('option[data-user-address="true"]')
  );
  userAddresses.forEach((option) => option.remove());

  try {
    const response = await fetch("/store/addresses/");
    const data = await response.json();

    if (data.success) {
      const placeholder = select.querySelector('option[value=""]');
      data.addresses.forEach((address) => {
        const option = new Option(
          `${address.county}, ${address.subcounty}, ${address.town}, ${
            address.address_line1
          }${address.is_default ? " (Default)" : ""}`,
          address.id
        );
        option.dataset.userAddress = "true";
        placeholder.insertAdjacentElement("afterend", option);
      });

      const defaultAddress = data.addresses.find((addr) => addr.is_default);
      if (defaultAddress) {
        select.value = defaultAddress.id;
      }
    }
  } catch (error) {
    console.error("Failed to load addresses:", error);
  }
}

// =================================================================================
// MODAL & UTILITY FUNCTIONS
// =================================================================================
function showAddressModal() {
  document.getElementById("address-modal").style.display = "flex";
}

function hideAddressModal() {
  const modal = document.getElementById("address-modal");
  if (modal) {
    modal.style.display = "none";
    modal.querySelector("form")?.reset(); // Assuming the modal contains a form
  }
}

function showOrderModal(contentHtml) {
  const modal = document.getElementById("order-modal");
  const content = document.getElementById("order-modal-content");
  if (content) content.innerHTML = contentHtml;
  if (modal) modal.style.display = "flex";
}

function closeOrderModal() {
  document.getElementById("order-modal").style.display = "none";
}

function getCSRFToken() {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "csrftoken") {
      return decodeURIComponent(value);
    }
  }
  return "";
}

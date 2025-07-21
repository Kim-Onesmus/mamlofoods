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

// Get CSRF token for AJAX requests
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

// Show/hide address modal
function showAddressModal() {
  document.getElementById("address-modal").style.display = "flex";
}

function hideAddressModal() {
  document.getElementById("address-modal").style.display = "none";
  // Clear form
  document.getElementById("modal-county").value = "";
  document.getElementById("modal-subcounty").value = "";
  document.getElementById("modal-town").value = "";
  document.getElementById("modal-line1").value = "";
  document.getElementById("modal-line2").value = "";
}

// Save new address
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

  // Validate required fields
  const requiredFields = ["county", "subcounty", "town", "address_line1"];
  const missingFields = requiredFields.filter((field) => !addressData[field]);

  if (missingFields.length > 0) {
    showCheckoutModal(
      `Please fill in all required fields: ${missingFields.join(", ")}`
    );
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
    return;
  }

  console.log("Sending address data:", addressData); // Debug log

  try {
    const response = await fetch("/store/address/add/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCSRFToken(),
      },
      body: JSON.stringify(addressData),
    });

    console.log("Response status:", response.status); // Debug log
    const data = await response.json();
    console.log("Response data:", data); // Debug log

    if (data.success) {
      // Reload the address list to show all addresses and the default one correctly.
      await loadSavedAddresses();

      // Select the newly added address.
      const select = document.getElementById("shipping-address");
      if (select) {
        select.value = data.address_id;
      }

      // Show success message and hide the form modal
      showCheckoutModal("Address saved successfully!", true);
      hideAddressModal();
    } else {
      showCheckoutModal(
        data.error || "Failed to save address. Please try again."
      );
    }
  } catch (error) {
    console.error("Error saving address:", error); // Debug log
    showCheckoutModal("Failed to save address. Please try again.");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
}

// Load user's saved addresses
async function loadSavedAddresses() {
  const select = document.getElementById("shipping-address");
  if (!select) {
    return;
  }

  // --- Preserve and remove user addresses to avoid duplication ---
  const userAddresses = Array.from(
    select.querySelectorAll('option[data-user-address="true"]')
  );
  userAddresses.forEach((option) => option.remove());

  try {
    const response = await fetch("/store/addresses/");
    const data = await response.json();

    if (data.success) {
      // --- Insert user addresses after the placeholder ---
      const placeholder = select.querySelector('option[value=""]');

      data.addresses.forEach((address) => {
        const option = new Option(
          `${address.county}, ${address.subcounty}, ${address.town}, ${
            address.address_line1
          }${address.is_default ? " (Default)" : ""}`,
          address.id,
          false, // should not be default selected
          false // should not be selected
        );
        option.dataset.userAddress = "true"; // Mark as a user-added address
        placeholder.insertAdjacentElement("afterend", option);
      });

      // --- Set default selection ---
      const defaultAddress = data.addresses.find((addr) => addr.is_default);
      if (defaultAddress) {
        select.value = defaultAddress.id;
      }
    }
  } catch (error) {
    console.error("Failed to load addresses:", error);
  }
}

// Show checkout modal for messages
function showCheckoutModal(message, success = false) {
  const modal = document.getElementById("checkout-modal");
  const messageEl = document.getElementById("checkout-modal-message");
  if (messageEl) {
    messageEl.textContent = message;
    messageEl.className = success ? "text-green-600" : "text-red-600";
  }
  if (modal) modal.style.display = "flex";
}

// Show order modal for order status/results
function showOrderModal(contentHtml) {
  const modal = document.getElementById("order-modal");
  const content = document.getElementById("order-modal-content");
  if (content) content.innerHTML = contentHtml;
  if (modal) modal.style.display = "flex";
}
function closeOrderModal() {
  const modal = document.getElementById("order-modal");
  if (modal) modal.style.display = "none";
}

// Handle order form submission
const checkoutForm = document.getElementById("checkout-form");
if (checkoutForm) {
  checkoutForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const btn = document.getElementById("checkout-btn");
    btn.disabled = true;
    const oldText = btn.textContent;
    btn.textContent = "Placing Order...";

    // Gather order data
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const addressSelect = document.getElementById("shipping-address");
    const addressValue = addressSelect.value;
    const addressText =
      addressSelect.options[addressSelect.selectedIndex]?.text || "";
    const paymentMethod =
      checkoutForm.querySelector('input[name="payment"]:checked')?.value ||
      "mpesa";
    const mpesaPhone = document.getElementById("mpesa-phone").value;
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("phone").value;

    // Basic validation
    if (!cart.length) {
      showOrderModal('<span class="text-red-600">Your cart is empty.</span>');
      btn.disabled = false;
      btn.textContent = oldText;
      return;
    }
    if (!addressValue) {
      showOrderModal(
        '<span class="text-red-600">Please select a shipping address.</span>'
      );
      btn.disabled = false;
      btn.textContent = oldText;
      return;
    }
    if (!mpesaPhone) {
      showOrderModal(
        '<span class="text-red-600">Please enter your M-Pesa phone number.</span>'
      );
      btn.disabled = false;
      btn.textContent = oldText;
      return;
    }

    // Prepare order data
    const orderData = {
      cart,
      shipping_address: addressText,
      payment_method: paymentMethod,
      mpesa_phone: mpesaPhone,
      name,
      email,
      phone,
    };

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
        // Clear cart
        localStorage.removeItem("cart");
        // Show order summary
        showOrderModal(
          `<span class='text-green-600'>Order placed successfully!</span><br><br><b>Order ID:</b> ${data.order_id}<br><b>Total:</b> KES ${data.total}<br><b>Status:</b> ${data.status}`
        );
      } else {
        showOrderModal(
          `<span class='text-red-600'>${
            data.error || "Failed to place order."
          }</span>`
        );
      }
    } catch (error) {
      showOrderModal(
        '<span class="text-red-600">Failed to place order. Please try again.</span>'
      );
    } finally {
      btn.disabled = false;
      btn.textContent = oldText;
    }
  });
}
// Order modal close buttons
document
  .getElementById("order-modal-close")
  ?.addEventListener("click", closeOrderModal);
document
  .getElementById("order-modal-close2")
  ?.addEventListener("click", closeOrderModal);

// Event Listeners
document.addEventListener("DOMContentLoaded", function () {
  // Load saved addresses when page loads
  loadSavedAddresses();

  // Add Address button click
  const addAddressBtn = document.getElementById("add-address-btn");
  if (addAddressBtn) {
    addAddressBtn.addEventListener("click", showAddressModal);
  }

  // Close modal button click
  const closeModalBtn = document.getElementById("close-modal");
  if (closeModalBtn) {
    closeModalBtn.addEventListener("click", hideAddressModal);
  }

  // Save address button click
  const saveAddressBtn = document.getElementById("save-address");
  if (saveAddressBtn) {
    saveAddressBtn.addEventListener("click", saveAddress);
  }

  // Close modal when clicking outside
  const addressModal = document.getElementById("address-modal");
  if (addressModal) {
    addressModal.addEventListener("click", function (e) {
      if (e.target === this) {
        hideAddressModal();
      }
    });
  }
});

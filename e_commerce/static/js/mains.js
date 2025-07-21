console.log("Test: mains.js loaded");
document.addEventListener("DOMContentLoaded", function () {
  const productCardsContainer = document.getElementById("product-cards");
  const heroSwiperWrapper = document.getElementById("hero-swiper-wrapper");

  // Use correct URL for products JSON with /store/ prefix
  fetch("/store/products-json/")
    .then((response) => response.json())
    .then((data) => {
      const products = data.products;
      // Product Cards
      if (productCardsContainer) {
        if (!products.length) {
          productCardsContainer.innerHTML =
            '<div class="col-span-4 text-center text-gray-500">No products available.</div>';
        } else {
          productCardsContainer.innerHTML = products
            .map(
              (product) => `
      <div class="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col p-0 overflow-hidden group w-full">
          <a href="/store/product/${
            product.slug
          }/" class="block focus:ring-2 focus:ring-[#CA2E0A]">
              <div class="w-full h-32 md:h-48 bg-gray-100 flex items-center justify-center">
                  <img src="${product.image}" alt="${
                product.name
              }" class="w-full h-full object-cover rounded-t-3xl group-hover:scale-105 transition-transform duration-300">
              </div>
              <div class="p-2 pb-0">
                  <h3 class="text-[14px] md:text-xl font-bold text-[#CA2E0A]">
                  ${product.size_or_weight} ${product.name}</h3>
                  <div class="text-[14px] md:text-xl font-bold text-gray-900 mb-2">
                    Ksh ${product.price.toLocaleString()}
                  </div>
              </div>
          </a>
          <div class="flex gap-2 w-full px-2 pb-6 mt-auto">
              <button class="flex-1 bg-[#CA2E0A] text-white font-bold py-2 rounded-full shadow hover:bg-[#a82307] transition flex items-center justify-center gap-2 focus:ring-2 focus:ring-[#CA2E0A]" title="Add to Cart">
                  <i class="fa-solid fa-cart-plus"></i>
                  <span class="hidden sm:inline">Add to Cart</span>
              </button>
              <button class="bg-white border border-[#CA2E0A] text-[#CA2E0A] py-2 px-4 rounded-full shadow hover:bg-[#CA2E0A] hover:text-white transition flex items-center justify-center focus:ring-2 focus:ring-[#CA2E0A]" title="Add to Wishlist">
                  <i class="fa-regular fa-heart"></i>
              </button>
          </div>
      </div>
    `
            )
            .join("");
        }
      }
      // Hero Swiper Slides
      if (heroSwiperWrapper) {
        if (!products.length) {
          heroSwiperWrapper.innerHTML =
            '<div class="swiper-slide flex items-center justify-center text-white text-2xl">No products available.</div>';
        } else {
          heroSwiperWrapper.innerHTML = products
            .map(
              (product) => `
            <div class="swiper-slide flex flex-col md:flex-row items-center justify-between px-4 py-8 md:py-12">
                <div class="md:w-1/2 mb-8 md:mb-0">
                    <h1 class="text-4xl md:text-5xl font-extrabold mb-4 leading-tight drop-shadow">${
                      product.size_or_weight
                    } ${product.name}</h1>
                    <div class="flex justify-start md:justify-start mb-4"></div>
                    <p class="text-lg md:text-xl mb-6 font-medium">Ksh ${product.price.toLocaleString()}</p>
                    <a href="/store/product/${
                      product.slug
                    }/" class="inline-block bg-white text-[#CA2E0A] font-bold px-8 py-3 rounded-full shadow hover:bg-gray-100 hover:text-[#a82307] transition">View Product</a>
                </div>
                <div class="md:w-1/2 flex justify-center">
                    <img src="${product.image}" alt="${
                product.name
              }" class="w-80 h-80 object-cover rounded-2xl shadow-xl border-4 border-white">
                </div>
            </div>
          `
            )
            .join("");
          if (window.Swiper) {
            new Swiper(".heroSwiper", {
              loop: true,
              effect: "slide",
              pagination: {
                el: ".swiper-pagination",
                clickable: true,
              },
              navigation: {
                nextEl: ".swiper-button-next",
                prevEl: ".swiper-button-prev",
              },
              autoplay: {
                delay: 5000,
              },
            });
          }
        }
      }
    })
    .catch((err) => {
      if (productCardsContainer)
        productCardsContainer.innerHTML =
          '<div class="col-span-4 text-center text-red-500">Failed to load products.</div>';
      if (heroSwiperWrapper)
        heroSwiperWrapper.innerHTML =
          '<div class="swiper-slide flex items-center justify-center text-white text-2xl">Failed to load products.</div>';
    });

  // Enhanced debugging: log every click on productCardsContainer
  if (productCardsContainer) {
    productCardsContainer.addEventListener("click", function (e) {
      console.log("[product-cards] Click event fired. Event target:", e.target);
      const btn = e.target.closest('button[title="Add to Cart"]');
      if (btn) {
        console.log("Add to Cart button clicked", btn);
        const card = btn.closest(".bg-white");
        if (!card) {
          console.warn("Could not find card element for clicked button");
          return;
        }
        const link = card.querySelector('a[href*="/store/product/"]');
        if (!link) {
          console.warn("Could not find product link in card");
          return;
        }
        const href = link.getAttribute("href");
        console.log("Product link href:", href);
        const slug = href.split("/").filter(Boolean).pop();
        console.log("Extracted slug:", slug);
        addToCart(slug, 1);
      }
    });
  }

  // On page load, update cart counter
  updateCartCounter();

  // Delegate Add to Cart on product details page
  const addToCartForm = document.querySelector("#add-to-cart-form");
  if (addToCartForm && addToCartForm.querySelector('button[type="submit"]')) {
    addToCartForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const slug = window.location.pathname.split("/").filter(Boolean).pop();
      const qtyInput = document.getElementById("quantity");
      const quantity = parseInt(qtyInput.value) || 1;
      // Use correct URL for product-json with /store/ prefix
      addToCart(slug, quantity);
    });
  }
});

// Modal for error messages
function showErrorModal(message) {
  let modal = document.getElementById("cart-error-modal");
  let modalMsg = document.getElementById("cart-error-modal-msg");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "cart-error-modal";
    modal.className =
      "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40";
    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-[#CA2E0A]">Cart Error</h2>
          <button id="cart-error-modal-close" class="text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <p id="cart-error-modal-msg" class="mb-6 text-gray-700"></p>
        <div class="flex justify-end">
          <button id="cart-error-modal-close2" class="px-4 py-2 rounded bg-[#CA2E0A] text-white font-bold">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById("cart-error-modal-close").onclick = () =>
      (modal.style.display = "none");
    document.getElementById("cart-error-modal-close2").onclick = () =>
      (modal.style.display = "none");
  }
  modalMsg = document.getElementById("cart-error-modal-msg");
  modalMsg.textContent = message;
  modal.style.display = "flex";
}

function updateCartCounter() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  // Count unique products, not total quantity
  const count = cart.length;
  const counter = document.querySelector('a[aria-label="Cart"] span.absolute');
  console.log("[updateCartCounter] Cart:", cart);
  console.log("[updateCartCounter] Unique product count:", count);
  if (counter) {
    console.log(
      "[updateCartCounter] Found counter span, setting textContent to:",
      count
    );
    counter.textContent = count;
    counter.style.display = count > 0 ? "" : "none";
  } else {
    console.warn("[updateCartCounter] Cart counter span not found in DOM");
  }
}

function showSuccessModal(message) {
  let modal = document.getElementById("cart-success-modal");
  let modalMsg = document.getElementById("cart-success-modal-msg");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "cart-success-modal";
    modal.className =
      "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40";
    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-[#CA2E0A]">Cart</h2>
          <button id="cart-success-modal-close" class="text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <p id="cart-success-modal-msg" class="mb-6 text-gray-700"></p>
        <div class="flex justify-end">
          <button id="cart-success-modal-close2" class="px-4 py-2 rounded bg-[#CA2E0A] text-white font-bold">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById("cart-success-modal-close").onclick = () =>
      (modal.style.display = "none");
    document.getElementById("cart-success-modal-close2").onclick = () =>
      (modal.style.display = "none");
  }
  modalMsg = document.getElementById("cart-success-modal-msg");
  modalMsg.textContent = message;
  modal.style.display = "flex";
}

// Update addToCart to use /store/product-json/ for fetch
function addToCart(slug, quantity) {
  fetch(`/store/product-json/${slug}/`)
    .then((res) => res.json())
    .then((data) => {
      if (!data.success) {
        showErrorModal("Product not found.");
        return;
      }
      const product = data.product;
      if (quantity > product.stock_quantity) {
        showErrorModal("Not enough stock available.");
        return;
      }
      // Get cart from localStorage
      let cart = JSON.parse(localStorage.getItem("cart") || "[]");
      const existing = cart.find((item) => item.slug === slug);
      if (existing) {
        if (existing.quantity + quantity > product.stock_quantity) {
          showErrorModal("Not enough stock available.");
          return;
        }
        existing.quantity += quantity;
      } else {
        cart.push({
          slug: product.slug,
          name: product.name,
          price: product.price,
          image: product.image,
          size_or_weight: product.size_or_weight,
          quantity: quantity,
        });
      }
      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartCounter();
      showSuccessModal("Added to cart!");
    })
    .catch(() => showErrorModal("Failed to add to cart. Please try again."));
}

function renderCartTable() {
  const tbody = document.getElementById("cart-items");
  if (!tbody) return; // Only run on cart page
  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  let subtotal = 0;
  let shipping = 0;
  if (!cart.length) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center text-gray-500 py-8">Your cart is empty.</td></tr>';
  } else {
    tbody.innerHTML = cart
      .map((item) => {
        const itemSubtotal = item.price * item.quantity;
        subtotal += itemSubtotal;
        return `
        <tr>
          <td class="py-2 sm:py-4"><img src="${item.image}" alt="${
          item.name
        }" class="w-16 h-16 object-cover rounded-xl border"></td>
          <td class="py-2 sm:py-4 font-bold text-sm text-[#CA2E0A]">${
            item.name
          }</td>
          <td class="py-2 sm:py-4 hidden sm:table-cell">${
            item.size_or_weight || ""
          }</td>
          <td class="py-2 sm:py-4">KES ${item.price.toLocaleString()}</td>
          <td class="py-2 sm:py-4"><input type="number" min="1" value="${
            item.quantity
          }" class="w-16 border border-gray-300 rounded px-2 py-1 text-center focus:ring-2 focus:ring-[#CA2E0A]" data-slug="${
          item.slug
        }" onchange="updateCartQuantity(this)"></td>
          <td class="py-2 sm:py-4 font-bold hidden sm:table-cell">KES ${itemSubtotal.toLocaleString()}</td>
          <td class="py-2 sm:py-4 text-center"><button class="text-red-500 hover:text-red-700" title="Remove" onclick="removeCartItem('${
            item.slug
          }')"><i class="fa fa-trash"></i></button></td>
        </tr>
      `;
      })
      .join("");
  }
  shipping = subtotal > 0 ? 150 : 0;
  const subtotalEl = document.getElementById("cart-subtotal");
  const shippingEl = document.getElementById("cart-shipping");
  const totalEl = document.getElementById("cart-total");
  if (subtotalEl) subtotalEl.textContent = `KES ${subtotal.toLocaleString()}`;
  if (shippingEl) shippingEl.textContent = `KES ${shipping.toLocaleString()}`;
  if (totalEl)
    totalEl.textContent = `KES ${(subtotal + shipping).toLocaleString()}`;
}
window.updateCartQuantity = function (input) {
  const slug = input.getAttribute("data-slug");
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const item = cart.find((i) => i.slug === slug);
  if (item) {
    const qty = Math.max(1, parseInt(input.value) || 1);
    item.quantity = qty;
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCartTable();
    if (typeof updateCartCounter === "function") updateCartCounter();
  }
};
window.removeCartItem = function (slug) {
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  cart = cart.filter((i) => i.slug !== slug);
  localStorage.setItem("cart", JSON.stringify(cart));
  renderCartTable();
  if (typeof updateCartCounter === "function") updateCartCounter();
};
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("cart-items")) {
    renderCartTable();
  }
});

// Register form handler
function showRegisterModal(msg, success = false) {
  const modal = document.getElementById("register-modal");
  const msgEl = document.getElementById("register-modal-msg");
  if (msgEl) msgEl.textContent = msg;
  if (modal) modal.style.display = "flex";
  if (success) msgEl.classList.add("text-green-600");
  else msgEl.classList.remove("text-green-600");
}
function closeRegisterModal() {
  const modal = document.getElementById("register-modal");
  if (modal) modal.style.display = "none";
}
if (document.getElementById("register-form")) {
  document
    .getElementById("register-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const btn = document.getElementById("register-btn");
      btn.disabled = true;
      const oldText = btn.textContent;
      btn.textContent = "Registering...";
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const confirm = document.getElementById("confirm_password").value;
      if (password !== confirm) {
        showRegisterModal("Passwords do not match.");
        btn.disabled = false;
        btn.textContent = oldText;
        return;
      }
      try {
        const res = await fetch("/register/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
          },
          body: JSON.stringify({ email, password, confirm_password: confirm }),
        });
        const data = await res.json();
        if (data.success) {
          showRegisterModal(
            "Registration successful! You can now log in.",
            true
          );
          this.reset();
        } else {
          showRegisterModal(data.error || "Registration failed.");
        }
      } catch (err) {
        showRegisterModal("Registration failed. Please try again.");
      }
      btn.disabled = false;
      btn.textContent = oldText;
    });
  document.getElementById("register-modal-close").onclick = closeRegisterModal;
  document.getElementById("register-modal-close2").onclick = closeRegisterModal;
}
// Login form handler
function showLoginModal(msg, success = false) {
  const modal = document.getElementById("login-modal");
  const msgEl = document.getElementById("login-modal-msg");
  if (msgEl) msgEl.textContent = msg;
  if (modal) modal.style.display = "flex";
  if (success) msgEl.classList.add("text-green-600");
  else msgEl.classList.remove("text-green-600");
}
function closeLoginModal() {
  const modal = document.getElementById("login-modal");
  if (modal) modal.style.display = "none";
}
if (document.getElementById("login-form")) {
  document
    .getElementById("login-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const btn = document.getElementById("login-btn");
      btn.disabled = true;
      const oldText = btn.textContent;
      btn.textContent = "Logging in...";
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      try {
        const res = await fetch("/login/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
          },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (data.success) {
          showLoginModal("Login successful! Redirecting...", true);
          setTimeout(() => {
            window.location.href = data.redirect || "/";
          }, 1200);
        } else {
          showLoginModal(data.error || "Login failed.");
        }
      } catch (err) {
        showLoginModal("Login failed. Please try again.");
      }
      btn.disabled = false;
      btn.textContent = oldText;
    });
  document.getElementById("login-modal-close").onclick = closeLoginModal;
  document.getElementById("login-modal-close2").onclick = closeLoginModal;
}
// CSRF helper
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

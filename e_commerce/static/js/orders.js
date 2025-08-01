console.log("✅ Order.js loaded successfully!");

// =================================================================================
// MAIN INITIALIZATION
// =================================================================================
document.addEventListener("DOMContentLoaded", function () {
  // Setup all event listeners for the page
  initializeEventListeners();

  document
    .getElementById("order-modal-close")
    ?.addEventListener("click", closeOrderModal);
  document
    .getElementById("order-modal-close2")
    ?.addEventListener("click", closeOrderModal);
});

// =================================================================================
// EVENT LISTENERS
// =================================================================================
function initializeEventListeners() {
  // Main checkout form submission
  const orderForm = document.getElementById("repay-order");
  if (orderForm) {
    orderForm.addEventListener("submit", submitOrder);
  }
}

// =================================================================================
// ORDER SUBMISSION
// =================================================================================
async function submitOrder(e) {
  e.preventDefault();

  const payForm = document.getElementById("repay-order");
  const payButton = payForm.querySelector('button[type="submit"]');
  const mpesaInput = document.getElementById("mpesa_number");
  const orderIdInput = document.getElementById("pay-order-id");
  const totalInput = document.getElementById("pay-total-input");

  const oldText = payButton.textContent;
  payButton.disabled = true;
  payButton.textContent = "Initiating payment...";

  // 1. Gather Data
  const orderData = {
    order_id: orderIdInput.value,
    total: totalInput.value,
    mpesa_number: mpesaInput.value,
  };

  // 2. Validate
  if (
    !/^(\+257\d{8}|2547\d{8}|07\d{8}|01\d{8}|2541\d{8}|\+2541\d{8})$/.test(
      orderData.mpesa_number
    )
  ) {
    document.getElementById("order-modal-content").innerHTML = "";
    showOrderModal(`
        <div class="flex flex-col items-center gap-2">
      <i class="fa-solid fa-circle-xmark text-red-500 text-2xl"></i>
      <p class="text-red-600 font-bold">
        Please enter a valid M-Pesa number starting with 07...
      </p>
    </div>;
      `);
    payButton.disabled = false;
    payButton.textContent = oldText;
    return;
  }

  // --- 3. Submit to Backend ---
  try {
    const response = await fetch("/store/repay_orders/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCSRFToken(),
      },
      body: JSON.stringify(orderData),
    });
    console.log("[DEBUG] Order creation response:", response);

    const data = await response.json();
    console.log("[DEBUG] Parsed response data:", data);

    if (data.status === 200) {
      const orderId = data.order_id;
      console.log("[DEBUG] Order ID:", orderId);
      document.getElementById("order-modal-content").innerHTML = "";
      showOrderModal(`
        <div class="flex flex-col items-center gap-2">
          <div class="w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-green-600 font-bold">${
            data.message || "Payment initiated"
          }</p>
        </div>
      `);

      const checkPaymentStatus = async () => {
        let retries = 40;
        let successful = false;
        while (retries > 0) {
          try {
            const payResponse = await fetch(
              `/store/check_payment?order_id=${orderId}`
            );
            const payResponseData = await payResponse.json();
            // console.log("Pay Response", payResponseData);

            if (payResponseData.status === 202) {
              document.getElementById("order-modal-content").innerHTML = "";
              showOrderModal(`
                <div class="flex flex-col items-center gap-2">
                  <div class="w-6 h-6 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  <p class="text-green-600 font-bold">${
                    payResponseData.message || "Checking payment please wait"
                  }</p>
                </div>
              `);
            } else if (payResponseData.status === 200) {
              document.getElementById("order-modal-content").innerHTML = "";
              showOrderModal(`
                <div class="flex flex-col items-center gap-2">
                  <i class="fa-solid fa-circle-check text-green-500 text-2xl"></i>
                  <p class="text-green-600 font-bold">${
                    payResponseData.message || "Payment confirmed"
                  }</p>
                  <p>Redirecting in 5 seonds.....</p>
                </div>
              `);
              successful = true;
              setTimeout(() => {
                window.location.href = data.redirect || "/store/orders/";
              }, 5000);
              break;
            } else {
              document.getElementById("order-modal-content").innerHTML = "";
              showOrderModal(`
                <div class="flex flex-col items-center gap-2">
                  <i class="fa-solid fa-circle-xmark text-red-500 text-2xl"></i>
                  <p class="text-red-600 font-bold">${
                    payResponseData.message || "An error occurred"
                  }</p>
                  <p>Redirecting in 5 seonds.....</p>
                </div>
              `);
              successful = true;
              setTimeout(() => {
                window.location.href = data.redirect || "/store/orders/";
              }, 5000);
              break;
            }
          } catch (error) {
            document.getElementById("order-modal-content").innerHTML = "";
            showOrderModal(`
                <div class="flex flex-col items-center gap-2">
                  <i class="fa-solid fa-circle-xmark text-red-500 text-2xl"></i>
                  <p class="text-red-600 font-bold">${
                    data.message || "An error occurred while checking payment"
                  }</p>
                  <p>Redirecting in 5 seonds.....</p>
                </div>
              `);
            setTimeout(() => {
              window.location.href = data.redirect || "/store/orders/";
            }, 5000);
          }
          retries--;
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        if (!successful) {
          document.getElementById("order-modal-content").innerHTML = "";
          showOrderModal(`
            <div class="flex flex-col items-center gap-2">
              <i class="fa-solid fa-circle-xmark text-red-500 text-2xl"></i>
              <p class="text-red-600 font-bold">${
                data.message ||
                "You didnt interact with the STK push within the specified time"
              }</p>
              <p>Redirecting in 5 seonds.....</p>
            </div>
          `);
          setTimeout(() => {
            window.location.href = data.redirect || "/store/orders/";
          }, 5000);
        }
      };

      checkPaymentStatus();
    } else {
      document.getElementById("order-modal-content").innerHTML = "";
      console.log("[DEBUG] Error payload:", data);
      showOrderModal(`
        <div class="flex flex-col items-center gap-2">
          <i class="fa-solid fa-circle-xmark text-red-500 text-2xl"></i>
          <p class="text-red-600 font-bold">${
            data.message || "There was an error while initiating payment."
          }</p>
        </div>
      `);
    }
  } catch (error) {
    document.getElementById("order-modal-content").innerHTML = "";
    showOrderModal(`
      <div class="flex flex-col items-center gap-2">
        <i class="fa-solid fa-circle-xmark text-red-500 text-2xl"></i>
        <p class="text-red-600 font-bold">There was an error while initiating payment.....</p>
      </div>
    `);
  } finally {
    payButton.disabled = false;
    payButton.textContent = oldText;
  }
}



// =================================================================================
// MODAL & UTILITY FUNCTIONS
// =================================================================================
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

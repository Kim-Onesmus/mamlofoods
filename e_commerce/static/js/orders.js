console.log("orders.js loaded");

document.addEventListener("DOMContentLoaded", function () {
  fetchAndDisplayOrders();
});

function fetchAndDisplayOrders() {
  fetch("/store/orders/json/")
    .then((res) => res.json())
    .then((data) => {
      const orders = data.orders || [];
      // Clear all tab contents (remove static HTML)
      document
        .querySelectorAll(".tab-content")
        .forEach((tab) => (tab.innerHTML = ""));
      // Track if any order was rendered in each tab
      const tabHasOrders = {
        unpaid: false,
        confirmed: false,
        intransit: false,
        shipped: false,
        completed: false,
        cancelled: false,
      };
      if (orders.length === 0) {
        document.querySelectorAll(".tab-content").forEach((tab) => {
          tab.innerHTML =
            '<div class="text-gray-500 text-center py-8">You have not placed any orders yet.</div>';
        });
        return;
      }
      orders.forEach((order) => {
        const tabId = getTabIdForStatus(order.status);
        const tab = document.getElementById("tab-" + tabId);
        if (!tab) return;
        tab.innerHTML += renderOrderCard(order, tabId);
        tabHasOrders[tabId] = true;
      });
      // For tabs with no orders, show a message
      Object.keys(tabHasOrders).forEach((tabId) => {
        if (!tabHasOrders[tabId]) {
          const tab = document.getElementById("tab-" + tabId);
          if (tab)
            tab.innerHTML =
              '<div class="text-gray-500 text-center py-8">No orders in this category.</div>';
        }
      });
    });
}

function getTabIdForStatus(status) {
  // Map backend status to tab id
  const map = {
    Pending: "unpaid",
    Unpaid: "unpaid",
    Paid: "confirmed",
    Confirmed: "confirmed",
    Processing: "intransit",
    "In Transit": "intransit",
    Shipped: "shipped",
    Completed: "completed",
    Cancelled: "cancelled",
  };
  return map[status] || "unpaid";
}

function renderOrderCard(order, tabId) {
  // Pick color and label for status
  const statusStyles = {
    unpaid: {
      label: "Unpaid",
      badge: "bg-red-100 text-red-600",
      btn: "bg-red-500 hover:bg-red-600",
    },
    confirmed: {
      label: "Confirmed",
      badge: "bg-blue-100 text-blue-600",
      btn: "bg-blue-500 hover:bg-blue-600",
    },
    intransit: {
      label: "In Transit",
      badge: "bg-yellow-100 text-yellow-700",
      btn: "bg-yellow-500 hover:bg-yellow-600",
    },
    shipped: {
      label: "Shipped",
      badge: "bg-purple-100 text-purple-700",
      btn: "bg-purple-500 hover:bg-purple-600",
    },
    completed: {
      label: "Completed",
      badge: "bg-green-100 text-green-700",
      btn: "bg-green-500 hover:bg-green-600",
    },
    cancelled: {
      label: "Cancelled",
      badge: "bg-gray-200 text-gray-700",
      btn: "bg-gray-500 hover:bg-gray-600",
    },
  };
  const style = statusStyles[tabId] || statusStyles.unpaid;
  // Format date
  const placedOn = order.created_at ? `• Placed on ${order.created_at}` : "";
  // Format total
  const total = `Ksh. ${parseFloat(order.total).toLocaleString(undefined, {
    minimumFractionDigits: 2,
  })}`;
  // Items
  const itemsHtml = order.items
    .map(
      (item) => `
        <div class="flex items-center bg-gray-50 rounded-lg px-3 py-2 gap-2">
            <img src="https://via.placeholder.com/40" alt="Item" class="w-8 h-8 rounded object-cover border">
            <div>
                <div class="font-semibold text-sm">${item.product_name}</div>
                <div class="text-xs text-gray-500">Qty: ${item.quantity}</div>
            </div>
        </div>
    `
    )
    .join("");
  // Action buttons
  let actions = `<button onclick="openModal('details-modal')" class="flex items-center gap-1 px-3 py-1 rounded-full border text-gray-700 text-xs hover:bg-gray-100"><i class="fa fa-eye"></i> Details</button>
                   <button onclick="openModal('invoice-modal')" class="flex items-center gap-1 px-3 py-1 rounded-full border text-gray-700 text-xs hover:bg-gray-100"><i class="fa fa-download"></i> Invoice</button>`;
  if (tabId === "unpaid") {
    actions += `<button onclick="openModal('pay-modal')" class="ml-2 flex items-center gap-1 ${style.btn} text-white px-3 py-1 rounded-full font-bold text-xs transition"><i class="fa fa-credit-card"></i> Pay</button>`;
    actions += `<button onclick="openModal('cancel-modal')" class="flex items-center gap-1 px-3 py-1 rounded-full border border-red-200 text-red-600 text-xs hover:bg-red-50"><i class="fa fa-times"></i> Cancel</button>`;
  }
  if (tabId === "shipped") {
    // Add review button for each item
    // (You can enhance this to only show for items not yet reviewed)
    // For now, add a review button to each item
  }
  if (tabId === "cancelled") {
    // No actions
    actions = `<button onclick="openModal('details-modal')" class="flex items-center gap-1 px-3 py-1 rounded-full border text-gray-700 text-xs hover:bg-gray-100"><i class="fa fa-eye"></i> Details</button>
                   <button onclick="openModal('invoice-modal')" class="flex items-center gap-1 px-3 py-1 rounded-full border text-gray-700 text-xs hover:bg-gray-100"><i class="fa fa-download"></i> Invoice</button>`;
  }
  return `
    <div class="bg-white rounded-2xl shadow p-4 mb-6 border">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
            <div class="flex items-center gap-3">
                <span class="inline-block px-3 py-1 rounded-full ${style.badge} text-xs font-bold">${style.label}</span>
                <span class="font-semibold text-gray-800">${order.order_id}</span>
                <span class="text-xs text-gray-400">${placedOn}</span>
            </div>
            <div class="flex items-center gap-2 mt-2 md:mt-0">
                <span class="font-bold text-indigo-900 text-lg">${total}</span>
            </div>
        </div>
        <div class="flex gap-3 mt-4 flex-wrap">${itemsHtml}</div>
        <div class="flex justify-end gap-2 mt-4">${actions}</div>
    </div>
    `;
}

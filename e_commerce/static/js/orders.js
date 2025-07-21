console.log("orders.js loaded");

document.addEventListener("DOMContentLoaded", function () {
  fetchAndDisplayOrders();
});

function fetchAndDisplayOrders() {
  fetch("/store/orders/json/")
    .then((res) => res.json())
    .then((data) => {
      const orders = data.orders || [];
      const tableBody = document.querySelector("table tbody");
      if (!tableBody) return;
      tableBody.innerHTML = "";
      if (orders.length === 0) {
        tableBody.innerHTML =
          '<tr><td colspan="6" class="text-center text-gray-500 py-8">You have not placed any orders yet.</td></tr>';
        return;
      }
      orders.forEach((order) => {
        const itemsHtml = order.items
          .map((item) => `<li>${item.product_name} (x${item.quantity})</li>`)
          .join("");
        const row = document.createElement("tr");
        row.innerHTML = `
                    <td class="py-2 px-4 font-mono">${order.order_id}</td>
                    <td class="py-2 px-4">${order.created_at}</td>
                    <td class="py-2 px-4 order-status">${order.status}</td>
                    <td class="py-2 px-4">KES ${order.total}</td>
                    <td class="py-2 px-4">${order.shipping_address}</td>
                    <td class="py-2 px-4"><ul class="list-disc ml-4">${itemsHtml}</ul></td>
                `;
        tableBody.appendChild(row);
      });
      // Highlight pending orders
      document.querySelectorAll(".order-status").forEach(function (el) {
        if (el.textContent.trim().toLowerCase() === "pending") {
          el.classList.add("text-yellow-600", "font-bold");
        }
      });
    });
}

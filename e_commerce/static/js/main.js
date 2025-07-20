document.addEventListener("DOMContentLoaded", function () {
  const productCardsContainer = document.getElementById("product-cards");
  if (!productCardsContainer) return;

  fetch("/e_commerce/products-json/")
    .then((response) => response.json())
    .then((data) => {
      const products = data.products;
      if (!products.length) {
        productCardsContainer.innerHTML =
          '<div class="col-span-4 text-center text-gray-500">No products available.</div>';
        return;
      }
      productCardsContainer.innerHTML = products
        .map(
          (product) => `
                <div class="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-shadow duration-300 flex flex-col items-stretch p-0 overflow-hidden group">
                    <a href="/product/${
                      product.slug
                    }/" class="block focus:ring-2 focus:ring-[#CA2E0A]">
                        <div class="w-full h-48 bg-gray-100 md:h-48 h-32 flex items-center justify-center">
                            <img src="${product.image}" alt="${
            product.name
          }" class="w-full h-full object-cover rounded-t-3xl group-hover:scale-105 transition-transform duration-300">
                        </div>
                        <div class="p-6 pb-0">
                            <h3 class="text-xl font-bold text-[#CA2E0A] mb-4">${
                              product.name
                            }</h3>
                            <div class="text-gray-700 text-sm mb-2">${
                              product.size_or_weight
                            }</div>
                            <div class="text-lg font-bold text-gray-900 mb-2">Ksh ${product.price.toLocaleString()}</div>
                            <div class="text-xs text-gray-500 mb-2">${
                              product.product_code
                            }</div>
                            <div class="text-xs ${
                              product.stock_status === "Out of Stock"
                                ? "text-red-600"
                                : product.stock_status === "Low Stock"
                                ? "text-orange-500"
                                : "text-green-600"
                            } font-semibold mb-2">${product.stock_status}</div>
                        </div>
                    </a>
                    <div class="flex gap-2 w-full px-6 pb-6 mt-auto">
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
    })
    .catch((err) => {
      productCardsContainer.innerHTML =
        '<div class="col-span-4 text-center text-red-500">Failed to load products.</div>';
    });
});

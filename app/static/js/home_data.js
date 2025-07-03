document.addEventListener("DOMContentLoaded", function () {
  const statsLoader = document.getElementById("stats-loader");
  const swiperContainer = document.querySelector(".impactSwiper");
  const statsWrapper = document.getElementById("impact-swiper-wrapper");

  const partnersWrapper = document.getElementById("partners-swiper-wrapper");
  const partnersLoader = document.getElementById("partners-loader");
  const partnersSwiperContainer = document.querySelector(
    ".supporters-swiper-container"
  );

  const blogsWrapper = document.getElementById("blogs-wrapper");
  const blogsLoader = document.getElementById("blogs-loader");

  fetch("/api/mamlo-data/")
    .then((response) => response.json())
    .then((data) => {
      // === Stats ===
      statsWrapper.innerHTML = "";
      data.numbers.forEach((stat) => {
        const slide = document.createElement("div");
        slide.className = "swiper-slide";
        slide.innerHTML = `
          <div class="p-6 rounded-lg bg-white bg-opacity-10 backdrop-blur-lg text-white">
            <p class="text-4xl md:text-5xl font-bold text-yellow-400">
              <span class="counter" data-target="${stat.number}">0</span>
            </p>
            <p class="mt-2">${stat.name}</p>
          </div>`;
        statsWrapper.appendChild(slide);
      });
      statsLoader.classList.add("hidden");
      swiperContainer.classList.remove("hidden");

      // === Partners ===
      partnersWrapper.innerHTML = "";
      data.partners.forEach((partner) => {
        const slide = document.createElement("div");
        slide.className = "swiper-slide";
        slide.innerHTML = `
          <div class="bg-white p-6 rounded-xl transition duration-300">
            <img src="${partner.image}" alt="Partner Logo"
              class="mx-auto h-20 w-auto hover:grayscale-0 transition" />
          </div>`;
        partnersWrapper.appendChild(slide);
      });
      partnersLoader.classList.add("hidden");
      partnersSwiperContainer.classList.remove("hidden");

      // === Blogs ===
      blogsWrapper.innerHTML = "";
      data.blogs.forEach((blog, index) => {
        const card = document.createElement("div");
        card.className = "bg-white rounded-lg shadow-lg overflow-hidden";
        card.setAttribute("data-aos", "fade-up");
        card.setAttribute("data-aos-delay", `${(index + 1) * 100}`);
        card.innerHTML = `
          <img src="${blog.featured_image}" alt="${blog.title}" class="w-full h-48 object-cover">
          <div class="p-6">
            <h3 class="text-xl font-semibold mb-2">${blog.title}</h3>
            <p class="text-gray-600 mb-4 text-sm">By ${blog.author} • ${blog.date_published}</p>
            <a href="/details/${blog.slug}/" class="text-primary hover:underline font-semibold">Read More &rarr;</a>
          </div>`;
        blogsWrapper.appendChild(card);
      });
      blogsLoader.classList.add("hidden");
      blogsWrapper.classList.remove("hidden");

      // Init animations
      initCounterAnimation();
      initImpactSwiper();
      initPartnersSwiper();
    })
    .catch((error) => {
      console.error("Error loading MAMLO data:", error);
      statsLoader.innerHTML =
        "<p class='text-red-400'>Failed to load statistics.</p>";
      partnersLoader.innerHTML =
        "<p class='text-red-400'>Failed to load partner logos.</p>";
      blogsLoader.innerHTML =
        "<p class='text-red-400'>Failed to load blog posts.</p>";
    });

  // === Counter Animation ===
  function initCounterAnimation() {
    const counters = document.querySelectorAll(".counter");
    counters.forEach((counter) => {
      const updateCount = () => {
        const target = +counter.getAttribute("data-target");
        const count = +counter.innerText;
        const increment = Math.ceil(target / 50);
        if (count < target) {
          counter.innerText = count + increment;
          setTimeout(updateCount, 20);
        } else {
          counter.innerText = target;
        }
      };
      updateCount();
    });
  }

  // === Swiper for Stats ===
  function initImpactSwiper() {
    new Swiper(".impactSwiper", {
      slidesPerView: 2,
      spaceBetween: 20,
      loop: true,
      autoplay: {
        delay: 2500,
        disableOnInteraction: false,
      },
      breakpoints: {
        640: { slidesPerView: 1 },
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      },
    });
  }

  // === Swiper for Partners ===
  function initPartnersSwiper() {
    new Swiper(".supporters-swiper", {
      slidesPerView: 2,
      spaceBetween: 20,
      loop: true,
      autoplay: {
        delay: 2500,
        disableOnInteraction: false,
      },
      breakpoints: {
        640: { slidesPerView: 2 },
        768: { slidesPerView: 3 },
        1024: { slidesPerView: 4 },
      },
    });
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // ===== Stats Elements =====
  const statsLoader = document.getElementById("stats-loader");
  const swiperContainer = document.querySelector(".impactSwiper");
  const statsWrapper = document.getElementById("impact-swiper-wrapper");

  // ===== Partners Elements =====
  const partnersWrapper = document.getElementById("partners-swiper-wrapper");
  const partnersLoader = document.getElementById("partners-loader");
  const partnersSwiperContainer = document.querySelector(
    ".supporters-swiper-container"
  );

  // ===== Fetch Data from API =====
  fetch("/api/mamlo-data/")
    .then((response) => response.json())
    .then((data) => {
      // ===== Inject Stats =====
      statsWrapper.innerHTML = "";
      data.numbers.forEach((stat) => {
        const slide = document.createElement("div");
        slide.className = "swiper-slide";
        slide.innerHTML = `
            <div class="p-6 rounded-lg bg-white bg-opacity-10 backdrop-blur-lg">
                <p class="text-4xl md:text-5xl font-bold text-yellow-400">
                    <span class="counter" data-target="${stat.number}">0</span>
                </p>
                <p class="mt-2">${stat.name}</p>
            </div>`;
        statsWrapper.appendChild(slide);
      });

      // Show stats section
      if (statsLoader) statsLoader.classList.add("hidden");
      if (swiperContainer) swiperContainer.classList.remove("hidden");

      // ===== Inject Partners =====
      partnersWrapper.innerHTML = "";
      data.partners.forEach((partner) => {
        const imageUrl = partner.image.startsWith("http")
          ? partner.image
          : `/media/${partner.image}`;
        const slide = document.createElement("div");
        slide.className = "swiper-slide";
        slide.innerHTML = `
            <div class="bg-white p-6 rounded-xl transition duration-300">
                <img src="${imageUrl}" alt="Partner Logo"
                     class="mx-auto h-20 w-auto hover:grayscale-0 transition" />
            </div>`;
        partnersWrapper.appendChild(slide);
      });

      // Show partners section
      if (partnersLoader) partnersLoader.classList.add("hidden");
      if (partnersSwiperContainer)
        partnersSwiperContainer.classList.remove("hidden");

      // Initialize animations and swipers
      initCounterAnimation();
      initImpactSwiper();
      initPartnersSwiper();
    })
    .catch((error) => {
      console.error("Error loading MAMLO data:", error);
      if (statsLoader)
        statsLoader.innerHTML =
          "<p class='text-red-400'>Failed to load statistics.</p>";
      if (partnersLoader)
        partnersLoader.innerHTML =
          "<p class='text-red-400'>Failed to load partner logos.</p>";
    });

  // ===== Counter Animation =====
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

  // ===== Impact Swiper Init (Stats) =====
  function initImpactSwiper() {
    new Swiper(".impactSwiper", {
      slidesPerView: 1,
      spaceBetween: 20,
      pagination: {
        el: ".swiper-pagination",
        clickable: true,
      },
      breakpoints: {
        768: {
          slidesPerView: 2,
        },
        1024: {
          slidesPerView: 3,
        },
      },
    });
  }

  // ===== Partners Swiper Init =====
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
        640: {
          slidesPerView: 2,
        },
        768: {
          slidesPerView: 3,
        },
        1024: {
          slidesPerView: 4,
        },
      },
    });
  }
});

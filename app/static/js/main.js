AOS.init({
  duration: 1000,
  once: true,
});

// --- Swiper Performance & Autoplay Management ---
function manageSwiperAutoplay(swiperInstance, containerSelector) {
  const swiperContainer = document.querySelector(containerSelector);
  if (!swiperContainer || !swiperInstance.autoplay) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          swiperInstance.autoplay.start();
        } else {
          swiperInstance.autoplay.stop();
        }
      });
    },
    {
      rootMargin: "0px",
      threshold: 0.5, // Start/stop when 50% of the swiper is visible
    }
  );

  observer.observe(swiperContainer);
}

var swiper = new Swiper(".heroSwiper", {
  loop: true,
  autoplay: {
    delay: 10000,
    disableOnInteraction: false,
  },
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
});

const menuBtn = document.getElementById("menu-btn");
const mobileMenu = document.getElementById("mobile-menu");

// Toggle menu on button click
menuBtn.addEventListener("click", function (e) {
  e.stopPropagation(); // Prevent click from bubbling to window
  mobileMenu.classList.toggle("hidden");
});

// Close menu if click happens outside of it
window.addEventListener("click", function (e) {
  if (
    !mobileMenu.classList.contains("hidden") &&
    !mobileMenu.contains(e.target) &&
    !menuBtn.contains(e.target)
  ) {
    mobileMenu.classList.add("hidden");
  }
});

// Close menu when a link is clicked inside
mobileMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileMenu.classList.add("hidden");
  });
});




const supportersSwiper = new Swiper(".supporters-swiper", {
  loop: true,
  slidesPerView: 2,
  spaceBetween: 20,
  autoplay: {
    delay: 2500,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  },
  breakpoints: {
    640: { slidesPerView: 2, spaceBetween: 20 },
    768: { slidesPerView: 3, spaceBetween: 40 },
    1024: { slidesPerView: 4, spaceBetween: 50 },
  },
});
manageSwiperAutoplay(supportersSwiper, ".supporters-swiper");

// Smooth scroll for nav links
document.querySelectorAll('a.nav-link[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
      });
    }
  });
});

// Sticky nav on scroll
const nav = document.getElementById("main-nav");
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    nav.classList.add("shadow-lg");
  } else {
    nav.classList.remove("shadow-lg");
  }
});

// Gallery Filters
const filterButtons = document.querySelectorAll(".gallery-filter-btn");
const galleryContents = document.querySelectorAll(".gallery-content");
const initializedSwipers = {}; // Track initialized swipers to prevent re-initialization

const swiperOptions = {
  loop: true,
  slidesPerView: 1,
  spaceBetween: 30,
  autoplay: {
    delay: 3000,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  },
  breakpoints: {
    768: { slidesPerView: 3, spaceBetween: 30 },
    1024: { slidesPerView: 3, spaceBetween: 30 },
  },
};

function initializeSwiperFor(galleryId) {
  if (!initializedSwipers[galleryId]) {
    const selector = `#${galleryId} .swiper-container`;
    const navigation = {
      nextEl: `#${galleryId} .swiper-button-next`,
      prevEl: `#${galleryId} .swiper-button-prev`,
    };
    const newSwiper = new Swiper(selector, { ...swiperOptions, navigation });
    initializedSwipers[galleryId] = newSwiper;
    manageSwiperAutoplay(newSwiper, selector);
  }
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    const filter = button.dataset.filter;
    galleryContents.forEach((content) => {
      if (content.id === filter) {
        content.classList.remove("hidden");
        initializeSwiperFor(filter);
      } else {
        content.classList.add("hidden");
      }
    });
  });
});

// Initialize the default visible swiper
initializeSwiperFor("data-collection");

// Counter Animation
const counters = document.querySelectorAll(".counter");
const speed = 200;

const animateCounter = (counter) => {
  const target = +counter.getAttribute("data-target");
  let count = 0;
  const inc = target / speed;

  const updateCount = () => {
    if (count < target) {
      count += inc;
      counter.innerText = Math.ceil(count);
      setTimeout(updateCount, 1);
    } else {
      counter.innerText = target;
    }
  };

  updateCount();
};

// Intersection Observer for counters
const observerOptions = {
  threshold: 0.5,
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const counters = entry.target.querySelectorAll(".counter");
      counters.forEach((counter) => animateCounter(counter));
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe the section containing counters
const impactSection = document.querySelector(".counter").closest("section");
if (impactSection) {
  observer.observe(impactSection);
}


// Lazy loading
document.addEventListener("DOMContentLoaded", () => {
  const images = document.querySelectorAll(".lazy-image");

  images.forEach((img) => {
    // Image load event
    img.addEventListener("load", () => {
      img.classList.add("loaded");

      const wrapper = img.closest(".image-wrapper");
      const spinner = wrapper.querySelector(".spinner");

      if (spinner) {
        spinner.remove(); // ✅ Completely remove it from DOM
      }
    });

    // Image already cached (e.g. browser load from memory)
    if (img.complete && img.naturalHeight !== 0) {
      const event = new Event("load");
      img.dispatchEvent(event);
    }
  });
});


const impactSwiper = new Swiper(".impactSwiper", {
  loop: true,
  autoplay: {
    delay: 3500,
    disableOnInteraction: false,
  },
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
  slidesPerView: 1,
  spaceBetween: 20,
  breakpoints: {
    640: {
      slidesPerView: 2,
    },
    1024: {
      slidesPerView: 4,
    },
  },
});
// Registration Modal Logic
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
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      if (!strongPasswordRegex.test(password)) {
        showRegisterModal(
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."
        );
        btn.disabled = false;
        btn.textContent = oldText;
        return;
      }
      try {
        const res = await fetch("/store/register/", {
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
          setTimeout(() => {
            window.location.href = "/store/login/";
          }, 3000);
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
// Login Modal Logic
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
        const res = await fetch("/store/login/", {
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
            window.location.href = data.redirect || "/store/";
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

// Modal helpers
function showAccountModal(msg, success = false) {
  let modal = document.getElementById("account-modal");
  let msgEl = document.getElementById("account-modal-msg");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "account-modal";
    modal.className =
      "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40";
    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold text-[#CA2E0A]">Account</h2>
          <button id="account-modal-close" class="text-gray-400 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        <p id="account-modal-msg" class="mb-6 text-gray-700"></p>
        <div class="flex justify-end">
          <button id="account-modal-close2" class="px-4 py-2 rounded bg-[#CA2E0A] text-white font-bold">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById("account-modal-close").onclick = () =>
      (modal.style.display = "none");
    document.getElementById("account-modal-close2").onclick = () =>
      (modal.style.display = "none");
  }
  msgEl = document.getElementById("account-modal-msg");
  msgEl.textContent = msg;
  msgEl.className = "mb-6 text-gray-700" + (success ? " text-green-600" : "");
  modal.style.display = "flex";
}

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

// Profile update
if (document.getElementById("profile-form")) {
  document
    .getElementById("profile-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const btn = document.getElementById("profile-btn");
      btn.disabled = true;
      const oldText = btn.textContent;
      btn.textContent = "Updating...";
      const first_name = document.getElementById("first_name").value;
      const last_name = document.getElementById("last_name").value;
      const phone_number = document.getElementById("phone").value;
      try {
        const res = await fetch("/store/account/", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
          },
          body: JSON.stringify({ first_name, last_name, phone_number }),
        });
        const data = await res.json();
        if (data.success) {
          showAccountModal("Profile updated successfully!", true);
        } else {
          showAccountModal(data.error || "Failed to update profile.");
        }
      } catch (err) {
        showAccountModal("Failed to update profile. Please try again.");
      }
      btn.disabled = false;
      btn.textContent = oldText;
    });
}

// Password update
if (document.getElementById("password-form")) {
  document
    .getElementById("password-form")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const btn = document.getElementById("password-btn");
      btn.disabled = true;
      const oldText = btn.textContent;
      btn.textContent = "Updating...";
      const current_password =
        document.getElementById("current_password").value;
      const new_password = document.getElementById("new_password").value;
      const confirm_password =
        document.getElementById("confirm_password").value;
      if (new_password !== confirm_password) {
        showAccountModal("New passwords do not match.");
        btn.disabled = false;
        btn.textContent = oldText;
        return;
      }
      try {
        const res = await fetch("/store/account/", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": getCSRFToken(),
          },
          body: JSON.stringify({
            current_password,
            new_password,
            confirm_password,
          }),
        });
        const data = await res.json();
        if (data.success) {
          showAccountModal("Password updated successfully!", true);
          this.reset();
        } else {
          showAccountModal(data.error || "Failed to update password.");
        }
      } catch (err) {
        showAccountModal("Failed to update password. Please try again.");
      }
      btn.disabled = false;
      btn.textContent = oldText;
    });
}

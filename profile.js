// profile.js
(function(){
  const user = JSON.parse(localStorage.getItem("user") || "null");
  if (!user) {
    alert("You must be logged in.");
    window.location.href = "index.html";
  }

  const users = JSON.parse(localStorage.getItem("users") || "{}");
  const profileUsername = document.getElementById("profileUsername");
  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const profileBio = document.getElementById("profileBio");
  const profilePicture = document.getElementById("profilePicture");
  const newProfilePic = document.getElementById("newProfilePic");
  const removePic = document.getElementById("removePic");
  const profileForm = document.getElementById("profileForm");
  const myPostsList = document.getElementById("myPostsList");

  // populate
  profileUsername.value = user.username;
  profileName.value = user.name || "";
  profileEmail.value = user.email || "";
  profileBio.value = user.bio || "";
  profilePicture.src = user.profilePic || "https://via.placeholder.com/120";

  // handle pic upload (convert to base64)
  newProfilePic.addEventListener("change", () => {
    const f = newProfilePic.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = function() {
      profilePicture.src = r.result;
    };
    r.readAsDataURL(f);
  });

  removePic.addEventListener("click", () => {
    profilePicture.src = "https://via.placeholder.com/120";
    newProfilePic.value = "";
  });

  profileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const updatedName = profileName.value.trim();
    const updatedEmail = profileEmail.value.trim();
    const updatedBio = profileBio.value.trim();
    const newPassword = document.getElementById("profilePassword").value;

    if (!updatedName || !updatedEmail) return alert("Name and email required.");

    // update users object
    const allUsers = JSON.parse(localStorage.getItem("users") || "{}");
    if (!allUsers[user.username]) return alert("User record not found.");

    // profile pic: if new file selected, convert and save
    if (newProfilePic.files[0]) {
      const fr = new FileReader();
      fr.onload = function() {
        allUsers[user.username].profilePic = fr.result;
        finishSave();
      };
      fr.readAsDataURL(newProfilePic.files[0]);
    } else {
      // if removed pic, set empty
      if (profilePicture.src && profilePicture.src.includes("placeholder")) {
        allUsers[user.username].profilePic = "";
      } else {
        allUsers[user.username].profilePic = allUsers[user.username].profilePic || user.profilePic || "";
      }
      finishSave();
    }

    function finishSave() {
      allUsers[user.username].name = updatedName;
      allUsers[user.username].email = updatedEmail;
      allUsers[user.username].bio = updatedBio;
      if (newPassword && newPassword.trim() !== "") {
        allUsers[user.username].password = newPassword;
      }
      // update localStorage
      localStorage.setItem("users", JSON.stringify(allUsers));
      // update session user
      const sessionUser = JSON.parse(localStorage.getItem("user") || "null");
      sessionUser.name = updatedName;
      sessionUser.email = updatedEmail;
      sessionUser.bio = updatedBio;
      sessionUser.profilePic = allUsers[user.username].profilePic || "";
      if (newPassword) sessionUser.password = newPassword;
      localStorage.setItem("user", JSON.stringify(sessionUser));
      alert("Profile updated!");
      // redirect back to home to see updates applied, or stay on page
      window.location.href = "index.html";
    }
  });

  // Delete account
  document.getElementById("deleteAccount").addEventListener("click", () => {
    if (!confirm("Delete your account? This will remove your user and your posts.")) return;
    const allUsers = JSON.parse(localStorage.getItem("users") || "{}");
    delete allUsers[user.username];
    localStorage.setItem("users", JSON.stringify(allUsers));
    // remove posts by this user
    let posts = JSON.parse(localStorage.getItem("posts") || "[]");
    posts = posts.filter(p => p.name !== user.username);
    localStorage.setItem("posts", JSON.stringify(posts));
    // logout
    localStorage.removeItem("user");
    alert("Account deleted.");
    window.location.href = "index.html";
  });

  // Render "My posts"
  function renderMyPosts() {
    const posts = JSON.parse(localStorage.getItem("posts") || "[]");
    const mine = posts.filter(p => p.name === user.username);
    if (mine.length === 0) {
      myPostsList.innerHTML = "<p>No posts yet.</p>";
      return;
    }
    myPostsList.innerHTML = "";
    mine.forEach(p => {
      const div = document.createElement("div");
      div.className = "my-post-item";
      div.innerHTML = `
        <h4>${escapeHtml(p.title)}</h4>
        <p class="small">${escapeHtml(p.timestamp)}</p>
        <p>${escapeHtml(p.content.substring(0, 200))}${p.content.length>200?'...':''}</p>
        <div>
          <button class="btn edit" data-id="${p.id}">Edit</button>
          <button class="btn delete" data-id="${p.id}" style="background:#c0392b">Delete</button>
        </div>
      `;
      myPostsList.appendChild(div);
    });

    myPostsList.querySelectorAll("button.edit").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        // navigate back to index and load into edit state via localStorage flag
        localStorage.setItem("edit_post_id", id);
        window.location.href = "index.html";
      });
    });

    myPostsList.querySelectorAll("button.delete").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        if (!confirm("Delete this post?")) return;
        let posts = JSON.parse(localStorage.getItem("posts") || "[]");
        posts = posts.filter(p => p.id !== id);
        localStorage.setItem("posts", JSON.stringify(posts));
        renderMyPosts();
      });
    });
  }

  // helper escape (same as main script)
  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // initial render
  renderMyPosts();

})();


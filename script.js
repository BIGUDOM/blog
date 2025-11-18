// -------------------- DOM ELEMENTS --------------------
const postsContainer = document.getElementById("posts");
const postForm = document.getElementById("post-form");
const searchInput = document.getElementById("searchInput");
const clearPostsButton = document.getElementById("clearPostsButton");
const settingsMenu = document.querySelector(".settings-menu");
const darkBtn = document.getElementById("dark-btn");
const settingsUsername = document.getElementById("settingsUsername");
const bellIcon = document.querySelector(".nav-left ul li i.fa-bell") || null; // optional

// Auth
const loginContainer = document.getElementById("loginContainer");
const blogContainer = document.getElementById("blogContainer");
const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");
const goToSignup = document.getElementById("goToSignup");
const goToSignin = document.getElementById("goToSignin");
const logoutBtnLink = document.getElementById("logoutBtnLink");

// Upload
const fileInputImage = document.getElementById("fileInputImage");
const fileInputVideo = document.getElementById("fileInputVideo");
const uploadImageButton = document.getElementById("uploadImageButton");
const uploadVideoButton = document.getElementById("uploadVideoButton");
const previewContainer = document.getElementById("preview-container");

// Forgot Password helper (we create a modal dynamically)
let forgotModal = null;

// Draft timer
let draftTimer = null;

// -------------------- LOCAL STORAGE UTILITIES --------------------
function getPosts() {
  return JSON.parse(localStorage.getItem("posts") || "[]");
}
function savePosts(posts) {
  localStorage.setItem("posts", JSON.stringify(posts));
}
function loadUsers() {
  return JSON.parse(localStorage.getItem("users") || "{}");
}
function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}
function currentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}
function saveCurrentUser(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

// Notifications
function getNotifications() {
  return JSON.parse(localStorage.getItem("notifications") || "[]");
}
function saveNotifications(notifs) {
  localStorage.setItem("notifications", JSON.stringify(notifs));
}
function addNotification(n) {
  const nots = getNotifications();
  nots.unshift({ ...n, id: Date.now().toString(), read: false, timestamp: new Date().toLocaleString() });
  saveNotifications(nots);
  renderNotifCount();
}
function renderNotifCount() {
  const count = getNotifications().filter(n => !n.read).length;
  // if you have a visible badge, update it here. We'll set settingsUsername title with count as simple indicator.
  if (settingsUsername) {
    settingsUsername.title = `${count} unread notification${count !== 1 ? "s" : ""}`;
  }
}

// -------------------- SHOW/HIDE --------------------
function showLoginPopup() {
  loginContainer.style.display = "flex";
  blogContainer.style.display = "none";
}
function showBlog() {
  loginContainer.style.display = "none";
  blogContainer.style.display = "block";
}

// -------------------- REQUIRE LOGIN --------------------
function requireLogin() {
  if (!currentUser()) {
    showLoginPopup();
    return false;
  }
  return true;
}

// -------------------- DARK THEME --------------------
function settingsMenuToggle() {
  document.querySelector(".settings-menu").classList.toggle("active");
}

darkBtn.addEventListener("click", () => {
  darkBtn.classList.toggle("active");
  document.body.classList.toggle("dark-theme");
  localStorage.setItem("theme", document.body.classList.contains("dark-theme") ? "dark" : "light");
});

if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-theme");
  darkBtn.classList.add("active");
}

// -------------------- HELPERS --------------------
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Find post index by id
function findPostIndexById(id, arr = null) {
  const posts = arr || getPosts();
  return posts.findIndex(p => p.id === id);
}

// -------------------- RENDER POSTS --------------------
let editingPostId = null; // if not null, posting will update

function renderPosts(posts) {
  postsContainer.innerHTML = "";
  const searchTerm = (searchInput.value || "").toLowerCase();

  const filtered = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm) ||
    post.content.toLowerCase().includes(searchTerm) ||
    (post.name && post.name.toLowerCase().includes(searchTerm)) ||
    (post.mainname && post.mainname.toLowerCase().includes(searchTerm))
  );

  filtered.forEach((post) => {
    const div = document.createElement("div");
    div.className = "post";
    div.dataset.id = post.id;

    // show profile pic small if exists
    const pPic = post.profilePic ? `<img src="${post.profilePic}" class="post-author-pic" alt="pfp">` : "";

    div.innerHTML = `
      <div class="post-header">
        ${pPic} 
        <p class="meta small">${escapeHtml(post.mainname || "")}</p>
        <p class="meta"><strong>${escapeHtml(post.name)}</strong> • ${escapeHtml(post.timestamp)}</p>
        <div>
          <h3>${escapeHtml(post.title)}</h3>
        </div>
      </div>

      <p class="post-content">${escapeHtml(post.content)}</p>
      ${post.image ? `<img src="${post.image}" class="post-media">` : ""}
      ${post.video ? `<video controls class="post-media" src="${post.video}"></video>` : ""}

      <div class="post-actions">
        <button class="like-button">👍 <span class="like-count">${post.likes || 0}</span></button>
        <button class="comment-toggle">💬 ${post.comments?.length || 0}</button>
        ${currentUser() && currentUser().username === post.name ? `<button class="edit-post">✏️ Edit</button><button class="delete-post">🗑 Delete</button>` : ""}
      </div>

      <div class="comments">
        <h4>Comments</h4>
        <div class="comment-list">
          ${post.comments?.map((c,i) => `<p>${escapeHtml(c.text)} • ${escapeHtml(c.timestamp)} ${currentUser() && currentUser().username === post.name ? `<button class="delete-comment" data-comment-index="${i}">❌</button>` : ""}</p>`).join("")}
        </div>
        <input type="text" class="comment-input" placeholder="Add a comment...">
        <button class="add-comment">Comment</button>
      </div>
    `;

    postsContainer.appendChild(div);

    // wire actions based on id (stable)
    const likeBtn = div.querySelector(".like-button");
    const deleteBtn = div.querySelector(".delete-post");
    const addCommentBtn = div.querySelector(".add-comment");
    const commentInput = div.querySelector(".comment-input");
    const editBtn = div.querySelector(".edit-post");

    likeBtn.addEventListener("click", () => {
      const allPosts = getPosts();
      const idx = findPostIndexById(post.id, allPosts);
      if (idx === -1) return;
      allPosts[idx].likes = (allPosts[idx].likes || 0) + 1;
      savePosts(allPosts);
      // if someone other than post owner liked, add notification to post owner
      const user = currentUser();
      if (user && user.username !== allPosts[idx].name) {
        addNotification({ type: "like", message: `${user.username} liked your post "${allPosts[idx].title}"`, user: allPosts[idx].name });
      }
      div.querySelector(".like-count").textContent = allPosts[idx].likes;
    });

    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        if (!confirm("Delete this post?")) return;
        const allPosts = getPosts();
        const idx = findPostIndexById(post.id, allPosts);
        if (idx === -1) return;
        allPosts.splice(idx, 1);
        savePosts(allPosts);
        renderPosts(allPosts);
      });
    }

    if (editBtn) {
      editBtn.addEventListener("click", () => {
        // load into form for editing
        editingPostId = post.id;
        document.getElementById("post-title").value = post.title;
        document.getElementById("post-content").value = post.content;
        // NOTE: media cannot be reloaded into file inputs; we keep existing media if user doesn't replace
        // display preview
        previewContainer.innerHTML = "";
        if (post.image) previewContainer.innerHTML += `<img src="${post.image}" class="preview">`;
        if (post.video) previewContainer.innerHTML += `<video src="${post.video}" class="preview" controls></video>`;
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    addCommentBtn.addEventListener("click", () => {
      const text = commentInput.value.trim();
      if (!text) return;
      const allPosts = getPosts();
      const idx = findPostIndexById(post.id, allPosts);
      if (idx === -1) return;
      allPosts[idx].comments = allPosts[idx].comments || [];
      allPosts[idx].comments.push({ text, timestamp: new Date().toLocaleString(), author: currentUser()?.username || "Guest" });
      savePosts(allPosts);
      // notify post owner if commenter is different
      const user = currentUser();
      if (user && user.username !== allPosts[idx].name) {
        addNotification({ type: "comment", message: `${user.username} commented on your post "${allPosts[idx].title}"`, user: allPosts[idx].name });
      }
      renderPosts(allPosts);
    });

    div.querySelectorAll(".delete-comment").forEach(btn => {
      btn.addEventListener("click", () => {
        const cIndex = parseInt(btn.dataset.commentIndex, 10);
        const allPosts = getPosts();
        const idx = findPostIndexById(post.id, allPosts);
        if (idx === -1) return;
        allPosts[idx].comments.splice(cIndex, 1);
        savePosts(allPosts);
        renderPosts(allPosts);
      });
    });
  });

  if (postsContainer.innerHTML === "") {
    postsContainer.innerHTML = "<p>No posts yet.</p>";
  }
  renderNotifCount();
}

// -------------------- ADD / UPDATE POST --------------------
function addPost(e) {
  e.preventDefault();
  if (!requireLogin()) return;

  const allPosts = getPosts();
  const user = currentUser();
  const mainname = user?.name || "";
  const title = document.getElementById("post-title").value.trim();
  const content = document.getElementById("post-content").value.trim();
  const name = user?.username || "Anonymous";

  if (!title || !content) return alert("Title and content required.");

  // If user selected new files, convert them to base64 for persistent storage; otherwise keep existing media if editing
  const imageFile = fileInputImage.files[0];
  const videoFile = fileInputVideo.files[0];

  function continueSave(imageBase64 = "", videoBase64 = "") {
    if (editingPostId) {
      const idx = findPostIndexById(editingPostId, allPosts);
      if (idx === -1) return alert("Could not find post to update.");
      allPosts[idx].title = title;
      allPosts[idx].content = content;
      if (imageBase64) allPosts[idx].image = imageBase64;
      if (videoBase64) allPosts[idx].video = videoBase64;
      allPosts[idx].mainname = mainname;
      savePosts(allPosts);
      editingPostId = null;
    } else {
      const post = {
        id: Date.now().toString(),
        mainname,
        title,
        content,
        name,
        timestamp: new Date().toLocaleString(),
        image: imageBase64 || "",
        video: videoBase64 || "",
        likes: 0,
        comments: [],
        profilePic: user?.profilePic || ""
      };
      allPosts.unshift(post);
      savePosts(allPosts);
    }

    postForm.reset();
    previewContainer.innerHTML = "";
    localStorage.removeItem("draft_post");
    renderPosts(allPosts);
  }

  // If files selected, convert to base64 (may be heavier but persists across reloads)
  if (imageFile) {
    const reader = new FileReader();
    reader.onload = function() {
      const imageBase64 = reader.result;
      if (videoFile) {
        const r2 = new FileReader();
        r2.onload = function() {
          continueSave(imageBase64, r2.result);
        };
        r2.readAsDataURL(videoFile);
      } else {
        continueSave(imageBase64, "");
      }
    };
    reader.readAsDataURL(imageFile);
  } else if (videoFile) {
    const r2 = new FileReader();
    r2.onload = function() {
      continueSave("", r2.result);
    };
    r2.readAsDataURL(videoFile);
  } else {
    // no new files: if editing, keep previous media; if new post, no media
    continueSave("", "");
  }
}

// -------------------- SEARCH --------------------
searchInput.addEventListener("input", () => renderPosts(getPosts()));

// -------------------- UPLOAD PREVIEW --------------------
uploadImageButton.addEventListener("click", () => fileInputImage.click());
uploadVideoButton.addEventListener("click", () => fileInputVideo.click());
[fileInputImage, fileInputVideo].forEach(input => {
  input.addEventListener("change", () => {
    previewContainer.innerHTML = "";

    [...fileInputImage.files].forEach(file => {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);
      img.className = "preview";
      img.style.maxWidth = (window.innerWidth * 0.9) + "px";
      previewContainer.appendChild(img);
    });

    [...fileInputVideo.files].forEach(file => {
      const vid = document.createElement("video");
      vid.src = URL.createObjectURL(file);
      vid.controls = true;
      vid.className = "preview";
      vid.style.maxWidth = (window.innerWidth * 0.9) + "px";
      previewContainer.appendChild(vid);
    });
  });
});

// -------------------- AUTH --------------------
signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const users = loadUsers();
  const username = document.getElementById("signupUsername").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById("ConfirmsignupPassword").value;

  if (!username) return alert("Username required");
  if (users[username]) return alert("User exists");
  if (password !== confirmPassword) return alert("Passwords do not match");

  users[username] = {
    username,
    name: document.getElementById("signupName").value || username,
    email: document.getElementById("signupEmail").value || "",
    password,
    profilePic: "", // new
    bio: "" // new
  };
  saveUsers(users);
  alert("Signup successful! Please login.");
  document.getElementById("Signup").style.display = "none";
  document.getElementById("Signin").style.display = "block";
});

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const users = loadUsers();
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!users[username] || users[username].password !== password) return alert("Invalid credentials!");

  localStorage.setItem("user", JSON.stringify(users[username]));
  settingsUsername.textContent = username;
  showBlog();
  renderPosts(getPosts());
});

logoutBtnLink.addEventListener("click", (e) => {
  e.preventDefault();
  localStorage.removeItem("user");
  showLoginPopup();
  alert("Logged out");
});

goToSignup.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("Signin").style.display = "none";
  document.getElementById("Signup").style.display = "block";
});
goToSignin.addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("Signup").style.display = "none";
  document.getElementById("Signin").style.display = "block";
});

// -------------------- CLEAR POSTS --------------------
clearPostsButton.addEventListener("click", () => {
  if (!requireLogin()) return;
  if (confirm("Delete all posts?")) {
    savePosts([]);
    renderPosts([]);
  }
});

// -------------------- FORGOT PASSWORD (modal) --------------------
const forgotLink = document.querySelector('#Signin a[href="#"]'); // 'Forgot password?' anchor in Signin form
if (forgotLink) {
  forgotLink.addEventListener("click", (e) => {
    e.preventDefault();
    openForgotModal();
  });
}

function openForgotModal() {
  if (forgotModal) return;
  forgotModal = document.createElement('div');
  forgotModal.className = 'forgot-modal';
  forgotModal.innerHTML = `
    <div class="forgot-inner">
      <h3>Reset Password</h3>
      <p>Enter username and email to verify.</p>
      <input id="fpUsername" placeholder="Username"><br>
      <input id="fpEmail" placeholder="Email"><br>
      <input id="fpNewPassword" placeholder="New password" type="password"><br>
      <div style="text-align:right">
        <button id="fpCancel">Cancel</button>
        <button id="fpSubmit">Reset</button>
      </div>
    </div>
  `;
  document.body.appendChild(forgotModal);
  document.getElementById('fpCancel').addEventListener('click', () => { forgotModal.remove(); forgotModal = null; });
  document.getElementById('fpSubmit').addEventListener('click', () => {
    const u = document.getElementById('fpUsername').value.trim();
    const e = document.getElementById('fpEmail').value.trim();
    const pw = document.getElementById('fpNewPassword').value;
    if (!u || !e || !pw) return alert('All fields required');
    const users = loadUsers();
    if (!users[u] || users[u].email !== e) return alert('No user matched that username/email');
    users[u].password = pw;
    saveUsers(users);
    // If current logged user is same, update session
    const cu = currentUser();
    if (cu && cu.username === u) {
      cu.password = pw;
      saveCurrentUser(cu);
    }
    alert('Password reset. Please login.');
    forgotModal.remove(); forgotModal = null;
    document.getElementById('Signin').style.display = 'block';
  });
}

// -------------------- DRAFT AUTOSAVE --------------------
function startDraftAutosave() {
  if (draftTimer) clearInterval(draftTimer);
  draftTimer = setInterval(() => {
    const title = document.getElementById("post-title").value.trim();
    const content = document.getElementById("post-content").value.trim();
    if (!title && !content) return;
    const draft = {
      title,
      content,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem("draft_post", JSON.stringify(draft));
  }, 3000);
}

function loadDraftIfAny() {
  const draft = JSON.parse(localStorage.getItem("draft_post") || "null");
  if (draft) {
    if (confirm("Load saved draft?")) {
      document.getElementById("post-title").value = draft.title || "";
      document.getElementById("post-content").value = draft.content || "";
      previewContainer.innerHTML = "";
    } else {
      localStorage.removeItem("draft_post");
    }
  }
}

// -------------------- INIT --------------------
document.addEventListener("DOMContentLoaded", () => {
  const user = currentUser();
  if (!user) {
    showLoginPopup();
  } else {
    settingsUsername.textContent = user.username;
    // show profile pic in settings if exists
    const userPicEls = document.querySelectorAll(".user-profile i.fas.fa-user-circle");
    // optionally we could replace with an <img> in the settings menu - left as an exercise to style
    showBlog();
    renderPosts(getPosts());
  }

  // Drafts
  loadDraftIfAny();
  startDraftAutosave();
});

// -------------------- POST FORM SUBMIT --------------------
postForm.addEventListener("submit", addPost);
searchInput.addEventListener("input", () => renderPosts(getPosts()));
// -------------------- NOTIFICATIONS RENDER ON START --------------------
renderNotifCount();

// -------------------- PROFILE / SETTINGS INTERACTIONS --------------------
// We added profile.html file — when user navigates there profile.js will manage edits.
// But we also allow quick small edits from settings menu: add "Edit Profile" inline behavior
// Replace the settings "See your profile" anchor if you want a quick edit popup instead of new page (optional)
// -------------------- END OF SCRIPT --------------------
const seeProfileLink = document.querySelector(".see-profile");
if (seeProfileLink) {
  seeProfileLink.addEventListener("click", (e) => {
    e.preventDefault();
    const user = currentUser();
    if (!user) return alert("Not logged in.");
    // Navigate to profile.html
    window.location.href = "profile.html";
  });
}
const leftSidebar = document.querySelector('.left-sidebar');
const rightSidebar = document.querySelector('.right-sidebar');
const leftBtn = document.querySelector('.mobile-left-btn');
const rightBtn = document.querySelector('.mobile-right-btn');
const overlay = document.createElement('div');

overlay.classList.add('sidebar-overlay');
document.body.appendChild(overlay);

leftBtn?.addEventListener('click', () => {
  leftSidebar.classList.toggle('active');
  overlay.classList.toggle('active');
});
rightBtn?.addEventListener('click', () => {
  rightSidebar.classList.toggle('active');
  overlay.classList.toggle('active');
});

// Close sidebar on overlay click
overlay.addEventListener('click', () => {
  leftSidebar.classList.remove('active');
  rightSidebar.classList.remove('active');
  overlay.classList.remove('active');
});



// -------------------- END OF SCRIPT --------------------
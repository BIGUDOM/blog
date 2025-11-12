// -------------------- DOM ELEMENTS --------------------
const postsContainer = document.getElementById("posts");
const postForm = document.getElementById("post-form");
const searchInput = document.getElementById("searchInput");
const clearPostsButton = document.getElementById("clearPostsButton");
const settingsMenu = document.querySelector(".settings-menu");
const darkBtn = document.getElementById("dark-btn");
const settingsUsername = document.getElementById("settingsUsername");

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
  return JSON.parse(localStorage.getItem("user"));
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

// Load Theme on refresh
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-theme");
  darkBtn.classList.add("active");
}
// -------------------- RENDER POSTS --------------------
function renderPosts(posts) {
  postsContainer.innerHTML = "";
  const searchTerm = searchInput.value.toLowerCase();

  posts
    .filter(post => post.title.toLowerCase().includes(searchTerm) || post.content.toLowerCase().includes(searchTerm))
    .forEach((post, index) => {
      const div = document.createElement("div");
      div.className = "post";
      div.dataset.index = index;

      div.innerHTML = `
        <h3>${post.title}</h3>
        <p><strong>${post.name}</strong> • ${post.timestamp}</p>
        <p class="post-content">${post.content}</p>
        ${post.image ? `<img src="${post.image}" class="post-media">` : ""}
        ${post.video ? `<video controls class="post-media" src="${post.video}"></video>` : ""}
        <div class="post-actions">
          <button class="like-button">👍 <span class="like-count">${post.likes}</span></button>
          <button class="delete-post">🗑 Delete</button>
        </div>
        <div class="comments">
          <h4>Comments</h4>
          <div class="comment-list">
            ${post.comments
              .map((c,i) => `<p>${c.text} • ${c.timestamp} <button class="delete-comment" data-comment-index="${i}">❌</button></p>`)
              .join("")}
          </div>
          <input type="text" class="comment-input" placeholder="Add a comment...">
          <button class="add-comment">Comment</button>
        </div>
      `;

      postsContainer.appendChild(div);

      // -------------------- EVENT LISTENERS --------------------
      div.querySelector(".like-button").addEventListener("click", () => {
        post.likes++;
        savePosts(posts);
        div.querySelector(".like-count").textContent = post.likes;
      });

      div.querySelector(".delete-post").addEventListener("click", () => {
        posts.splice(index,1);
        savePosts(posts);
        renderPosts(posts);
      });

      const addCommentBtn = div.querySelector(".add-comment");
      const commentInput = div.querySelector(".comment-input");
      addCommentBtn.addEventListener("click", () => {
        const text = commentInput.value.trim();
        if (!text) return;
        post.comments.push({ text, timestamp: new Date().toLocaleString() });
        savePosts(posts);
        renderPosts(posts);
      });

      // Delete comment
      div.querySelectorAll(".delete-comment").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const cIndex = parseInt(btn.dataset.commentIndex);
          post.comments.splice(cIndex, 1);
          savePosts(posts);
          renderPosts(posts);
        });
      });
    });

  if (postsContainer.innerHTML === "") {
    postsContainer.innerHTML = "<p>No posts yet.</p>";
  }
}

// -------------------- ADD POST --------------------
function addPost(e) {
  e.preventDefault();
  if (!requireLogin()) return;

  const posts = getPosts();
  const title = document.getElementById("post-title").value.trim();
  const content = document.getElementById("post-content").value.trim();
  const name = currentUser().username;

  if (!title || !content) return alert("Title and content required.");

  const image = fileInputImage.files[0] ? URL.createObjectURL(fileInputImage.files[0]) : "";
  const video = fileInputVideo.files[0] ? URL.createObjectURL(fileInputVideo.files[0]) : "";

  posts.unshift({
    title,
    content,
    name,
    timestamp: new Date().toLocaleString(),
    image,
    video,
    likes: 0,
    comments: []
  });

  savePosts(posts);
  postForm.reset();
  previewContainer.innerHTML = "";
  renderPosts(posts);
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
      previewContainer.appendChild(img);
    });
    [...fileInputVideo.files].forEach(file => {
      const vid = document.createElement("video");
      vid.src = URL.createObjectURL(file);
      vid.controls = true;
      vid.className = "preview";
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
    name: document.getElementById("signupName").value,
    email: document.getElementById("signupEmail").value,
    password
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

logoutBtnLink.addEventListener("click", () => {
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

// -------------------- SEARCH FUNCTIONALITY --------------------
searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  postsContainer.innerHTML = "";
  let found = false;
  posts.forEach((post, index) => {
    if (
      post.title.toLowerCase().includes(query) ||
      post.content.toLowerCase().includes(query) ||
      post.name.toLowerCase().includes(query)
    ) {
      found = true;
      const postElement = document.createElement("div");
      postElement.classList.add("post");
      postElement.innerHTML = `
        <h3>${post.title}</h3>
        <p><strong>${post.name}</strong>: ${post.content}</p>
        <p class="date">Posted on: ${post.timestamp}</p>
        <div class="attachments">${post.media.join("")}</div>
        <div class="post-actions">
          <button class="like-button">👍 Like <span class="like-count">${post.likes}</span></button>
          <button class="comment-toggle">💬 Comment</button>
        </div>
      `;
      postsContainer.prepend(postElement);
    }
  });
  if (!found) {
    postsContainer.innerHTML = "<p>No posts found.</p>";
  }
});


// -------------------- INIT --------------------
document.addEventListener("DOMContentLoaded", () => {
  const user = currentUser();
  if (!user) {
    showLoginPopup();
  } else {
    settingsUsername.textContent = user.username;
    showBlog();
    renderPosts(getPosts());
  }
});

// -------------------- POST FORM SUBMIT --------------------
postForm.addEventListener("submit", addPost);

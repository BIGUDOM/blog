// =============================
// SETTINGS MENU & DARK THEME
// =============================
function settingsMenuToggle() {
  document.querySelector(".settings-menu").classList.toggle("active");
}

const darkBtn = document.getElementById("dark-btn");
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

// =============================
// POSTS HANDLING
// =============================
const postForm = document.getElementById("post-form");
const postsContainer = document.getElementById("posts");
const fileInputImage = document.getElementById("fileInputImage");
const fileInputVideo = document.getElementById("fileInputVideo");
const previewContainer = document.getElementById("preview-container");

let posts = JSON.parse(localStorage.getItem("posts")) || [];

// Hidden file inputs trigger
document.getElementById("uploadImageButton").addEventListener("click", () => fileInputImage.click());
document.getElementById("uploadVideoButton").addEventListener("click", () => fileInputVideo.click());

// Preview selected files
function handleFilePreview(files, type) {
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const element = type === "image"
        ? `<img src="${e.target.result}" alt="preview" class="preview-item">`
        : `<video src="${e.target.result}" controls class="preview-item"></video>`;
      previewContainer.insertAdjacentHTML("beforeend", element);
    };
    reader.readAsDataURL(file);
  });
}

fileInputImage.addEventListener("change", () => handleFilePreview(fileInputImage.files, "image"));
fileInputVideo.addEventListener("change", () => handleFilePreview(fileInputVideo.files, "video"));

// Save posts to localStorage
function savePosts() {
  localStorage.setItem("posts", JSON.stringify(posts));
}

// Render all posts
function renderPosts() {
  postsContainer.innerHTML = "";
  posts.forEach((post, index) => {
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
        <button class="delete-post">🗑️ Delete</button>
      </div>
      <div class="comments-section" style="display: none;">
        <input type="text" class="comment-input" placeholder="Write a comment...">
        <button class="add-comment">Post</button>
        <div class="comments-list">
          ${post.comments.map(c => `<p class="comment">${c.text} <span class="date">(${c.timestamp})</span></p>`).join("")}
        </div>
      </div>
    `;

    addPostFunctionalities(postElement, index);
    postsContainer.prepend(postElement);
  });
}

// Add Post
postForm.addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("User_name").value;
  const title = document.getElementById("post-title").value;
  const content = document.getElementById("post-content").value;
  const timestamp = new Date().toLocaleString();

  const media = Array.from(previewContainer.querySelectorAll(".preview-item"))
    .map(el => el.outerHTML);

  const newPost = { name, title, content, media, likes: 0, comments: [], timestamp };

  posts.push(newPost);
  savePosts();
  renderPosts();

  postForm.reset();
  previewContainer.innerHTML = "";
});

// =============================
// Post Functionalities
// =============================
function addDeleteCommentFunctionality(commentEl, postIndex, commentIndex) {
  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Delete";
  deleteBtn.className = "delete-comment";
  deleteBtn.addEventListener("click", () => {
    posts[postIndex].comments.splice(commentIndex, 1);
    savePosts();
    renderPosts();
  });
  commentEl.appendChild(deleteBtn);
}

function addPostFunctionalities(postElement, index) {
  // Like button
  const likeButton = postElement.querySelector(".like-button");
  const likeCount = postElement.querySelector(".like-count");
  likeButton.addEventListener("click", () => {
    posts[index].likes++;
    savePosts();
    likeCount.textContent = posts[index].likes;
  });

  // Toggle comment section
  const commentToggle = postElement.querySelector(".comment-toggle");
  const commentsSection = postElement.querySelector(".comments-section");
  commentToggle.addEventListener("click", () => {
    commentsSection.style.display =
      commentsSection.style.display === "none" ? "block" : "none";
  });

  // Add comment
  const addCommentBtn = postElement.querySelector(".add-comment");
  const commentInput = postElement.querySelector(".comment-input");
  const commentsList = postElement.querySelector(".comments-list");

  addCommentBtn.addEventListener("click", () => {
    const commentText = commentInput.value.trim();
    if (commentText !== "") {
      const comment = { text: commentText, timestamp: new Date().toLocaleString() };
      posts[index].comments.push(comment);
      savePosts();
      const commentEl = document.createElement("p");
      commentEl.classList.add("comment");
      commentEl.innerHTML = `${comment.text} <span class="date">(${comment.timestamp})</span>`;
      commentsList.appendChild(commentEl);
      addDeleteCommentFunctionality(commentEl, index, posts[index].comments.length - 1);
      commentInput.value = "";
    }
  });

  // Delete post
  const deleteButton = postElement.querySelector(".delete-post");
  deleteButton.addEventListener("click", () => {
    posts.splice(index, 1);
    savePosts();
    renderPosts();
  });

  // Add delete buttons to existing comments
  const existingComments = postElement.querySelectorAll(".comment");
  existingComments.forEach((commentEl, commentIndex) => {
    addDeleteCommentFunctionality(commentEl, index, commentIndex);
  });
}

// Clear All Posts
document.getElementById("clearPostsButton").addEventListener("click", () => {
  posts = [];
  savePosts();
  renderPosts();
});

// Delete preview before posting
previewContainer.addEventListener("click", e => {
  if (e.target.classList.contains("preview-item")) {
    if (confirm("Delete this preview?")) {
      e.target.remove();
    }
  }
});

const searchInput = document.getElementById("search-bar");
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
          <button class="delete-post">🗑️ Delete</button>
        </div>
        <div class="comments-section" style="display: none;">
          <input type="text" class="comment-input" placeholder="Write a comment...">
          <button class="add-comment">Post</button>
          <div class="comments-list">
            ${post.comments.map(c => `<p class="comment">${c.text} <span class="date">(${c.timestamp})</span></p>`).join("")}
          </div>
        </div>
      `;
      addPostFunctionalities(postElement, index);
      postsContainer.prepend(postElement);
    }
  });
  if (!found) {
    postsContainer.innerHTML = "<p>No posts found.</p>";
  }
});


// Initial render
renderPosts();

// Mobile Right Sidebar Toggle
const mobileRightBtn = document.getElementById("mobileRightBtn");
const rightSidebar = document.querySelector(".right-sidebar");

mobileRightBtn.addEventListener("click", () => {
  rightSidebar.classList.toggle("active");
});
document.addEventListener("click", (e) => {
  if (!rightSidebar.contains(e.target) && !mobileRightBtn.contains(e.target)) {
    rightSidebar.classList.remove("active");
  }
});
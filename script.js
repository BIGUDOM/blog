// Client-side script (works with the Flask backend)
// Make sure your Flask server runs at http://127.0.0.1:5000
const API_URL = "http://127.0.0.1:5000/posts";

const postsContainer = document.getElementById("posts");
const postForm = document.getElementById("post-form");
const searchInput = document.getElementById("searchInput");
const fileInputImage = document.getElementById("fileInputImage");
const fileInputVideo = document.getElementById("fileInputVideo");
const previewContainer = document.getElementById("preview-container");
const uploadImageButton = document.getElementById("uploadImageButton");
const uploadVideoButton = document.getElementById("uploadVideoButton");
const clearPostsButton = document.getElementById("clearPostsButton");
const darkBtn = document.getElementById("dark-btn");

let posts = [];

// Wire upload buttons to hidden inputs
uploadImageButton.addEventListener("click", () => fileInputImage.click());
uploadVideoButton.addEventListener("click", () => fileInputVideo.click());

// Preview selected files (supports multiple; shows all)
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

// reset preview when selecting new files
fileInputImage.addEventListener("change", () => {
  previewContainer.innerHTML = "";
  handleFilePreview(fileInputImage.files, "image");
});
fileInputVideo.addEventListener("change", () => {
  previewContainer.innerHTML = "";
  handleFilePreview(fileInputVideo.files, "video");
});

// SETTINGS MENU TOGGLE (called from HTML onclick)
function settingsMenuToggle() {
  document.querySelector(".settings-menu").classList.toggle("active");
}
// Make globally available
window.settingsMenuToggle = settingsMenuToggle;

// Dark mode toggle
if (darkBtn) {
  darkBtn.addEventListener("click", () => {
    darkBtn.classList.toggle("active");
    document.body.classList.toggle("dark-theme");
    localStorage.setItem(
      "theme",
      document.body.classList.contains("dark-theme") ? "dark" : "light"
    );
  });
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-theme");
    darkBtn.classList.add("active");
  }
}

// Fetch posts from server
async function fetchPosts() {
  try {
    const res = await fetch(API_URL);
    posts = await res.json();
    displayPosts(posts);
  } catch (err) {
    console.error("Error fetching posts:", err);
    postsContainer.innerHTML = "<p>Unable to load posts.</p>";
  }
}

// Render posts array into DOM
function displayPosts(postsToDisplay) {
  postsContainer.innerHTML = "";
  // newest first
  postsToDisplay.slice().reverse().forEach(post => {
    const postEl = document.createElement("div");
    postEl.classList.add("post");

    // attachments
    let attachments = "";
    if (post.image) {
      attachments += `<img src="http://127.0.0.1:5000${post.image}" alt="Post Image" style="max-width:100%;">`;
    }
    if (post.video) {
      attachments += `<video src="http://127.0.0.1:5000${post.video}" controls style="max-width:100%;"></video>`;
    }

    const commentsHtml = (post.comments || []).map(c => {
      return `
        <div class="comment-item" data-comment-id="${c.id}">
          <div class="comment-text-wrap">
            <p class="comment-text">${escapeHtml(c.text)}</p>
            <small class="comment-meta">${escapeHtml(c.timestamp)}</small>
          </div>
          <button class="delete-comment" data-comment-id="${c.id}" title="Delete comment">✖</button>
        </div>
      `;
    }).join("");

    const likesCount = post.likes || 0;

    postEl.innerHTML = `
      <h3>${escapeHtml(post.title || "")}</h3>
      <p><strong>${escapeHtml(post.name || "")}</strong>: ${escapeHtml(post.content || "")}</p>

      <div class="attachments">${attachments}</div>

      <div class="post-meta">
        <p class="date">Posted on: ${post.timestamp || ""}</p>
        <div class="post-actions-inline">
          <button class="like-btn"><i class="fas fa-thumbs-up"></i> <span class="like-count">${likesCount}</span></button>
          <button class="delete-post">Delete</button>
        </div>
      </div>

      <div class="comments-section">
        <h3>Comments</h3>
        <div class="comments-list">${commentsHtml}</div>
        <div class="comment-input-container">
          <input type="text" class="comment-input" placeholder="Write a comment...">
          <button class="comment-post-btn">Post</button>
        </div>
      </div>
    `;

    // attach like handler
    const likeBtn = postEl.querySelector(".like-btn");
    likeBtn.addEventListener("click", async (e) => {
      // animate quickly
      likeBtn.classList.add("liked");
      try {
        const res = await fetch(`${API_URL}/${post.id}/like`, { method: "POST" });
        if (!res.ok) throw new Error("Failed to like");
        // slight delay so animation is visible
        setTimeout(() => fetchPosts(), 220);
      } catch (err) {
        console.error("Like error:", err);
        likeBtn.classList.remove("liked");
      }
      // remove animation after short delay (safety)
      setTimeout(() => likeBtn.classList.remove("liked"), 600);
    });

    // delete post
    postEl.querySelector(".delete-post").addEventListener("click", () => deletePost(post.id));

    // add comment
    const commentBtn = postEl.querySelector(".comment-post-btn");
    const commentInput = postEl.querySelector(".comment-input");
    commentBtn.addEventListener("click", async () => {
      const text = commentInput.value.trim();
      if (!text) return;
      try {
        const res = await fetch(`${API_URL}/${post.id}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text })
        });
        if (!res.ok) throw new Error("Failed to add comment");
        commentInput.value = "";
        // fetch updated posts
        fetchPosts();
      } catch (err) {
        console.error("Add comment error:", err);
        alert("Could not add comment.");
      }
    });

    // attach delete-comment handlers (delegated after rendering)
    postEl.addEventListener("click", async (ev) => {
      const target = ev.target;
      if (target && target.classList.contains("delete-comment")) {
        const commentId = target.dataset.commentId;
        if (!confirm("Delete this comment?")) return;
        const commentItem = target.closest(".comment-item");
        try {
          const res = await fetch(`${API_URL}/${post.id}/comments/${commentId}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Delete comment failed");
          // animate removal, then refresh
          commentItem.classList.add("comment-deleted");
          setTimeout(() => fetchPosts(), 320);
        } catch (err) {
          console.error("Delete comment error:", err);
          alert("Could not delete comment.");
        }
      }
    });

    postsContainer.appendChild(postEl);
  });
}

// Basic HTML-escape
function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, s => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[s]));
}

// Submit new post
postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const formData = new FormData();
  const name = document.getElementById("User_name").value;
  const title = document.getElementById("post-title").value;
  const content = document.getElementById("post-content").value;

  formData.append("name", name);
  formData.append("title", title);
  formData.append("content", content);

  if (fileInputImage.files.length > 0) formData.append("image", fileInputImage.files[0]);
  if (fileInputVideo.files.length > 0) formData.append("video", fileInputVideo.files[0]);

  try {
    const res = await fetch(API_URL, { method: "POST", body: formData });
    if (!res.ok) throw new Error("Failed to save post");
    postForm.reset();
    previewContainer.innerHTML = "";
    fetchPosts();
  } catch (err) {
    console.error(err);
    alert("Error saving post.");
  }
});

// Delete post
async function deletePost(id) {
  if (!confirm("Delete this post?")) return;
  try {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    fetchPosts();
  } catch (err) {
    console.error(err);
    alert("Could not delete post.");
  }
}

// Add comment (legacy function not used — kept for compat)
async function addComment(postId, text) {
  try {
    const res = await fetch(`${API_URL}/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    if (!res.ok) throw new Error("Failed to add comment");
    return await res.json();
  } catch (err) {
    console.error(err);
  }
}

// Clear all posts
clearPostsButton.addEventListener("click", async () => {
  if (!confirm("Clear all posts? This cannot be undone.")) return;
  try {
    const res = await fetch(API_URL);
    const all = await res.json();
    await Promise.all(all.map(p => fetch(`${API_URL}/${p.id}`, { method: "DELETE" })));
    fetchPosts();
  } catch (err) {
    console.error(err);
    alert("Could not clear posts.");
  }
});

// Search filter
searchInput.addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  if (!q) return displayPosts(posts);
  const filtered = posts.filter(p =>
    (p.title || "").toLowerCase().includes(q) ||
    (p.content || "").toLowerCase().includes(q) ||
    (p.name || "").toLowerCase().includes(q)
  );
  displayPosts(filtered);
});

// Like animation
function likePost(postId, btn) {
  fetch(`/posts/${postId}/like`, { method: "POST" })
    .then(res => res.json())
    .then(data => {
      btn.classList.add("liked");
      setTimeout(() => btn.classList.remove("liked"), 400);
      btn.querySelector(".like-count").textContent = data.likes;
    });
}

// Delete comment animation
function deleteComment(postId, commentId, commentElement) {
  fetch(`/posts/${postId}/comments/${commentId}`, { method: "DELETE" })
    .then(res => res.json())
    .then(() => {
      commentElement.classList.add("removed");
      setTimeout(() => commentElement.remove(), 400);
    });
}


// initial load
fetchPosts();

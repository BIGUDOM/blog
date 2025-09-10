// ============================
// DOM Elements
// ============================
const postForm = document.getElementById('post-form');
const postTitleInput = document.getElementById('post-title');
const userNameInput = document.getElementById('User_name');
const postContentInput = document.getElementById('post-content');
const fileInputImage = document.getElementById('fileInputImage');
const fileInputVideo = document.getElementById('fileInputVideo');
const uploadImageButton = document.getElementById('uploadImageButton');
const uploadVideoButton = document.getElementById('uploadVideoButton');
const postsContainer = document.getElementById('posts');
const previewContainer = document.getElementById('preview-container');
const searchInput = document.querySelector('.search input');

// ============================
// Store uploaded files
// ============================
let uploadedImages = [];
let uploadedVideos = [];

// ============================
// File Upload Handling
// ============================
uploadImageButton.addEventListener('click', () => fileInputImage.click());
uploadVideoButton.addEventListener('click', () => fileInputVideo.click());

fileInputImage.addEventListener('change', (e) => {
  uploadedImages = [];
  previewContainer.innerHTML = "";
  Array.from(e.target.files).forEach(file => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        uploadedImages.push(ev.target.result);
        const img = document.createElement("img");
        img.src = ev.target.result;
        img.classList.add("preview-image");
        previewContainer.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  });
});

fileInputVideo.addEventListener('change', (e) => {
  uploadedVideos = [];
  previewContainer.innerHTML = "";
  Array.from(e.target.files).forEach(file => {
    if (file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        uploadedVideos.push(ev.target.result);
        const vid = document.createElement("video");
        vid.src = ev.target.result;
        vid.controls = true;
        vid.classList.add("preview-video");
        previewContainer.appendChild(vid);
      };
      reader.readAsDataURL(file);
    }
  });
});

// ============================
// Utility
// ============================
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================
// Save & Load Posts
// ============================
function savePosts() {
  localStorage.setItem("blogPosts", postsContainer.innerHTML);
}
function loadPosts() {
  const saved = localStorage.getItem("blogPosts");
  if (saved) {
    postsContainer.innerHTML = saved;
    document.querySelectorAll('.post').forEach(attachPostEvents);
  }
}

// ============================
// Create Post
// ============================
function createPost(userName, title, content, images = [], videos = []) {
  const post = document.createElement('article');
  post.classList.add('post');

  const now = new Date();
  const date = now.toLocaleDateString();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const imagesHTML = images.map(src =>  `<img src="${src}" class="post-image">`).join('');
  const videosHTML = videos.map(src => `<video src="${src}" controls class="post-video"></video>`).join('');

  post.innerHTML = `
    <div class="post-header">
      <i class="fas fa-user-circle profile-icon"></i>
      <div>
        <h3>${escapeHTML(userName)}</h3>
        <p class="date">${date} • ${time}</p>
      </div>
    </div>
    <h2>${escapeHTML(title)}</h2>
    <p>${escapeHTML(content)}</p>
    ${imagesHTML}
    ${videosHTML}
    <div class="post-actions">
      <button class="like-button">👍 Like <span class="like-count">0</span></button>
      <button class="delete-button">🗑 Delete</button>
    </div>
    <div class="comments-section">
      <h4>Comments</h4>
      <ul class="comments-list"></ul>
      <textarea class="comment-input" placeholder="Add a comment..."></textarea>
      <button class="comment-button">Comment</button>
    </div>
  `;

  postsContainer.prepend(post);
  attachPostEvents(post);
  savePosts();
}

// ============================
// Attach Events to Post
// ============================
function attachPostEvents(post) {
  const likeBtn = post.querySelector('.like-button');
  const likeCount = post.querySelector('.like-count');
  const deleteBtn = post.querySelector('.delete-button');
  const commentBtn = post.querySelector('.comment-button');
  const commentInput = post.querySelector('.comment-input');
  const commentsList = post.querySelector('.comments-list');

  let likes = parseInt(likeCount.textContent) || 0;

  likeBtn.addEventListener('click', () => {
    likes++;
    likeCount.textContent = likes;
    savePosts();
  });

  deleteBtn.addEventListener('click', () => {
    post.remove();
    savePosts();
  });

  commentBtn.addEventListener('click', () => {
    const text = commentInput.value.trim();
    if (text) {
      const li = document.createElement('li');
      li.textContent = text;
      commentsList.appendChild(li);
      commentInput.value = "";
      savePosts();
    }
  });
}

// ============================
// Form Submit
// ============================
postForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const userName = userNameInput.value.trim();
  const title = postTitleInput.value.trim();
  const content = postContentInput.value.trim();

  if (!userName || !title || !content) {
    alert("Please fill in all fields");
    return;
  }

  createPost(userName, title, content, uploadedImages, uploadedVideos);

  postForm.reset();
  uploadedImages = [];
  uploadedVideos = [];
  previewContainer.innerHTML = "";
});

// ============================
// Search Posts
// ============================
searchInput.addEventListener('input', () => {
  const query = searchInput.value.toLowerCase();
  document.querySelectorAll('.post').forEach(post => {
    const title = post.querySelector('h2').textContent.toLowerCase();
    const content = post.querySelector('p').textContent.toLowerCase();
    post.style.display = (title.includes(query) || content.includes(query)) ? "block" : "none";
  });
});

// ============================
// Clear All Posts
// ============================
const clearPostsButton = document.getElementById('clearPostsButton');

clearPostsButton.addEventListener('click', () => {
  if (confirm("Are you sure you want to delete all posts?")) {
    localStorage.removeItem("blogPosts");
    postsContainer.innerHTML = "";
  }
});


// ============================
// Load saved posts on start
// ============================
window.addEventListener('DOMContentLoaded', loadPosts);
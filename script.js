// ============================
// DOM Elements
// ============================
const postForm = document.getElementById('post-form');
const postTitleInput = document.getElementById('post-title');
const postContentInput = document.getElementById('post-content');
const fileInputImage = document.getElementById('fileInputImage');
const fileInputVideo = document.getElementById('fileInputVideo');
const uploadImageButton = document.getElementById('uploadImageButton');
const uploadVideoButton = document.getElementById('uploadVideoButton');
const postsContainer = document.getElementById('posts');

// ============================
// Store uploaded files
// ============================
let uploadedImages = [];
let uploadedVideos = [];

// ============================
// Image Upload Handling
// ============================
uploadImageButton.addEventListener('click', () => {
    fileInputImage.click();
});

fileInputImage.addEventListener('change', (event) => {
    const files = Array.from(event.target.files);
    uploadedImages = []; // reset each time

    files.forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedImages.push(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });
});

// ============================
// Video Upload Handling
// ============================
uploadVideoButton.addEventListener('click', () => {
    fileInputVideo.click();
});

fileInputVideo.addEventListener('change', (event) => {
    const files = Array.from(event.target.files);
    uploadedVideos = []; // reset each time

    files.forEach(file => {
        if (file.type.startsWith('video/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedVideos.push(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });
});

// ============================
// Utility: Escape HTML
// ============================
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ============================
// Create and Insert Post
// ============================
function createPost(title, content, imageSources = [], videoSources = []) {
    const post = document.createElement('article');
    post.classList.add('post');

    let likes = 0;
    const date = new Date().toLocaleDateString();

    let imagesHTML = imageSources
        .map(src => `<img src="${src}" alt="Uploaded image" class="post-image">`)
        .join('');

    let videosHTML = videoSources
        .map(src => `<video src="${src}" controls class="post-video"></video>`)
        .join('');

    post.innerHTML = `
        <h2>${escapeHTML(title)}</h2>
        <p class="date">${date}</p>
        <p>${escapeHTML(content)}</p>
        ${imagesHTML}
        ${videosHTML}
        <button class="like-button">👍 Like <span class="like-count">0</span></button>
        <div class="comments-section">
            <h3>Comments</h3>
            <ul class="comments-list"></ul>
            <textarea class="comment-input" placeholder="Add a comment..."></textarea>
            <button class="comment-button">Comment</button>
        </div>
    `;

    // Like functionality
    const likeButton = post.querySelector('.like-button');
    const likeCountSpan = post.querySelector('.like-count');
    likeButton.addEventListener('click', () => {
        likes++;
        likeCountSpan.textContent = likes;
    });

    // Comment functionality
    const commentInput = post.querySelector('.comment-input');
    const commentButton = post.querySelector('.comment-button');
    const commentsList = post.querySelector('.comments-list');

    commentButton.addEventListener('click', () => {
        const commentText = commentInput.value.trim();
        if (commentText) {
            const li = document.createElement('li');
            li.textContent = commentText;
            commentsList.appendChild(li);
            commentInput.value = '';
        }
    });

    // Optional: Allow "Enter" key to submit comments
    commentInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            commentButton.click();
        }
    });

    // Add post to the top
    postsContainer.prepend(post);
    post.scrollIntoView({ behavior: 'smooth' });
}

// ============================
// Handle Form Submission
// ============================
postForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = postTitleInput.value.trim();
    const content = postContentInput.value.trim();

    if (!title || !content) {
        alert("Please fill in both title and content.");
        return;
    }

    createPost(title, content, uploadedImages, uploadedVideos);

    // Reset form and uploads
    postForm.reset();
    uploadedImages = [];
    uploadedVideos = [];
});
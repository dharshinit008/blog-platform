const API_URL = "/api";

let token = localStorage.getItem("token");
let currentUser = JSON.parse(localStorage.getItem("user") || "null");

// Navigate between pages
function showSection(sectionId) {
    document.querySelectorAll(".section").forEach(section => {
        section.classList.remove("active");
    });

    document.getElementById(sectionId).classList.add("active");
}

// Registration
document.getElementById("registerForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;

    const message = document.getElementById("registerMessage");

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, password })
        });

        const data = await response.json();

        message.textContent = data.message;

        if (response.ok) {
            document.getElementById("registerForm").reset();
            showSection("login");
        }
    } catch (error) {
        message.textContent = "Server connection failed. Please try again.";
    }
});

// Login
document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    const message = document.getElementById("loginMessage");

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        message.textContent = data.message;

        if (response.ok) {
            token = data.token;
            currentUser = data.user;

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(currentUser));

            document.getElementById("welcomeUser").textContent =
                `Welcome, ${currentUser.name}!`;

            document.getElementById("loginForm").reset();

            showSection("dashboard");
        }
    } catch (error) {
        message.textContent = "Server connection failed. Please try again.";
    }
});

// Logout
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    token = null;
    currentUser = null;

    showSection("home");
}
// Create a new blog
document.getElementById("blogForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const title = document.getElementById("blogTitle").value.trim();
    const content = document.getElementById("blogContent").value.trim();
    const message = document.getElementById("blogMessage");

    try {
        const response = await fetch(`${API_URL}/blogs`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ title, content })
        });

        const data = await response.json();

        message.textContent = data.message;

        if (response.ok) {
            document.getElementById("blogForm").reset();

            await loadMyBlogs();
            await loadAllBlogs();

            showSection("dashboard");
        }
    } catch (error) {
        message.textContent = "Could not publish blog. Please try again.";
    }
});

// Load all blogs
async function loadAllBlogs() {
    const container = document.getElementById("blogList");

    try {
        const response = await fetch(`${API_URL}/blogs`);

        if (!response.ok) {
            throw new Error("Failed to load blogs");
        }

        const blogs = await response.json();

        if (blogs.length === 0) {
            container.textContent = "No blog posts yet. Be the first to publish!";
            return;
        }

        container.replaceChildren();

        blogs.forEach(blog => {
            const card = document.createElement("article");
            card.className = "blog-card";

            const title = document.createElement("h3");
            title.textContent = blog.title;

            const author = document.createElement("p");
            author.className = "blog-meta";
            author.textContent = `By ${blog.authorName}`;

            const content = document.createElement("p");
            content.textContent = blog.content;

           card.append(title, author, content);

// Comments section
const commentsTitle = document.createElement("h4");
commentsTitle.textContent = "Comments";

const commentsList = document.createElement("div");
commentsList.className = "comments-list";

const commentInput = document.createElement("input");
commentInput.type = "text";
commentInput.placeholder = "Write a comment...";

const commentButton = document.createElement("button");
commentButton.textContent = "Add Comment";

commentButton.onclick = async () => {
    const text = commentInput.value.trim();

    if (!text) {
        alert("Please enter a comment.");
        return;
    }

    await addComment(blog._id, text, commentsList, commentInput);
};

card.append(commentsTitle, commentsList, commentInput, commentButton);

// Load existing comments
loadComments(blog._id, commentsList);

container.appendChild(card);
        });
    } catch (error) {
        container.textContent = "Unable to load blogs. Please refresh.";
    }
}

// Load logged-in user's blogs
async function loadMyBlogs() {
    const container = document.getElementById("myBlogs");

    if (!token) {
        container.textContent = "Please log in to view your blogs.";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/blogs/my`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to load your blogs");
        }

        const blogs = await response.json();

        container.replaceChildren();

        if (blogs.length === 0) {
            container.textContent = "You haven't published any blogs yet.";
            return;
        }

        blogs.forEach(blog => {
            const card = document.createElement("article");
            card.className = "blog-card";

            const title = document.createElement("h3");
            title.textContent = blog.title;

            const content = document.createElement("p");
            content.textContent = blog.content;

            const editButton = document.createElement("button");
            editButton.textContent = "Edit";
            editButton.addEventListener("click", () => editBlog(blog));

            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", () => deleteBlog(blog._id));

            card.append(title, content, editButton, deleteButton);
            container.appendChild(card);
        });
    } catch (error) {
        container.textContent = "Unable to load your blogs. Please log in again.";
    }
}

// Edit a blog
async function editBlog(blog) {
    const title = prompt("Enter the new blog title:", blog.title);

    if (title === null) return;

    const content = prompt("Enter the new blog content:", blog.content);

    if (content === null) return;

    if (!title.trim() || !content.trim()) {
        alert("Title and content cannot be empty.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/blogs/${blog._id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ title, content })
        });

        const data = await response.json();

        alert(data.message);

        if (response.ok) {
            await loadMyBlogs();
            await loadAllBlogs();
        }
    } catch (error) {
        alert("Unable to update blog.");
    }
}

// Delete a blog
async function deleteBlog(id) {
    if (!confirm("Are you sure you want to delete this blog?")) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/blogs/${id}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        alert(data.message);

        if (response.ok) {
            await loadMyBlogs();
            await loadAllBlogs();
        }
    } catch (error) {
        alert("Unable to delete blog.");
    }
}

// Refresh blogs when opening the home page
const originalShowSection = showSection;

showSection = function (sectionId) {
    originalShowSection(sectionId);

    if (sectionId === "home") {
        loadAllBlogs();
    }

    if (sectionId === "dashboard" && token) {
        loadMyBlogs();
    }
};

// Load blogs on initial page load
loadAllBlogs();
// Load comments for a blog

async function loadComments(blogId, container) {
    try {
        const response = await fetch(
            `${API_URL}/comments/${blogId}`
        );

        const data = await response.json();

        if (!response.ok) {
            container.textContent = "Unable to load comments.";
            return;
        }

        const comments = data.comments || data;

        if (!Array.isArray(comments) || comments.length === 0) {
            container.textContent = "No comments yet.";
            return;
        }

        container.innerHTML = "";

        comments.forEach((comment) => {
            const item = document.createElement("p");
            item.textContent =
                `${comment.user?.name || comment.username || "User"}: ${comment.text}`;
            container.appendChild(item);
        });
    } catch (error) {
        container.textContent = "Unable to load comments.";
        console.error(error);
    }
}

// Add a comment to a blog
async function addComment(blogId, text, container) {
    if (!token) {
        alert("Please login to comment.");
        showSection("login");
        return;
    }

    if (!text.trim()) {
        alert("Please enter a comment.");
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/comments/${blogId}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ text: text.trim() })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to add comment.");
            return;
        }

        alert("Comment added successfully!");

        await loadComments(blogId, container);

    } catch (error) {
        console.error("Comment error:", error);
        alert("Server connection failed.");
    }
}


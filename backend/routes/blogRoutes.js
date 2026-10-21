const express = require("express");
const mongoose = require("mongoose");

const Blog = require("../models/Blog");
const User = require("../models/User");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Get all blog posts
router.get("/", async (req, res) => {
    try {
        const blogs = await Blog.find()
            .sort({ createdAt: -1 });

        res.json(blogs);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch blogs"
        });
    }
});

// Create a blog post
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title?.trim() || !content?.trim()) {
            return res.status(400).json({
                message: "Title and content are required"
            });
        }

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        const blog = await Blog.create({
            title: title.trim(),
            content: content.trim(),
            author: user._id,
            authorName: user.name
        });

        res.status(201).json({
            message: "Blog published successfully!",
            blog
        });
    } catch (error) {
        console.error("Create blog error:", error.message);

        res.status(500).json({
            message: "Failed to create blog"
        });
    }
});

// Get logged-in user's blogs
router.get("/my", authenticateToken, async (req, res) => {
    try {
        const blogs = await Blog.find({
            author: req.user.userId
        }).sort({ createdAt: -1 });

        res.json(blogs);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch your blogs"
        });
    }
});

// Edit a blog post
router.put("/:id", authenticateToken, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid blog ID"
            });
        }

        const { title, content } = req.body;

        if (!title?.trim() || !content?.trim()) {
            return res.status(400).json({
                message: "Title and content are required"
            });
        }

        const blog = await Blog.findOneAndUpdate(
            {
                _id: req.params.id,
                author: req.user.userId
            },
            {
                title: title.trim(),
                content: content.trim()
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found or you cannot edit it"
            });
        }

        res.json({
            message: "Blog updated successfully!",
            blog
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to update blog"
        });
    }
});

// Delete a blog post
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({
                message: "Invalid blog ID"
            });
        }

        const blog = await Blog.findOneAndDelete({
            _id: req.params.id,
            author: req.user.userId
        });

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found or you cannot delete it"
            });
        }

        res.json({
            message: "Blog deleted successfully!"
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to delete blog"
        });
    }
});

module.exports = router;
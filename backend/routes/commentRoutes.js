const express = require("express");
const mongoose = require("mongoose");

const Comment = require("../models/Comment");
const Blog = require("../models/Blog");
const User = require("../models/User");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// Get comments for a particular blog
router.get("/:blogId", async (req, res) => {
    try {
        const { blogId } = req.params;

        if (!mongoose.isValidObjectId(blogId)) {
            return res.status(400).json({
                message: "Invalid blog ID"
            });
        }

        const comments = await Comment.find({ blog: blogId })
            .sort({ createdAt: -1 });

        res.json(comments);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch comments"
        });
    }
});

// Add a comment
router.post("/:blogId", authenticateToken, async (req, res) => {
    try {
        const { blogId } = req.params;
        const { text } = req.body;

        if (!mongoose.isValidObjectId(blogId)) {
            return res.status(400).json({
                message: "Invalid blog ID"
            });
        }

        if (!text || !text.trim()) {
            return res.status(400).json({
                message: "Comment cannot be empty"
            });
        }

        if (text.trim().length > 1000) {
            return res.status(400).json({
                message: "Comment must be under 1000 characters"
            });
        }

        const blog = await Blog.findById(blogId);

        if (!blog) {
            return res.status(404).json({
                message: "Blog not found"
            });
        }

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(401).json({
                message: "User not found"
            });
        }

        const comment = await Comment.create({
            blog: blogId,
            author: user._id,
            authorName: user.name,
            text: text.trim()
        });

        res.status(201).json({
            message: "Comment added successfully!",
            comment
        });
    } catch (error) {
        console.error("Comment error:", error.message);

        res.status(500).json({
            message: "Failed to add comment"
        });
    }
});

module.exports = router;
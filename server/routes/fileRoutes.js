import express from 'express';
import File from '../models/File.js';

const router = express.Router();

// @desc    Retrieve uploaded file/image stored in MongoDB
// @route   GET /api/files/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file || !file.data) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    res.setHeader('Content-Type', file.contentType || 'image/jpeg');
    res.setHeader('Content-Length', file.size || file.data.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return res.send(file.data);
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: 'Invalid file ID or file not found',
    });
  }
});

export default router;

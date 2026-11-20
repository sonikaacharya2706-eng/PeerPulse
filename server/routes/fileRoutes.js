import express from 'express';
import crypto from 'crypto';
import File from '../models/File.js';
import Complaint from '../models/Complaint.js';
import Claim from '../models/Claim.js';
import { verifyToken } from '../utils/jwt.js';

const router = express.Router();

// @desc    Retrieve uploaded file/image with HMAC signature and access control
// @route   GET /api/files/:id
// @access  Protected via HMAC signature + Role/Owner checks for restricted documents
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { exp, sig, token: queryToken } = req.query;

    // 1. Verify HMAC Signature and Expiry
    if (!exp || !sig) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: HMAC signed URL required (missing exp or sig)',
      });
    }

    const now = Math.floor(Date.now() / 1000);
    if (Number(exp) < now) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Signed URL has expired',
      });
    }

    const secret = process.env.JWT_SECRET;
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(`${id}:${exp}`)
      .digest('hex');

    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Invalid file signature',
      });
    }

    // 2. Fetch File from Database
    const file = await File.findById(id);
    if (!file || !file.data) {
      return res.status(404).json({
        success: false,
        message: 'File not found',
      });
    }

    // 3. Document-Level Access Control for Restricted Attachments (Complaint & Claim)
    if (file.fileType === 'complaint' || file.fileType === 'claim') {
      let requester = null;
      const authHeader = req.headers.authorization;
      const rawToken =
        (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.split(' ')[1] : queryToken;

      if (rawToken) {
        try {
          requester = verifyToken(rawToken);
        } catch (e) {
          // invalid or expired user token
        }
      }

      if (!requester) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Authentication token required to view restricted attachments',
        });
      }

      // Admin has blanket authorization
      if (requester.role === 'admin') {
        // Authorized
      } else if (file.fileType === 'complaint') {
        // Complaint attachments: viewable by owner (raisedBy), assignee (assignedTo), or admin
        const complaint = await Complaint.findOne({
          $or: [
            { images: { $regex: id } },
            { 'timeline.images': { $regex: id } },
          ],
        });

        const isOwner =
          (complaint && complaint.raisedBy?.toString() === requester.id) ||
          file.uploadedBy?.toString() === requester.id;
        const isAssignee =
          complaint && complaint.assignedTo?.toString() === requester.id;

        if (!isOwner && !isAssignee) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: Only complaint owner, assigned technician, or admin may view this file',
          });
        }
      } else if (file.fileType === 'claim') {
        // Claim attachments: viewable by claimant, item reporter, security staff, or admin
        if (requester.role === 'security') {
          // Authorized security reviewer
        } else {
          const claim = await Claim.findOne({
            proofImages: { $regex: id },
          }).populate('item');

          const isClaimant =
            (claim && claim.claimant?.toString() === requester.id) ||
            file.uploadedBy?.toString() === requester.id;
          const isItemReporter =
            claim && claim.item?.reportedBy?.toString() === requester.id;
          const isVerifier =
            claim && claim.verifiedBy?.toString() === requester.id;

          if (!isClaimant && !isItemReporter && !isVerifier) {
            return res.status(403).json({
              success: false,
              message: 'Access denied: Only claimant, item finder, or security staff may view claim proof',
            });
          }
        }
      }
    }

    res.setHeader('Content-Type', file.contentType || 'image/jpeg');
    res.setHeader('Content-Length', file.size || file.data.length);
    res.setHeader('Cache-Control', 'private, max-age=86400');
    return res.send(file.data);
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: 'Invalid file ID or error reading file',
    });
  }
});

export default router;

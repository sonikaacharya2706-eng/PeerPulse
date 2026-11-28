import crypto from 'crypto';
import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { sendEmail } from '../services/emailService.js';
import { logAudit } from '../middleware/audit.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password, department, year, rollNo, phone, clubs } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    if (rollNo) {
      const existingRollNo = await User.findOne({ rollNo });
      if (existingRollNo) {
        return res.status(409).json({
          success: false,
          message: 'A user with this Roll Number already exists',
        });
      }
    }

    // Public self-registration ALWAYS creates a student (prevent privilege escalation)
    const assignedRole = 'student';

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: assignedRole,
      department: department || '',
      year: year ? Number(year) : null,
      rollNo: rollNo || undefined,
      phone: phone || '',
      clubs: clubs || [],
    });

    const token = generateToken(user._id, user.role);

    await logAudit(req, 'REGISTER', 'User', user._id, { email: user.email, role: user.role });

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          year: user.year,
          rollNo: user.rollNo,
          phone: user.phone,
          avatar: user.avatar,
          clubs: user.clubs,
        },
      },
      message: 'Registration successful',
    });
  } catch (error) {
    next(error);
  }
};

// Whitelisted College Faculty & Students for Canara Engineering College (ISE Dept)
export const WHITELISTED_FACULTY_EMAILS = [
  'sandeepkini@canaraengineering.in',
  'pradeepm@canaraengineering.in',
  'geetha.laxmi@canaraengineering.in',
  'yashaswini@canaraengineering.in',
];

export const WHITELISTED_STUDENT_EMAILS = [
  'mgssp3014@gmail.com',
  'shreyagouda722@gmail.com',
  'spoorthijgatty2@gmail.com',
  'sonikaacharya2706@gmail.com',
  'soukhya0510@gmail.com',
  'rashmishetty310@gmail.com',
  'pramodsmg05@gmail.com',
  'prathameshprathamesh198@gmail.com',
  'shrigurunaik14@gmail.com',
  'kulalprajwal309@gmail.com',
  'sachinbyndoor05@gmail.com',
  'gjehehdhzzzhzhx7656@gmail.com',
  'pramodvishakanta796@gmail.com',
  'vaibhavnetta@gmail.com',
  'rathnamskjk@gmail.com',
];

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account deactivated. Please contact an administrator.',
      });
    }

    const token = generateToken(user._id, user.role);

    await logAudit(req, 'LOGIN', 'User', user._id, { email: user.email });

    res.json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          year: user.year,
          rollNo: user.rollNo,
          phone: user.phone,
          avatar: user.avatar,
          clubs: user.clubs,
        },
      },
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get public Google OAuth Client ID configuration
// @route   GET /api/auth/google-config
// @access  Public
export const getGoogleConfig = (req, res) => {
  const rawClientId = (process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '').trim();
  const clientId = rawClientId.endsWith('.apps.googleusercontent.com') ? rawClientId : '';
  res.json({
    success: true,
    data: { clientId },
  });
};

// @desc    Google Sign-in / Sign-up verification (validates with Google OAuth)
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req, res, next) => {
  try {
    const { credential, accessToken, expectedEmail } = req.body;

    // Strict validation: Require real Google token. Never trust unverified client profile or email fields.
    if (!credential && !accessToken) {
      return res.status(400).json({
        success: false,
        message: 'Google credential token or access token is required',
      });
    }

    let email = null;
    let name = null;
    let avatar = '';

    const expectedAudience = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;

    if (credential) {
      // 1. Verify Google ID token via Google tokeninfo API
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
      );

      if (!response.ok) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired Google credential token',
        });
      }

      const payload = await response.json();

      // Check email_verified: Must be verified by Google
      const isVerified = payload.email_verified === true || payload.email_verified === 'true';
      if (!isVerified) {
        return res.status(401).json({
          success: false,
          message: 'Google email address is not verified',
        });
      }

      // Check audience: Ensure token was issued for this application
      if (expectedAudience && payload.aud && payload.aud !== expectedAudience) {
        return res.status(401).json({
          success: false,
          message: 'Google token audience mismatch',
        });
      }

      email = payload.email?.toLowerCase().trim();
      name = payload.name;
      avatar = payload.picture || '';
    } else if (accessToken) {
      // 2. Verify with Google's tokeninfo & userinfo API using OAuth2 access token
      const tokenInfoRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
      );

      if (!tokenInfoRes.ok) {
        return res.status(401).json({
          success: false,
          message: 'Invalid or expired Google access token',
        });
      }

      const tokenInfo = await tokenInfoRes.json();

      // Check audience / client_id on access token if configured
      if (expectedAudience && tokenInfo.aud && tokenInfo.aud !== expectedAudience) {
        return res.status(401).json({
          success: false,
          message: 'Google token audience mismatch',
        });
      }

      // Fetch verified user profile
      const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!userinfoRes.ok) {
        return res.status(401).json({
          success: false,
          message: 'Failed to retrieve verified Google profile',
        });
      }

      const profilePayload = await userinfoRes.json();

      const isVerified =
        profilePayload.email_verified === true || profilePayload.email_verified === 'true';
      if (!isVerified) {
        return res.status(401).json({
          success: false,
          message: 'Google email address is not verified',
        });
      }

      email = profilePayload.email?.toLowerCase().trim();
      name = profilePayload.name;
      avatar = profilePayload.picture || '';
    }

    if (!email) {
      return res.status(401).json({
        success: false,
        message: 'Google authentication failed: No verified email in Google token',
      });
    }

    if (expectedEmail && email !== expectedEmail.toLowerCase().trim()) {
      return res.status(401).json({
        success: false,
        message: 'The Google account does not match the entered email address.',
      });
    }

    name = name || email.split('@')[0];

    // Only after Google token verification succeeds: Look up the user in the database
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account deactivated. Please contact an administrator.',
      });
    }

    if (avatar && !user.avatar) {
      user.avatar = avatar;
      await user.save();
    }

    await logAudit(req, 'GOOGLE_LOGIN', 'User', user._id, { email: user.email });

    const token = generateToken(user._id, user.role);

    res.json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          year: user.year,
          rollNo: user.rollNo,
          phone: user.phone,
          avatar: user.avatar,
          clubs: user.clubs,
        },
      },
      message: 'Google login successful',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      data: user,
      message: 'Current profile retrieved',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res, next) => {
  try {
    const updates = {};
    // Explicitly restrict to safe fields only; role and security credentials cannot be changed here
    const allowed = ['name', 'phone', 'department', 'year', 'clubs', 'avatar'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Enforce that role, email, password, and isActive can never be updated via self-profile
    delete updates.role;
    delete updates.email;
    delete updates.password;
    delete updates.isActive;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    await logAudit(req, 'UPDATE_PROFILE', 'User', user._id, updates);

    res.json({
      success: true,
      data: user,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    await logAudit(req, 'CHANGE_PASSWORD', 'User', user._id);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email address',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetToken = hashedToken;
    user.resetTokenExpiry = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: 'Smart Campus - Password Reset Request',
      text: `You requested a password reset. Please click or open the link below to reset your password:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email. Token is valid for 1 hour.`,
    });

    res.json({
      success: true,
      message: 'Password reset link sent to your email (check console/ethereal if testing)',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired',
      });
    }

    user.password = password;
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    await logAudit(req, 'RESET_PASSWORD', 'User', user._id);

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login.',
    });
  } catch (error) {
    next(error);
  }
};

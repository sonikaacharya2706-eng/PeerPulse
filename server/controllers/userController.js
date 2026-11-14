import User from '../models/User.js';
import { logAudit } from '../middleware/audit.js';

// @desc    Get all users (admin)
// @route   GET /api/users
// @access  Private (admin)
export const getUsers = async (req, res, next) => {
  try {
    const { role, department, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (role) query.role = role;
    if (department) query.department = department;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rollNo: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(limitNum).sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users,
      meta: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
      message: 'Users retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a user (admin)
// @route   POST /api/users
// @access  Private (admin)
export const createUser = async (req, res, next) => {
  try {
    const { name, email, password, role, department, year, rollNo, phone, clubs } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
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

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
      department: department || '',
      year: year ? Number(year) : null,
      rollNo: rollNo || undefined,
      phone: phone || '',
      clubs: clubs || [],
    });

    await logAudit(req, 'CREATE_USER', 'User', user._id, { email: user.email, role: user.role });

    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(201).json({
      success: true,
      data: safeUser,
      message: 'User created successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user (admin)
// @route   PUT /api/users/:id
// @access  Private (admin)
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.password) {
      // If updating password, do not allow plain text overwrite without hashing
      const tempUser = new User({ password: updates.password });
      const salt = await (await import('bcryptjs')).default.genSalt(10);
      updates.password = await (await import('bcryptjs')).default.hash(updates.password, salt);
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await logAudit(req, 'UPDATE_USER', 'User', user._id, updates);

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user (admin)
// @route   DELETE /api/users/:id
// @access  Private (admin)
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await logAudit(req, 'DELETE_USER', 'User', id, { email: user.email });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status (admin)
// @route   PATCH /api/users/:id/toggle
// @access  Private (admin)
export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    await logAudit(req, 'TOGGLE_USER_STATUS', 'User', user._id, { isActive: user.isActive });

    res.json({
      success: true,
      data: user,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

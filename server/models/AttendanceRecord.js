import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema(
  {
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: [true, 'Session reference is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    markedAt: {
      type: Date,
      default: Date.now,
    },
    method: {
      type: String,
      enum: ['qr', 'manual'],
      default: 'qr',
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      default: 'present',
    },
    geo: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    deviceId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// UNIQUE compound index (session, student)
attendanceRecordSchema.index({ session: 1, student: 1 }, { unique: true });

// UNIQUE compound index (session, deviceId) - prevents proxy marking from one physical device
attendanceRecordSchema.index({ session: 1, deviceId: 1 }, { unique: true, sparse: true });

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);
export default AttendanceRecord;

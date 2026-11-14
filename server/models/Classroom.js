import mongoose from 'mongoose';

const classroomSchema = new mongoose.Schema(
  {
    roomNo: {
      type: String,
      required: [true, 'Room number is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    building: {
      type: String,
      required: [true, 'Building name is required'],
      trim: true,
    },
    floor: {
      type: Number,
      required: [true, 'Floor number is required'],
    },
    capacity: {
      type: Number,
      required: [true, 'Room capacity is required'],
      min: 1,
    },
    type: {
      type: String,
      enum: ['lecture', 'lab', 'seminar'],
      required: [true, 'Classroom type is required'],
    },
    facilities: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Classroom = mongoose.model('Classroom', classroomSchema);
export default Classroom;

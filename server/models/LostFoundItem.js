import mongoose from 'mongoose';

const lostFoundItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['lost', 'found'],
      required: [true, 'Item type is required (lost/found)'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['electronics', 'books', 'id_cards', 'clothing', 'accessories', 'keys', 'bags', 'other'],
      required: [true, 'Category is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    dateOccurred: {
      type: Date,
      required: [true, 'Date occurred is required'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Reporter reference is required'],
    },
    status: {
      type: String,
      enum: ['reported', 'matched', 'claimed', 'returned', 'closed'],
      default: 'reported',
    },
    matchedWith: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LostFoundItem',
      default: null,
    },
    keywords: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

lostFoundItemSchema.index({ type: 1, category: 1, status: 1 });
lostFoundItemSchema.index({ keywords: 1 });

const LostFoundItem = mongoose.model('LostFoundItem', lostFoundItemSchema);
export default LostFoundItem;

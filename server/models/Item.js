const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    type: { type: String, required: true, enum: ['Lost', 'Found'] },
    location: { type: String, required: true, trim: true, maxlength: 160 },
    date: { type: Date, required: true },
    image: { type: String, trim: true, default: '', maxlength: 2048 },
    status: { type: String, required: true, enum: ['Active', 'Resolved'], default: 'Active' },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Item', itemSchema);

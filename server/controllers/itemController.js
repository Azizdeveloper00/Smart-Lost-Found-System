const mongoose = require('mongoose');
const Item = require('../models/Item');
const Claim = require('../models/Claim');

const allowedTypes = ['Lost', 'Found'];
const allowedStatuses = ['Active', 'Resolved'];
const editableFields = ['title', 'description', 'category', 'location', 'date', 'image'];

const itemProjection = 'title description category type location date image status reportedBy createdAt updatedAt';
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const validatePayload = (payload, requireAll = true) => {
  const fields = ['title', 'description', 'category', 'location', 'date'];
  if (requireAll && fields.some((field) => typeof payload[field] !== 'string' || !payload[field].trim())) {
    return 'Title, description, category, location, and date are required.';
  }
  if (!requireAll && fields.some((field) => payload[field] !== undefined && (typeof payload[field] !== 'string' || !payload[field].trim()))) {
    return 'Updated item fields cannot be empty.';
  }
  const limits = { title: 120, description: 2000, category: 80, location: 160, image: 2048 };
  if (Object.entries(limits).some(([field, limit]) => typeof payload[field] === 'string' && payload[field].length > limit)) {
    return 'One or more fields exceed the allowed length.';
  }
  if (payload.type !== undefined && !allowedTypes.includes(payload.type)) return 'Type must be Lost or Found.';
  if (payload.date !== undefined && (Number.isNaN(Date.parse(payload.date)) || !payload.date)) return 'Date must be valid.';
  if (payload.image !== undefined && typeof payload.image !== 'string') return 'Image must be a URL or path string.';
  return null;
};

const isOwner = (item, userId) => item.reportedBy._id?.toString() === userId.toString() || item.reportedBy.toString() === userId.toString();

const createItem = async (req, res) => {
  const validationError = validatePayload(req.body || {});
  if (validationError) return res.status(400).json({ message: validationError });
  if (!allowedTypes.includes(req.body.type)) return res.status(400).json({ message: 'Type must be Lost or Found.' });

  try {
    const item = await Item.create({
      title: req.body.title.trim(),
      description: req.body.description.trim(),
      category: req.body.category.trim(),
      type: req.body.type,
      location: req.body.location.trim(),
      date: req.body.date,
      image: typeof req.body.image === 'string' ? req.body.image.trim() : '',
      reportedBy: req.user._id,
    });
    await item.populate('reportedBy', 'name email');
    return res.status(201).json(item);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ message: 'Please provide valid item details.' });
    return res.status(500).json({ message: 'Unable to create item.' });
  }
};

const getItems = async (req, res) => {
  const { keyword, type, category, location, status } = req.query;
  if (type && (typeof type !== 'string' || !allowedTypes.includes(type))) return res.status(400).json({ message: 'Type filter must be Lost or Found.' });
  if (status && (typeof status !== 'string' || !allowedStatuses.includes(status))) return res.status(400).json({ message: 'Status filter must be Active or Resolved.' });

  const conditions = {};
  if (typeof keyword === 'string' && keyword.trim()) {
    const keywordPattern = new RegExp(escapeRegex(keyword.trim()), 'i');
    conditions.$or = [{ title: keywordPattern }, { description: keywordPattern }];
  }
  if (type) conditions.type = type;
  if (status) conditions.status = status;
  if (typeof category === 'string' && category.trim()) conditions.category = new RegExp(escapeRegex(category.trim()), 'i');
  if (typeof location === 'string' && location.trim()) conditions.location = new RegExp(escapeRegex(location.trim()), 'i');

  try {
    const items = await Item.find(conditions).select(itemProjection).populate('reportedBy', 'name email').sort({ createdAt: -1 });
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load items.' });
  }
};

const getMyItems = async (req, res) => {
  try {
    const items = await Item.find({ reportedBy: req.user._id }).select(itemProjection).populate('reportedBy', 'name email').sort({ createdAt: -1 });
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load your reports.' });
  }
};

const getItemById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid item ID.' });
  try {
    const item = await Item.findById(req.params.id).select(itemProjection).populate('reportedBy', 'name email');
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    return res.json(item);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load item.' });
  }
};

const findOwnedItem = async (id, userId) => {
  if (!mongoose.isValidObjectId(id)) return { error: { status: 400, message: 'Invalid item ID.' } };
  const item = await Item.findById(id);
  if (!item) return { error: { status: 404, message: 'Item not found.' } };
  if (!isOwner(item, userId)) return { error: { status: 403, message: 'You can only manage your own reports.' } };
  return { item };
};

const updateItem = async (req, res) => {
  const validationError = validatePayload(req.body || {}, false);
  if (validationError) return res.status(400).json({ message: validationError });
  try {
    const result = await findOwnedItem(req.params.id, req.user._id);
    if (result.error) return res.status(result.error.status).json({ message: result.error.message });
    const updates = {};
    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = field === 'image' ? req.body[field].trim() : typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
    });
    if (!Object.keys(updates).length) return res.status(400).json({ message: 'No editable fields were provided.' });
    Object.assign(result.item, updates);
    await result.item.save();
    await result.item.populate('reportedBy', 'name email');
    return res.json(result.item);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ message: 'Please provide valid item details.' });
    return res.status(500).json({ message: 'Unable to update item.' });
  }
};

const deleteItem = async (req, res) => {
  try {
    const result = await findOwnedItem(req.params.id, req.user._id);
    if (result.error) return res.status(result.error.status).json({ message: result.error.message });
    await Claim.deleteMany({ item: result.item._id });
    await result.item.deleteOne();
    return res.json({ message: 'Item deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete item.' });
  }
};

const updateItemStatus = async (req, res) => {
  if (!allowedStatuses.includes(req.body?.status)) return res.status(400).json({ message: 'Status must be Active or Resolved.' });
  try {
    const result = await findOwnedItem(req.params.id, req.user._id);
    if (result.error) return res.status(result.error.status).json({ message: result.error.message });
    result.item.status = req.body.status;
    await result.item.save();
    await result.item.populate('reportedBy', 'name email');
    return res.json(result.item);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update item status.' });
  }
};

module.exports = { createItem, getItems, getMyItems, getItemById, updateItem, deleteItem, updateItemStatus };

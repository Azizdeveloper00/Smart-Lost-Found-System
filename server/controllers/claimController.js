const mongoose = require('mongoose');
const Claim = require('../models/Claim');
const Item = require('../models/Item');

const claimProjection = 'item claimant message status createdAt updatedAt';
const userProjection = 'name email';

const populatedClaim = (query) => query
  .select(claimProjection)
  .populate({ path: 'item', select: 'title type location status' })
  .populate({ path: 'claimant', select: userProjection });

const createClaim = async (req, res) => {
  const itemId = req.body?.itemId;
  const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';

  if (!mongoose.isValidObjectId(itemId)) return res.status(400).json({ message: 'A valid item ID is required.' });
  if (!message) return res.status(400).json({ message: 'Claim message is required.' });
  if (message.length > 2000) return res.status(400).json({ message: 'Claim message is too long.' });

  try {
    const item = await Item.findById(itemId).select('type reportedBy');
    if (!item) return res.status(404).json({ message: 'Item not found.' });
    if (item.type !== 'Found') return res.status(400).json({ message: 'Claims can only be submitted for Found items.' });
    if (item.reportedBy.toString() === req.user._id.toString()) return res.status(403).json({ message: 'You cannot claim your own item.' });

    const duplicate = await Claim.exists({ item: item._id, claimant: req.user._id, status: 'Pending' });
    if (duplicate) return res.status(409).json({ message: 'You already have a pending claim for this item.' });

    const claim = await Claim.create({ item: item._id, claimant: req.user._id, message });
    return res.status(201).json(await populatedClaim(Claim.findById(claim._id)));
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ message: 'Please provide a valid claim.' });
    return res.status(500).json({ message: 'Unable to submit claim.' });
  }
};

const getMyClaims = async (req, res) => {
  try {
    const claims = await populatedClaim(Claim.find({ claimant: req.user._id }).sort({ createdAt: -1 }));
    return res.json(claims);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load your claims.' });
  }
};

const getReceivedClaims = async (req, res) => {
  try {
    const ownedFoundItems = await Item.find({ reportedBy: req.user._id, type: 'Found' }).select('_id');
    const claims = await populatedClaim(Claim.find({ item: { $in: ownedFoundItems.map((item) => item._id) } }).sort({ createdAt: -1 }));
    return res.json(claims);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load claim requests.' });
  }
};

const findOwnedClaim = async (claimId, userId) => {
  if (!mongoose.isValidObjectId(claimId)) return { error: { status: 400, message: 'Invalid claim ID.' } };
  const claim = await Claim.findById(claimId).populate('item', 'type reportedBy title status');
  if (!claim) return { error: { status: 404, message: 'Claim not found.' } };
  if (!claim.item) return { error: { status: 404, message: 'Associated item not found.' } };
  if (claim.item.reportedBy.toString() !== userId.toString()) return { error: { status: 403, message: 'Only the item reporter can manage this claim.' } };
  return { claim };
};

const approveClaim = async (req, res) => {
  try {
    const result = await findOwnedClaim(req.params.id, req.user._id);
    if (result.error) return res.status(result.error.status).json({ message: result.error.message });
    if (result.claim.item.type !== 'Found') return res.status(400).json({ message: 'Only claims for Found items can be approved.' });
    if (result.claim.status !== 'Pending') return res.status(409).json({ message: 'Only Pending claims can be approved.' });

    result.claim.status = 'Approved';
    await result.claim.save();
    await Item.findByIdAndUpdate(result.claim.item._id, { status: 'Resolved' });
    await Claim.updateMany({ item: result.claim.item._id, status: 'Pending', _id: { $ne: result.claim._id } }, { status: 'Rejected' });
    return res.json(await populatedClaim(Claim.findById(result.claim._id)));
  } catch (error) {
    return res.status(500).json({ message: 'Unable to approve claim.' });
  }
};

const rejectClaim = async (req, res) => {
  try {
    const result = await findOwnedClaim(req.params.id, req.user._id);
    if (result.error) return res.status(result.error.status).json({ message: result.error.message });
    if (result.claim.item.type !== 'Found') return res.status(400).json({ message: 'Only claims for Found items can be rejected.' });
    if (result.claim.status !== 'Pending') return res.status(409).json({ message: 'Only Pending claims can be rejected.' });

    result.claim.status = 'Rejected';
    await result.claim.save();
    return res.json(await populatedClaim(Claim.findById(result.claim._id)));
  } catch (error) {
    return res.status(500).json({ message: 'Unable to reject claim.' });
  }
};

module.exports = { createClaim, getMyClaims, getReceivedClaims, approveClaim, rejectClaim };

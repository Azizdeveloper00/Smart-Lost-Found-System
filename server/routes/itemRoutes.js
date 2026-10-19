const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createItem,
  getItems,
  getMyItems,
  getItemById,
  updateItem,
  deleteItem,
  updateItemStatus,
} = require('../controllers/itemController');

const router = express.Router();

router.get('/', getItems);
router.get('/my', protect, getMyItems);
router.get('/:id', getItemById);
router.post('/', protect, createItem);
router.put('/:id', protect, updateItem);
router.delete('/:id', protect, deleteItem);
router.patch('/:id/status', protect, updateItemStatus);

module.exports = router;

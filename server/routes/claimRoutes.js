const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createClaim,
  getMyClaims,
  getReceivedClaims,
  approveClaim,
  rejectClaim,
} = require('../controllers/claimController');

const router = express.Router();

router.use(protect);
router.post('/', createClaim);
router.get('/my', getMyClaims);
router.get('/received', getReceivedClaims);
router.patch('/:id/approve', approveClaim);
router.patch('/:id/reject', rejectClaim);

module.exports = router;

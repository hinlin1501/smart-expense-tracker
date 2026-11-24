const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);
router.get('/', dashboardController.getDashboardData);
router.get('/chart', dashboardController.getDashboardChart);
router.get('/export', dashboardController.exportReport);

module.exports = router;
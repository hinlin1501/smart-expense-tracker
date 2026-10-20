const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/income.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/', incomeController.createIncome);
router.get('/', incomeController.getIncomes);
router.put('/:id', incomeController.updateIncome);
router.delete('/:id', incomeController.deleteIncome);

module.exports = router;
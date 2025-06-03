const express = require('express');
const router = express.Router();

// Home route
router.get('/', (req, res) => {
    res.send('Fitness Tracker API is running! Visit /api-docs for documentation.');
});

module.exports = router;
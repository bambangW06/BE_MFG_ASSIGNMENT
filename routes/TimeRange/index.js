const { getTimerange, addTimerange } = require('../../controllers/TimeRange/TimeRange.controller');

var router = require('express').Router();

router.get('/timerange', getTimerange)
router.post('/add', addTimerange)

module.exports = router
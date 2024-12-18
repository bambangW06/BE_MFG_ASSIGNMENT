const { getTimerange } = require('../../controllers/TimeRange/TimeRange.controller');

var router = require('express').Router();

router.get('/timerange', getTimerange)

module.exports = router
const express = require('express');
const config = require('../config');
const { getAllMergeRequests } = require('../services/mergeRequestService');

const router = express.Router();

let cache = null;
let cacheTimestamp = 0;

router.get('/pull-requests', async (req, res) => {
  const force = req.query.force === 'true';

  if (!force && cache && Date.now() - cacheTimestamp < config.cacheTtlMs) {
    return res.json(cache);
  }

  try {
    const data = await getAllMergeRequests();
    cache = data;
    cacheTimestamp = Date.now();
    res.json(data);
  } catch (err) {
    console.error('Error fetching merge requests:', err);
    res.status(502).json({
      error: 'No se pudieron obtener los merge requests de GitLab.',
      detail: err.message,
    });
  }
});

module.exports = router;

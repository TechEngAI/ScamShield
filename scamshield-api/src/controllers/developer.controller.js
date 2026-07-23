'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/response');
const developerService = require('../services/developer.service');

const generateKey = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim().length < 2) {
    return sendError(res, 'key name must be at least 2 characters', 400);
  }

  if (name.trim().length > 50) {
    return sendError(res, 'key name must be under 50 characters', 400);
  }

  const { key, keyData } = await developerService.generateApiKey(req.user.id, name.trim());

  return sendSuccess(
    res,
    { key, keyData },
    'api key generated — save this key now, it will not be shown again',
    201
  );
});

const listKeys = asyncHandler(async (req, res) => {
  const keys = await developerService.listApiKeys(req.user.id);
  return sendSuccess(res, keys, 'api keys retrieved');
});

const revokeKey = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await developerService.revokeApiKey(id, req.user.id);
  return sendSuccess(res, null, 'api key revoked successfully');
});

const getUsage = asyncHandler(async (req, res) => {
  const stats = await developerService.getUsageStats(req.user.id);
  return sendSuccess(res, stats, 'usage stats retrieved');
});

module.exports = { generateKey, listKeys, revokeKey, getUsage };

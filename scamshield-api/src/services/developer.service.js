'use strict';

const crypto = require('crypto');
const { supabaseAdmin } = require('../config/supabase');
const logger = require('../utils/logger');

/**
 * Generates a new API key for a user
 * Key format: ss_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
 * Only the prefix (first 8 chars after ss_live_) is stored
 * The full key is shown ONCE and never stored in plain text
 * @param {string} userId
 * @param {string} keyName - user-defined name for the key
 * @returns {Promise<{key: string, keyData: object}>}
 */
const generateApiKey = async (userId, keyName) => {
  const { count, error: countError } = await supabaseAdmin
    .from('api_keys')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_active', true);

  if (countError) {
    logger.error('Failed to count API keys', { error: countError.message, userId });
    throw new Error('failed to count api keys');
  }

  if (count >= 5) {
    throw new Error('maximum of 5 API keys allowed per account');
  }

  const rawKey = `ss_live_${crypto.randomBytes(24).toString('hex')}`;
  const keyPrefix = rawKey.substring(0, 16);
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .insert({
      user_id: userId,
      name: keyName,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to save API key', { error: error.message });
    throw new Error('failed to generate api key');
  }

  logger.info('API key generated', { userId, keyPrefix });

  return {
    key: rawKey,
    keyData: {
      id: data.id,
      name: data.name,
      key_prefix: keyPrefix,
      created_at: data.created_at,
      is_active: true,
      total_calls: 0,
    },
  };
};

const listApiKeys = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, name, key_prefix, is_active, total_calls, last_used_at, created_at, expires_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error('failed to fetch api keys');
  return data || [];
};

const revokeApiKey = async (keyId, userId) => {
  const { error } = await supabaseAdmin
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', keyId)
    .eq('user_id', userId);

  if (error) throw new Error('failed to revoke api key');
  logger.info('API key revoked', { keyId, userId });
};

const validateApiKey = async (rawKey) => {
  if (!rawKey || !rawKey.startsWith('ss_live_')) return null;

  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, user_id, is_active, total_calls')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  await supabaseAdmin
    .from('api_keys')
    .update({
      last_used_at: new Date().toISOString(),
      total_calls: (data.total_calls || 0) + 1,
    })
    .eq('id', data.id);

  return data;
};

const getUsageStats = async (userId) => {
  const { data: keys } = await supabaseAdmin
    .from('api_keys')
    .select('id, name, key_prefix, total_calls, last_used_at, is_active')
    .eq('user_id', userId);

  const totalCalls = (keys || []).reduce((sum, key) => sum + (key.total_calls || 0), 0);
  const activeKeys = (keys || []).filter((key) => key.is_active).length;

  const { data: logs } = await supabaseAdmin
    .from('api_usage_logs')
    .select('endpoint, verdict, response_time_ms, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  return {
    total_calls: totalCalls,
    active_keys: activeKeys,
    keys: keys || [],
    recent_logs: logs || [],
  };
};

module.exports = {
  generateApiKey,
  listApiKeys,
  revokeApiKey,
  validateApiKey,
  getUsageStats,
};

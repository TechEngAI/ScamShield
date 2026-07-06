const { createClient } = require('@supabase/supabase-js');
const config = require('./env');

let supabaseAnon;
let supabaseAdmin;

if (!supabaseAnon) {
  supabaseAnon = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);
}

if (!supabaseAdmin) {
  supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);
}

module.exports = {
  supabaseAnon,
  supabaseAdmin,
};

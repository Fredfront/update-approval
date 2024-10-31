// Import required modules
const { createClient: createSanityClient } = require('@sanity/client');
const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
const express = require('express');
require('dotenv').config();

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const sanityClient = createSanityClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  useCdn: true,
  apiVersion: '2024-10-31',
});

// @ts-ignore
const supabaseClient = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Listen to all mutations in Sanity
sanityClient.listen('*').subscribe(async (mutation) => {
  if (mutation.result?._type === 'MythicPlusTeam') {
    const { contactPerson, teamSlug } = mutation.result;
    await supabaseClient
      .from('teams')
      .update({ approved_in_sanity: true })
      .eq('contact_person', contactPerson)
      .eq('team_slug', teamSlug);
  }
});

console.log('Listening for Sanity changes...');

// Create Express app to keep Render active
const app = express();
const PORT = process.env.PORT || 8080;

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
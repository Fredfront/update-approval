// Import required modules
const { createClient: createSanityClient } = require('@sanity/client');
const { createClient: createSupabaseClient } = require('@supabase/supabase-js');

const express = require('express');

// Environment variables
require('dotenv').config();
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const client = createSanityClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  useCdn: true, // set to `false` to bypass the edge cache
  apiVersion: '2024-10-31', // use a UTC date string 

})

const supabaseClient = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);


client.listen('*').subscribe(async (mutation) => {
  if(mutation.result?._type === 'MythicPlusTeam') {
    console.log(mutation.result)
    const contactPerson = mutation.result.contactPerson
    await supabaseClient.from('teams').update({ approved_in_sanity: true }).eq('contact_person', contactPerson).eq('team_slug', mutation.result.teamSlug);
  }
  })

// Create Express app
const app = express();
const PORT = 8080;

app.use(express.json());

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

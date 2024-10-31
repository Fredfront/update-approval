// Import required modules
const { createClient: createSanityClient } = require('@sanity/client');
const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
const express = require('express');
require('dotenv').config();

// Validate environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY || !process.env.SANITY_PROJECT_ID || !process.env.SANITY_DATASET) {
  throw new Error("Missing required environment variables.");
}

// Initialize Sanity client
const sanityClient = createSanityClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  useCdn: false,
  apiVersion: '2024-10-31',
});

// Initialize Supabase client
const supabaseClient = createSupabaseClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Function to start listening for Sanity mutations
function startSanityListener() {
  sanityClient.listen('*[_type == "MythicPlusTeam"]').subscribe({
    next: async (mutation) => {
      console.log('Sanity mutation:', mutation);

      // Check if mutation has necessary data and is of type `update` or `create`
      if (mutation.result && (mutation.transition === 'update' || mutation.transition === 'appear')) {
        const { contactPerson, teamSlug } = mutation.result;

        try {
          // Update the approved_in_sanity flag in Supabase
          const { error } = await supabaseClient
            .from('teams')
            .update({ approved_in_sanity: true })
            .eq('contact_person', contactPerson)
            .eq('team_slug', teamSlug);

          if (error) {
            console.error('Error updating Supabase:', error.message);
          } else {
            console.log(`Team ${teamSlug} approved in Supabase for contact ${contactPerson}`);
          }
        } catch (err) {
          console.error('Error during Supabase update:', err.message);
        }
      }
    },
    error: (err) => {
      console.error('Sanity listener error:', err);

      // Attempt to reconnect after a delay
      setTimeout(() => {
        console.log('Attempting to reconnect to Sanity...');
        startSanityListener(); // Re-call the listener setup function
      }, 5000);
    }
  });
}

// Start the Sanity listener
startSanityListener();
console.log('Listening for Sanity changes...');

// Express app to keep the server active
const app = express();
const PORT = process.env.PORT || 8080;

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
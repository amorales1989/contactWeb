// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://buzeesifyccipkpjgqwc.supabase.co';
const supabaseAnonKey =  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ1emVlc2lmeWNjaXBrcGpncXdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI4OTYwMjQsImV4cCI6MjAzODQ3MjAyNH0.-mMRDobveFsff6qku4zs6wdzxOkpmbTe1EFrJScS8_0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

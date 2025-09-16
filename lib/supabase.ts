import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';


const supabaseUrl = "https://hfkgmmorjwxikpklsqln.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhma2dtbW9yand4aWtwa2xzcWxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMjM4NTcsImV4cCI6MjA3MzU5OTg1N30.nEX9vNZ1OGRbj0vTyaflGUyL7cnkGmvU2GJJBMFp5Iw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
  },
});
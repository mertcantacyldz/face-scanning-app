// hooks/useUserId.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const useUserId = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUserId();
  }, []);

  const getCurrentUserId = async () => {
    try {
      // Önce AsyncStorage'den dene
      const storedUserId = await AsyncStorage.getItem('userId');
      if (storedUserId) {
        setUserId(storedUserId);
        return;
      }

      // Yoksa Supabase'den al
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
        await AsyncStorage.setItem('userId', session.user.id);
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
    }
  };

  return userId;
};

export default useUserId;
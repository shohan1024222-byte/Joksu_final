// FirebaseStorage - AsyncStorage এর মতো interface কিন্তু data Firebase Firestore এ save হয়
// App uninstall করলেও data থাকবে! PC বন্ধ করলেও data থাকবে!
// Firebase fail হলে AsyncStorage-এ fallback করবে

import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './config';

const COLLECTION = 'appData';

/**
 * FirebaseStorage - AsyncStorage এর drop-in replacement
 * একই getItem/setItem/removeItem API, কিন্তু data cloud-এ save হয়
 * Firebase fail হলে automatically AsyncStorage-এ fallback করে
 */
export const FirebaseStorage = {
  getItem: async (key: string): Promise<string | null> => {
    // If Firebase is not initialized, use AsyncStorage directly
    if (!db) {
      console.log(`[Storage] Firebase unavailable, using AsyncStorage for key: ${key}`);
      return await AsyncStorage.getItem(key);
    }
    try {
      const docRef = doc(db, COLLECTION, key);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().value;
      }
      // Try AsyncStorage as secondary source
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn(`FirebaseStorage getItem error [${key}], falling back to AsyncStorage:`, error);
      try {
        return await AsyncStorage.getItem(key);
      } catch (e) {
        console.error(`AsyncStorage fallback also failed [${key}]:`, e);
        return null;
      }
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    // Always save to AsyncStorage as backup
    try {
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn(`AsyncStorage setItem error [${key}]:`, e);
    }
    // Also try Firebase if available
    if (!db) return;
    try {
      const docRef = doc(db, COLLECTION, key);
      await setDoc(docRef, { 
        value, 
        updatedAt: new Date().toISOString() 
      });
    } catch (error) {
      console.warn(`FirebaseStorage setItem error [${key}], saved to AsyncStorage only:`, error);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    // Remove from AsyncStorage
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn(`AsyncStorage removeItem error [${key}]:`, e);
    }
    // Also try Firebase if available
    if (!db) return;
    try {
      const docRef = doc(db, COLLECTION, key);
      await deleteDoc(docRef);
    } catch (error) {
      console.warn(`FirebaseStorage removeItem error [${key}]:`, error);
    }
  }
};

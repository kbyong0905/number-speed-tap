import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "gen-lang-client-0372991353",
  appId: "1:171569860262:web:47877530f9eabdf755ee67",
  apiKey: "AIzaSyB6aym82aQ46BtKDyEPrB-W1h19QLfILmg",
  authDomain: "gen-lang-client-0372991353.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-speedtap-a0e754b3-2e91-4500-ae7a-80995cb1a8af",
  storageBucket: "gen-lang-client-0372991353.firebasestorage.app",
  messagingSenderId: "171569860262"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific database ID specified in the config
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Validate connection immediately
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();

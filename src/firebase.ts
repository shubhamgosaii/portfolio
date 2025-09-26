import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DB_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

setPersistence(auth, browserLocalPersistence);

const db = getDatabase(app);

const messaging = getMessaging(app);

export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.error("Notification permission denied.");
      return;
    }

    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY, 
    });

    if (currentToken) {
      console.log('FCM Token:', currentToken);
    } else {
      console.log('No registration token available. Request permission to generate one.');
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }
};

export const setupForegroundMessageListener = (callback: (message: any) => void) => {
  onMessage(messaging, (payload) => {
    console.log('Message received in foreground: ', payload);
    callback(payload);
  });
};

export { auth, db, messaging };

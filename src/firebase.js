import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAWobrA19exMrjblU2MenCJXLb0DGXSvVU",
  authDomain: "qm-system-d8f82.firebaseapp.com",
  projectId: "qm-system-d8f82",
  storageBucket: "qm-system-d8f82.firebasestorage.app",
  messagingSenderId: "1064137977806",
  appId: "1:1064137977806:web:f0c332a5a2aeaf40e4059f",
  measurementId: "G-X3BZ471D8P"
};

// Validate Firebase config
const requiredFields = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

if (missingFields.length > 0) {
  console.error('Missing Firebase configuration fields:', missingFields);
  throw new Error(`Missing Firebase configuration: ${missingFields.join(', ')}`);
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase:', error);
  throw error;
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Enable emulators in development (comment out in production)
if (process.env.NODE_ENV === 'development') {
  // Uncomment these lines if you want to use Firebase emulators for development
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectFirestoreEmulator(db, 'localhost', 8080);
}

// Log Firebase services status
console.log('Firebase Auth initialized:', !!auth);
console.log('Firebase Firestore initialized:', !!db);

// Test Firebase connection
auth.onAuthStateChanged((user) => {
  if (user) {
    console.log('Firebase Auth connection successful, user:', user.email);
  } else {
    console.log('Firebase Auth connection successful, no user signed in');
  }
}, (error) => {
  console.error('Firebase Auth connection error:', error);
});

export default app;

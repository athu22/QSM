import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if Firebase is properly initialized
  const isFirebaseReady = () => {
    return auth && db && typeof auth.onAuthStateChanged === 'function';
  };

  // Check if this is the first user in the system
  async function isFirstUser() {
    try {
      if (!isFirebaseReady()) {
        console.error('Firebase not ready');
        return false;
      }
      
      // Check if any users exist in Firestore
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      return snapshot.empty;
    } catch (error) {
      console.error('Error checking if first user:', error);
      return false;
    }
  }

  // Create admin user automatically
  async function createFirstAdminUser(email, password) {
    try {
      console.log('Attempting to create first admin user...');
      console.log('Firebase Auth available:', !!auth);
      console.log('Firebase Firestore available:', !!db);
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Admin user created in Firebase Auth:', result.user.uid);
      
      // Create admin user document in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        email: email,
        role: 'Admin',
        displayName: 'System Administrator',
        createdAt: new Date().toISOString(),
        isActive: true,
        isFirstAdmin: true
      });
      
      console.log('Admin user document created in Firestore');
      return result;
    } catch (error) {
      console.error('Error creating first admin user:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Provide more specific error messages
      if (error.code === 'auth/configuration-not-found') {
        throw new Error('Firebase configuration error. Please check your Firebase project setup and ensure Authentication is enabled.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else {
        throw new Error(`Failed to create admin user: ${error.message}`);
      }
    }
  }

  async function signup(email, password, role, displayName) {
    try {
      if (!isFirebaseReady()) {
        throw new Error('Firebase not ready. Please refresh the page and try again.');
      }
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        email: email,
        role: role,
        displayName: displayName,
        createdAt: new Date().toISOString(),
        isActive: true
      });
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  async function login(email, password) {
    try {
      if (!isFirebaseReady()) {
        throw new Error('Firebase not ready. Please refresh the page and try again.');
      }
      
      console.log('Login attempt started...');
      console.log('Firebase Auth available:', !!auth);
      console.log('Firebase Firestore available:', !!db);
      
      // Check if this is the first login and no users exist
      const firstUser = await isFirstUser();
      console.log('Is first user:', firstUser);
      
      if (firstUser) {
        // This is the first login, automatically create admin user
        console.log('First login detected, creating admin user...');
        const result = await createFirstAdminUser(email, password);
        setUserRole('Admin');
        return result;
      } else {
        // Normal login flow
        console.log('Normal login flow...');
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log('User authenticated:', result.user.uid);
        
        // Get user role from Firestore
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          console.log('User role retrieved:', role);
          setUserRole(role);
        } else {
          console.warn('User document not found in Firestore');
        }
        
        return result;
      }
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Provide more specific error messages
      if (error.code === 'auth/user-not-found') {
        throw new Error('No user found with this email address.');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('Invalid email address format.');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('This account has been disabled. Please contact support.');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Too many failed attempts. Please wait a moment and try again.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection and try again.');
      } else {
        throw error; // Re-throw the original error for other cases
      }
    }
  }

  async function logout() {
    try {
      setUserRole(null);
      setCurrentUser(null);
      if (isFirebaseReady()) {
        await signOut(auth);
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  async function getUserRole(uid) {
    try {
      if (!isFirebaseReady()) {
        console.error('Firebase not ready');
        return null;
      }
      
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data().role;
      }
      return null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  }

  useEffect(() => {
    if (!isFirebaseReady()) {
      console.error('Firebase not ready, skipping auth state listener');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          console.log('User authenticated:', user.email);
          setCurrentUser(user);
          const role = await getUserRole(user.uid);
          setUserRole(role);
        } else {
          console.log('No user authenticated');
          setCurrentUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        // Don't throw here, just log the error and continue
        setCurrentUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Firebase Auth state change error:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    signup,
    login,
    logout,
    getUserRole,
    isFirstUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

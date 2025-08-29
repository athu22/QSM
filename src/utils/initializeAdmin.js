import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

/**
 * Initialize the admin user in Firebase
 * This function should be called once when setting up the system
 */
export const initializeAdmin = async (email = 'admin@qms.com', password = 'admin123', displayName = 'System Administrator') => {
  try {
    console.log('Initializing admin user...');
    
    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('Admin user created in Firebase Auth:', user.uid);
    
    // Store admin user data in Firestore
    const adminData = {
      email: email,
      role: 'Admin',
      displayName: displayName,
      createdAt: new Date().toISOString(),
      isActive: true,
      uid: user.uid
    };
    
    // Store in users collection with UID as document ID
    await setDoc(doc(db, 'users', user.uid), adminData);
    console.log('Admin user data stored in Firestore with UID');
    
    // Also store in a special admin document for easy access
    await setDoc(doc(db, 'users', 'admin'), adminData);
    console.log('Admin user data stored in Firestore with "admin" document ID');
    
    // Sign out the admin user (they should login normally)
    await auth.signOut();
    
    console.log('Admin user initialization completed successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role: Admin');
    
    return {
      success: true,
      uid: user.uid,
      email: email,
      message: 'Admin user created successfully'
    };
    
  } catch (error) {
    console.error('Error initializing admin user:', error);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('Admin user already exists in Firebase Auth');
      
      // Check if admin document exists in Firestore
      try {
        const adminDoc = await getDoc(doc(db, 'users', 'admin'));
        if (adminDoc.exists()) {
          console.log('Admin user already exists in Firestore');
          return {
            success: true,
            message: 'Admin user already exists'
          };
        }
      } catch (firestoreError) {
        console.error('Error checking Firestore:', firestoreError);
      }
    }
    
    return {
      success: false,
      error: error.message,
      message: 'Failed to create admin user'
    };
  }
};

/**
 * Check if admin user exists
 */
export const checkAdminExists = async () => {
  try {
    const adminDoc = await getDoc(doc(db, 'users', 'admin'));
    return adminDoc.exists();
  } catch (error) {
    console.error('Error checking admin existence:', error);
    return false;
  }
};

export default initializeAdmin;

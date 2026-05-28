import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Create or update user record in Firestore
  const updateUserDocument = async (firebaseUser) => {
    if (!firebaseUser) return;
    
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        photoURL: firebaseUser.photoURL || null,
        emailVerified: firebaseUser.emailVerified,
        lastLogin: serverTimestamp(),
      };

      if (!userSnap.exists()) {
        // New user - create record
        userData.createdAt = serverTimestamp();
        await setDoc(userRef, userData);
        console.log('Created new user document');
      } else {
        // Existing user - update last login
        await setDoc(userRef, userData, { merge: true });
        console.log('Updated user document');
      }
    } catch (err) {
      console.error('Error updating user document:', err);
      // Don't throw - this is a non-critical operation
    }
  };

  useEffect(() => {
    // [fix] mounted-flag prevents state updates on unmounted component or
    // out-of-order updates when a second auth event fires during an await.
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await updateUserDocument(firebaseUser);
      }
      if (active) {
        setUser(firebaseUser);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      // [fix] Don't call updateUserDocument here — onAuthStateChanged fires
      // after signInWithPopup succeeds and handles the document write.
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  };

  const handleEmailSignIn = async (email, password, name, isSignUp) => {
    try {
      let userCredential;
      if (isSignUp) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      // [fix] Don't call updateUserDocument here — onAuthStateChanged handles it.
    } catch (error) {
      console.error("Email sign-in error:", error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // [fix] Don't set user to null manually — onAuthStateChanged fires with
      // null automatically after signOut and handles the state update.
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return { 
    user, 
    loading, 
    signInWithGoogle: handleGoogleSignIn, 
    signInWithEmail: handleEmailSignIn, 
    signOut: handleSignOut 
  };
};

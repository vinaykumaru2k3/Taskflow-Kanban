import { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect,
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
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, googleProvider, db, storage } from '../lib/firebase';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  // Create or update user record in Firestore
  const updateUserDocument = async (firebaseUser, photoURLOverride = null) => {
    if (!firebaseUser) return;
    
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      
      const userData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
        photoURL: photoURLOverride || firebaseUser.photoURL || null,
        emailVerified: firebaseUser.emailVerified,
        lastLogin: serverTimestamp(),
      };

      if (!userSnap.exists()) {
        // New user - create record
        userData.createdAt = serverTimestamp();
        await setDoc(userRef, userData);
        console.info('Created new user document');
      } else {
        // Existing user - update last login
        await setDoc(userRef, userData, { merge: true });
        console.info('Updated user document');
      }
      // Return the stored user data for consumers
      const updatedSnap = await getDoc(userRef);
      return updatedSnap.exists() ? updatedSnap.data() : userData;
    } catch (err) {
      console.error('Error updating user document:', err);
      // Don't throw - this is a non-critical operation
      return null;
    }
  };

  // Cache an external avatar into Firebase Storage and return its download URL.
  const cacheAvatarIfNeeded = async (firebaseUser) => {
    if (!firebaseUser || !firebaseUser.photoURL) return null;
    // Avoid uploading avatars from local development to Storage to prevent
    // CORS/preflight issues when the GCS bucket isn't configured for localhost.
    try {
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        console.info('Running in local dev - skipping avatar upload to Storage for', firebaseUser.uid);
        return null;
      }
    } catch (e) {
      // ignore
    }
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      const existing = userSnap.exists() ? userSnap.data()?.photoURL : null;
      // If already pointing to Firebase Storage, reuse it
      if (existing && existing.includes('firebasestorage.googleapis.com')) {
        console.info('Using cached avatar from Firestore for', firebaseUser.uid);
        return existing;
      }

      // Fetch the external image
      console.info('Fetching avatar to cache for', firebaseUser.uid, firebaseUser.photoURL);
      const resp = await fetch(firebaseUser.photoURL);
      if (!resp.ok) {
        console.warn('Failed to fetch remote avatar:', resp.status);
        return null;
      }
      const blob = await resp.blob();

      // Upload to Firebase Storage
      const ext = blob.type.split('/')[1] || 'jpg';
      const ref = storageRef(storage, `avatars/${firebaseUser.uid}.${ext}`);
      await uploadBytes(ref, blob);
      const downloadUrl = await getDownloadURL(ref);
      console.info('Uploaded cached avatar for', firebaseUser.uid, downloadUrl);
      return downloadUrl;
    } catch (err) {
      console.warn('Avatar caching failed for', firebaseUser?.uid, err);
      return null;
    }
  };

  useEffect(() => {
    // [fix] mounted-flag prevents state updates on unmounted component or
    // out-of-order updates when a second auth event fires during an await.
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.info('onAuthStateChanged fired, user:', firebaseUser?.uid ?? null);
      if (firebaseUser) {
        // Attempt to cache avatar into Storage and update the Firestore record
        const cached = await cacheAvatarIfNeeded(firebaseUser);
        const stored = await updateUserDocument(firebaseUser, cached);
        console.info('updateUserDocument completed for', firebaseUser.uid);
        if (active) {
          // Merge stored Firestore profile with the auth user object so UI reads cached avatar
          setUser({ ...(firebaseUser || {}), ...stored });
          setLoading(false);
        }
        return;
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
      if (signingIn) return;
      setSigningIn(true);
      // [fix] Don't call updateUserDocument here — onAuthStateChanged fires
      // after signInWithPopup succeeds and handles the document write.
      const result = await signInWithPopup(auth, googleProvider);
      console.info('Google sign-in (popup) succeeded for user:', result?.user?.uid);
    } catch (error) {
      // If popup-based sign-in is blocked by COOP/COEP or the browser,
      // fall back to redirect-based flow which works in restrictive contexts.
      console.warn('signInWithPopup failed, attempting signInWithRedirect as fallback:', error);
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (err2) {
        console.error("Google sign-in error:", err2);
        throw err2;
      }
    } finally {
      setSigningIn(false);
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
      console.info('User signed out');
      // [fix] Don't set user to null manually — onAuthStateChanged fires with
      // null automatically after signOut and handles the state update.
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return { 
    user, 
    loading, 
    signingIn,
    signInWithGoogle: handleGoogleSignIn, 
    signInWithEmail: handleEmailSignIn, 
    signOut: handleSignOut 
  };
};

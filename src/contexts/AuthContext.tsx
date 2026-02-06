import { auth, db } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  User as FirebaseUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import { deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface User {
  user_id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  userId: string | null;
  email: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Log when component mounts
  useEffect(() => {
    console.log('[AuthProvider] Component mounted');
    return () => console.log('[AuthProvider] Component unmounting');
  }, []);

  const syncUserFromFirebase = async (firebaseUser: FirebaseUser): Promise<User> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      const shouldUpdateProfile =
        (!!firebaseUser.displayName && !userData.name) ||
        (!!firebaseUser.photoURL && !userData.avatar_url);

      if (shouldUpdateProfile) {
        await setDoc(
          userDocRef,
          {
            name: userData.name ?? firebaseUser.displayName ?? null,
            avatar_url: userData.avatar_url ?? firebaseUser.photoURL ?? null,
          },
          { merge: true }
        );
      }

      return {
        user_id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: userData.name ?? firebaseUser.displayName ?? undefined,
        avatar_url: userData.avatar_url ?? firebaseUser.photoURL ?? undefined,
      };
    }

    await setDoc(userDocRef, {
      email: firebaseUser.email,
      name: firebaseUser.displayName ?? null,
      avatar_url: firebaseUser.photoURL ?? null,
      created_at: new Date(),
    });

    return {
      user_id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName ?? undefined,
      avatar_url: firebaseUser.photoURL ?? undefined,
    };
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    let isMounted = true;

    console.log('[Auth] Setting up auth state listener...');

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!isMounted) {
        console.log('[Auth] Component unmounted during auth state change');
        return;
      }
      
      try {
        console.log('[Auth] Auth state changed:', firebaseUser?.email || 'null');
        setLoading(true);
        
        if (firebaseUser) {
          console.log('[Auth] User authenticated, syncing...');
          const nextUser = await syncUserFromFirebase(firebaseUser);
          
          if (isMounted) {
            console.log('[Auth] ✅ User set:', nextUser.email);
            setUser(nextUser);
          }
        } else {
          console.log('[Auth] No user authenticated');
          if (isMounted) {
            setUser(null);
          }
        }
      } catch (error) {
        console.error('[Auth] ❌ Error in auth state change:', error);
        if (firebaseUser && isMounted) {
          // Fallback: set basic user info
          console.log('[Auth] Using fallback user data');
          setUser({
            user_id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName ?? undefined,
            avatar_url: firebaseUser.photoURL ?? undefined,
          });
        } else if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    return () => {
      console.log('[Auth] Cleaning up auth listener');
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Login with Firebase Auth
  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  // Signup with Firebase Auth
  const signup = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        name: null,
        avatar_url: null,
        created_at: new Date(),
      });
      
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      console.error('Signup error:', error);
      throw new Error(error.message || 'Signup failed');
    }
  };

  // Sign in/up with Google
  const signInWithGoogle = async () => {
    try {
      console.log('[Auth] Opening Google sign-in popup...');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      console.log('[Auth] ✅ Google sign-in successful!');
      console.log('[Auth] User:', result.user.email);
      
      // User state will be updated by onAuthStateChanged
    } catch (error: any) {
      console.error('[Auth] ❌ Google sign-in error:', error);
      console.error('[Auth] Error code:', error.code);
      
      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup blocked by browser. Please allow popups for this site.');
      } else {
        throw new Error(error.message || 'Google sign-in failed');
      }
    }
  };

  const deleteAccount = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      await deleteDoc(userDocRef);
      await deleteUser(currentUser);
      setUser(null);
    } catch (error: any) {
      console.error('Delete account error:', error);
      throw new Error(error.message || 'Failed to delete account');
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Update user info in Firestore
  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
    }
  };

  const value: AuthContextType = {
    user,
    userId: user?.user_id ?? null,
    email: user?.email ?? null,
    loading,
    isAuthenticated: !!user,
    login,
    signup,
    signInWithGoogle,
    deleteAccount,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
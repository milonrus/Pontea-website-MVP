import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  currentUser: null, 
  userProfile: null, 
  loading: true,
  isAdmin: false,
  refreshProfile: async () => {}
});

export const useAuth = () => useContext(AuthContext);

// List of emails that should automatically get Admin privileges
const ADMIN_EMAILS = ['my.mulyar@gmail.com'];
// DEV MODE: Set this to true to treat all users as admins during development
const DEV_AUTO_ADMIN = false; 

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (user: User) => {
    try {
      // Check if this user is in the hardcoded admin list OR if dev mode is on
      const shouldBeAdmin = DEV_AUTO_ADMIN || (user.email && ADMIN_EMAILS.includes(user.email));

      // Fetch user profile from Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const data = userDocSnap.data() as UserProfile;

        // Auto-promote if they should be admin but aren't yet in the DB
        if (shouldBeAdmin && data.role !== 'admin') {
          console.log(`Auto-promoting user ${user.email} to admin...`);
          await setDoc(userDocRef, { role: 'admin' }, { merge: true });
          data.role = 'admin';
        }

        setUserProfile(data);
      } else {
        // Create default profile for new users
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Student',
          role: shouldBeAdmin ? 'admin' : 'student', 
          createdAt: serverTimestamp() as any,
          settings: {
            showResultAfterEach: false
          }
        };
        
        // Try to save to Firestore
        await setDoc(userDocRef, newProfile);
        
        // For local state
        setUserProfile({
            ...newProfile,
            createdAt: Timestamp.now()
        });
      }
    } catch (error: any) {
      console.warn("Could not fetch/create user profile in Firestore. Using local fallback.", error.code);
      
      const shouldBeAdmin = DEV_AUTO_ADMIN || (user.email && ADMIN_EMAILS.includes(user.email || ''));
      
      const fallbackProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Student',
        role: shouldBeAdmin ? 'admin' : 'student',
        createdAt: Timestamp.now(),
        settings: {
          showResultAfterEach: false
        }
      };
      setUserProfile(fallbackProfile);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const refreshProfile = async () => {
    if (currentUser) {
        setLoading(true);
        await fetchProfile(currentUser);
        setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      isAdmin: userProfile?.role === 'admin',
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session
  useEffect(() => {
    async function initAuth() {
      const token = localStorage.getItem('cinestream_token');
      if (token) {
        try {
          const data = await api.getMe();
          setUser(data.user);
          setProfiles(data.profiles);
          const savedProfId = localStorage.getItem('cinestream_profile_id');
          const found = data.profiles.find(p => p.id === savedProfId) || data.profiles[0];
          setActiveProfile(found || null);
        } catch (err) {
          console.warn('Session expired or invalid token:', err.message);
          localStorage.removeItem('cinestream_token');
          await loginWithDemo();
        }
      } else {
        // Auto-login with demo for instant access
        await loginWithDemo();
      }
      setLoading(false);
    }

    initAuth();
  }, []);

  async function login(email, password) {
    const data = await api.login(email, password);
    localStorage.setItem('cinestream_token', data.token);
    setUser(data.user);
    setProfiles(data.profiles);
    const prof = data.profiles[0] || null;
    setActiveProfile(prof);
    if (prof) localStorage.setItem('cinestream_profile_id', prof.id);
    return data;
  }

  async function loginWithDemo() {
    try {
      return await login('demo@cinestream.io', 'Demo123!');
    } catch (e) {
      console.warn('Demo login note:', e.message);
    }
  }

  async function loginWithAdmin(password) {
    return login('admin@cinestream.io', password);
  }

  async function register(name, email, password) {
    const data = await api.register(name, email, password);
    localStorage.setItem('cinestream_token', data.token);
    setUser(data.user);
    setProfiles(data.profiles);
    setActiveProfile(data.activeProfile);
    if (data.activeProfile) localStorage.setItem('cinestream_profile_id', data.activeProfile.id);
    return data;
  }

  function logout() {
    localStorage.removeItem('cinestream_token');
    localStorage.removeItem('cinestream_profile_id');
    setUser(null);
    setProfiles([]);
    setActiveProfile(null);
  }

  function selectProfile(profile) {
    setActiveProfile(profile);
    localStorage.setItem('cinestream_profile_id', profile.id);
  }

  async function addProfile(profileData) {
    const newProf = await api.createProfile(profileData);
    setProfiles(prev => [...prev, newProf]);
    return newProf;
  }

  async function removeProfile(profileId) {
    await api.deleteProfile(profileId);
    setProfiles(prev => prev.filter(p => p.id !== profileId));
    if (activeProfile?.id === profileId) {
      const remaining = profiles.filter(p => p.id !== profileId);
      selectProfile(remaining[0] || null);
    }
  }

  function updateUserPlan(newPlan) {
    if (user) {
      setUser(prev => ({ ...prev, plan: newPlan }));
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profiles,
        activeProfile,
        loading,
        login,
        loginWithDemo,
        loginWithAdmin,
        register,
        logout,
        selectProfile,
        addProfile,
        removeProfile,
        updateUserPlan
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

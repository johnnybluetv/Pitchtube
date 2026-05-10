/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import { PitchFeed } from './components/feed/PitchFeed';
import { IntrestorFeed } from './components/intrestor/IntrestorFeed';
import DashboardPage from './DashboardPage';
import OnboardingPage from './OnboardingPage';
import InvestorDashboardPage from './InvestorDashboardPage';
import ProfilePage from './ProfilePage';
import LoginPage from './LoginPage';
import AdminPortal from './AdminPortal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CharityEarthButton } from './components/CharityEarthButton';
import { ViewportProvider } from './components/shared/ViewportSimulator';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, profile } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative z-[999]">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <div className="absolute mt-24 text-zinc-500 font-mono text-[10px] uppercase tracking-widest animate-pulse">Synchronizing Neural Net...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Handle onboarding redirect
  if (profile && !profile.onboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Prevent onboarded users from seeing onboarding again
  if (profile && profile.onboarded && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <ViewportProvider>
        <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route 
                path="/onboarding" 
                element={
                  <PrivateRoute>
                    <OnboardingPage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/profile/:userId" 
                element={
                  <PrivateRoute>
                    <ProfilePage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/investor" 
                element={
                  <PrivateRoute>
                    <DashboardLayout 
                      leftPane={<PitchFeed />} 
                      rightPane={<IntrestorFeed />}
                    >
                      <InvestorDashboardPage />
                    </DashboardLayout>
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <PrivateRoute>
                    <AdminPortal />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/" 
                element={
                  <PrivateRoute>
                    <DashboardLayout 
                      leftPane={<PitchFeed />} 
                      rightPane={<IntrestorFeed />}
                    >
                      <DashboardPage />
                    </DashboardLayout>
                  </PrivateRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
      </ViewportProvider>
    </AuthProvider>
  );
}

import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Gate from './pages/Gate'
import Threshold from './pages/Threshold'
import Introduction from './pages/Introduction'
import Journal from './pages/Journal'
import Balance from './pages/Balance'
import Record from './pages/Record'
import Meditate from './pages/Meditate'
import Lifeline from './pages/Lifeline'
import Settings from './pages/Settings'

function AppRoutes() {
  const { isUnlocked, isLoading, profile, checkVault } = useAuth()

  useEffect(() => {
    checkVault()
  }, [checkVault])

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-shadow-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-400" />
      </div>
    )
  }

  // Not unlocked → show The Gate
  if (!isUnlocked) {
    return <Gate />
  }

  // Unlocked but no profile → show The Threshold (path selection)
  if (!profile) {
    return (
      <Routes>
        <Route path="/threshold" element={<Threshold />} />
        <Route path="*" element={<Navigate to="/threshold" replace />} />
      </Routes>
    )
  }

  // Has profile but hasn't completed onboarding → show Introduction
  if (!profile.hasCompletedOnboarding) {
    return (
      <Routes>
        <Route path="/introduction" element={<Introduction />} />
        <Route path="*" element={<Navigate to="/introduction" replace />} />
      </Routes>
    )
  }

  // Fully set up → main app
  return (
    <Layout>
      <Routes>
        <Route path="/journal" element={<Journal />} />
        <Route path="/balance" element={<Balance />} />
        <Route path="/record" element={<Record />} />
        <Route path="/meditate" element={<Meditate />} />
        <Route path="/lifeline" element={<Lifeline />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/journal" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

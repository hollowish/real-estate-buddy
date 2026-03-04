import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import SignupPage from './auth/SignupPage'
import HomePage from './pages/HomePage'
import ListingsPage from './components/listings/ListingsPage'
import ListingDetail from './components/listings/ListingDetail'
import AddListingForm from './components/listings/AddListingForm'
import ProfilePage from './components/auth/ProfilePage'
import Navbar from './components/shared/Navbar'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/listings" element={
            <ProtectedRoute><ListingsPage /></ProtectedRoute>
          } />
          <Route path="/listings/new" element={
            <ProtectedRoute><AddListingForm /></ProtectedRoute>
          } />
          <Route path="/listings/:id" element={
            <ProtectedRoute><ListingDetail /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/listings" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

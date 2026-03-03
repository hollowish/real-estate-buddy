import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import LoginPage from './auth/LoginPage'
import SignupPage from './auth/SignupPage'
import ListingsPage from './components/listings/ListingsPage'
import ListingDetail from './components/listings/ListingDetail'
import AddListingForm from './components/listings/AddListingForm'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/" element={<Navigate to="/listings" replace />} />
          <Route path="/listings" element={
            <ProtectedRoute><ListingsPage /></ProtectedRoute>
          } />
          <Route path="/listings/new" element={
            <ProtectedRoute><AddListingForm /></ProtectedRoute>
          } />
          <Route path="/listings/:id" element={
            <ProtectedRoute><ListingDetail /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/listings" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

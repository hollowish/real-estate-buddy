import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import Layout from './components/shared/Layout'
import LoginPage from './auth/LoginPage'
import SignupPage from './auth/SignupPage'
import HomePage from './pages/HomePage'
import ListingsPage from './components/listings/ListingsPage'
import ListingDetail from './components/listings/ListingDetail'
import AddListingForm from './components/listings/AddListingForm'
import EditListingForm from './components/listings/EditListingForm'
import ProfilePage from './components/auth/ProfilePage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/listings" element={
            <ProtectedRoute><Layout><ListingsPage /></Layout></ProtectedRoute>
          } />
          <Route path="/listings/new" element={
            <ProtectedRoute><Layout><AddListingForm /></Layout></ProtectedRoute>
          } />
          <Route path="/listings/:id" element={
            <ProtectedRoute><Layout><ListingDetail /></Layout></ProtectedRoute>
          } />
          <Route path="/listings/:id/edit" element={
            <ProtectedRoute><Layout><EditListingForm /></Layout></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/listings" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

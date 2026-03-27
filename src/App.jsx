import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login/Login";
import CreateAccount from "./pages/CreateAccount/CreateAccount";
import Dashboard from "./pages/Dashboard/Dashboard";
import Masters from "./pages/Masters/Masters";
import UsersDept from "./pages/Masters/UsersDept/UsersDept";
import SalesContact from "./pages/Masters/SalesContact/SalesContact";
import Customer from "./pages/Masters/Customer/Customer";
import Buyer from './pages/Masters/Buyer/Buyer';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public routes */}
          <Route path="/login"          element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />

          <Route path="/masters" element={
            <ProtectedRoute><Masters /></ProtectedRoute>
          } />

          <Route path="/masters/users-dept" element={
            <ProtectedRoute><UsersDept /></ProtectedRoute>
          } />

          <Route path="/masters/sales-contact" element={
            <ProtectedRoute><SalesContact /></ProtectedRoute>
          } />

          <Route path="/masters/customer" element={
            <ProtectedRoute><Customer /></ProtectedRoute>
          } />

<Route path="/masters/buyer" element={
  <ProtectedRoute><Buyer /></ProtectedRoute>
} />

          {/* Future module routes */}
          {/* <Route path="/masters/buyer"            element={<ProtectedRoute><Buyer /></ProtectedRoute>} /> */}
          {/* <Route path="/masters/country"          element={<ProtectedRoute><Country /></ProtectedRoute>} /> */}
          {/* <Route path="/masters/product"          element={<ProtectedRoute><Product /></ProtectedRoute>} /> */}
          {/* <Route path="/enquiry"                  element={<ProtectedRoute><Enquiry /></ProtectedRoute>} /> */}
          {/* <Route path="/technical-offer"          element={<ProtectedRoute><TechnicalOffer /></ProtectedRoute>} /> */}
          {/* <Route path="/price-offer"              element={<ProtectedRoute><PriceOffer /></ProtectedRoute>} /> */}
          {/* <Route path="/approval"                 element={<ProtectedRoute><Approval /></ProtectedRoute>} /> */}
          {/* <Route path="/price-upload"             element={<ProtectedRoute><PriceUpload /></ProtectedRoute>} /> */}

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
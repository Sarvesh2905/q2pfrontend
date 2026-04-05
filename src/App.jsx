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
import Buyer from "./pages/Masters/Buyer/Buyer";
import Country from "./pages/Masters/Country/Country";
import Product from "./pages/Masters/Product/Product";
import Price from "./pages/Masters/Price/Price";
import GEReference from "./pages/Masters/GEReference/GEReference";
import Discount from "./pages/Masters/Discount/Discount";
import SpclDiscount from "./pages/Masters/SpclDiscount/SpclDiscount";
import EndIndustry from "./pages/Masters/EndIndustry/EndIndustry";
import CustomerType from "./pages/Masters/CustomerType/CustomerType";
import StatusMaster from "./pages/Masters/StatusMaster/StatusMaster";
import Reason from "./pages/Masters/Reason/Reason";
import TimelineTarget from "./pages/Masters/TimelineTarget/TimelineTarget";
import CostPrice from "./pages/Masters/CostPrice/CostPrice";
import EnquiryHome from "./pages/Enquiry/EnquiryHome";
import AddEnquiry from "./pages/Enquiry/AddEnquiry/AddEnquiry";
import EnquiryRegister from "./pages/Enquiry/EnquiryRegister/EnquiryRegister";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />

          {/* Protected routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/masters" element={<ProtectedRoute><Masters /></ProtectedRoute>} />
          <Route path="/masters/users-dept" element={<ProtectedRoute><UsersDept /></ProtectedRoute>} />
          <Route path="/masters/sales-contact" element={<ProtectedRoute><SalesContact /></ProtectedRoute>} />
          <Route path="/masters/customer" element={<ProtectedRoute><Customer /></ProtectedRoute>} />
          <Route path="/masters/buyer" element={<ProtectedRoute><Buyer /></ProtectedRoute>} />
          <Route path="/masters/country" element={<ProtectedRoute><Country /></ProtectedRoute>} />
          <Route path="/masters/product" element={<ProtectedRoute><Product /></ProtectedRoute>} />
          <Route path="/masters/price" element={<ProtectedRoute><Price /></ProtectedRoute>} />
          <Route path="/masters/ge-reference" element={<ProtectedRoute><GEReference /></ProtectedRoute>} />
          <Route path="/masters/discount" element={<ProtectedRoute><Discount /></ProtectedRoute>} />
          <Route path="/masters/special-discount" element={<ProtectedRoute><SpclDiscount /></ProtectedRoute>} />
          <Route path="/masters/end-industry" element={<ProtectedRoute><EndIndustry /></ProtectedRoute>} />
          <Route path="/masters/customer-type" element={<ProtectedRoute><CustomerType /></ProtectedRoute>} />
          <Route path="/masters/status" element={<ProtectedRoute><StatusMaster /></ProtectedRoute>} />
          <Route path="/masters/reason" element={<ProtectedRoute><Reason /></ProtectedRoute>} />
          <Route path="/masters/timeline-target" element={<ProtectedRoute><TimelineTarget /></ProtectedRoute>} />
          <Route path="/masters/cost-price" element={<ProtectedRoute><CostPrice /></ProtectedRoute>} />

          {/* ── Enquiry ── */}
          <Route path="/enquiry" element={<ProtectedRoute><EnquiryHome /></ProtectedRoute>} />
          <Route path="/enquiry/register" element={<ProtectedRoute><EnquiryRegister /></ProtectedRoute>} />
          <Route path="/enquiry/add" element={<ProtectedRoute><AddEnquiry /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
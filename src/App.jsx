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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/masters"
            element={
              <ProtectedRoute>
                <Masters />
              </ProtectedRoute>
            }
          />

          {/* Future module routes — add here as we build them */}
          {/* <Route path="/enquiry"        element={<ProtectedRoute><Enquiry /></ProtectedRoute>} /> */}
          {/* <Route path="/technical-offer" element={<ProtectedRoute><TechnicalOffer /></ProtectedRoute>} /> */}
          {/* <Route path="/price-offer"    element={<ProtectedRoute><PriceOffer /></ProtectedRoute>} /> */}
          {/* <Route path="/approval"       element={<ProtectedRoute><Approval /></ProtectedRoute>} /> */}
          {/* <Route path="/price-upload"   element={<ProtectedRoute><PriceUpload /></ProtectedRoute>} /> */}

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.jpg";
import "./DashboardNavbar.css";

const DashboardNavbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="dash-navbar">
      {/* Left */}
      <div className="dash-nav-left">
        <span className="dash-brand">CircorFlow</span>
      </div>

      {/* Center */}
      <div className="dash-nav-center">
        <span className="dash-system">Q2P System</span>
        {user && (
          <span className="dash-welcome">
            Welcome,&nbsp;<strong>{user.First_name}</strong>
            <span className="dash-role-chip">({user.role})</span>
          </span>
        )}
      </div>

      {/* Right */}
      <div className="dash-nav-right">
        <img src={logo} alt="Circor" className="dash-logo" />
        <button
          className="dash-icon-btn"
          onClick={() => navigate("/dashboard")}
          title="Home"
        >
          <i className="bi bi-house-fill"></i>
        </button>
        <button
          className="dash-icon-btn dash-logout-btn"
          onClick={handleLogout}
          title="Logout"
        >
          <i className="bi bi-box-arrow-right"></i>
        </button>
      </div>
    </nav>
  );
};

export default DashboardNavbar;

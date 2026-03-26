import React from "react";
import logo from "../../assets/logo.jpg";
import "./AuthNavbar.css";

const AuthNavbar = () => (
  <nav className="auth-navbar">
    <div className="auth-nav-left">
      <span className="auth-brand">CircorFlow</span>
    </div>
    <div className="auth-nav-center">
      <span className="auth-system">Q2P System</span>
    </div>
    <div className="auth-nav-right">
      <img src={logo} alt="Circor" className="auth-logo" />
    </div>
  </nav>
);

export default AuthNavbar;

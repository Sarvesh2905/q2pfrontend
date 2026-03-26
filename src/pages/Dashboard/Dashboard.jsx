import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import { useAuth } from "../../context/AuthContext";
import "./Dashboard.css";

const modules = [
  {
    icon: "bi-sliders",
    label: "Masters",
    desc: "Manage all master data — customers, products, pricing & more",
    route: "/masters",
    active: true,
    color: "#8B0000",
  },
  {
    icon: "bi-file-earmark-text",
    label: "Enquiry",
    desc: "Create and track customer RFQs with revision history",
    route: "/enquiry",
    active: false,
    color: "#1a5276",
  },
  {
    icon: "bi-tools",
    label: "Technical Offer",
    desc: "Manage technical proposals and line items",
    route: "/technical-offer",
    active: false,
    color: "#784212",
  },
  {
    icon: "bi-currency-dollar",
    label: "Price Offer",
    desc: "Handle commercial pricing, discounts and approvals",
    route: "/price-offer",
    active: false,
    color: "#145a32",
  },
  {
    icon: "bi-check2-circle",
    label: "Approval",
    desc: "Approve or reject technical and price offers",
    route: "/approval",
    active: false,
    color: "#4a235a",
  },
  {
    icon: "bi-cloud-upload",
    label: "Price Upload",
    desc: "Upload LTSA and standard price lists with validation",
    route: "/price-upload",
    active: false,
    color: "#1b4f72",
  },
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="dash-page">
      <DashboardNavbar />
      <div className="dash-body">
        {/* Welcome Banner */}
        <div className="welcome-banner">
          <div className="banner-icon-wrap">
            <i className="bi bi-grid-3x3-gap-fill"></i>
          </div>
          <div className="banner-text">
            <h2 className="banner-heading">
              Welcome,&nbsp;
              <span className="name-hl">
                {user?.First_name} {user?.Last_name}
              </span>
            </h2>
            <p className="banner-sub">
              <span className="role-pill">{user?.role}</span>
              <span className="banner-divider">·</span>
              <i className="bi bi-geo-alt me-1"></i>
              {user?.site}
              <span className="banner-divider">·</span>
              <i className="bi bi-envelope me-1"></i>
              {user?.username}
            </p>
          </div>
        </div>

        {/* Modules */}
        <div className="section-header">
          <i className="bi bi-grid me-2"></i>
          <span>Modules</span>
          <span className="module-count">{modules.length} modules</span>
        </div>

        <div className="row g-3">
          {modules.map((mod, i) => (
            <div className="col-xl-4 col-md-6 col-sm-12" key={i}>
              <div
                className={`mod-card ${mod.active ? "mod-active" : "mod-disabled"}`}
                onClick={() => mod.active && navigate(mod.route)}
                style={mod.active ? { "--mod-color": mod.color } : {}}
              >
                {/* Number Badge */}
                <span className="mod-number">
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Icon */}
                <div
                  className="mod-icon-wrap"
                  style={mod.active ? { background: mod.color } : {}}
                >
                  <i className={`bi ${mod.icon}`}></i>
                </div>

                {/* Info */}
                <div className="mod-info">
                  <h6 className="mod-label">{mod.label}</h6>
                  <p className="mod-desc">{mod.desc}</p>
                </div>

                {/* Status */}
                {mod.active ? (
                  <div className="mod-go">
                    <i className="bi bi-arrow-right-circle-fill"></i>
                  </div>
                ) : (
                  <span className="soon-badge">
                    <i className="bi bi-clock me-1"></i>Soon
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

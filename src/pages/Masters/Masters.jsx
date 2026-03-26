import React from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import "./Masters.css";

const subMasters = [
  {
    icon: "bi-people-fill",
    label: "Users Dept",
    desc: "Manage department users",
    route: "/masters/users-dept",
  },
  {
    icon: "bi-person-badge-fill",
    label: "Sales Contact",
    desc: "Manage sales contacts",
    route: "/masters/sales-contact",
  },
  {
    icon: "bi-building",
    label: "Customer",
    desc: "Manage customer records",
    route: "/masters/customer",
  },
  {
    icon: "bi-person-rolodex",
    label: "Buyer",
    desc: "Manage buyer information",
    route: "/masters/buyer",
  },
  {
    icon: "bi-globe2",
    label: "Country",
    desc: "Manage countries & currencies",
    route: "/masters/country",
  },
  {
    icon: "bi-box-seam-fill",
    label: "Product",
    desc: "Manage product catalogue",
    route: "/masters/product",
  },
  {
    icon: "bi-tags-fill",
    label: "Price",
    desc: "Manage standard price list",
    route: "/masters/price",
  },
  {
    icon: "bi-arrow-left-right",
    label: "GE Reference",
    desc: "Manage part number references",
    route: "/masters/ge-reference",
  },
  {
    icon: "bi-percent",
    label: "Discount",
    desc: "Manage discount configurations",
    route: "/masters/discount",
  },
  {
    icon: "bi-gift-fill",
    label: "Special Discount",
    desc: "Manage special discount entries",
    route: "/masters/special-discount",
  },
  {
    icon: "bi-factory",
    label: "End Industry",
    desc: "Manage end industry segments",
    route: "/masters/end-industry",
  },
  {
    icon: "bi-diagram-3-fill",
    label: "Customer Type",
    desc: "Manage customer type categories",
    route: "/masters/customer-type",
  },
  {
    icon: "bi-toggles",
    label: "Status",
    desc: "Manage status definitions",
    route: "/masters/status",
  },
  {
    icon: "bi-chat-left-text-fill",
    label: "Reason",
    desc: "Manage reason codes",
    route: "/masters/reason",
  },
  {
    icon: "bi-stopwatch-fill",
    label: "Timeline Target",
    desc: "Manage stage timeline targets",
    route: "/masters/timeline-target",
  },
  {
    icon: "bi-calculator-fill",
    label: "Cost Price",
    desc: "Manage cost price data",
    route: "/masters/cost-price",
  },
  {
    icon: "bi-shield-lock-fill",
    label: "Privileges",
    desc: "Manage role-based access rights",
    route: "/masters/privileges",
  },
];

const Masters = () => {
  const navigate = useNavigate();

  return (
    <div className="masters-page">
      <DashboardNavbar />
      <div className="masters-body">
        {/* Breadcrumb */}
        <nav className="m-breadcrumb" aria-label="breadcrumb">
          <span className="bc-link" onClick={() => navigate("/dashboard")}>
            <i className="bi bi-house-fill me-1"></i>Dashboard
          </span>
          <i className="bi bi-chevron-right bc-sep"></i>
          <span className="bc-active">Masters</span>
        </nav>

        {/* Header */}
        <div className="masters-header">
          <div className="masters-header-icon">
            <i className="bi bi-sliders"></i>
          </div>
          <div>
            <h3 className="masters-title">Masters Module</h3>
            <p className="masters-subtitle">
              Select a sub-master to view and manage its data
            </p>
          </div>
          <span className="masters-count">{subMasters.length} sub-masters</span>
        </div>

        {/* Sub-Master Grid */}
        <div className="row g-3">
          {subMasters.map((sm, i) => (
            <div className="col-xl-3 col-lg-4 col-md-6 col-sm-6" key={i}>
              <div
                className="sm-card"
                onClick={() => navigate(sm.route)}
                title={sm.label}
              >
                {/* Serial */}
                <span className="sm-serial">
                  {String(i + 1).padStart(2, "0")}
                </span>

                {/* Icon */}
                <div className="sm-icon-wrap">
                  <i className={`bi ${sm.icon}`}></i>
                </div>

                {/* Text */}
                <div className="sm-info">
                  <h6 className="sm-label">{sm.label}</h6>
                  <p className="sm-desc">{sm.desc}</p>
                </div>

                {/* Arrow */}
                <div className="sm-arrow">
                  <i className="bi bi-arrow-right"></i>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Masters;

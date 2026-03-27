import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../../components/DashboardNavbar/DashboardNavbar";
import api from "../../services/api";
import "./Masters.css";

const Masters = () => {
  const navigate = useNavigate();

  const [deptCounts, setDeptCounts] = useState({ active: 0, inactive: 0 });
  const [salesCounts, setSalesCounts] = useState({ active: 0, inactive: 0 });
  const [custCounts, setCustCounts] = useState({ active: 0, inactive: 0 });
  const [buyerCounts, setBuyerCounts] = useState({ active: 0, inactive: 0 });
  const [countryCounts, setCountryCounts] = useState({
    active: 0,
    inactive: 0,
  });

  useEffect(() => {
    api
      .get("/dept-users", { params: { page: 1, pageSize: 10000 } })
      .then((res) => {
        const data = res.data.data || [];
        setDeptCounts({
          active: data.filter((r) => r.status === "Active").length,
          inactive: data.filter((r) => r.status !== "Active").length,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api
      .get("/sales-contacts")
      .then((res) => {
        const data = res.data.data || [];
        setSalesCounts({
          active: data.filter((r) => r.status === "Active").length,
          inactive: data.filter((r) => r.status !== "Active").length,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api
      .get("/customers")
      .then((res) => {
        const data = res.data.data || [];
        setCustCounts({
          active: data.filter((r) => r.status === "Active").length,
          inactive: data.filter((r) => r.status !== "Active").length,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api
      .get("/buyers")
      .then((res) => {
        const data = res.data.data || [];
        setBuyerCounts({
          active: data.filter((r) => r.status === "Active").length,
          inactive: data.filter((r) => r.status !== "Active").length,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    api
      .get("/countries")
      .then((res) => {
        const data = res.data.data || [];
        setCountryCounts({
          active: data.filter((r) => r.status === "Active").length,
          inactive: data.filter((r) => r.status !== "Active").length,
        });
      })
      .catch(() => {});
  }, []);

  const subMasters = [
    {
      icon: "bi-people-fill",
      label: "Users Dept",
      desc: "Manage department users",
      route: "/masters/users-dept",
      counts: deptCounts,
    },
    {
      icon: "bi-person-badge-fill",
      label: "Sales Contact",
      desc: "Manage sales contacts",
      route: "/masters/sales-contact",
      counts: salesCounts,
    },
    {
      icon: "bi-building",
      label: "Customer",
      desc: "Manage customer records",
      route: "/masters/customer",
      counts: custCounts,
    },
    {
      icon: "bi-person-rolodex",
      label: "Buyer",
      desc: "Manage buyer information",
      route: "/masters/buyer",
      counts: buyerCounts,
    },
    {
      icon: "bi-globe2",
      label: "Country",
      desc: "Manage countries & currencies",
      route: "/masters/country",
      counts: countryCounts,
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
                <span className="sm-serial">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="sm-icon-wrap">
                  <i className={`bi ${sm.icon}`}></i>
                </div>

                <div className="sm-info">
                  <h6 className="sm-label">{sm.label}</h6>
                  <p className="sm-desc">{sm.desc}</p>

                  {sm.counts && (
                    <div className="sm-counts">
                      <span className="sm-count-active">
                        <i className="bi bi-circle-fill me-1"></i>
                        Active: {sm.counts.active}
                      </span>
                      <span className="sm-count-inactive">
                        <i className="bi bi-circle-fill me-1"></i>
                        Inactive: {sm.counts.inactive}
                      </span>
                    </div>
                  )}
                </div>

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

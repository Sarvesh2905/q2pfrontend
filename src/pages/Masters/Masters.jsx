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
  const [productCounts, setProductCounts] = useState({
    active: 0,
    inactive: 0,
  });
  const [geRefCounts, setGeRefCounts] = useState({ active: 0, inactive: 0 });
  const [spclDiscountCounts, setSpclDiscountCounts] = useState({
    active: 0,
    inactive: 0,
  });
  const [custTypeCounts, setCustTypeCounts] = useState({
    active: 0,
    inactive: 0,
  });
  const [statusMasterCounts, setStatusMasterCounts] = useState({
    active: 0,
    inactive: 0,
  });
  const [costPriceCounts, setCostPriceCounts] = useState({
    active: 0,
    inactive: 0,
  }); // ← NEW

  /* ── Users Dept ── */
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

  /* ── Sales Contact ── */
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

  /* ── Customer ── */
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

  /* ── Buyer ── */
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

  /* ── Country ── */
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

  /* ── Product ── */
  useEffect(() => {
    api
      .get("/products")
      .then((res) => {
        const data = res.data.data || [];
        setProductCounts({
          active: data.filter((r) => r.status === "Active").length,
          inactive: data.filter((r) => r.status !== "Active").length,
        });
      })
      .catch(() => {});
  }, []);

  /* ── GE Reference ── */
  useEffect(() => {
    api
      .get("/ge-references")
      .then((res) => {
        const data = res.data.data || [];
        setGeRefCounts({
          active: data.filter((r) => r.status === "Active").length,
          inactive: data.filter((r) => r.status !== "Active").length,
        });
      })
      .catch(() => {});
  }, []);

  /* ── Special Discount ── */
  useEffect(() => {
    api
      .get("/spcl-discounts")
      .then((res) => {
        const data = res.data.data || [];
        setSpclDiscountCounts({
          active: data.filter((r) => r.status === "Active").length,
          inactive: data.filter((r) => r.status !== "Active").length,
        });
      })
      .catch(() => {});
  }, []);

  /* ── Customer Type ── */
  useEffect(() => {
    api
      .get("/customer-types")
      .then((res) => {
        const data = res.data.data || [];
        setCustTypeCounts({
          active: data.filter((r) => r.Status === "Active").length,
          inactive: data.filter((r) => r.Status !== "Active").length,
        });
      })
      .catch(() => {});
  }, []);

  /* ── Status Master ── */
  useEffect(() => {
    api
      .get("/status-master")
      .then((res) => {
        const data = res.data.data || [];
        setStatusMasterCounts({
          active: data.filter((r) => r.Status === "Active").length,
          inactive: data.filter((r) => r.Status !== "Active").length,
        });
      })
      .catch(() => {});
  }, []);

  /* ── Cost Price ── */
  useEffect(() => {
    api
      .get("/cost-price")
      .then((res) => {
        const data = res.data.data || [];
        setCostPriceCounts({
          active: data.filter((r) => r.status === "Active").length,
          inactive: data.filter((r) => r.status !== "Active").length,
        });
      })
      .catch(() => {});
  }, []);

  /* ── Sub-master definitions ── */
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
      counts: productCounts,
    },
    {
      icon: "bi-tags-fill",
      label: "Price",
      desc: "Manage standard price list",
      route: "/masters/price",
      // no status counts — Price master has no simple status toggle
    },
    {
      icon: "bi-arrow-left-right",
      label: "GE Reference",
      desc: "Manage part number references",
      route: "/masters/ge-reference",
      counts: geRefCounts,
    },
    {
      icon: "bi-percent",
      label: "Discount",
      desc: "Manage discount configurations",
      route: "/masters/discount",
      // no status counts
    },
    {
      icon: "bi-gift-fill",
      label: "Special Discount",
      desc: "Manage special discount entries",
      route: "/masters/special-discount",
      counts: spclDiscountCounts,
    },
    {
      icon: "bi-factory",
      label: "End Industry",
      desc: "Manage end industry segments",
      route: "/masters/end-industry",
      // no status counts
    },
    {
      icon: "bi-diagram-3-fill",
      label: "Customer Type",
      desc: "Manage customer type categories",
      route: "/masters/customer-type",
      counts: custTypeCounts,
    },
    {
      icon: "bi-toggles",
      label: "Status",
      desc: "Manage status definitions",
      route: "/masters/status",
      counts: statusMasterCounts,
    },
    {
      icon: "bi-chat-left-text-fill",
      label: "Reason",
      desc: "Manage reason codes",
      route: "/masters/reason",
      // no status — reason master has no status column
    },
    {
      icon: "bi-stopwatch-fill",
      label: "Timeline Target",
      desc: "Manage stage timeline targets",
      route: "/masters/timeline-target",
      // no status — timeline_target has no status column
    },
    {
      icon: "bi-calculator-fill",
      label: "Cost Price",
      desc: "Manage cost price data",
      route: "/masters/cost-price",
      counts: costPriceCounts, // ← NEW
    },
    {
      icon: "bi-shield-lock-fill",
      label: "Privileges",
      desc: "Manage role-based access rights",
      route: "/masters/privileges",
      // no status counts
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

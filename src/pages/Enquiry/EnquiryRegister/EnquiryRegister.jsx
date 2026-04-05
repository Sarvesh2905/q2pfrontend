import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../../../components/DashboardNavbar/DashboardNavbar";
import api from "../../../services/api";
import "./EnquiryRegister.css";

/* ── helpers ── */
const fmt = (val) => (val == null || val === "" ? "—" : val);

const STAGE_BADGE = {
  "enquiry":         "eq-badge-enquiry",
  "technical offer": "eq-badge-technical",
  "priced offer":    "eq-badge-priced",
  "price book order":"eq-badge-pbo",
  "regret":          "eq-badge-regret",
  "cancelled":       "eq-badge-cancelled",
};
const stageBadge = (s) =>
  STAGE_BADGE[(s || "").toLowerCase()] || "eq-badge-default";

const PROB_CLASS = {
  high:   "eq-prob-high",
  medium: "eq-prob-medium",
  low:    "eq-prob-low",
};

const PRI_CLASS = {
  high:   "eq-pri-high",
  medium: "eq-pri-medium",
  low:    "eq-pri-low",
};

/* ══════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════ */
export default function EnquiryRegister() {
  const navigate = useNavigate();

  const [rows, setRows]             = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(false);
  const [filterOpts, setFilterOpts] = useState({
    ae: [], sales: [], quote_stage: [], opp_stage: [], product: [], priority: [],
  });

  const [filters, setFilters] = useState({
    ae: "", sales: "", product: "", quote_stage: "",
    opp_stage: "", priority: "", search: "",
    date_from: "", date_to: "",
  });
  const [activeFilters, setActiveFilters] = useState({ ...filters });

  /* ── Load filter dropdown options once ── */
  useEffect(() => {
    api.get("/enquiry/register/filters")
      .then((r) => setFilterOpts(r.data))
      .catch(() => {});
  }, []);

  /* ── Fetch table data ── */
  const fetchData = useCallback(async (params) => {
    setLoading(true);
    try {
      const res = await api.get("/enquiry/register", { params });
      setRows(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData({}); }, [fetchData]);

  /* ── Filter handlers ── */
  const handleFilterChange = (key, val) =>
    setFilters((prev) => ({ ...prev, [key]: val }));

  const applyFilters = () => {
    setActiveFilters({ ...filters });
    fetchData(filters);
  };

  const clearFilters = () => {
    const empty = {
      ae: "", sales: "", product: "", quote_stage: "",
      opp_stage: "", priority: "", search: "", date_from: "", date_to: "",
    };
    setFilters(empty);
    setActiveFilters(empty);
    fetchData({});
  };

  const hasActiveFilter = Object.values(activeFilters).some((v) => v !== "");

  /* ── Download CSV ── */
  const handleDownload = async () => {
    try {
      const res = await api.get("/enquiry/register/download", {
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data]));
      const a   = document.createElement("a");
      a.href    = url;
      a.download = "enquiry_register.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Download failed");
    }
  };

  /* ══════════════════════
     RENDER
  ══════════════════════ */
  return (
    <div className="eq-page">
      <DashboardNavbar />
      <div className="eq-body">

        {/* ── Breadcrumb ── */}
        <div className="eq-breadcrumb">
          <span className="eq-crumb-link" onClick={() => navigate("/dashboard")}>
            <i className="bi bi-house-fill me-1"></i>Dashboard
          </span>
          <span className="eq-crumb-sep">/</span>
          <span className="eq-crumb-active">Enquiry Register</span>
        </div>

        {/* ── Header ── */}
        <div className="eq-header">
          <div>
            <h3 className="eq-title">
              <i className="bi bi-table me-2"></i>Enquiry Register
            </h3>
            <p className="eq-subtitle">
              {loading
                ? "Loading..."
                : `${total} record${total !== 1 ? "s" : ""}${hasActiveFilter ? " (filtered)" : ""}`}
            </p>
          </div>
          <div className="eq-header-actions">
            <button
              className="btn eq-btn-add"
              onClick={() => navigate("/enquiry/add")}
            >
              <i className="bi bi-plus-lg me-1"></i>Add Enquiry
            </button>
            <button className="btn eq-btn-download" onClick={handleDownload}>
              <i className="bi bi-download me-1"></i>Download CSV
            </button>
          </div>
        </div>

        {/* ── Filter Bar ── */}
        <div className="eq-filter-bar">
          <div className="eq-filter-row">

            {/* Global search */}
            <div className="eq-filter-field eq-filter-search">
              <label><i className="bi bi-search me-1"></i>Search</label>
              <input
                type="text"
                className="form-control eq-input"
                placeholder="Quote No, Customer, End User, Project, RFQ Ref..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              />
            </div>

            {/* App Engineer */}
            <div className="eq-filter-field">
              <label>App_Engineer</label>
              <select
                className="form-select eq-input"
                value={filters.ae}
                onChange={(e) => handleFilterChange("ae", e.target.value)}
              >
                <option value="">All</option>
                {filterOpts.ae.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Sales Contact */}
            <div className="eq-filter-field">
              <label>Sales_Contact</label>
              <select
                className="form-select eq-input"
                value={filters.sales}
                onChange={(e) => handleFilterChange("sales", e.target.value)}
              >
                <option value="">All</option>
                {filterOpts.sales.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Product */}
            <div className="eq-filter-field">
              <label>Product</label>
              <select
                className="form-select eq-input"
                value={filters.product}
                onChange={(e) => handleFilterChange("product", e.target.value)}
              >
                <option value="">All</option>
                {filterOpts.product.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Quote Stage */}
            <div className="eq-filter-field">
              <label>Quote_Stage</label>
              <select
                className="form-select eq-input"
                value={filters.quote_stage}
                onChange={(e) => handleFilterChange("quote_stage", e.target.value)}
              >
                <option value="">All</option>
                {filterOpts.quote_stage.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Opp Stage */}
            <div className="eq-filter-field">
              <label>Opp_Stage</label>
              <select
                className="form-select eq-input"
                value={filters.opp_stage}
                onChange={(e) => handleFilterChange("opp_stage", e.target.value)}
              >
                <option value="">All</option>
                {filterOpts.opp_stage.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="eq-filter-field">
              <label>Priority</label>
              <select
                className="form-select eq-input"
                value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}
              >
                <option value="">All</option>
                {filterOpts.priority.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div className="eq-filter-field">
              <label>Quote_Date From</label>
              <input
                type="date"
                className="form-control eq-input"
                value={filters.date_from}
                onChange={(e) => handleFilterChange("date_from", e.target.value)}
              />
            </div>

            {/* Date To */}
            <div className="eq-filter-field">
              <label>Quote_Date To</label>
              <input
                type="date"
                className="form-control eq-input"
                value={filters.date_to}
                onChange={(e) => handleFilterChange("date_to", e.target.value)}
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="eq-filter-actions">
            <button className="btn eq-btn-apply" onClick={applyFilters}>
              <i className="bi bi-funnel-fill me-1"></i>Apply
            </button>
            <button
              className="btn eq-btn-clear"
              onClick={clearFilters}
              disabled={!hasActiveFilter}
            >
              <i className="bi bi-x-circle me-1"></i>Clear
            </button>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="eq-table-wrapper">
          {loading ? (
            <div className="eq-loading">
              <div
                className="spinner-border text-danger"
                style={{ width: "2rem", height: "2rem" }}
              ></div>
              <span>Loading enquiries...</span>
            </div>
          ) : rows.length === 0 ? (
            <div className="eq-empty">
              <i className="bi bi-inbox"></i>
              <p>No enquiries found{hasActiveFilter ? " for the selected filters" : ""}.</p>
              {hasActiveFilter && (
                <button className="btn eq-btn-clear mt-2" onClick={clearFilters}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <table className="eq-table">
              <thead>
                <tr>
                  {/* ── Exact column names from company HTML ── */}
                  <th>Sno</th>
                  <th>App_Engineer</th>
                  <th>Sales_Contact</th>
                  <th>Quote_Number</th>
                  <th>Quote_Date</th>
                  <th>Price'K</th>
                  <th>Customer</th>
                  <th>End_User</th>
                  <th>Product</th>
                  <th>Project</th>
                  <th>Cust_Due_Date</th>
                  <th>Probability</th>
                  <th>Quote_Stage</th>
                  <th>Category</th>
                  <th>Opp_Stage</th>
                  <th>Rev</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.Quote_number || i}>
                    {/* Sno — actual DB value */}
                    <td className="eq-td-center eq-td-muted">{row.Sno}</td>
                    <td>{fmt(row.ae_name)}</td>
                    <td>{fmt(row.Sales_contact)}</td>
                    <td className="eq-td-qno">{fmt(row.Quote_number)}</td>
                    <td className="eq-td-center">{fmt(row.quote_date)}</td>
                    <td className="eq-td-center eq-td-price">
                      {row.price_k > 0 ? row.price_k : "—"}
                    </td>
                    <td>{fmt(row.Customer_name)}</td>
                    <td>{fmt(row.End_user_name)}</td>
                    <td>{fmt(row.Product)}</td>
                    <td>{fmt(row.Project_name)}</td>
                    <td className="eq-td-center">{fmt(row.cust_due_date)}</td>
                    <td className="eq-td-center">
                      {row.probability ? (
                        <span
                          className={`eq-prob ${
                            PROB_CLASS[(row.probability || "").toLowerCase()] || ""
                          }`}
                        >
                          {row.probability}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="eq-td-center">
                      {row.Quote_stage ? (
                        <span className={`eq-badge ${stageBadge(row.Quote_stage)}`}>
                          {row.Quote_stage}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>{fmt(row.category)}</td>
                    <td>{fmt(row.opp_stage)}</td>
                    <td className="eq-td-center">{fmt(row.Rev)}</td>
                    <td className="eq-td-center">
                      {row.Priority ? (
                        <span
                          className={`eq-pri ${
                            PRI_CLASS[(row.Priority || "").toLowerCase()] || ""
                          }`}
                        >
                          {row.Priority}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Row count footer */}
        {!loading && rows.length > 0 && (
          <div className="eq-footer">
            <span>
              Showing <strong>{rows.length}</strong> of{" "}
              <strong>{total}</strong> records
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
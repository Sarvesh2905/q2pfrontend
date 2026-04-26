import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardNavbar from "../../../components/DashboardNavbar/DashboardNavbar";
import api from "../../../services/api";
import "./EnquiryRegister.css";

/* ── helpers ── */
const fmt = (val) => (val == null || val === "" ? "—" : val);

const STAGE_BADGE = {
  "enquiry":          "eq-badge-enquiry",
  "technical offer":  "eq-badge-technical",
  "priced offer":     "eq-badge-priced",
  "price book order": "eq-badge-pbo",
  "regret":           "eq-badge-regret",
  "cancelled":        "eq-badge-cancelled",
};
const stageBadge = (s) =>
  STAGE_BADGE[(s || "").toLowerCase()] || "eq-badge-default";

const PROB_CLASS = { high: "eq-prob-high", medium: "eq-prob-medium", low: "eq-prob-low" };
const PRI_CLASS  = { high: "eq-pri-high",  medium: "eq-pri-medium",  low: "eq-pri-low"  };

const EMPTY_FILTERS = {
  ae: "", sales: "", product: "", quote_stage: "",
  opp_stage: "", priority: "", search: "", date_from: "", date_to: "",
};

export default function EnquiryRegister() {
  const navigate = useNavigate();

  const [allRows, setAllRows] = useState([]);   // full dataset — never mutated
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });

  /* ── Fetch ALL rows once, sorted by Quote_number ── */
  useEffect(() => {
    setLoading(true);
    api.get("/enquiry/register", { params: { limit: 9999 } })
      .then((r) => {
        const data = (r.data.data || []).sort((a, b) =>
          (a.Quote_number || "").localeCompare(b.Quote_number || "")
        );
        setAllRows(data);
      })
      .catch(() => setAllRows([]))
      .finally(() => setLoading(false));
  }, []);

  /* ── Instant client-side filtering ── */
  const rows = useMemo(() => {
    return allRows.filter((row) => {
      const s = filters.search.toLowerCase();
      if (s && ![
        row.Quote_number, row.Customer_name,
        row.End_user_name, row.Project_name, row.rfq_ref,
      ].some((v) => (v || "").toLowerCase().includes(s))) return false;

      if (filters.ae          && row.ae_name       !== filters.ae)          return false;
      if (filters.sales       && row.Sales_contact !== filters.sales)        return false;
      if (filters.product     && row.Product       !== filters.product)      return false;
      if (filters.quote_stage && row.Quote_stage   !== filters.quote_stage)  return false;
      if (filters.opp_stage   && row.opp_stage     !== filters.opp_stage)    return false;
      if (filters.priority    && row.Priority      !== filters.priority)      return false;
      if (filters.date_from   && row.quote_date    <  filters.date_from)     return false;
      if (filters.date_to     && row.quote_date    >  filters.date_to)       return false;

      return true;
    });
  }, [allRows, filters]);

  /* ── Cascading dropdown options ──
     For each field, compute options by filtering allRows with ALL
     other active filters (excluding that field's own filter).
     This way selecting AE010 narrows Sales to only Deepa/Abi etc. ── */
  const getOptions = useCallback(
    (excludeField, rowKey) => {
      const filtered = allRows.filter((row) => {
        if (excludeField !== "ae"          && filters.ae          && row.ae_name       !== filters.ae)          return false;
        if (excludeField !== "sales"       && filters.sales       && row.Sales_contact !== filters.sales)        return false;
        if (excludeField !== "product"     && filters.product     && row.Product       !== filters.product)      return false;
        if (excludeField !== "quote_stage" && filters.quote_stage && row.Quote_stage   !== filters.quote_stage)  return false;
        if (excludeField !== "opp_stage"   && filters.opp_stage   && row.opp_stage     !== filters.opp_stage)    return false;
        if (excludeField !== "priority"    && filters.priority    && row.Priority      !== filters.priority)      return false;
        return true;
      });
      return [...new Set(filtered.map((r) => r[rowKey]).filter(Boolean))].sort();
    },
    [allRows, filters]
  );

  const aeOptions         = useMemo(() => getOptions("ae",          "ae_name"),       [getOptions]);
  const salesOptions      = useMemo(() => getOptions("sales",       "Sales_contact"), [getOptions]);
  const productOptions    = useMemo(() => getOptions("product",     "Product"),       [getOptions]);
  const quoteStageOptions = useMemo(() => getOptions("quote_stage", "Quote_stage"),   [getOptions]);
  const oppStageOptions   = useMemo(() => getOptions("opp_stage",   "opp_stage"),     [getOptions]);
  const priorityOptions   = useMemo(() => getOptions("priority",    "Priority"),      [getOptions]);

  const handleFilterChange = (key, val) =>
    setFilters((prev) => ({ ...prev, [key]: val }));

  const clearFilters = () => setFilters({ ...EMPTY_FILTERS });
  const hasActiveFilter = Object.values(filters).some((v) => v !== "");

  /* ── Download CSV ── */
  const handleDownload = async () => {
    try {
      const res = await api.get("/enquiry/register/download", { responseType: "blob" });
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
                : `${rows.length} record${rows.length !== 1 ? "s" : ""}${hasActiveFilter ? " (filtered)" : ""}`}
            </p>
          </div>
          <div className="eq-header-actions">
            <button className="btn eq-btn-add" onClick={() => navigate("/enquiry/add")}>
              <i className="bi bi-plus-lg me-1"></i>Add Enquiry
            </button>
            <button className="btn eq-btn-download" onClick={handleDownload}>
              <i className="bi bi-download me-1"></i>Download CSV
            </button>
          </div>
        </div>

        {/* ── Filter Bar — NO Apply button ── */}
        <div className="eq-filter-bar">
          <div className="eq-filter-row">

            {/* Global search — instant */}
            <div className="eq-filter-field eq-filter-search">
              <label><i className="bi bi-search me-1"></i>Search</label>
              <input
                type="text"
                className="form-control eq-input"
                placeholder="Quote No, Customer, End User, Project, RFQ Ref..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            {/* App Engineer */}
            <div className="eq-filter-field">
              <label>App_Engineer</label>
              <select className="form-select eq-input" value={filters.ae}
                onChange={(e) => handleFilterChange("ae", e.target.value)}>
                <option value="">All</option>
                {aeOptions.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            {/* Sales Contact — cascades from AE selection */}
            <div className="eq-filter-field">
              <label>Sales_Contact</label>
              <select className="form-select eq-input" value={filters.sales}
                onChange={(e) => handleFilterChange("sales", e.target.value)}>
                <option value="">All</option>
                {salesOptions.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            {/* Product — cascades */}
            <div className="eq-filter-field">
              <label>Product</label>
              <select className="form-select eq-input" value={filters.product}
                onChange={(e) => handleFilterChange("product", e.target.value)}>
                <option value="">All</option>
                {productOptions.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            {/* Quote Stage — cascades */}
            <div className="eq-filter-field">
              <label>Quote_Stage</label>
              <select className="form-select eq-input" value={filters.quote_stage}
                onChange={(e) => handleFilterChange("quote_stage", e.target.value)}>
                <option value="">All</option>
                {quoteStageOptions.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            {/* Opp Stage — cascades */}
            <div className="eq-filter-field">
              <label>Opp_Stage</label>
              <select className="form-select eq-input" value={filters.opp_stage}
                onChange={(e) => handleFilterChange("opp_stage", e.target.value)}>
                <option value="">All</option>
                {oppStageOptions.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            {/* Priority — cascades */}
            <div className="eq-filter-field">
              <label>Priority</label>
              <select className="form-select eq-input" value={filters.priority}
                onChange={(e) => handleFilterChange("priority", e.target.value)}>
                <option value="">All</option>
                {priorityOptions.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            {/* Date From */}
            <div className="eq-filter-field">
              <label>Quote_Date From</label>
              <input type="date" className="form-control eq-input"
                value={filters.date_from}
                onChange={(e) => handleFilterChange("date_from", e.target.value)} />
            </div>

            {/* Date To */}
            <div className="eq-filter-field">
              <label>Quote_Date To</label>
              <input type="date" className="form-control eq-input"
                value={filters.date_to}
                onChange={(e) => handleFilterChange("date_to", e.target.value)} />
            </div>
          </div>

          {/* Only Clear remains — no Apply */}
          <div className="eq-filter-actions">
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
              <div className="spinner-border text-danger"
                style={{ width: "2rem", height: "2rem" }}></div>
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
                        <span className={`eq-prob ${PROB_CLASS[(row.probability || "").toLowerCase()] || ""}`}>
                          {row.probability}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="eq-td-center">
                      {row.Quote_stage ? (
                        <span className={`eq-badge ${stageBadge(row.Quote_stage)}`}>
                          {row.Quote_stage}
                        </span>
                      ) : "—"}
                    </td>
                    <td>{fmt(row.category)}</td>
                    <td>{fmt(row.opp_stage)}</td>
                    <td className="eq-td-center">{fmt(row.Rev)}</td>
                    <td className="eq-td-center">
                      {row.Priority ? (
                        <span className={`eq-pri ${PRI_CLASS[(row.Priority || "").toLowerCase()] || ""}`}>
                          {row.Priority}
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {!loading && rows.length > 0 && (
          <div className="eq-footer">
            <span>
              Showing <strong>{rows.length}</strong> of{" "}
              <strong>{allRows.length}</strong> records
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useCallback, useEffect, useMemo, useState } from "react";
import DashboardNavbar from "../../../components/DashboardNavbar/DashboardNavbar";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import "./TimelineTarget.css";

const PAGE_SIZE = 50;

const NUMERIC_FIELDS = [
  { key: "Enquiry", label: "Enquiry" },
  { key: "Technical_offer", label: "Technical Offer" },
  { key: "Priced_offer", label: "Priced Offer" },
  { key: "Price_book_order", label: "Price Book Order" },
  { key: "Regret", label: "Regret" },
  { key: "Cancelled", label: "Cancelled" },
];

const isValidInt = (val) => /^\d+$/.test(String(val).trim());

const TimelineTarget = () => {
  const { user } = useAuth();
  const role = user?.role || "View-only";
  const canModify = role === "Manager" || role === "Admin";

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [editVals, setEditVals] = useState({});
  const [editErrs, setEditErrs] = useState({});

  const showMsg = (text, type) => {
    setMessage({ text, type });
    if (text) setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/timeline-target");
      setRows(res.data.data || []);
    } catch {
      showMsg("Failed to load timeline targets", "danger");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      [
        r.Sno,
        r.Product,
        r.Enquiry,
        r.Technical_offer,
        r.Priced_offer,
        r.Price_book_order,
        r.Regret,
        r.Cancelled,
      ].some((v) =>
        String(v ?? "")
          .toLowerCase()
          .includes(q),
      ),
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );

  useEffect(() => {
    setPage(1);
  }, [search]);

  const resetForm = () => {
    setSelected(null);
    setShowForm(false);
    setEditVals({});
    setEditErrs({});
    setMessage({ text: "", type: "" });
  };

  const handleRowDoubleClick = (row) => {
    setSelected(row);
    setEditVals({
      Enquiry: String(row.Enquiry),
      Technical_offer: String(row.Technical_offer),
      Priced_offer: String(row.Priced_offer),
      Price_book_order: String(row.Price_book_order),
      Regret: String(row.Regret),
      Cancelled: String(row.Cancelled),
    });
    setEditErrs({});
    setShowForm(true);
    setMessage({ text: "", type: "" });
  };

  const handleFieldChange = (key, val) => {
    setEditVals((prev) => ({ ...prev, [key]: val }));
    setEditErrs((prev) => ({
      ...prev,
      [key]: isValidInt(val) ? "" : "Must be a non-negative whole number",
    }));
  };

  const hasErrors =
    Object.values(editErrs).some((e) => !!e) ||
    NUMERIC_FIELDS.some(
      (f) => editVals[f.key] === "" || editVals[f.key] === undefined,
    );

  /* FIX B2: payload keys are lowercase to match controller destructure:
     const { enquiry, technical_offer, priced_offer,
             price_book_order, regret, cancelled } = req.body
     Sending PascalCase made every field undefined → 400 on every save. */
  const handleEdit = async (ev) => {
    ev.preventDefault();
    if (!selected || hasErrors) return;
    try {
      await api.put(`/timeline-target/${selected.Sno}`, {
        enquiry: editVals.Enquiry,
        technical_offer: editVals.Technical_offer,
        priced_offer: editVals.Priced_offer,
        price_book_order: editVals.Price_book_order,
        regret: editVals.Regret,
        cancelled: editVals.Cancelled,
      });
      showMsg("Timeline target updated successfully!", "success");

      const parsed = {
        Enquiry: parseInt(editVals.Enquiry),
        Technical_offer: parseInt(editVals.Technical_offer),
        Priced_offer: parseInt(editVals.Priced_offer),
        Price_book_order: parseInt(editVals.Price_book_order),
        Regret: parseInt(editVals.Regret),
        Cancelled: parseInt(editVals.Cancelled),
      };

      setRows((prev) =>
        prev.map((r) => (r.Sno === selected.Sno ? { ...r, ...parsed } : r)),
      );
      setSelected((prev) => ({ ...prev, ...parsed }));
    } catch (err) {
      showMsg(err.response?.data?.message || "Update failed", "danger");
    }
  };

  return (
    <div className="tt-page">
      <DashboardNavbar />
      <div className="tt-body">
        {/* Breadcrumb */}
        <div className="tt-breadcrumb">
          <span onClick={() => window.history.back()} className="tt-crumb-link">
            <i className="bi bi-chevron-left me-1"></i>Masters
          </span>
          <span className="tt-crumb-sep">/</span>
          <span className="tt-crumb-active">Timeline Target</span>
        </div>

        {/* Header */}
        <div className="tt-header">
          <div>
            <h3 className="tt-title">Timeline Target</h3>
            <p className="tt-subtitle">
              Manage stage timeline targets per product
            </p>
          </div>
          <span className="tt-role-pill">
            <i className="bi bi-person-fill me-1"></i>Role: {role}
          </span>
        </div>

        {/* Info Note */}
        <div className="tt-info-note">
          <i className="bi bi-info-circle me-2"></i>
          This master defines target days per opportunity stage for each
          product.
          {canModify
            ? " Double-click a row to edit target values."
            : " You have view-only access."}
        </div>

        {/* Toolbar */}
        <div className="tt-toolbar">
          <div className="input-group tt-search">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by Product, Enquiry, Technical Offer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="btn btn-outline-secondary"
                onClick={() => setSearch("")}
              >
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`alert alert-${message.type} py-2 mb-2 tt-alert`}>
            {message.type === "success" && (
              <i className="bi bi-check-circle me-2"></i>
            )}
            {message.type === "danger" && (
              <i className="bi bi-exclamation-triangle me-2"></i>
            )}
            {message.text}
          </div>
        )}

        {/* Split layout */}
        <div className={`tt-main ${showForm ? "tt-split" : ""}`}>
          {/* ── Table ── */}
          <div className="tt-table-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="tt-records">Records: {filtered.length}</span>
              <span className="tt-page-info">
                Page {page} of {totalPages}
              </span>
            </div>

            <div className="table-responsive tt-table-container">
              <table className="table table-sm table-hover align-middle tt-table">
                <thead>
                  <tr>
                    <th style={{ width: "4%" }}>Sno</th>
                    <th style={{ width: "18%" }}>Product</th>
                    <th style={{ width: "13%" }} className="text-center">
                      Enquiry
                      <br />
                      <small className="tt-days-hint">days</small>
                    </th>
                    <th style={{ width: "13%" }} className="text-center">
                      Technical Offer
                      <br />
                      <small className="tt-days-hint">days</small>
                    </th>
                    <th style={{ width: "13%" }} className="text-center">
                      Priced Offer
                      <br />
                      <small className="tt-days-hint">days</small>
                    </th>
                    <th style={{ width: "13%" }} className="text-center">
                      Price Book Order
                      <br />
                      <small className="tt-days-hint">days</small>
                    </th>
                    <th style={{ width: "13%" }} className="text-center">
                      Regret
                      <br />
                      <small className="tt-days-hint">days</small>
                    </th>
                    <th style={{ width: "13%" }} className="text-center">
                      Cancelled
                      <br />
                      <small className="tt-days-hint">days</small>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-4">
                        <div
                          className="spinner-border spinner-border-sm me-2"
                          style={{ color: "#8B0000" }}
                        ></div>
                        Loading...
                      </td>
                    </tr>
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-3 text-muted">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((r, idx) => (
                      <tr
                        key={r.Sno}
                        onDoubleClick={() =>
                          canModify && handleRowDoubleClick(r)
                        }
                        className={`${selected?.Sno === r.Sno ? "tt-row-selected" : ""} ${canModify ? "tt-row-editable" : ""}`}
                        title={canModify ? "Double-click to edit" : ""}
                      >
                        <td
                          className="text-muted"
                          style={{ fontSize: ".75rem" }}
                        >
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="tt-product-cell">{r.Product}</td>
                        <td className="text-center tt-num-cell">{r.Enquiry}</td>
                        <td className="text-center tt-num-cell">
                          {r.Technical_offer}
                        </td>
                        <td className="text-center tt-num-cell">
                          {r.Priced_offer}
                        </td>
                        <td className="text-center tt-num-cell">
                          {r.Price_book_order}
                        </td>
                        <td className="text-center tt-num-cell">{r.Regret}</td>
                        <td className="text-center tt-num-cell">
                          {r.Cancelled}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-2">
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <i className="bi bi-chevron-left"></i> Prev
              </button>
              <div className="small text-muted">
                Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
                –{Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </div>
              <button
                className="btn btn-sm btn-outline-secondary"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>

          {/* ── Edit Panel ── */}
          {showForm && (
            <div className="tt-form-panel">
              <h5 className="tt-form-title">
                <i className="bi bi-pencil-square me-2"></i>Edit Timeline Target
              </h5>
              <p className="tt-form-subtitle">
                <i className="bi bi-lock-fill me-1"></i>Product is locked — edit
                target days only
              </p>

              <form onSubmit={handleEdit} noValidate className="tt-form-scroll">
                {/* Product — locked */}
                <div className="mb-3">
                  <label className="form-label">Product</label>
                  <input
                    type="text"
                    className="form-control tt-input tt-locked"
                    value={selected?.Product || ""}
                    disabled
                  />
                </div>

                {/* All numeric fields */}
                {NUMERIC_FIELDS.map(({ key, label }) => (
                  <div className="mb-3" key={key}>
                    <label className="form-label">
                      {label} <span className="req">*</span>
                      <span className="tt-unit-badge">days</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      className={`form-control tt-input ${editErrs[key] ? "is-invalid" : ""}`}
                      value={editVals[key] ?? ""}
                      onChange={(e) => handleFieldChange(key, e.target.value)}
                    />
                    {editErrs[key] && (
                      <div className="invalid-feedback d-block">
                        {editErrs[key]}
                      </div>
                    )}
                  </div>
                ))}

                {/* Info box */}
                <div className="tt-info-box mb-3">
                  <div className="d-flex align-items-center justify-content-between">
                    <span className="tt-info-label">Record #</span>
                    <span className="tt-info-value">#{selected?.Sno}</span>
                  </div>
                  <p className="tt-no-status-note mt-2 mb-0">
                    <i className="bi bi-info-circle me-1"></i>
                    Timeline records have no status toggle.
                  </p>
                </div>

                <div className="d-flex gap-2 mt-2">
                  <button
                    type="submit"
                    className="btn tt-btn-primary flex-fill"
                    disabled={!canModify || hasErrors}
                  >
                    <i className="bi bi-save me-1"></i>Update
                  </button>
                  <button
                    type="button"
                    className="btn tt-btn-outline flex-fill"
                    onClick={resetForm}
                  >
                    <i className="bi bi-x-lg me-1"></i>Close
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimelineTarget;

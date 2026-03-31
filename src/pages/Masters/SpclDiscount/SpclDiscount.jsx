import React, { useEffect, useMemo, useState } from "react";
import DashboardNavbar from "../../../components/DashboardNavbar/DashboardNavbar";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import "./SpclDiscount.css";

const PAGE_SIZE = 50;

const SpclDiscount = () => {
  const { user } = useAuth();
  const role = user?.role || "View-only";
  const canModify = role === "Manager" || role === "Admin";

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isAdd, setIsAdd] = useState(false);
  const [nameVal, setNameVal] = useState("");
  const [nameError, setNameError] = useState("");
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const showMsg = (text, type) => {
    setMessage({ text, type });
    if (text) setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  /* ── Customers dropdown ──
     Controller now returns customer_name + Location correctly */
  useEffect(() => {
    api
      .get("/spcl-discounts/customers")
      .then((r) => setCustomers(r.data || []))
      .catch(() => {});
  }, []);

  /* ── Fetch rows ── */
  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await api.get("/spcl-discounts");
      setRows(res.data.data || []);
    } catch {
      showMsg("Failed to load special discounts", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  /* ── Live unique name check ── */
  useEffect(() => {
    if (!isAdd || !nameVal.trim()) {
      setNameError("");
      return;
    }
    const t = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await api.get("/spcl-discounts/check", {
          params: { Name: nameVal },
        });
        setNameError(res.data.exists ? res.data.message : "");
      } catch {
        setNameError("");
      } finally {
        setChecking(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [nameVal, isAdd]);

  /* ── Dynamic filter ── */
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      [r.Sno, r.Name, r.status].some((v) =>
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

  /* ── Reset ── */
  const resetForm = () => {
    setNameVal("");
    setNameError("");
    setSelected(null);
    setIsAdd(false);
    setShowForm(false);
    setMessage({ text: "", type: "" });
  };

  const handleOpenAdd = () => {
    if (!canModify) return;
    setNameVal("");
    setNameError("");
    setSelected(null);
    setIsAdd(true);
    setShowForm(true);
    setMessage({ text: "", type: "" });
  };

  /* ── Double-click → info panel ── */
  const handleRowDoubleClick = (row) => {
    setSelected(row);
    setIsAdd(false);
    setShowForm(true);
    setNameVal(row.Name || "");
    setNameError("");
    setMessage({ text: "", type: "" });
  };

  /* ── Submit add ── */
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!nameVal.trim()) {
      setNameError("Name is required");
      return;
    }
    if (nameError) return;
    try {
      await api.post("/spcl-discounts", { Name: nameVal });
      showMsg("Special discount added successfully!", "success");
      setNameVal("");
      setNameError("");
      await fetchRows();
    } catch (err) {
      showMsg(err.response?.data?.message || "Operation failed", "danger");
    }
  };

  /* ── Toggle status ── */
  const handleToggle = async (row) => {
    if (!canModify) return;
    try {
      const res = await api.patch(`/spcl-discounts/${row.Sno}/status`);
      const ns = res.data.status;
      setRows((prev) =>
        prev.map((r) => (r.Sno === row.Sno ? { ...r, status: ns } : r)),
      );
      if (selected?.Sno === row.Sno)
        setSelected((prev) => ({ ...prev, status: ns }));
      showMsg(`Status changed to ${ns}.`, "success");
    } catch (err) {
      const msg = err.response?.data?.message || "Toggle failed";
      showMsg(msg, err.response?.data?.openQuote ? "warning" : "danger");
    }
  };

  return (
    <div className="spc-page">
      <DashboardNavbar />
      <div className="spc-body">
        {/* Breadcrumb */}
        <div className="spc-breadcrumb">
          <span
            onClick={() => window.history.back()}
            className="spc-crumb-link"
          >
            <i className="bi bi-chevron-left me-1"></i>Masters
          </span>
          <span className="spc-crumb-sep">/</span>
          <span className="spc-crumb-active">Special Discount</span>
        </div>

        {/* Header */}
        <div className="spc-header">
          <div>
            <h3 className="spc-title">Special Discount</h3>
            <p className="spc-subtitle">
              Customers eligible for special discount pricing
            </p>
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="spc-role-pill">Role: {role}</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="spc-toolbar">
          <div className="input-group spc-search">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by Name, Status..."
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
          {canModify && (
            <button className="btn spc-btn-primary" onClick={handleOpenAdd}>
              <i className="bi bi-plus-lg me-1"></i>Add
            </button>
          )}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`alert alert-${message.type} py-2 mb-2 spc-alert`}>
            {message.type === "success" && (
              <i className="bi bi-check-circle me-2"></i>
            )}
            {message.type === "danger" && (
              <i className="bi bi-exclamation-triangle me-2"></i>
            )}
            {message.type === "warning" && (
              <i className="bi bi-info-circle me-2"></i>
            )}
            {message.text}
          </div>
        )}

        {/* Main split layout */}
        <div className={`spc-main ${showForm ? "spc-split" : ""}`}>
          {/* ── Table ── */}
          <div className="spc-table-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="spc-records">Records: {filtered.length}</span>
              <span className="spc-page-info">
                Page {page} of {totalPages}
              </span>
            </div>

            <div className="table-responsive spc-table-container">
              <table className="table table-sm table-hover align-middle spc-table">
                <thead>
                  <tr>
                    <th style={{ width: "8%" }}>Sno</th>
                    <th style={{ width: "72%" }}>Name</th>
                    <th style={{ width: "20%" }} className="text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="text-center py-4">
                        <div
                          className="spinner-border spinner-border-sm me-2"
                          style={{ color: "#8B0000" }}
                        ></div>
                        Loading...
                      </td>
                    </tr>
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-3 text-muted">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((r, idx) => (
                      <tr
                        key={r.Sno}
                        onDoubleClick={() => handleRowDoubleClick(r)}
                        className={
                          selected?.Sno === r.Sno ? "spc-row-selected" : ""
                        }
                        title="Double-click to view details"
                      >
                        <td
                          className="text-muted"
                          style={{ fontSize: ".75rem" }}
                        >
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className="spc-avatar">
                              {r.Name?.charAt(0)?.toUpperCase() || "?"}
                            </span>
                            <span className="spc-name">{r.Name}</span>
                          </div>
                        </td>
                        <td className="text-center">
                          {canModify ? (
                            <div
                              className={`spc-toggle ${r.status === "Active" ? "spc-toggle-on" : "spc-toggle-off"}`}
                              onClick={() => handleToggle(r)}
                              title={`Click to set ${r.status === "Active" ? "Inactive" : "Active"}`}
                            >
                              <div className="spc-toggle-thumb"></div>
                              <span className="spc-toggle-label">
                                {r.status}
                              </span>
                            </div>
                          ) : (
                            <span
                              className={`badge ${r.status === "Active" ? "bg-success" : "bg-secondary"}`}
                            >
                              {r.status}
                            </span>
                          )}
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

          {/* ── Form / Info Panel ── */}
          {showForm && (
            <div className="spc-form-panel">
              <h5 className="spc-form-title">
                <i
                  className={`bi ${isAdd ? "bi-plus-circle" : "bi-info-circle"} me-2`}
                ></i>
                {isAdd ? "Add Special Discount" : "Customer Info"}
              </h5>
              <p className="spc-form-subtitle">
                {isAdd ? (
                  <>
                    Fields marked <span className="req">*</span> are mandatory
                  </>
                ) : (
                  <>
                    <i className="bi bi-lock-fill me-1"></i>Name is locked after
                    creation
                  </>
                )}
              </p>

              <form
                onSubmit={isAdd ? handleSubmit : (e) => e.preventDefault()}
                noValidate
                className="spc-form-scroll"
              >
                {/* Name */}
                <div className="mb-3">
                  <label className="form-label">
                    Name {isAdd && <span className="req">*</span>}
                  </label>
                  {isAdd ? (
                    <>
                      {/* FIX: composite key prevents duplicate-key warning
                          when two customers share the same name but differ
                          by Location (division) */}
                      <select
                        className={`form-control spc-input ${nameError ? "is-invalid" : ""}`}
                        value={nameVal}
                        onChange={(e) => setNameVal(e.target.value)}
                      >
                        <option value="">-- Select Customer --</option>
                        {customers.map((c, i) => (
                          <option
                            key={`${c.name}-${c.division || i}`}
                            value={c.name}
                          >
                            {c.division ? `${c.name} - ${c.division}` : c.name}
                          </option>
                        ))}
                      </select>
                      {checking && (
                        <small className="text-muted">
                          <i className="bi bi-arrow-repeat me-1"></i>Checking...
                        </small>
                      )}
                      {nameError && (
                        <div className="invalid-feedback d-block">
                          {nameError}
                        </div>
                      )}
                    </>
                  ) : (
                    <input
                      type="text"
                      className="form-control spc-input spc-locked"
                      value={nameVal}
                      disabled
                    />
                  )}
                </div>

                {/* Info box — view/toggle mode */}
                {!isAdd && selected && (
                  <div className="spc-info-box">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="spc-info-label">Status</span>
                      <span
                        className={`badge ${selected.status === "Active" ? "bg-success" : "bg-secondary"}`}
                      >
                        {selected.status}
                      </span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="spc-info-label">Record #</span>
                      <span className="spc-info-value">#{selected.Sno}</span>
                    </div>
                    {canModify && (
                      <button
                        type="button"
                        className={`btn w-100 mt-3 ${
                          selected.status === "Active"
                            ? "spc-btn-inactive"
                            : "spc-btn-activate"
                        }`}
                        onClick={() => handleToggle(selected)}
                      >
                        <i
                          className={`bi ${
                            selected.status === "Active"
                              ? "bi-toggle-off"
                              : "bi-toggle-on"
                          } me-1`}
                        ></i>
                        Set{" "}
                        {selected.status === "Active" ? "Inactive" : "Active"}
                      </button>
                    )}
                    {selected.status === "Active" && canModify && (
                      <p className="spc-warn-hint mt-2">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        Setting Inactive will be blocked if open quotes exist.
                      </p>
                    )}
                  </div>
                )}

                <div className="d-flex gap-2 mt-3">
                  {isAdd && (
                    <button
                      type="submit"
                      className="btn spc-btn-primary flex-fill"
                      disabled={!canModify || !!nameError || checking}
                    >
                      <i className="bi bi-save me-1"></i>Save
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn spc-btn-outline flex-fill"
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

export default SpclDiscount;

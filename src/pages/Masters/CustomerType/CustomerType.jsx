import React, { useEffect, useMemo, useState } from "react";
import DashboardNavbar from "../../../components/DashboardNavbar/DashboardNavbar";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import "./CustomerType.css";

const PAGE_SIZE = 50;

const CustomerType = () => {
  const { user } = useAuth();
  const role = user?.role || "View-only";
  const canModify = role === "Manager" || role === "Admin";

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isAdd, setIsAdd] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  /* Add state */
  const [ctVal, setCtVal] = useState("");
  const [ctError, setCtError] = useState("");
  const [checking, setChecking] = useState(false);

  const showMsg = (text, type) => {
    setMessage({ text, type });
    if (text) setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  /* ── Fetch ── */
  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await api.get("/customer-types");
      setRows(res.data.data || []);
    } catch {
      showMsg("Failed to load customer types", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  /* ── Live unique check ── */
  useEffect(() => {
    if (!isAdd || !ctVal.trim()) {
      setCtError("");
      return;
    }
    const t = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await api.get("/customer-types/check", {
          params: { custtype: ctVal },
        });
        setCtError(res.data.exists ? res.data.message : "");
      } catch {
        setCtError("");
      } finally {
        setChecking(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [ctVal, isAdd]);

  /* ── Filter ── */
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      [r.Sno, r.Customer_Type, r.Status].some((v) =>
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

  /* ── Handlers ── */
  const resetForm = () => {
    setCtVal("");
    setCtError("");
    setSelected(null);
    setIsAdd(false);
    setShowForm(false);
    setMessage({ text: "", type: "" });
  };

  const handleOpenAdd = () => {
    if (!canModify) return;
    setCtVal("");
    setCtError("");
    setSelected(null);
    setIsAdd(true);
    setShowForm(true);
    setMessage({ text: "", type: "" });
  };

  const handleRowDoubleClick = (row) => {
    setSelected(row);
    setIsAdd(false);
    setShowForm(true);
    setMessage({ text: "", type: "" });
  };

  /* ── Submit Add ── */
  const handleAdd = async (ev) => {
    ev.preventDefault();
    if (!ctVal.trim()) {
      setCtError("Customer Type is required");
      return;
    }
    if (ctError) return;
    try {
      await api.post("/customer-types", { custtype: ctVal });
      showMsg("Customer type added successfully!", "success");
      setCtVal("");
      setCtError("");
      await fetchRows();
    } catch (err) {
      showMsg(err.response?.data?.message || "Operation failed", "danger");
    }
  };

  /* ── Toggle Status ── */
  const handleToggle = async (row) => {
    if (!canModify) return;
    const newStatus = row.Status === "Active" ? "Inactive" : "Active";
    try {
      const res = await api.patch(`/customer-types/${row.Sno}/status`, {
        status: newStatus,
      });
      const ns = res.data.status;
      setRows((prev) =>
        prev.map((r) => (r.Sno === row.Sno ? { ...r, Status: ns } : r)),
      );
      if (selected?.Sno === row.Sno)
        setSelected((prev) => ({ ...prev, Status: ns }));
      showMsg(`Status changed to ${ns}.`, "success");
    } catch (err) {
      showMsg(err.response?.data?.message || "Toggle failed", "danger");
    }
  };

  return (
    <div className="ct-page">
      <DashboardNavbar />
      <div className="ct-body">
        {/* Breadcrumb */}
        <div className="ct-breadcrumb">
          <span onClick={() => window.history.back()} className="ct-crumb-link">
            <i className="bi bi-chevron-left me-1"></i>Masters
          </span>
          <span className="ct-crumb-sep">/</span>
          <span className="ct-crumb-active">Customer Type</span>
        </div>

        {/* Header */}
        <div className="ct-header">
          <div>
            <h3 className="ct-title">Customer Type</h3>
            <p className="ct-subtitle">Manage customer type categories</p>
          </div>
          <span className="ct-role-pill">
            <i className="bi bi-person-fill me-1"></i>Role: {role}
          </span>
        </div>

        {/* Toolbar */}
        <div className="ct-toolbar">
          <div className="input-group ct-search">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by Customer Type, Status..."
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
            <button className="btn ct-btn-primary" onClick={handleOpenAdd}>
              <i className="bi bi-plus-lg me-1"></i>Add
            </button>
          )}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`alert alert-${message.type} py-2 mb-2 ct-alert`}>
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
        <div className={`ct-main ${showForm ? "ct-split" : ""}`}>
          {/* ── Table ── */}
          <div className="ct-table-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="ct-records">Records: {filtered.length}</span>
              <span className="ct-page-info">
                Page {page} of {totalPages}
              </span>
            </div>

            <div className="table-responsive ct-table-container">
              <table className="table table-sm table-hover align-middle ct-table">
                <thead>
                  <tr>
                    <th style={{ width: "8%" }}>Sno</th>
                    <th style={{ width: "72%" }}>Customer_Type</th>
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
                          selected?.Sno === r.Sno ? "ct-row-selected" : ""
                        }
                        title="Double-click to view details"
                      >
                        <td
                          className="text-muted"
                          style={{ fontSize: ".75rem" }}
                        >
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="ct-type-name">{r.Customer_Type}</td>
                        <td className="text-center">
                          {canModify ? (
                            <div
                              className={`ct-toggle ${r.Status === "Active" ? "ct-toggle-on" : "ct-toggle-off"}`}
                              onClick={() => handleToggle(r)}
                              title={`Click to set ${r.Status === "Active" ? "Inactive" : "Active"}`}
                            >
                              <div className="ct-toggle-thumb"></div>
                              <span className="ct-toggle-label">
                                {r.Status}
                              </span>
                            </div>
                          ) : (
                            <span
                              className={`badge ${r.Status === "Active" ? "bg-success" : "bg-secondary"}`}
                            >
                              {r.Status}
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
            <div className="ct-form-panel">
              <h5 className="ct-form-title">
                <i
                  className={`bi ${isAdd ? "bi-plus-circle" : "bi-info-circle"} me-2`}
                ></i>
                {isAdd ? "Add Customer Type" : "Customer Type Info"}
              </h5>
              <p className="ct-form-subtitle">
                {isAdd ? (
                  <>
                    Fields marked <span className="req">*</span> are mandatory
                  </>
                ) : (
                  <>
                    <i className="bi bi-lock-fill me-1"></i>Customer Type is
                    locked after creation
                  </>
                )}
              </p>

              <form
                onSubmit={isAdd ? handleAdd : (e) => e.preventDefault()}
                noValidate
                className="ct-form-scroll"
              >
                {/* Customer Type field */}
                <div className="mb-3">
                  <label className="form-label">
                    Customer_Type {isAdd && <span className="req">*</span>}
                  </label>
                  {isAdd ? (
                    <>
                      <input
                        type="text"
                        className={`form-control ct-input ${ctError ? "is-invalid" : ""}`}
                        value={ctVal}
                        onChange={(e) => setCtVal(e.target.value)}
                        placeholder="e.g. DISTRIBUTOR"
                        maxLength={45}
                      />
                      {checking && (
                        <small className="text-muted">
                          <i className="bi bi-arrow-repeat me-1"></i>Checking...
                        </small>
                      )}
                      {ctError && (
                        <div className="invalid-feedback d-block">
                          {ctError}
                        </div>
                      )}
                      <small className="text-muted">
                        Will be saved in UPPERCASE
                      </small>
                    </>
                  ) : (
                    <input
                      type="text"
                      className="form-control ct-input ct-locked"
                      value={selected?.Customer_Type || ""}
                      disabled
                    />
                  )}
                </div>

                {/* Info box — view mode */}
                {!isAdd && selected && (
                  <div className="ct-info-box">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="ct-info-label">Status</span>
                      <span
                        className={`badge ${selected.Status === "Active" ? "bg-success" : "bg-secondary"}`}
                      >
                        {selected.Status}
                      </span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="ct-info-label">Record #</span>
                      <span className="ct-info-value">#{selected.Sno}</span>
                    </div>
                    {canModify && (
                      <button
                        type="button"
                        className={`btn w-100 mt-3 ${selected.Status === "Active" ? "ct-btn-inactive" : "ct-btn-activate"}`}
                        onClick={() => handleToggle(selected)}
                      >
                        <i
                          className={`bi ${selected.Status === "Active" ? "bi-toggle-off" : "bi-toggle-on"} me-1`}
                        ></i>
                        Set{" "}
                        {selected.Status === "Active" ? "Inactive" : "Active"}
                      </button>
                    )}
                  </div>
                )}

                <div className="d-flex gap-2 mt-3">
                  {isAdd && (
                    <button
                      type="submit"
                      className="btn ct-btn-primary flex-fill"
                      disabled={
                        !canModify || !!ctError || checking || !ctVal.trim()
                      }
                    >
                      <i className="bi bi-save me-1"></i>Save
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn ct-btn-outline flex-fill"
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

export default CustomerType;

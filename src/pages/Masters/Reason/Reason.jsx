import React, { useEffect, useMemo, useState } from "react";
import DashboardNavbar from "../../../components/DashboardNavbar/DashboardNavbar";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import "./Reason.css";

const PAGE_SIZE = 50;

const Reason = () => {
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
  const [codeVal, setCodeVal] = useState("");
  const [descVal, setDescVal] = useState("");
  const [codeError, setCodeError] = useState("");
  const [descError, setDescError] = useState("");
  const [checking, setChecking] = useState(false);

  /* Edit state */
  const [editDesc, setEditDesc] = useState("");
  const [editDescError, setEditDescError] = useState("");

  const showMsg = (text, type) => {
    setMessage({ text, type });
    if (text) setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  /* ── Fetch ── */
  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reasons");
      setRows(res.data.data || []);
    } catch {
      showMsg("Failed to load reasons", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  /* ── Live unique check on Reason Code ── */
  useEffect(() => {
    if (!isAdd || !codeVal.trim()) {
      setCodeError("");
      return;
    }
    const t = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await api.get("/reasons/check", {
          params: { reason: codeVal },
        });
        setCodeError(res.data.exists ? res.data.message : "");
      } catch {
        setCodeError("");
      } finally {
        setChecking(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [codeVal, isAdd]);

  /* ── Dynamic filter ── */
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      [r.Sno, r.Reason_Code, r.Description].some((v) =>
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
    setCodeVal("");
    setDescVal("");
    setCodeError("");
    setDescError("");
    setEditDesc("");
    setEditDescError("");
    setSelected(null);
    setIsAdd(false);
    setShowForm(false);
    setMessage({ text: "", type: "" });
  };

  const handleOpenAdd = () => {
    if (!canModify) return;
    setCodeVal("");
    setDescVal("");
    setCodeError("");
    setDescError("");
    setSelected(null);
    setIsAdd(true);
    setShowForm(true);
    setMessage({ text: "", type: "" });
  };

  const handleRowDoubleClick = (row) => {
    setSelected(row);
    setIsAdd(false);
    setShowForm(true);
    setEditDesc(row.Description || "");
    setEditDescError("");
    setMessage({ text: "", type: "" });
  };

  /* ── Submit Add ── */
  const handleAdd = async (ev) => {
    ev.preventDefault();
    let valid = true;
    if (!codeVal.trim()) {
      setCodeError("Reason Code is required");
      valid = false;
    }
    if (!descVal.trim()) {
      setDescError("Description is required");
      valid = false;
    }
    if (!valid || codeError) return;
    try {
      await api.post("/reasons", {
        reason_code: codeVal,
        description: descVal,
      });
      showMsg("Reason added successfully!", "success");
      setCodeVal("");
      setDescVal("");
      setCodeError("");
      setDescError("");
      await fetchRows();
    } catch (err) {
      showMsg(err.response?.data?.message || "Operation failed", "danger");
    }
  };

  /* ── Submit Edit ── */
  const handleEdit = async (ev) => {
    ev.preventDefault();
    if (!editDesc.trim()) {
      setEditDescError("Description is required");
      return;
    }
    if (!selected) return;
    try {
      await api.put(`/reasons/${selected.Sno}`, { description: editDesc });
      showMsg("Reason updated successfully!", "success");
      setRows((prev) =>
        prev.map((r) =>
          r.Sno === selected.Sno ? { ...r, Description: editDesc } : r,
        ),
      );
      setSelected((prev) => ({ ...prev, Description: editDesc }));
      setEditDescError("");
    } catch (err) {
      showMsg(err.response?.data?.message || "Update failed", "danger");
    }
  };

  return (
    <div className="rn-page">
      <DashboardNavbar />
      <div className="rn-body">
        {/* Breadcrumb */}
        <div className="rn-breadcrumb">
          <span onClick={() => window.history.back()} className="rn-crumb-link">
            <i className="bi bi-chevron-left me-1"></i>Masters
          </span>
          <span className="rn-crumb-sep">/</span>
          <span className="rn-crumb-active">Reason</span>
        </div>

        {/* Header */}
        <div className="rn-header">
          <div>
            <h3 className="rn-title">Reason Master</h3>
            <p className="rn-subtitle">Manage reason codes and descriptions</p>
          </div>
          <span className="rn-role-pill">
            <i className="bi bi-person-fill me-1"></i>Role: {role}
          </span>
        </div>

        {/* Toolbar */}
        <div className="rn-toolbar">
          <div className="input-group rn-search">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by Reason Code, Description..."
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
            <button className="btn rn-btn-primary" onClick={handleOpenAdd}>
              <i className="bi bi-plus-lg me-1"></i>Add
            </button>
          )}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`alert alert-${message.type} py-2 mb-2 rn-alert`}>
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
        <div className={`rn-main ${showForm ? "rn-split" : ""}`}>
          {/* ── Table ── */}
          <div className="rn-table-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="rn-records">Records: {filtered.length}</span>
              <span className="rn-page-info">
                Page {page} of {totalPages}
              </span>
            </div>

            <div className="table-responsive rn-table-container">
              <table className="table table-sm table-hover align-middle rn-table">
                <thead>
                  <tr>
                    <th style={{ width: "7%" }}>Sno</th>
                    <th style={{ width: "30%" }}>Reason</th>
                    <th style={{ width: "63%" }}>Description</th>
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
                          selected?.Sno === r.Sno ? "rn-row-selected" : ""
                        }
                        title={canModify ? "Double-click to edit" : ""}
                      >
                        <td
                          className="text-muted"
                          style={{ fontSize: ".75rem" }}
                        >
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="rn-code-cell">{r.Reason_Code}</td>
                        <td className="rn-desc-cell">{r.Description}</td>
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
            <div className="rn-form-panel">
              <h5 className="rn-form-title">
                <i
                  className={`bi ${isAdd ? "bi-plus-circle" : "bi-pencil-square"} me-2`}
                ></i>
                {isAdd ? "Add Reason" : "Edit Reason"}
              </h5>
              <p className="rn-form-subtitle">
                {isAdd ? (
                  <>
                    Fields marked <span className="req">*</span> are mandatory
                  </>
                ) : (
                  <>
                    <i className="bi bi-lock-fill me-1"></i>Reason Code is
                    locked — edit Description only
                  </>
                )}
              </p>

              <form
                onSubmit={isAdd ? handleAdd : handleEdit}
                noValidate
                className="rn-form-scroll"
              >
                {/* Reason Code */}
                <div className="mb-3">
                  <label className="form-label">
                    Reason {isAdd && <span className="req">*</span>}
                  </label>
                  {isAdd ? (
                    <>
                      <input
                        type="text"
                        className={`form-control rn-input ${codeError ? "is-invalid" : ""}`}
                        value={codeVal}
                        onChange={(e) => setCodeVal(e.target.value)}
                        placeholder="e.g. PRICE"
                        maxLength={10}
                      />
                      {checking && (
                        <small className="text-muted">
                          <i className="bi bi-arrow-repeat me-1"></i>Checking...
                        </small>
                      )}
                      {codeError && (
                        <div className="invalid-feedback d-block">
                          {codeError}
                        </div>
                      )}
                      <small className="text-muted">
                        Max 10 characters · saved in UPPERCASE
                      </small>
                    </>
                  ) : (
                    <input
                      type="text"
                      className="form-control rn-input rn-locked"
                      value={selected?.Reason_Code || ""}
                      disabled
                    />
                  )}
                </div>

                {/* Description */}
                <div className="mb-3">
                  <label className="form-label">
                    Description <span className="req">*</span>
                  </label>
                  <textarea
                    className={`form-control rn-input ${
                      isAdd
                        ? descError
                          ? "is-invalid"
                          : ""
                        : editDescError
                          ? "is-invalid"
                          : ""
                    }`}
                    rows={4}
                    value={isAdd ? descVal : editDesc}
                    onChange={(e) => {
                      if (isAdd) {
                        setDescVal(e.target.value);
                        setDescError("");
                      } else {
                        setEditDesc(e.target.value);
                        setEditDescError("");
                      }
                    }}
                    placeholder="Enter description..."
                    maxLength={150}
                  />
                  {isAdd && descError && (
                    <div className="invalid-feedback d-block">{descError}</div>
                  )}
                  {!isAdd && editDescError && (
                    <div className="invalid-feedback d-block">
                      {editDescError}
                    </div>
                  )}
                  <small className="text-muted">Max 150 characters</small>
                </div>

                {/* Info box — edit mode */}
                {!isAdd && selected && (
                  <div className="rn-info-box">
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="rn-info-label">Record #</span>
                      <span className="rn-info-value">#{selected.Sno}</span>
                    </div>
                    <p className="rn-no-status-note mt-2 mb-0">
                      <i className="bi bi-info-circle me-1"></i>
                      Reason records have no status toggle — they remain active
                      permanently.
                    </p>
                  </div>
                )}

                <div className="d-flex gap-2 mt-3">
                  <button
                    type="submit"
                    className="btn rn-btn-primary flex-fill"
                    disabled={
                      !canModify ||
                      (isAdd &&
                        (!!codeError ||
                          checking ||
                          !codeVal.trim() ||
                          !descVal.trim()))
                    }
                  >
                    <i className="bi bi-save me-1"></i>
                    {isAdd ? "Save" : "Update"}
                  </button>
                  <button
                    type="button"
                    className="btn rn-btn-outline flex-fill"
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

export default Reason;

import React, { useEffect, useMemo, useState } from "react";
import DashboardNavbar from "../../../components/DashboardNavbar/DashboardNavbar";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import "./EndIndustry.css";

const PAGE_SIZE = 50;

const EndIndustry = () => {
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

  /* Add form state */
  const [industryVal, setIndustryVal] = useState("");
  const [descVal, setDescVal] = useState("");
  const [indError, setIndError] = useState("");
  const [checking, setChecking] = useState(false);

  /* Edit form state */
  const [editDesc, setEditDesc] = useState("");

  const showMsg = (text, type) => {
    setMessage({ text, type });
    if (text) setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  /* ── Fetch rows ── */
  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await api.get("/end-industries");
      setRows(res.data.data || []);
    } catch {
      showMsg("Failed to load end industries", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  /* ── Live unique check (Add mode) ── */
  useEffect(() => {
    if (!isAdd || !industryVal.trim()) {
      setIndError("");
      return;
    }
    const t = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await api.get("/end-industries/check", {
          params: { Industry: industryVal },
        });
        setIndError(res.data.exists ? res.data.message : "");
      } catch {
        setIndError("");
      } finally {
        setChecking(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [industryVal, isAdd]);

  /* ── Dynamic filter ── */
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      [r.Sno, r.Industry, r.Description].some((v) =>
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
    setIndustryVal("");
    setDescVal("");
    setIndError("");
    setEditDesc("");
    setSelected(null);
    setIsAdd(false);
    setShowForm(false);
    setMessage({ text: "", type: "" });
  };

  const handleOpenAdd = () => {
    if (!canModify) return;
    setIndustryVal("");
    setDescVal("");
    setIndError("");
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
    setMessage({ text: "", type: "" });
  };

  /* ── Submit Add ── */
  const handleAdd = async (ev) => {
    ev.preventDefault();
    if (!industryVal.trim()) {
      setIndError("Industry is required");
      return;
    }
    if (indError) return;
    try {
      await api.post("/end-industries", {
        Industry: industryVal,
        Description: descVal,
      });
      showMsg("End Industry added successfully!", "success");
      setIndustryVal("");
      setDescVal("");
      setIndError("");
      await fetchRows();
    } catch (err) {
      showMsg(err.response?.data?.message || "Operation failed", "danger");
    }
  };

  /* ── Submit Edit ── */
  const handleEdit = async (ev) => {
    ev.preventDefault();
    if (!selected) return;
    try {
      await api.put(`/end-industries/${selected.Sno}`, {
        Description: editDesc,
      });
      showMsg("End Industry updated successfully!", "success");
      setRows((prev) =>
        prev.map((r) =>
          r.Sno === selected.Sno ? { ...r, Description: editDesc } : r,
        ),
      );
      setSelected((prev) => ({ ...prev, Description: editDesc }));
    } catch (err) {
      showMsg(err.response?.data?.message || "Update failed", "danger");
    }
  };

  return (
    <div className="ei-page">
      <DashboardNavbar />
      <div className="ei-body">
        {/* Breadcrumb */}
        <div className="ei-breadcrumb">
          <span onClick={() => window.history.back()} className="ei-crumb-link">
            <i className="bi bi-chevron-left me-1"></i>Masters
          </span>
          <span className="ei-crumb-sep">/</span>
          <span className="ei-crumb-active">End Industry</span>
        </div>

        {/* Header */}
        <div className="ei-header">
          <div>
            <h3 className="ei-title">End Industry</h3>
            <p className="ei-subtitle">Manage end industry segments</p>
          </div>
          <span className="ei-role-pill">
            <i className="bi bi-person-fill me-1"></i>Role: {role}
          </span>
        </div>

        {/* Toolbar */}
        <div className="ei-toolbar">
          <div className="input-group ei-search">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by Industry, Description..."
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
            <button className="btn ei-btn-primary" onClick={handleOpenAdd}>
              <i className="bi bi-plus-lg me-1"></i>Add
            </button>
          )}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`alert alert-${message.type} py-2 mb-2 ei-alert`}>
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
        <div className={`ei-main ${showForm ? "ei-split" : ""}`}>
          {/* ── Table ── */}
          <div className="ei-table-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="ei-records">Records: {filtered.length}</span>
              <span className="ei-page-info">
                Page {page} of {totalPages}
              </span>
            </div>

            <div className="table-responsive ei-table-container">
              <table className="table table-sm table-hover align-middle ei-table">
                <thead>
                  <tr>
                    <th style={{ width: "7%" }}>Sno</th>
                    <th style={{ width: "30%" }}>Industry</th>
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
                        onDoubleClick={() =>
                          canModify && handleRowDoubleClick(r)
                        }
                        className={
                          selected?.Sno === r.Sno ? "ei-row-selected" : ""
                        }
                        title={canModify ? "Double-click to edit" : ""}
                      >
                        <td
                          className="text-muted"
                          style={{ fontSize: ".75rem" }}
                        >
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        
                          <td>
                            <span className="ei-ind-name">{r.Industry}</span>
                          </td>
                        
                        <td className="ei-desc-cell">
                          {r.Description || (
                            <span className="text-muted fst-italic">—</span>
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

          {/* ── Form Panel ── */}
          {showForm && (
            <div className="ei-form-panel">
              <h5 className="ei-form-title">
                <i
                  className={`bi ${isAdd ? "bi-plus-circle" : "bi-pencil-square"} me-2`}
                ></i>
                {isAdd ? "Add End Industry" : "Edit End Industry"}
              </h5>
              <p className="ei-form-subtitle">
                {isAdd ? (
                  <>
                    Fields marked <span className="req">*</span> are mandatory
                  </>
                ) : (
                  <>
                    <i className="bi bi-lock-fill me-1"></i>Industry name is
                    locked — edit Description only
                  </>
                )}
              </p>

              <form
                onSubmit={isAdd ? handleAdd : handleEdit}
                noValidate
                className="ei-form-scroll"
              >
                {/* Industry */}
                <div className="mb-3">
                  <label className="form-label">
                    Industry {isAdd && <span className="req">*</span>}
                  </label>
                  {isAdd ? (
                    <>
                      <input
                        type="text"
                        className={`form-control ei-input ${indError ? "is-invalid" : ""}`}
                        value={industryVal}
                        onChange={(e) => setIndustryVal(e.target.value)}
                        placeholder="e.g. OIL & GAS"
                        maxLength={45}
                      />
                      {checking && (
                        <small className="text-muted">
                          <i className="bi bi-arrow-repeat me-1"></i>Checking...
                        </small>
                      )}
                      {indError && (
                        <div className="invalid-feedback d-block">
                          {indError}
                        </div>
                      )}
                      <small className="text-muted">
                        Will be saved in UPPERCASE
                      </small>
                    </>
                  ) : (
                    <input
                      type="text"
                      className="form-control ei-input ei-locked"
                      value={selected?.Industry || ""}
                      disabled
                    />
                  )}
                </div>

                {/* Description */}
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control ei-input"
                    rows={3}
                    value={isAdd ? descVal : editDesc}
                    onChange={(e) =>
                      isAdd
                        ? setDescVal(e.target.value)
                        : setEditDesc(e.target.value)
                    }
                    placeholder="Optional description..."
                    maxLength={75}
                  />
                  <small className="text-muted">Max 75 characters</small>
                </div>

                <div className="d-flex gap-2 mt-3">
                  <button
                    type="submit"
                    className="btn ei-btn-primary flex-fill"
                    disabled={
                      !canModify ||
                      (isAdd && (!!indError || checking || !industryVal.trim()))
                    }
                  >
                    <i className="bi bi-save me-1"></i>
                    {isAdd ? "Save" : "Update"}
                  </button>
                  <button
                    type="button"
                    className="btn ei-btn-outline flex-fill"
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

export default EndIndustry;

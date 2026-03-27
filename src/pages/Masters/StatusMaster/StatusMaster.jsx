import React, { useEffect, useMemo, useState } from "react";
import DashboardNavbar from "../../../components/DashboardNavbar/DashboardNavbar";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import "./StatusMaster.css";

const PAGE_SIZE = 50;

const StatusMaster = () => {
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
  const [stageVal, setStageVal] = useState("");
  const [descVal, setDescVal] = useState("");
  const [stageError, setStageError] = useState("");
  const [checking, setChecking] = useState(false);

  /* Edit state */
  const [editDesc, setEditDesc] = useState("");

  const showMsg = (text, type) => {
    setMessage({ text, type });
    if (text) setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  /* ── Fetch ── */
  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await api.get("/status-master");
      setRows(res.data.data || []);
    } catch {
      showMsg("Failed to load statuses", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  /* ── Live unique check ── */
  useEffect(() => {
    if (!isAdd || !stageVal.trim()) {
      setStageError("");
      return;
    }
    const t = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await api.get("/status-master/check", {
          params: { stage: stageVal },
        });
        setStageError(res.data.exists ? res.data.message : "");
      } catch {
        setStageError("");
      } finally {
        setChecking(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [stageVal, isAdd]);

  /* ── Dynamic filter ── */
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      [r.Sno, r.Opportunity_Stage, r.Description, r.Status].some((v) =>
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
    setStageVal("");
    setDescVal("");
    setStageError("");
    setEditDesc("");
    setSelected(null);
    setIsAdd(false);
    setShowForm(false);
    setMessage({ text: "", type: "" });
  };

  const handleOpenAdd = () => {
    if (!canModify) return;
    setStageVal("");
    setDescVal("");
    setStageError("");
    setSelected(null);
    setIsAdd(true);
    setShowForm(true);
    setMessage({ text: "", type: "" });
  };

  const handleRowDoubleClick = (row) => {
    if (row.Status !== "Active" && !canModify) return;
    setSelected(row);
    setIsAdd(false);
    setShowForm(true);
    setEditDesc(row.Description || "");
    setMessage({ text: "", type: "" });
  };

  /* ── Submit Add ── */
  const handleAdd = async (ev) => {
    ev.preventDefault();
    if (!stageVal.trim()) {
      setStageError("Opportunity Stage is required");
      return;
    }
    if (stageError) return;
    try {
      await api.post("/status-master", {
        stage: stageVal,
        description: descVal,
      });
      showMsg("Status added successfully!", "success");
      setStageVal("");
      setDescVal("");
      setStageError("");
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
      await api.put(`/status-master/${selected.Sno}`, {
        description: editDesc,
      });
      showMsg("Status updated successfully!", "success");
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

  /* ── Toggle ── */
  const handleToggle = async (row) => {
    if (!canModify) return;
    const newStatus = row.Status === "Active" ? "Inactive" : "Active";
    try {
      const res = await api.patch(`/status-master/${row.Sno}/status`, {
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
    <div className="sm-page">
      <DashboardNavbar />
      <div className="sm-body">
        {/* Breadcrumb */}
        <div className="sm-breadcrumb">
          <span onClick={() => window.history.back()} className="sm-crumb-link">
            <i className="bi bi-chevron-left me-1"></i>Masters
          </span>
          <span className="sm-crumb-sep">/</span>
          <span className="sm-crumb-active">Status</span>
        </div>

        {/* Header */}
        <div className="sm-header">
          <div>
            <h3 className="sm-title">Status Master</h3>
            <p className="sm-subtitle">Manage opportunity stage definitions</p>
          </div>
          <span className="sm-role-pill">
            <i className="bi bi-person-fill me-1"></i>Role: {role}
          </span>
        </div>

        {/* Toolbar */}
        <div className="sm-toolbar">
          <div className="input-group sm-search">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by Opportunity Stage, Description, Status..."
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
            <button className="btn sm-btn-primary" onClick={handleOpenAdd}>
              <i className="bi bi-plus-lg me-1"></i>Add
            </button>
          )}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`alert alert-${message.type} py-2 mb-2 sm-alert`}>
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
        <div className={`sm-main ${showForm ? "sm-split" : ""}`}>
          {/* ── Table ── */}
          <div className="sm-table-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="sm-records">Records: {filtered.length}</span>
              <span className="sm-page-info">
                Page {page} of {totalPages}
              </span>
            </div>

            <div className="table-responsive sm-table-container">
              <table className="table table-sm table-hover align-middle sm-table">
                <thead>
                  <tr>
                    <th style={{ width: "7%" }}>Sno</th>
                    <th style={{ width: "35%" }}>Opportunity Stage</th>
                    <th style={{ width: "38%" }}>Description</th>
                    <th style={{ width: "20%" }} className="text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4">
                        <div
                          className="spinner-border spinner-border-sm me-2"
                          style={{ color: "#8B0000" }}
                        ></div>
                        Loading...
                      </td>
                    </tr>
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-3 text-muted">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((r, idx) => (
                      <tr
                        key={r.Sno}
                        onDoubleClick={() => handleRowDoubleClick(r)}
                        className={
                          selected?.Sno === r.Sno ? "sm-row-selected" : ""
                        }
                        title={canModify ? "Double-click to edit" : ""}
                      >
                        <td
                          className="text-muted"
                          style={{ fontSize: ".75rem" }}
                        >
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="sm-stage-name">{r.Opportunity_Stage}</td>
                        <td className="sm-desc-cell">
                          {r.Description || (
                            <span className="text-muted fst-italic">—</span>
                          )}
                        </td>
                        <td className="text-center">
                          {canModify ? (
                            <div
                              className={`sm-toggle ${r.Status === "Active" ? "sm-toggle-on" : "sm-toggle-off"}`}
                              onClick={() => handleToggle(r)}
                              title={`Click to set ${r.Status === "Active" ? "Inactive" : "Active"}`}
                            >
                              <div className="sm-toggle-thumb"></div>
                              <span className="sm-toggle-label">
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
            <div className="sm-form-panel">
              <h5 className="sm-form-title">
                <i
                  className={`bi ${isAdd ? "bi-plus-circle" : "bi-pencil-square"} me-2`}
                ></i>
                {isAdd ? "Add Opportunity Stage" : "Edit Opportunity Stage"}
              </h5>
              <p className="sm-form-subtitle">
                {isAdd ? (
                  <>
                    Fields marked <span className="req">*</span> are mandatory
                  </>
                ) : (
                  <>
                    <i className="bi bi-lock-fill me-1"></i>Stage name is locked
                    — edit Description only
                  </>
                )}
              </p>

              <form
                onSubmit={isAdd ? handleAdd : handleEdit}
                noValidate
                className="sm-form-scroll"
              >
                {/* Opportunity Stage */}
                <div className="mb-3">
                  <label className="form-label">
                    Opportunity Stage {isAdd && <span className="req">*</span>}
                  </label>
                  {isAdd ? (
                    <>
                      <input
                        type="text"
                        className={`form-control sm-input ${stageError ? "is-invalid" : ""}`}
                        value={stageVal}
                        onChange={(e) => setStageVal(e.target.value)}
                        placeholder="e.g. ENQUIRY"
                        maxLength={45}
                      />
                      {checking && (
                        <small className="text-muted">
                          <i className="bi bi-arrow-repeat me-1"></i>Checking...
                        </small>
                      )}
                      {stageError && (
                        <div className="invalid-feedback d-block">
                          {stageError}
                        </div>
                      )}
                      <small className="text-muted">
                        Will be saved in UPPERCASE
                      </small>
                    </>
                  ) : (
                    <input
                      type="text"
                      className="form-control sm-input sm-locked"
                      value={selected?.Opportunity_Stage || ""}
                      disabled
                    />
                  )}
                </div>

                {/* Description */}
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control sm-input"
                    rows={3}
                    value={isAdd ? descVal : editDesc}
                    onChange={(e) =>
                      isAdd
                        ? setDescVal(e.target.value)
                        : setEditDesc(e.target.value)
                    }
                    placeholder="Optional description..."
                    maxLength={150}
                    disabled={!isAdd && selected?.Status === "Inactive"}
                  />
                  <small className="text-muted">Max 150 characters</small>
                </div>

                {/* Info box — view/toggle mode */}
                {!isAdd && selected && (
                  <div className="sm-info-box">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="sm-info-label">Status</span>
                      <span
                        className={`badge ${selected.Status === "Active" ? "bg-success" : "bg-secondary"}`}
                      >
                        {selected.Status}
                      </span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="sm-info-label">Record #</span>
                      <span className="sm-info-value">#{selected.Sno}</span>
                    </div>
                    {canModify && (
                      <button
                        type="button"
                        className={`btn w-100 mt-3 ${selected.Status === "Active" ? "sm-btn-inactive" : "sm-btn-activate"}`}
                        onClick={() => handleToggle(selected)}
                      >
                        <i
                          className={`bi ${selected.Status === "Active" ? "bi-toggle-off" : "bi-toggle-on"} me-1`}
                        ></i>
                        Set{" "}
                        {selected.Status === "Active" ? "Inactive" : "Active"}
                      </button>
                    )}
                    {selected.Status === "Active" && canModify && (
                      <p className="sm-warn-hint mt-2">
                        <i className="bi bi-exclamation-triangle me-1"></i>
                        Inactive stages won't appear in quote dropdowns.
                      </p>
                    )}
                  </div>
                )}

                <div className="d-flex gap-2 mt-3">
                  <button
                    type="submit"
                    className="btn sm-btn-primary flex-fill"
                    disabled={
                      !canModify ||
                      (isAdd &&
                        (!!stageError || checking || !stageVal.trim())) ||
                      (!isAdd && selected?.Status === "Inactive")
                    }
                  >
                    <i className="bi bi-save me-1"></i>
                    {isAdd ? "Save" : "Update"}
                  </button>
                  <button
                    type="button"
                    className="btn sm-btn-outline flex-fill"
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

export default StatusMaster;

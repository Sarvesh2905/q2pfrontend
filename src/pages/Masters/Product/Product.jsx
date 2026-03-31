import React, { useCallback, useEffect, useMemo, useState } from "react";
import DashboardNavbar from "../../../components/DashboardNavbar/DashboardNavbar";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import "./Product.css";

const PAGE_SIZE = 50;

const Product = () => {
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
  const [checking, setChecking] = useState(false);
  const [prdError, setPrdError] = useState("");

  const initForm = {
    Products: "",
    Description: "",
    Facing_Factory: "",
    Prd_group: "",
  };
  const [form, setForm] = useState(initForm);

  const showMsg = (text, type) => {
    setMessage({ text, type });
    if (text) setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/products");
      setRows(res.data.data || []);
    } catch {
      showMsg("Failed to load products", "danger");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  /* Live duplicate check */
  useEffect(() => {
    if (!isAdd || !form.Products.trim()) {
      setPrdError("");
      return;
    }
    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await api.get("/products/check", {
          params: { Products: form.Products.trim() },
        });
        setPrdError(res.data.exists ? res.data.message : "");
      } catch {
        setPrdError("");
      } finally {
        setChecking(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [form.Products, isAdd]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      [r.Products, r.Description, r.Facing_Factory, r.Prd_group, r.status].some(
        (v) =>
          String(v ?? "")
            .toLowerCase()
            .includes(q),
      ),
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = useMemo(() => {
    const s = (page - 1) * PAGE_SIZE;
    return filtered.slice(s, s + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const resetForm = () => {
    setForm(initForm);
    setSelected(null);
    setIsAdd(false);
    setShowForm(false);
    setPrdError("");
    setMessage({ text: "", type: "" });
  };

  const handleOpenAdd = () => {
    if (!canModify) return;
    setForm(initForm);
    setSelected(null);
    setIsAdd(true);
    setShowForm(true);
    setPrdError("");
    setMessage({ text: "", type: "" });
  };

  const handleRowDoubleClick = (row) => {
    if (!canModify) return;
    if (row.status !== "Active") {
      showMsg(
        `Product "${row.Products}" is Inactive and cannot be edited.`,
        "warning",
      );
      return;
    }
    setSelected(row);
    setForm({
      Products: row.Products || "",
      Description: row.Description || "",
      Facing_Factory: row.Facing_Factory || "",
      Prd_group: row.Prd_group || "",
    });
    setIsAdd(false);
    setShowForm(true);
    setPrdError("");
    setMessage({ text: "", type: "" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (prdError) return;

    if (isAdd) {
      if (
        !form.Products.trim() ||
        !form.Facing_Factory.trim() ||
        !form.Prd_group.trim()
      ) {
        showMsg("Product, Facing Factory and Group are required.", "danger");
        return;
      }
    } else {
      // FIX: Facing_Factory required on edit — controller returns 400 if missing
      if (!form.Facing_Factory.trim()) {
        showMsg("Facing Factory is required.", "danger");
        return;
      }
    }

    try {
      if (isAdd) {
        await api.post("/products", form);
        showMsg("Product added successfully!", "success");
        setForm(initForm);
      } else if (selected) {
        await api.put(`/products/${selected.Sno}`, {
          Description: form.Description,
          Facing_Factory: form.Facing_Factory,
        });
        showMsg("Product updated successfully!", "success");
        setShowForm(false);
        setSelected(null);
      }
      await fetchRows();
    } catch (err) {
      showMsg(err.response?.data?.message || "Operation failed", "danger");
    }
  };

  const handleToggle = async (row) => {
    if (!canModify) return;
    try {
      const res = await api.patch(`/products/${row.Sno}/status`);
      const ns = res.data.status;
      setRows((prev) =>
        prev.map((r) => (r.Sno === row.Sno ? { ...r, status: ns } : r)),
      );
      showMsg(`Status changed to ${ns} for "${row.Products}".`, "success");
      if (selected?.Sno === row.Sno && ns !== "Active") {
        setShowForm(false);
        setSelected(null);
      }
    } catch (err) {
      showMsg(
        err.response?.data?.message || "Failed to toggle status",
        "danger",
      );
    }
  };

  return (
    <div className="prd-page">
      <DashboardNavbar />
      <div className="prd-body">
        {/* Breadcrumb */}
        <div className="prd-breadcrumb">
          <span
            onClick={() => window.history.back()}
            className="prd-crumb-link"
          >
            <i className="bi bi-chevron-left me-1"></i>Masters
          </span>
          <span className="prd-crumb-sep">/</span>
          <span className="prd-crumb-active">Product</span>
        </div>

        {/* Header */}
        <div className="prd-header">
          <div>
            <h3 className="prd-title">Product</h3>
            <p className="prd-subtitle">Manage product master data</p>
          </div>
          <span className="prd-role-pill">Role: {role}</span>
        </div>

        {/* Toolbar */}
        <div className="prd-toolbar">
          <div className="input-group prd-search">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by Product, Description, Factory, Group, Status..."
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
            <button className="btn prd-btn-primary" onClick={handleOpenAdd}>
              <i className="bi bi-plus-lg me-1"></i>Add
            </button>
          )}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`alert alert-${message.type} py-2 mb-2 prd-alert`}>
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
        <div className={`prd-main ${showForm ? "prd-split" : ""}`}>
          {/* ── Table ── */}
          <div className="prd-table-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="prd-records">Records: {filtered.length}</span>
              <span className="prd-page-info">
                Page {page} of {totalPages}
              </span>
            </div>

            <div className="table-responsive prd-table-container">
              <table className="table table-sm table-hover align-middle prd-table">
                <thead>
                  <tr>
                    <th style={{ width: "5%" }}>Sno</th>
                    <th style={{ width: "20%" }}>Product</th>
                    <th style={{ width: "28%" }}>Description</th>
                    <th style={{ width: "18%" }}>Factory</th>
                    <th style={{ width: "14%" }}>Group</th>
                    <th style={{ width: "15%" }} className="text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4">
                        <div
                          className="spinner-border spinner-border-sm me-2"
                          style={{ color: "#8B0000" }}
                        ></div>
                        Loading...
                      </td>
                    </tr>
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-3 text-muted">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((r, idx) => (
                      <tr
                        key={r.Sno}
                        onDoubleClick={() => handleRowDoubleClick(r)}
                        className={
                          selected?.Sno === r.Sno ? "prd-row-selected" : ""
                        }
                        title={canModify ? "Double-click to edit" : ""}
                      >
                        <td>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                        <td className="fw-semibold">
                          <span className="prd-name-badge">{r.Products}</span>
                        </td>
                        <td className="prd-desc-cell">
                          {r.Description || "—"}
                        </td>
                        <td>{r.Facing_Factory || "—"}</td>
                        <td>
                          <span className="prd-group-badge">{r.Prd_group}</span>
                        </td>
                        <td className="text-center">
                          {canModify ? (
                            <div
                              className={`prd-toggle ${r.status === "Active" ? "prd-toggle-on" : "prd-toggle-off"}`}
                              onClick={() => handleToggle(r)}
                              title={`Click to set ${r.status === "Active" ? "Inactive" : "Active"}`}
                            >
                              <div className="prd-toggle-thumb"></div>
                              <span className="prd-toggle-label">
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

          {/* ── Form Panel ── */}
          {showForm && (
            <div className="prd-form-panel">
              <h5 className="prd-form-title">
                <i
                  className={`bi ${isAdd ? "bi-box-seam" : "bi-pencil-square"} me-2`}
                ></i>
                {isAdd ? "Add Product" : "Edit Product"}
              </h5>
              <p className="prd-form-subtitle">
                Fields marked <span className="req">*</span> are mandatory
              </p>

              <form
                onSubmit={handleSubmit}
                noValidate
                className="prd-form-scroll"
              >
                {/* Product Name */}
                <div className="mb-2">
                  <label className="form-label">
                    Product <span className="req">*</span>
                    {isAdd && (
                      <small className="text-muted ms-1">
                        (auto-uppercase)
                      </small>
                    )}
                  </label>
                  {isAdd ? (
                    <>
                      <input
                        type="text"
                        className={`form-control prd-input ${prdError ? "is-invalid" : ""}`}
                        name="Products"
                        value={form.Products}
                        onChange={handleChange}
                        maxLength={45}
                        placeholder="e.g. VALVE"
                        required
                      />
                      {checking && (
                        <small className="text-muted">Checking...</small>
                      )}
                      {prdError && (
                        <div className="invalid-feedback d-block">
                          {prdError}
                        </div>
                      )}
                      {/* FIX B1: maxLength 45 matches timeline_target.Product varchar(45).
                          Old value was 60 — controller rejects >45 with 400. */}
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        className="form-control prd-input"
                        value={form.Products}
                        disabled
                      />
                      <small className="text-muted">
                        <i className="bi bi-lock-fill me-1"></i>Cannot be
                        changed.
                      </small>
                    </>
                  )}
                </div>

                {/* Description */}
                <div className="mb-2">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control prd-input"
                    name="Description"
                    value={form.Description}
                    onChange={handleChange}
                    rows={3}
                    maxLength={150}
                    placeholder="Optional product description"
                  />
                </div>

                {/* Facing Factory */}
                <div className="mb-2">
                  <label className="form-label">
                    Facing Factory <span className="req">*</span>
                    {isAdd && (
                      <small className="text-muted ms-1">
                        (auto-uppercase)
                      </small>
                    )}
                  </label>
                  <input
                    type="text"
                    className="form-control prd-input"
                    name="Facing_Factory"
                    value={form.Facing_Factory}
                    onChange={handleChange}
                    maxLength={45}
                    placeholder="e.g. CIRCOR"
                    required={isAdd}
                  />
                </div>

                {/* Group */}
                <div className="mb-3">
                  <label className="form-label">
                    Group <span className="req">*</span>
                    {isAdd && (
                      <small className="text-muted ms-1">
                        (auto-uppercase)
                      </small>
                    )}
                  </label>
                  {isAdd ? (
                    <input
                      type="text"
                      className="form-control prd-input"
                      name="Prd_group"
                      value={form.Prd_group}
                      onChange={handleChange}
                      maxLength={45}
                      placeholder="e.g. REGULATORS"
                      required
                    />
                  ) : (
                    <>
                      <input
                        type="text"
                        className="form-control prd-input"
                        value={form.Prd_group}
                        disabled
                      />
                      <small className="text-muted">
                        <i className="bi bi-lock-fill me-1"></i>Cannot be
                        changed.
                      </small>
                    </>
                  )}
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn prd-btn-primary flex-fill"
                    disabled={!canModify || !!prdError || checking}
                  >
                    <i className="bi bi-save me-1"></i>
                    {isAdd ? "Save" : "Update"}
                  </button>
                  <button
                    type="button"
                    className="btn prd-btn-outline flex-fill"
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

export default Product;

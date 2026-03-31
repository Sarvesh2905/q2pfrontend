import React, { useEffect, useMemo, useState } from "react";
import DashboardNavbar from "../../../components/DashboardNavbar/DashboardNavbar";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import "./Discount.css";

const PAGE_SIZE = 50;
const TYPE_OPTIONS = ["Item", "Project"];
const MARKET_OPTIONS = ["FM", "AM"];

const initForm = {
  Type: "",
  Category: "",
  Market: "",
  Product: "",
  Discount: "",
};

const Discount = () => {
  const { user } = useAuth();
  const role = user?.role || "View-only";
  const canModify = role === "Manager" || role === "Admin";

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isAdd, setIsAdd] = useState(false);
  const [form, setForm] = useState(initForm);
  const [errors, setErrors] = useState({});
  const [checking, setChecking] = useState(false);
  const [comboError, setComboError] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  const showMsg = (text, type) => {
    setMessage({ text, type });
    if (text) setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  /* ── Fetch categories on mount ── */
  useEffect(() => {
    api
      .get("/discounts/categories")
      .then((r) => setCategories(r.data || []))
      .catch(() => {});
  }, []);

  /* ── Fetch products filtered by selected category ── */
  useEffect(() => {
    if (!form.Category) {
      setProducts([]);
      return;
    }
    api
      .get("/discounts/products-by-category", {
        params: { category: form.Category },
      })
      .then((r) => setProducts(r.data || []))
      .catch(() => setProducts([]));
  }, [form.Category]);

  /* ── Fetch table rows ── */
  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await api.get("/discounts");
      setRows(res.data.data || []);
    } catch {
      showMsg("Failed to load discounts", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  /* ── Live combo uniqueness check (add only) ── */
  useEffect(() => {
    if (
      !isAdd ||
      !form.Type ||
      !form.Category ||
      !form.Market ||
      !form.Product
    ) {
      setComboError("");
      return;
    }
    const t = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await api.get("/discounts/check", {
          params: {
            Type: form.Type,
            Category: form.Category,
            Market: form.Market,
            Product: form.Product,
          },
        });
        setComboError(res.data.exists ? res.data.message : "");
      } catch {
        setComboError("");
      } finally {
        setChecking(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [form.Type, form.Category, form.Market, form.Product, isAdd]);

  /* ── Filter ── */
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      [r.Sno, r.Type, r.Category, r.Product, r.Market, r.Discount].some((v) =>
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
    setForm(initForm);
    setSelected(null);
    setIsAdd(false);
    setShowForm(false);
    setErrors({});
    setComboError("");
    setProducts([]);
    setMessage({ text: "", type: "" });
  };

  const handleOpenAdd = () => {
    if (!canModify) return;
    setForm(initForm);
    setSelected(null);
    setIsAdd(true);
    setShowForm(true);
    setErrors({});
    setComboError("");
    setProducts([]);
    setMessage({ text: "", type: "" });
  };

  /* ── Double-click → edit ── */
  const handleRowDoubleClick = (row) => {
    if (!canModify) return;
    setSelected(row);
    setForm({
      Type: row.Type || "",
      Category: row.Category || "",
      Market: row.Market || "",
      Product: row.Product || "",
      Discount: row.Discount ?? "",
    });
    setIsAdd(false);
    setShowForm(true);
    setErrors({});
    setComboError("");
    setMessage({ text: "", type: "" });
  };

  /* ── Handle change — reset Product when Category changes ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "Category") {
      setForm((prev) => ({ ...prev, Category: value, Product: "" }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  /* ── Validate ── */
  const validate = () => {
    const e = {};
    if (isAdd) {
      if (!form.Type) e.Type = "Required";
      if (!form.Category) e.Category = "Required";
      if (!form.Market) e.Market = "Required";
      if (!form.Product) e.Product = "Required";
    }
    const dv = parseFloat(form.Discount);
    if (form.Discount === "" || form.Discount === undefined) {
      e.Discount = "Required";
    } else if (isNaN(dv) || dv < 0 || dv > 100) {
      e.Discount = "Must be between 0 and 100";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit ── */
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate() || (isAdd && comboError)) return;

    try {
      if (isAdd) {
        await api.post("/discounts", form);
        showMsg("Discount added successfully!", "success");
        setForm(initForm);
        setProducts([]);
        setComboError("");
      } else {
        await api.put(`/discounts/${selected.Sno}`, {
          Discount: form.Discount,
        });
        showMsg("Discount updated successfully!", "success");
        setShowForm(false);
        setSelected(null);
      }
      await fetchRows();
    } catch (err) {
      showMsg(err.response?.data?.message || "Operation failed", "danger");
    }
  };

  /* ── Render ── */
  return (
    <div className="dis-page">
      <DashboardNavbar />
      <div className="dis-body">
        {/* Breadcrumb */}
        <div className="dis-breadcrumb">
          <span
            onClick={() => window.history.back()}
            className="dis-crumb-link"
          >
            <i className="bi bi-chevron-left me-1"></i>Masters
          </span>
          <span className="dis-crumb-sep">/</span>
          <span className="dis-crumb-active">Discount</span>
        </div>

        {/* Header */}
        <div className="dis-header">
          <div>
            <h3 className="dis-title">Discount Master</h3>
            <p className="dis-subtitle">
              Manage discount rates by type, category and product
            </p>
          </div>
          <span className="dis-role-pill">Role: {role}</span>
        </div>

        {/* Toolbar */}
        <div className="dis-toolbar">
          <div className="input-group dis-search">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by Type, Category, Product, Market, Discount..."
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
            <button className="btn dis-btn-primary" onClick={handleOpenAdd}>
              <i className="bi bi-plus-lg me-1"></i>Add
            </button>
          )}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`alert alert-${message.type} py-2 mb-2 dis-alert`}>
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
        <div className={`dis-main ${showForm ? "dis-split" : ""}`}>
          {/* ── Table ── */}
          <div className="dis-table-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="dis-records">Records: {filtered.length}</span>
              <span className="dis-page-info">
                Page {page} of {totalPages}
              </span>
            </div>

            <div className="table-responsive dis-table-container">
              <table className="table table-sm table-hover align-middle dis-table">
                <thead>
                  <tr>
                    <th style={{ width: "6%" }}>Sno</th>
                    <th style={{ width: "13%" }}>Type</th>
                    <th style={{ width: "25%" }}>Category</th>
                    <th style={{ width: "25%" }}>Product</th>
                    <th style={{ width: "10%" }}>Market</th>
                    <th style={{ width: "21%" }} className="text-end">
                      Discount%
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
                          selected?.Sno === r.Sno ? "dis-row-selected" : ""
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
                          <span
                            className={`dis-type-badge dis-type-${r.Type?.toLowerCase()}`}
                          >
                            {r.Type}
                          </span>
                        </td>
                        <td>{r.Category || "—"}</td>
                        <td>{r.Product || "—"}</td>
                        <td>
                          <span className="dis-market-badge">
                            {r.Market || "—"}
                          </span>
                        </td>
                        <td className="text-end">
                          <span className="dis-disc-value">{r.Discount}%</span>
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
            <div className="dis-form-panel">
              <h5 className="dis-form-title">
                <i
                  className={`bi ${isAdd ? "bi-plus-circle" : "bi-pencil-square"} me-2`}
                ></i>
                {isAdd ? "Add Discount" : "Edit Discount"}
              </h5>
              <p className="dis-form-subtitle">
                {isAdd ? (
                  <>
                    {" "}
                    Fields marked <span className="req">*</span> are
                    mandatory{" "}
                  </>
                ) : (
                  <>
                    {" "}
                    <i className="bi bi-lock-fill me-1"></i>Only Discount% is
                    editable{" "}
                  </>
                )}
              </p>

              <form
                onSubmit={handleSubmit}
                noValidate
                className="dis-form-scroll"
              >
                {/* Type */}
                <div className="mb-2">
                  <label className="form-label">
                    Type {isAdd && <span className="req">*</span>}
                  </label>
                  {isAdd ? (
                    <select
                      className={`form-control dis-input ${errors.Type ? "is-invalid" : ""}`}
                      name="Type"
                      value={form.Type}
                      onChange={handleChange}
                    >
                      <option value="">-- Select --</option>
                      {TYPE_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-control dis-input dis-locked"
                      value={form.Type}
                      disabled
                    />
                  )}
                  {errors.Type && (
                    <div className="invalid-feedback d-block">
                      {errors.Type}
                    </div>
                  )}
                </div>

                {/* Category */}
                <div className="mb-2">
                  <label className="form-label">
                    Category {isAdd && <span className="req">*</span>}
                  </label>
                  {isAdd ? (
                    <select
                      className={`form-control dis-input ${errors.Category ? "is-invalid" : ""}`}
                      name="Category"
                      value={form.Category}
                      onChange={handleChange}
                    >
                      <option value="">-- Select --</option>
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-control dis-input dis-locked"
                      value={form.Category}
                      disabled
                    />
                  )}
                  {errors.Category && (
                    <div className="invalid-feedback d-block">
                      {errors.Category}
                    </div>
                  )}
                </div>

                {/* Product — disabled until category is selected */}
                <div className="mb-2">
                  <label className="form-label">
                    Product {isAdd && <span className="req">*</span>}
                  </label>
                  {isAdd ? (
                    <>
                      <select
                        className={`form-control dis-input ${errors.Product ? "is-invalid" : ""}`}
                        name="Product"
                        value={form.Product}
                        onChange={handleChange}
                        disabled={!form.Category}
                      >
                        <option value="">
                          {form.Category
                            ? "-- Select Product --"
                            : "-- Select Category first --"}
                        </option>
                        {products.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      {!form.Category && (
                        <small className="text-muted">
                          <i className="bi bi-info-circle me-1"></i>Select a
                          category to load products
                        </small>
                      )}
                    </>
                  ) : (
                    <input
                      type="text"
                      className="form-control dis-input dis-locked"
                      value={form.Product}
                      disabled
                    />
                  )}
                  {errors.Product && (
                    <div className="invalid-feedback d-block">
                      {errors.Product}
                    </div>
                  )}
                </div>

                {/* Market */}
                <div className="mb-2">
                  <label className="form-label">
                    Market {isAdd && <span className="req">*</span>}
                  </label>
                  {isAdd ? (
                    <select
                      className={`form-control dis-input ${errors.Market ? "is-invalid" : ""}`}
                      name="Market"
                      value={form.Market}
                      onChange={handleChange}
                    >
                      <option value="">-- Select --</option>
                      {MARKET_OPTIONS.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-control dis-input dis-locked"
                      value={form.Market}
                      disabled
                    />
                  )}
                  {errors.Market && (
                    <div className="invalid-feedback d-block">
                      {errors.Market}
                    </div>
                  )}
                </div>

                {/* Combo duplicate warning */}
                {isAdd && comboError && (
                  <div
                    className="alert alert-danger py-2 mb-2"
                    style={{ fontSize: ".79rem" }}
                  >
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    {comboError}
                  </div>
                )}
                {isAdd && checking && !comboError && (
                  <small className="text-muted d-block mb-2">
                    <i className="bi bi-arrow-repeat me-1"></i>Checking
                    combination...
                  </small>
                )}

                {/* Discount% */}
                <div className="mb-3">
                  <label className="form-label">
                    Discount% <span className="req">*</span>
                    {!isAdd && (
                      <span className="ms-1 dis-edit-hint">(editable)</span>
                    )}
                  </label>
                  <div className="input-group">
                    <input
                      type="number"
                      className={`form-control dis-input ${errors.Discount ? "is-invalid" : ""}`}
                      name="Discount"
                      value={form.Discount}
                      onChange={handleChange}
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="e.g. 15.5"
                    />
                    <span className="input-group-text dis-pct-addon">%</span>
                  </div>
                  {errors.Discount && (
                    <div className="invalid-feedback d-block">
                      {errors.Discount}
                    </div>
                  )}
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn dis-btn-primary flex-fill"
                    disabled={
                      !canModify || (isAdd && (!!comboError || checking))
                    }
                  >
                    <i className="bi bi-save me-1"></i>
                    {isAdd ? "Save" : "Update"}
                  </button>
                  <button
                    type="button"
                    className="btn dis-btn-outline flex-fill"
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

export default Discount;

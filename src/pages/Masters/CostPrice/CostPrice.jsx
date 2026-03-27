import React, { useEffect, useMemo, useState } from "react";
import DashboardNavbar from "../../../components/DashboardNavbar/DashboardNavbar";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import "./CostPrice.css";

const PAGE_SIZE = 50;
const MARKETS = ["FM", "AM"];

const EMPTY_FORM = {
  cfti_partno: "",
  description: "",
  cost_price: "",
  currency: "",
  product: "",
  market: "",
};

const CostPrice = () => {
  const { user } = useAuth();
  const role = user?.role || "View-only";
  const canModify = role === "Manager" || role === "Admin";

  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isAdd, setIsAdd] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [cpError, setCpError] = useState("");
  const [checking, setChecking] = useState(false);

  const showMsg = (text, type) => {
    setMessage({ text, type });
    if (text) setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  /* ── Fetch rows ── */
  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await api.get("/cost-price");
      setRows(res.data.data || []);
    } catch {
      showMsg("Failed to load cost prices", "danger");
    } finally {
      setLoading(false);
    }
  };

  /* ── Fetch products dropdown ── */
  const fetchProducts = async () => {
    try {
      const res = await api.get("/cost-price/products");
      setProducts(res.data.data || []);
    } catch {
      setProducts([]);
    }
  };

  /* ── Fetch currencies from country table ── */
  const fetchCurrencies = async () => {
    try {
      const res = await api.get("/cost-price/currencies");
      setCurrencies(res.data.data || []);
    } catch {
      setCurrencies([]);
    }
  };

  useEffect(() => {
    fetchRows();
    fetchProducts();
    fetchCurrencies();
  }, []);

  /* ── Live unique check on CFTI Part No ── */
  useEffect(() => {
    if (!isAdd || !form.cfti_partno.trim()) {
      setCpError("");
      return;
    }
    const t = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await api.get("/cost-price/check", {
          params: { cftipartno: form.cfti_partno },
        });
        setCpError(res.data.exists ? res.data.message : "");
      } catch {
        setCpError("");
      } finally {
        setChecking(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [form.cfti_partno, isAdd]);

  /* ── Dynamic filter ── */
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      [
        r.Sno,
        r.Cfti_partno,
        r.Description,
        r.Cost_Price,
        r.Currency,
        r.Product,
        r.Market,
        r.status,
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

  /* ── Handlers ── */
  const resetForm = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setCpError("");
    setSelected(null);
    setIsAdd(false);
    setShowForm(false);
    setMessage({ text: "", type: "" });
  };

  const handleOpenAdd = () => {
    if (!canModify) return;
    setForm(EMPTY_FORM);
    setErrors({});
    setCpError("");
    setSelected(null);
    setIsAdd(true);
    setShowForm(true);
    setMessage({ text: "", type: "" });
  };

  const handleRowDoubleClick = (row) => {
    setSelected(row);
    setIsAdd(false);
    setShowForm(true);
    setForm({
      cfti_partno: row.Cfti_partno,
      description: row.Description || "",
      cost_price: String(row.Cost_Price),
      currency: row.Currency,
      product: row.Product,
      market: row.Market,
    });
    setErrors({});
    setCpError("");
    setMessage({ text: "", type: "" });
  };

  const handleChange = (field, val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  /* ── Validate ── */
  const validate = () => {
    const e = {};
    if (isAdd && !form.cfti_partno.trim())
      e.cfti_partno = "CFTI Part No is required";
    if (
      form.cost_price === "" ||
      isNaN(parseFloat(form.cost_price)) ||
      parseFloat(form.cost_price) < 0
    )
      e.cost_price = "Valid non-negative Cost Price is required";
    if (!form.currency.trim()) e.currency = "Currency is required";
    if (!form.product.trim()) e.product = "Product is required";
    if (!form.market.trim()) e.market = "Market is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit Add ── */
  const handleAdd = async (ev) => {
    ev.preventDefault();
    if (!validate() || cpError) return;
    try {
      await api.post("/cost-price", form);
      showMsg("Cost price added successfully!", "success");
      setForm(EMPTY_FORM);
      setCpError("");
      setErrors({});
      await fetchRows();
    } catch (err) {
      showMsg(err.response?.data?.message || "Operation failed", "danger");
    }
  };

  /* ── Submit Edit ── */
  const handleEdit = async (ev) => {
    ev.preventDefault();
    if (!validate() || !selected) return;
    try {
      await api.put(`/cost-price/${selected.Sno}`, form);
      showMsg("Cost price updated successfully!", "success");
      setRows((prev) =>
        prev.map((r) =>
          r.Sno === selected.Sno
            ? {
                ...r,
                Description: form.description || null,
                Cost_Price: parseFloat(form.cost_price),
                Currency: form.currency.toUpperCase(),
                Product: form.product.toUpperCase(),
                Market: form.market.toUpperCase(),
              }
            : r,
        ),
      );
      setSelected((prev) => ({
        ...prev,
        Description: form.description || null,
        Cost_Price: parseFloat(form.cost_price),
        Currency: form.currency.toUpperCase(),
        Product: form.product.toUpperCase(),
        Market: form.market.toUpperCase(),
      }));
    } catch (err) {
      showMsg(err.response?.data?.message || "Update failed", "danger");
    }
  };

  /* ── Toggle Status ── */
  const handleToggle = async (row) => {
    if (!canModify) return;
    const newStatus = row.status === "Active" ? "Inactive" : "Active";
    try {
      const res = await api.patch(`/cost-price/${row.Sno}/status`, {
        status: newStatus,
      });
      const ns = res.data.status;
      setRows((prev) =>
        prev.map((r) => (r.Sno === row.Sno ? { ...r, status: ns } : r)),
      );
      if (selected?.Sno === row.Sno)
        setSelected((prev) => ({ ...prev, status: ns }));
      showMsg(`Status changed to ${ns}.`, "success");
    } catch (err) {
      showMsg(err.response?.data?.message || "Toggle failed", "danger");
    }
  };

  const isInactive = !isAdd && selected?.status === "Inactive";

  return (
    <div className="cp-page">
      <DashboardNavbar />
      <div className="cp-body">
        {/* Breadcrumb */}
        <div className="cp-breadcrumb">
          <span onClick={() => window.history.back()} className="cp-crumb-link">
            <i className="bi bi-chevron-left me-1"></i>Masters
          </span>
          <span className="cp-crumb-sep">/</span>
          <span className="cp-crumb-active">Cost Price</span>
        </div>

        {/* Header */}
        <div className="cp-header">
          <div>
            <h3 className="cp-title">Cost Price Master</h3>
            <p className="cp-subtitle">
              Manage internal cost prices per CFTI part number
            </p>
          </div>
          <span className="cp-role-pill">
            <i className="bi bi-person-fill me-1"></i>Role: {role}
          </span>
        </div>

        {/* Toolbar */}
        <div className="cp-toolbar">
          <div className="input-group cp-search">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by Part No, Description, Product, Market, Currency..."
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
            <button className="btn cp-btn-primary" onClick={handleOpenAdd}>
              <i className="bi bi-plus-lg me-1"></i>Add
            </button>
          )}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`alert alert-${message.type} py-2 mb-2 cp-alert`}>
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
        <div className={`cp-main ${showForm ? "cp-split" : ""}`}>
          {/* ── Table ── */}
          <div className="cp-table-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="cp-records">Records: {filtered.length}</span>
              <span className="cp-page-info">
                Page {page} of {totalPages}
              </span>
            </div>

            <div className="table-responsive cp-table-container">
              <table className="table table-sm table-hover align-middle cp-table">
                <thead>
                  <tr>
                    <th style={{ width: "5%" }}>Sno</th>
                    <th style={{ width: "16%" }}>CFTI Part No</th>
                    <th style={{ width: "22%" }}>Description</th>
                    <th style={{ width: "11%" }} className="text-end">
                      Cost Price
                    </th>
                    <th style={{ width: "8%" }} className="text-center">
                      Currency
                    </th>
                    <th style={{ width: "14%" }}>Product</th>
                    <th style={{ width: "8%" }} className="text-center">
                      Market
                    </th>
                    <th style={{ width: "16%" }} className="text-center">
                      Status
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
                        onDoubleClick={() => handleRowDoubleClick(r)}
                        className={`
                          ${selected?.Sno === r.Sno ? "cp-row-selected" : ""}
                          ${canModify ? "cp-row-hover" : ""}
                        `}
                        title={canModify ? "Double-click to edit" : ""}
                      >
                        <td
                          className="text-muted"
                          style={{ fontSize: ".75rem" }}
                        >
                          {(page - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="cp-partno-cell">{r.Cfti_partno}</td>
                        <td className="cp-desc-cell">
                          {r.Description || (
                            <span className="text-muted fst-italic">—</span>
                          )}
                        </td>
                        <td className="text-end cp-price-cell">
                          {parseFloat(r.Cost_Price).toFixed(2)}
                        </td>
                        <td className="text-center">
                          <span className="cp-badge-curr">{r.Currency}</span>
                        </td>
                        <td>{r.Product}</td>
                        <td className="text-center">
                          <span
                            className={`cp-badge-market ${r.Market === "FM" ? "cp-fm" : "cp-am"}`}
                          >
                            {r.Market}
                          </span>
                        </td>
                        <td className="text-center">
                          {canModify ? (
                            <div
                              className={`cp-toggle ${r.status === "Active" ? "cp-toggle-on" : "cp-toggle-off"}`}
                              onClick={() => handleToggle(r)}
                              title={`Click to set ${r.status === "Active" ? "Inactive" : "Active"}`}
                            >
                              <div className="cp-toggle-thumb"></div>
                              <span className="cp-toggle-label">
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
            <div className="cp-form-panel">
              <h5 className="cp-form-title">
                <i
                  className={`bi ${isAdd ? "bi-plus-circle" : "bi-pencil-square"} me-2`}
                ></i>
                {isAdd ? "Add Cost Price" : "Edit Cost Price"}
              </h5>
              <p className="cp-form-subtitle">
                {isAdd ? (
                  <>
                    Fields marked <span className="req">*</span> are mandatory
                  </>
                ) : (
                  <>
                    <i className="bi bi-lock-fill me-1"></i>CFTI Part No is
                    locked — edit other fields only
                  </>
                )}
              </p>

              <form
                onSubmit={isAdd ? handleAdd : handleEdit}
                noValidate
                className="cp-form-scroll"
              >
                {/* CFTI Part No */}
                <div className="mb-3">
                  <label className="form-label">
                    CFTI Part No {isAdd && <span className="req">*</span>}
                  </label>
                  {isAdd ? (
                    <>
                      <input
                        type="text"
                        className={`form-control cp-input ${
                          cpError || errors.cfti_partno ? "is-invalid" : ""
                        }`}
                        value={form.cfti_partno}
                        onChange={(e) =>
                          handleChange("cfti_partno", e.target.value)
                        }
                        placeholder="e.g. CFTI-001"
                        maxLength={45}
                      />
                      {checking && (
                        <small className="text-muted">
                          <i className="bi bi-arrow-repeat me-1"></i>Checking...
                        </small>
                      )}
                      {cpError && (
                        <div className="invalid-feedback d-block">
                          {cpError}
                        </div>
                      )}
                      {errors.cfti_partno && !cpError && (
                        <div className="invalid-feedback d-block">
                          {errors.cfti_partno}
                        </div>
                      )}
                    </>
                  ) : (
                    <input
                      type="text"
                      className="form-control cp-input cp-locked"
                      value={form.cfti_partno}
                      disabled
                    />
                  )}
                </div>

                {/* Description */}
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control cp-input"
                    rows={2}
                    value={form.description}
                    onChange={(e) =>
                      handleChange("description", e.target.value)
                    }
                    placeholder="Optional description..."
                    maxLength={150}
                    disabled={isInactive}
                  />
                  <small className="text-muted">Max 150 characters</small>
                </div>

                {/* Cost Price */}
                <div className="mb-3">
                  <label className="form-label">
                    Cost Price <span className="req">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={`form-control cp-input ${errors.cost_price ? "is-invalid" : ""}`}
                    value={form.cost_price}
                    onChange={(e) => handleChange("cost_price", e.target.value)}
                    placeholder="0.00"
                    disabled={isInactive}
                  />
                  {errors.cost_price && (
                    <div className="invalid-feedback d-block">
                      {errors.cost_price}
                    </div>
                  )}
                </div>

                {/* Currency — from country table */}
                <div className="mb-3">
                  <label className="form-label">
                    Currency <span className="req">*</span>
                  </label>
                  <select
                    className={`form-select cp-input ${errors.currency ? "is-invalid" : ""}`}
                    value={form.currency}
                    onChange={(e) => handleChange("currency", e.target.value)}
                    disabled={isInactive}
                  >
                    <option value="">-- Select Currency --</option>
                    {currencies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  {errors.currency && (
                    <div className="invalid-feedback d-block">
                      {errors.currency}
                    </div>
                  )}
                </div>

                {/* Product */}
                <div className="mb-3">
                  <label className="form-label">
                    Product <span className="req">*</span>
                  </label>
                  <select
                    className={`form-select cp-input ${errors.product ? "is-invalid" : ""}`}
                    value={form.product}
                    onChange={(e) => handleChange("product", e.target.value)}
                    disabled={isInactive}
                  >
                    <option value="">-- Select Product --</option>
                    {products.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {errors.product && (
                    <div className="invalid-feedback d-block">
                      {errors.product}
                    </div>
                  )}
                </div>

                {/* Market */}
                <div className="mb-3">
                  <label className="form-label">
                    Market <span className="req">*</span>
                  </label>
                  <select
                    className={`form-select cp-input ${errors.market ? "is-invalid" : ""}`}
                    value={form.market}
                    onChange={(e) => handleChange("market", e.target.value)}
                    disabled={isInactive}
                  >
                    <option value="">-- Select Market --</option>
                    {MARKETS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  {errors.market && (
                    <div className="invalid-feedback d-block">
                      {errors.market}
                    </div>
                  )}
                </div>

                {/* Info box — edit mode */}
                {!isAdd && selected && (
                  <div className="cp-info-box mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="cp-info-label">Status</span>
                      <span
                        className={`badge ${
                          selected.status === "Active"
                            ? "bg-success"
                            : "bg-secondary"
                        }`}
                      >
                        {selected.status}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="cp-info-label">Record #</span>
                      <span className="cp-info-value">#{selected.Sno}</span>
                    </div>
                    {canModify && (
                      <button
                        type="button"
                        className={`btn w-100 mt-3 ${
                          selected.status === "Active"
                            ? "cp-btn-inactive"
                            : "cp-btn-activate"
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
                    {isInactive && (
                      <p className="cp-warn-hint mt-2 mb-0">
                        <i className="bi bi-lock-fill me-1"></i>
                        Record is Inactive. Activate it to edit.
                      </p>
                    )}
                  </div>
                )}

                <div className="d-flex gap-2 mt-2">
                  <button
                    type="submit"
                    className="btn cp-btn-primary flex-fill"
                    disabled={
                      !canModify ||
                      isInactive ||
                      (isAdd &&
                        (!!cpError || checking || !form.cfti_partno.trim()))
                    }
                  >
                    <i className="bi bi-save me-1"></i>
                    {isAdd ? "Save" : "Update"}
                  </button>
                  <button
                    type="button"
                    className="btn cp-btn-outline flex-fill"
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

export default CostPrice;

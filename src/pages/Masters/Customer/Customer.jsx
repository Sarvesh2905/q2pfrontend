import React, { useEffect, useMemo, useRef, useState } from "react";
import DashboardNavbar from "../../../components/DashboardNavbar/DashboardNavbar";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import "./Customer.css";

const PAGE_SIZE = 50;

/* ─── Searchable Select ─────────────────────────────────── */
const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder,
  disabled,
}) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const select = (opt) => {
    onChange(opt);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="cs-sel-wrap" ref={ref}>
      <div
        className={`cs-sel-trigger ${disabled ? "cs-sel-disabled" : ""} ${open ? "cs-sel-open" : ""}`}
        onClick={() => !disabled && setOpen((o) => !o)}
      >
        <span className={value ? "cs-sel-val" : "cs-sel-ph"}>
          {value || placeholder}
        </span>
        <i className={`bi bi-chevron-${open ? "up" : "down"} cs-sel-arr`}></i>
      </div>
      {open && !disabled && (
        <div className="cs-sel-drop">
          <input
            className="cs-sel-search"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
          <div className="cs-sel-list">
            {filtered.length === 0 ? (
              <div className="cs-sel-empty">No results</div>
            ) : (
              filtered.map((opt, i) => (
                <div
                  key={i}
                  className={`cs-sel-item ${value === opt ? "cs-sel-item-active" : ""}`}
                  onClick={() => select(opt)}
                >
                  {opt}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ────────────────────────────────────── */
const Customer = () => {
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

  const [typeOptions, setTypeOptions] = useState([]);
  const [countryOptions, setCountryOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [ltsaOptions, setLtsaOptions] = useState([]);
  const [addNewCatg, setAddNewCatg] = useState(false);

  const initForm = {
    customer_name: "",
    customer_type: "",
    customer_country: "",
    Address: "",
    City: "",
    State: "",
    Region: "",
    Sub_Region: "",
    Location: "",
    Category: "",
    Short_name: "",
    Ltsa_code: "",
    Segment: "INDUSTRIAL",
  };
  const [form, setForm] = useState(initForm);

  const showMsg = (text, type) => {
    setMessage({ text, type });
    if (text) setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  /* ── Fetch dropdowns ──
     FIX: each dropdown has its own isolated try/catch with correct
          endpoint, field name and fallback — one failure no longer
          silently kills all dropdowns */
  const fetchDropdowns = async (currentRows = []) => {
    /* 1. Customer types — controller returns plain string[] */
    try {
      const tRes = await api.get("/customers/dropdown/types");
      setTypeOptions((tRes.data || []).filter(Boolean).sort());
    } catch {
      setTypeOptions(
        [
          ...new Set(currentRows.map((r) => r.customer_type).filter(Boolean)),
        ].sort(),
      );
    }

    /* 2. Countries — controller returns plain string[] */
    try {
      const cRes = await api.get("/customers/dropdown/countries");
      setCountryOptions((cRes.data || []).filter(Boolean).sort());
    } catch {
      setCountryOptions(
        [
          ...new Set(
            currentRows.map((r) => r.customer_country).filter(Boolean),
          ),
        ].sort(),
      );
    }

    /* 3. Categories — from already loaded rows */
    setCategoryOptions(
      [...new Set(currentRows.map((r) => r.Category).filter(Boolean))].sort(),
    );

    /* 4. LTSA codes */
    try {
      const lRes = await api.get("/customers/dropdown/ltsa-codes");
      setLtsaOptions((lRes.data || []).filter(Boolean).sort());
    } catch {
      setLtsaOptions([]);
    }
  };

  /* ── Initial load ── */
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const res = await api.get("/customers");
        const data = res.data.data || [];
        setRows(data);
        await fetchDropdowns(data);
      } catch {
        showMsg("Failed to load customers", "danger");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  /* ── Filter ── */
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      [
        r.customer_name,
        r.Location,
        r.City,
        r.customer_country,
        r.buyers,
        r.customer_type,
        r.Region,
        r.Category,
        r.status,
      ].some((v) =>
        String(v || "")
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

  /* ── Helpers ── */
  const resetForm = () => {
    setForm(initForm);
    setSelected(null);
    setIsAdd(false);
    setShowForm(false);
    setAddNewCatg(false);
    setMessage({ text: "", type: "" });
  };

  const handleOpenAdd = () => {
    if (!canModify) return;
    setForm(initForm);
    setSelected(null);
    setIsAdd(true);
    setShowForm(true);
    setAddNewCatg(false);
    setMessage({ text: "", type: "" });
  };

  const handleRowDoubleClick = (row) => {
    if (!canModify) return;
    if (row.status !== "Active") {
      showMsg(
        `Customer "${row.customer_name}" is Inactive and cannot be edited.`,
        "warning",
      );
      return;
    }
    setSelected(row);
    setForm({
      customer_name: row.customer_name || "",
      customer_type: row.customer_type || "",
      customer_country: row.customer_country || "",
      Address: row.Address || "",
      City: row.City || "",
      State: row.State || "",
      Region: row.Region || "",
      Sub_Region: row.Sub_Region || "",
      Location: row.Location || "",
      Category: row.Category || "",
      Short_name: row.Short_name || "",
      Ltsa_code: row.Ltsa_code || "",
      Segment: "INDUSTRIAL",
    });
    setIsAdd(false);
    setShowForm(true);
    setAddNewCatg(false);
    setMessage({ text: "", type: "" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      isAdd &&
      (!form.customer_name || !form.customer_type || !form.customer_country)
    ) {
      showMsg("Customer Name, Type and Country are mandatory.", "danger");
      return;
    }
    try {
      if (isAdd) {
        await api.post("/customers", form);
        showMsg("Added successfully.", "success");
        setForm(initForm);
        setAddNewCatg(false);
      } else if (selected) {
        await api.put(`/customers/${selected.Sno}`, {
          Address: form.Address,
          City: form.City,
          State: form.State,
          Region: form.Region,
          Sub_Region: form.Sub_Region,
          Category: form.Category,
          Short_name: form.Short_name,
          Ltsa_code: form.Ltsa_code,
        });
        showMsg("Updated successfully.", "success");
        setShowForm(false);
        setSelected(null);
      }

      const res = await api.get("/customers");
      const data = res.data.data || [];
      setRows(data);
      await fetchDropdowns(data);
    } catch (err) {
      showMsg(err.response?.data?.message || "Operation failed", "danger");
    }
  };

  const handleToggle = async (row) => {
    if (!canModify) return;
    try {
      const res = await api.patch(`/customers/${row.Sno}/status`);
      const ns = res.data.status;
      setRows((prev) =>
        prev.map((r) => (r.Sno === row.Sno ? { ...r, status: ns } : r)),
      );
      showMsg(`Status changed to ${ns} for "${row.customer_name}".`, "success");
      if (selected?.Sno === row.Sno && ns !== "Active") {
        setShowForm(false);
        setSelected(null);
      }
    } catch (err) {
      showMsg(
        err.response?.data?.message || "Failed to change status",
        "danger",
      );
    }
  };

  /* ── RENDER ── */
  return (
    <div className="cst-page">
      <DashboardNavbar />
      <div className="cst-body">
        {/* Breadcrumb */}
        <div className="cst-breadcrumb">
          <span
            onClick={() => window.history.back()}
            className="cst-crumb-link"
          >
            <i className="bi bi-chevron-left me-1"></i>Masters
          </span>
          <span className="cst-crumb-sep">/</span>
          <span className="cst-crumb-active">Customer</span>
        </div>

        {/* Header */}
        <div className="cst-header">
          <div>
            <h3 className="cst-title">Customer</h3>
            <p className="cst-subtitle">Manage customer master data</p>
          </div>
          <span className="cst-role-pill">Role: {role}</span>
        </div>

        {/* Toolbar */}
        <div className="cst-toolbar">
          <div className="input-group cst-search">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by Name, Location, City, Country, Type, Category..."
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
            <button className="btn cst-btn-primary" onClick={handleOpenAdd}>
              <i className="bi bi-plus-lg me-1"></i>Add
            </button>
          )}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`alert alert-${message.type} py-2 mb-2 cst-alert`}>
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

        {/* Main layout */}
        <div className={`cst-main ${showForm ? "cst-split" : ""}`}>
          {/* ── Table ── */}
          <div className="cst-table-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="cst-records">Records: {filtered.length}</span>
              <span className="cst-page-info">
                Page {page} of {totalPages}
              </span>
            </div>

            <div className="table-responsive cst-table-container">
              <table className="table table-sm table-hover align-middle cst-table">
                <thead>
                  <tr>
                    <th style={{ width: "4%" }}>Sno</th>
                    <th style={{ width: "18%" }}>Customer Name</th>
                    <th style={{ width: "10%" }}>Location</th>
                    <th style={{ width: "9%" }}>City</th>
                    <th style={{ width: "9%" }}>Country</th>
                    <th style={{ width: "15%" }}>Buyers</th>
                    <th style={{ width: "9%" }}>Cust_Type</th>
                    <th style={{ width: "9%" }}>Region</th>
                    <th style={{ width: "9%" }}>Category</th>
                    <th style={{ width: "8%" }} className="text-center">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="text-center py-4">
                        <div
                          className="spinner-border spinner-border-sm me-2"
                          style={{ color: "#8B0000" }}
                        ></div>
                        Loading...
                      </td>
                    </tr>
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-3 text-muted">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((r, idx) => (
                      <tr
                        key={r.Sno}
                        onDoubleClick={() => handleRowDoubleClick(r)}
                        className={
                          selected?.Sno === r.Sno ? "cst-row-selected" : ""
                        }
                      >
                        <td>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                        <td className="fw-semibold">{r.customer_name}</td>
                        <td>{r.Location || "—"}</td>
                        <td>{r.City || "—"}</td>
                        <td>{r.customer_country || "—"}</td>
                        <td>
                          {r.buyers ? (
                            r.buyers.split(", ").map((b, i) => (
                              <span key={i} className="cst-buyer-tag">
                                {b}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>{r.customer_type || "—"}</td>
                        <td>{r.Region || "—"}</td>
                        <td>{r.Category || "—"}</td>
                        <td className="text-center">
                          {canModify ? (
                            <div
                              className={`cst-toggle ${
                                r.status === "Active"
                                  ? "cst-toggle-on"
                                  : "cst-toggle-off"
                              }`}
                              onClick={() => handleToggle(r)}
                              title={`Click to set ${
                                r.status === "Active" ? "Inactive" : "Active"
                              }`}
                            >
                              <div className="cst-toggle-thumb"></div>
                              <span className="cst-toggle-label">
                                {r.status}
                              </span>
                            </div>
                          ) : (
                            <span
                              className={`badge ${
                                r.status === "Active"
                                  ? "bg-success"
                                  : "bg-secondary"
                              }`}
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
            <div className="cst-form-panel">
              <h5 className="cst-form-title">
                <i
                  className={`bi ${
                    isAdd ? "bi-building-add" : "bi-pencil-square"
                  } me-2`}
                ></i>
                {isAdd ? "Add Customer" : "Edit Customer"}
              </h5>
              <p className="cst-form-subtitle">
                Fields marked <span className="req">*</span> are mandatory
              </p>

              <form
                onSubmit={handleSubmit}
                noValidate
                className="cst-form-scroll"
              >
                {/* Customer Name */}
                <div className="mb-2">
                  <label className="form-label">
                    Customer Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control cst-input"
                    name="customer_name"
                    value={form.customer_name}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    disabled={!isAdd}
                    required={isAdd}
                  />
                  {!isAdd && (
                    <small className="text-muted">
                      <i className="bi bi-lock-fill me-1"></i>Cannot be changed.
                    </small>
                  )}
                </div>

                {/* Customer Type */}
                <div className="mb-2">
                  <label className="form-label">
                    Customer Type <span className="req">*</span>
                  </label>
                  {isAdd ? (
                    <SearchableSelect
                      options={typeOptions}
                      value={form.customer_type}
                      onChange={(v) =>
                        setForm((p) => ({ ...p, customer_type: v }))
                      }
                      placeholder="-- Select Type --"
                    />
                  ) : (
                    <>
                      <input
                        type="text"
                        className="form-control cst-input"
                        value={form.customer_type}
                        disabled
                      />
                      <small className="text-muted">
                        <i className="bi bi-lock-fill me-1"></i>Cannot be
                        changed.
                      </small>
                    </>
                  )}
                </div>

                {/* Country */}
                <div className="mb-2">
                  <label className="form-label">
                    Country <span className="req">*</span>
                  </label>
                  {isAdd ? (
                    <SearchableSelect
                      options={countryOptions}
                      value={form.customer_country}
                      onChange={(v) =>
                        setForm((p) => ({ ...p, customer_country: v }))
                      }
                      placeholder="-- Select Country --"
                    />
                  ) : (
                    <>
                      <input
                        type="text"
                        className="form-control cst-input"
                        value={form.customer_country}
                        disabled
                      />
                      <small className="text-muted">
                        <i className="bi bi-lock-fill me-1"></i>Cannot be
                        changed.
                      </small>
                    </>
                  )}
                </div>

                {/* Location */}
                <div className="mb-2">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-control cst-input"
                    name="Location"
                    value={form.Location}
                    onChange={handleChange}
                    placeholder="Enter location / division"
                    disabled={!isAdd}
                  />
                  {!isAdd && (
                    <small className="text-muted">
                      <i className="bi bi-lock-fill me-1"></i>Cannot be changed.
                    </small>
                  )}
                </div>

                {/* Address */}
                <div className="mb-2">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-control cst-input"
                    name="Address"
                    rows={2}
                    value={form.Address}
                    onChange={handleChange}
                    placeholder="Enter address (optional)"
                    maxLength={250}
                  />
                </div>

                {/* City */}
                <div className="mb-2">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-control cst-input"
                    name="City"
                    value={form.City}
                    onChange={handleChange}
                    placeholder="Enter city"
                  />
                </div>

                {/* State */}
                <div className="mb-2">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    className="form-control cst-input"
                    name="State"
                    value={form.State}
                    onChange={handleChange}
                    placeholder="Enter state"
                  />
                </div>

                {/* Region */}
                <div className="mb-2">
                  <label className="form-label">Region</label>
                  <input
                    type="text"
                    className="form-control cst-input"
                    name="Region"
                    value={form.Region}
                    onChange={handleChange}
                    placeholder="Enter region"
                  />
                </div>

                {/* Sub Region */}
                <div className="mb-2">
                  <label className="form-label">Sub Region</label>
                  <input
                    type="text"
                    className="form-control cst-input"
                    name="Sub_Region"
                    value={form.Sub_Region}
                    onChange={handleChange}
                    placeholder="Enter sub region"
                  />
                </div>

                {/* Category with add-new checkbox */}
                <div className="mb-2">
                  <label className="form-label">Category</label>
                  {!addNewCatg ? (
                    <SearchableSelect
                      options={categoryOptions}
                      value={form.Category}
                      onChange={(v) => setForm((p) => ({ ...p, Category: v }))}
                      placeholder="-- Select Category --"
                    />
                  ) : (
                    <input
                      type="text"
                      className="form-control cst-input"
                      name="Category"
                      value={form.Category}
                      onChange={handleChange}
                      placeholder="Type new category name"
                    />
                  )}
                  <div className="cst-catg-check mt-1">
                    <input
                      type="checkbox"
                      id="addNewCatg"
                      checked={addNewCatg}
                      onChange={(e) => {
                        setAddNewCatg(e.target.checked);
                        setForm((p) => ({ ...p, Category: "" }));
                      }}
                    />
                    <label htmlFor="addNewCatg" className="ms-2">
                      Add new category
                    </label>
                  </div>
                </div>

                {/* Short Name */}
                <div className="mb-2">
                  <label className="form-label">Short Name</label>
                  <input
                    type="text"
                    className="form-control cst-input"
                    name="Short_name"
                    value={form.Short_name}
                    onChange={handleChange}
                    placeholder="Enter short name"
                    maxLength={90}
                  />
                </div>

                {/* Segment — always INDUSTRIAL, locked */}
                <div className="mb-2">
                  <label className="form-label">Segment</label>
                  <input
                    type="text"
                    className="form-control cst-input"
                    value="INDUSTRIAL"
                    disabled
                  />
                  <small className="text-muted">
                    <i className="bi bi-lock-fill me-1"></i>Fixed as INDUSTRIAL.
                  </small>
                </div>

                {/* LTSA Code */}
                <div className="mb-3">
                  <label className="form-label">LTSA Code</label>
                  <SearchableSelect
                    options={ltsaOptions}
                    value={form.Ltsa_code}
                    onChange={(v) => setForm((p) => ({ ...p, Ltsa_code: v }))}
                    placeholder="-- Select LTSA Code --"
                  />
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn cst-btn-primary flex-fill"
                    disabled={!canModify}
                  >
                    <i className="bi bi-save me-1"></i>
                    {isAdd ? "Save" : "Update"}
                  </button>
                  <button
                    type="button"
                    className="btn cst-btn-outline flex-fill"
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

export default Customer;

import React, { useEffect, useMemo, useState } from "react";
import DashboardNavbar from "../../../components/DashboardNavbar/DashboardNavbar";
import { useAuth } from "../../../context/AuthContext";
import api from "../../../services/api";
import "./Country.css";

const PAGE_SIZE = 50;

const Country = () => {
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

  const initForm = {
    Country_code: "",
    Country_name: "",
    Region: "",
    Currency: "",
    Currency_Name: "",
    Conversion_rate: "",
  };
  const [form, setForm] = useState(initForm);
  const [codeError, setCodeError] = useState("");

  const showMsg = (text, type) => {
    setMessage({ text, type });
    if (text) setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await api.get("/countries");
      setRows(res.data.data || []);
    } catch {
      showMsg("Failed to load countries", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
  }, []);

  /* Live duplicate check on Country_code */
  useEffect(() => {
    if (!isAdd || !form.Country_code.trim()) {
      setCodeError("");
      return;
    }
    const timer = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await api.get("/countries/check", {
          params: { Country_code: form.Country_code.trim() },
        });
        setCodeError(res.data.exists ? res.data.message : "");
      } catch {
        setCodeError("");
      } finally {
        setChecking(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [form.Country_code, isAdd]);

  /* Filter */
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      [
        r.Country_code,
        r.Country_name,
        r.Region,
        r.Currency,
        r.Currency_Name,
        r.Conversion_rate,
        r.status,
      ].some((v) =>
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
    setCodeError("");
    setMessage({ text: "", type: "" });
  };

  const handleOpenAdd = () => {
    if (!canModify) return;
    setForm(initForm);
    setSelected(null);
    setIsAdd(true);
    setShowForm(true);
    setCodeError("");
    setMessage({ text: "", type: "" });
  };

  const handleRowDoubleClick = (row) => {
    if (!canModify) return;
    if (row.status !== "Active") {
      showMsg(
        `Country "${row.Country_name}" is Inactive and cannot be edited.`,
        "warning",
      );
      return;
    }
    setSelected(row);
    setForm({
      Country_code: row.Country_code || "",
      Country_name: row.Country_name || "",
      Region: row.Region || "",
      Currency: row.Currency || "",
      Currency_Name: row.Currency_Name || "",
      Conversion_rate: row.Conversion_rate ?? "",
    });
    setIsAdd(false);
    setShowForm(true);
    setCodeError("");
    setMessage({ text: "", type: "" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (codeError) return;

    if (isAdd) {
      const { Country_code, Country_name, Currency, Conversion_rate } = form;
      if (!Country_code || !Country_name || !Currency || !Conversion_rate) {
        showMsg(
          "Country Code, Name, Currency and Conversion Rate are required.",
          "danger",
        );
        return;
      }
    }

    try {
      if (isAdd) {
        await api.post("/countries", form);
        showMsg("Country added successfully!", "success");
        setForm(initForm);
      } else if (selected) {
        await api.put(`/countries/${selected.Sno}`, {
          Region: form.Region,
          Currency_Name: form.Currency_Name,
          Conversion_rate: form.Conversion_rate,
        });
        showMsg("Country updated successfully!", "success");
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
      const res = await api.patch(`/countries/${row.Sno}/status`);
      const ns = res.data.status;
      setRows((prev) =>
        prev.map((r) => (r.Sno === row.Sno ? { ...r, status: ns } : r)),
      );
      showMsg(`Status changed to ${ns} for "${row.Country_name}".`, "success");
      if (selected?.Sno === row.Sno && ns !== "Active") {
        setShowForm(false);
        setSelected(null);
      }
    } catch (err) {
      showMsg(err.response?.data?.message || "Failed", "danger");
    }
  };

  return (
    <div className="cty-page">
      <DashboardNavbar />
      <div className="cty-body">
        {/* Breadcrumb */}
        <div className="cty-breadcrumb">
          <span
            onClick={() => window.history.back()}
            className="cty-crumb-link"
          >
            <i className="bi bi-chevron-left me-1"></i>Masters
          </span>
          <span className="cty-crumb-sep">/</span>
          <span className="cty-crumb-active">Country</span>
        </div>

        {/* Header */}
        <div className="cty-header">
          <div>
            <h3 className="cty-title">Country</h3>
            <p className="cty-subtitle">Manage country master data</p>
          </div>
          <span className="cty-role-pill">Role: {role}</span>
        </div>

        {/* Toolbar */}
        <div className="cty-toolbar">
          <div className="input-group cty-search">
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by Code, Name, Region, Currency, Conversion..."
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
            <button className="btn cty-btn-primary" onClick={handleOpenAdd}>
              <i className="bi bi-plus-lg me-1"></i>Add
            </button>
          )}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`alert alert-${message.type} py-2 mb-2 cty-alert`}>
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
        <div className={`cty-main ${showForm ? "cty-split" : ""}`}>
          {/* ── Table ── */}
          <div className="cty-table-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="cty-records">Records: {filtered.length}</span>
              <span className="cty-page-info">
                Page {page} of {totalPages}
              </span>
            </div>

            <div className="table-responsive cty-table-container">
              <table className="table table-sm table-hover align-middle cty-table">
                <thead>
                  <tr>
                    <th style={{ width: "4%" }}>Sno</th>
                    <th style={{ width: "10%" }}>Country Code</th>
                    <th style={{ width: "18%" }}>Country Name</th>
                    <th style={{ width: "14%" }}>Region</th>
                    <th style={{ width: "10%" }}>Currency</th>
                    <th style={{ width: "16%" }}>Currency Name</th>
                    <th style={{ width: "14%" }}>Conversion to USD</th>
                    <th style={{ width: "14%" }} className="text-center">
                      Action
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
                        className={
                          selected?.Sno === r.Sno ? "cty-row-selected" : ""
                        }
                        title="Double-click to edit"
                      >
                        <td>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                        <td>
                          <span className="cty-code-badge">
                            {r.Country_code}
                          </span>
                        </td>
                        <td className="fw-semibold">{r.Country_name}</td>
                        <td>{r.Region || "—"}</td>
                        <td>
                          <span className="cty-curr-badge">{r.Currency}</span>
                        </td>
                        <td>{r.Currency_Name || "—"}</td>
                        <td className="text-end pe-3">{r.Conversion_rate}</td>
                        <td className="text-center">
                          {canModify ? (
                            <div
                              className={`cty-toggle ${r.status === "Active" ? "cty-toggle-on" : "cty-toggle-off"}`}
                              onClick={() => handleToggle(r)}
                              title={`Click to set ${r.status === "Active" ? "Inactive" : "Active"}`}
                            >
                              <div className="cty-toggle-thumb"></div>
                              <span className="cty-toggle-label">
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
            <div className="cty-form-panel">
              <h5 className="cty-form-title">
                <i
                  className={`bi ${isAdd ? "bi-globe-americas" : "bi-pencil-square"} me-2`}
                ></i>
                {isAdd ? "Add Country" : "Edit Country"}
              </h5>
              <p className="cty-form-subtitle">
                Fields marked <span className="req">*</span> are mandatory
              </p>

              <form
                onSubmit={handleSubmit}
                noValidate
                className="cty-form-scroll"
              >
                {/* Country Code */}
                <div className="mb-2">
                  <label className="form-label">
                    Country Code <span className="req">*</span>
                    {isAdd && (
                      <small className="text-muted ms-1">
                        (max 3 letters, auto-uppercase)
                      </small>
                    )}
                  </label>
                  {isAdd ? (
                    <>
                      <input
                        type="text"
                        className={`form-control cty-input ${codeError ? "is-invalid" : ""}`}
                        name="Country_code"
                        value={form.Country_code}
                        onChange={handleChange}
                        maxLength={3}
                        placeholder="e.g. IND"
                        required
                      />
                      {checking && (
                        <small className="text-muted">Checking...</small>
                      )}
                      {codeError && (
                        <div className="invalid-feedback d-block">
                          {codeError}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        className="form-control cty-input"
                        value={form.Country_code}
                        disabled
                      />
                      <small className="text-muted">
                        <i className="bi bi-lock-fill me-1"></i>Cannot be
                        changed.
                      </small>
                    </>
                  )}
                </div>

                {/* Country Name */}
                <div className="mb-2">
                  <label className="form-label">
                    Country Name <span className="req">*</span>
                  </label>
                  {isAdd ? (
                    <input
                      type="text"
                      className="form-control cty-input"
                      name="Country_name"
                      value={form.Country_name}
                      onChange={handleChange}
                      placeholder="e.g. India"
                      required
                    />
                  ) : (
                    <>
                      <input
                        type="text"
                        className="form-control cty-input"
                        value={form.Country_name}
                        disabled
                      />
                      <small className="text-muted">
                        <i className="bi bi-lock-fill me-1"></i>Cannot be
                        changed.
                      </small>
                    </>
                  )}
                </div>

                {/* Region */}
                <div className="mb-2">
                  <label className="form-label">Region</label>
                  <input
                    type="text"
                    className="form-control cty-input"
                    name="Region"
                    value={form.Region}
                    onChange={handleChange}
                    placeholder="e.g. South Asia"
                  />
                </div>

                {/* Currency */}
                <div className="mb-2">
                  <label className="form-label">
                    Currency <span className="req">*</span>
                    {isAdd && (
                      <small className="text-muted ms-1">(max 3 letters)</small>
                    )}
                  </label>
                  {isAdd ? (
                    <input
                      type="text"
                      className="form-control cty-input"
                      name="Currency"
                      value={form.Currency}
                      onChange={handleChange}
                      maxLength={3}
                      placeholder="e.g. INR"
                      required
                    />
                  ) : (
                    <>
                      <input
                        type="text"
                        className="form-control cty-input"
                        value={form.Currency}
                        disabled
                      />
                      <small className="text-muted">
                        <i className="bi bi-lock-fill me-1"></i>Cannot be
                        changed.
                      </small>
                    </>
                  )}
                </div>

                {/* Currency Name */}
                <div className="mb-2">
                  <label className="form-label">Currency Name</label>
                  <input
                    type="text"
                    className="form-control cty-input"
                    name="Currency_Name"
                    value={form.Currency_Name}
                    onChange={handleChange}
                    placeholder="e.g. Indian Rupee"
                  />
                </div>

                {/* Conversion Rate */}
                <div className="mb-3">
                  <label className="form-label">
                    Conversion to USD <span className="req">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control cty-input"
                    name="Conversion_rate"
                    value={form.Conversion_rate}
                    onChange={handleChange}
                    placeholder="e.g. 83.5"
                    step="any"
                    min="0"
                    required
                  />
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn cty-btn-primary flex-fill"
                    disabled={!canModify || !!codeError || checking}
                  >
                    <i className="bi bi-save me-1"></i>
                    {isAdd ? "Save" : "Update"}
                  </button>
                  <button
                    type="button"
                    className="btn cty-btn-outline flex-fill"
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

export default Country;

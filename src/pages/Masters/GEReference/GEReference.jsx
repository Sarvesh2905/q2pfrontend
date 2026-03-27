import React, { useEffect, useMemo, useState } from 'react';
import DashboardNavbar from '../../../components/DashboardNavbar/DashboardNavbar';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import './GEReference.css';

const PAGE_SIZE = 50;

const initForm = { Customer_partno: '', Cfti_partno: '' };

const GEReference = () => {
  const { user }   = useAuth();
  const role       = user?.role || 'View-only';
  const canModify  = role === 'Manager' || role === 'Admin';

  const [rows,     setRows]     = useState([]);
  const [search,   setSearch]   = useState('');
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [isAdd,    setIsAdd]    = useState(false);
  const [form,     setForm]     = useState(initForm);
  const [errors,   setErrors]   = useState({});
  const [checking, setChecking] = useState(false);
  const [pairError,setPairError]= useState('');
  const [message,  setMessage]  = useState({ text: '', type: '' });

  const showMsg = (text, type) => {
    setMessage({ text, type });
    if (text) setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  /* ── Fetch all rows ── */
  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await api.get('/ge-references');
      setRows(res.data.data || []);
    } catch {
      showMsg('Failed to load references', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRows(); }, []);

  /* ── Live pair duplicate check ── */
  useEffect(() => {
    if (!isAdd || !form.Customer_partno.trim() || !form.Cfti_partno.trim()) {
      setPairError(''); return;
    }
    const t = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await api.get('/ge-references/check', {
          params: { Customer_partno: form.Customer_partno, Cfti_partno: form.Cfti_partno }
        });
        setPairError(res.data.exists ? res.data.message : '');
      } catch {
        setPairError('');
      } finally {
        setChecking(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [form.Customer_partno, form.Cfti_partno, isAdd]);

  /* ── Dynamic search ── */
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(r =>
      [r.Customer_partno, r.Cfti_partno, r.status]
        .some(v => String(v ?? '').toLowerCase().includes(q))
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows   = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  useEffect(() => { setPage(1); }, [search]);

  /* ── Reset ── */
  const resetForm = () => {
    setForm(initForm);
    setSelected(null);
    setIsAdd(false);
    setShowForm(false);
    setErrors({});
    setPairError('');
    setMessage({ text: '', type: '' });
  };

  const handleOpenAdd = () => {
    if (!canModify) return;
    setForm(initForm);
    setSelected(null);
    setIsAdd(true);
    setShowForm(true);
    setErrors({});
    setPairError('');
    setMessage({ text: '', type: '' });
  };

  /* ── Double-click row → view/info panel ── */
  const handleRowDoubleClick = (row) => {
    if (!canModify) return;
    if (row.status !== 'Active') {
      showMsg(`Reference "${row.Customer_partno} / ${row.Cfti_partno}" is Inactive.`, 'warning');
      return;
    }
    setSelected(row);
    setForm({ Customer_partno: row.Customer_partno, Cfti_partno: row.Cfti_partno });
    setIsAdd(false);
    setShowForm(true);
    setErrors({});
    setPairError('');
    setMessage({ text: '', type: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  /* ── Validate ── */
  const validate = () => {
    const e = {};
    if (!form.Customer_partno.trim()) e.Customer_partno = 'Customer PN is required';
    if (!form.Cfti_partno.trim())     e.Cfti_partno     = 'CFTI PN is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit (Add only — no edit fields exist in schema) ── */
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate() || pairError) return;

    try {
      await api.post('/ge-references', form);
      showMsg('Reference created successfully!', 'success');
      setForm(initForm);
      setPairError('');
      await fetchRows();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Operation failed', 'danger');
    }
  };

  /* ── Toggle status ── */
  const handleToggle = async (row) => {
    if (!canModify) return;
    try {
      const res = await api.patch(`/ge-references/${row.Sno}/status`);
      const ns  = res.data.status;
      setRows(prev => prev.map(r => r.Sno === row.Sno ? { ...r, status: ns } : r));
      showMsg(`Status changed to ${ns}.`, 'success');
      if (selected?.Sno === row.Sno && ns !== 'Active') { setShowForm(false); setSelected(null); }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Toggle failed', 'danger');
    }
  };

  const activeCount   = rows.filter(r => r.status === 'Active').length;
  const inactiveCount = rows.filter(r => r.status !== 'Active').length;

  return (
    <div className="ger-page">
      <DashboardNavbar />
      <div className="ger-body">

        {/* Breadcrumb */}
        <div className="ger-breadcrumb">
          <span onClick={() => window.history.back()} className="ger-crumb-link">
            <i className="bi bi-chevron-left me-1"></i>Masters
          </span>
          <span className="ger-crumb-sep">/</span>
          <span className="ger-crumb-active">GE Reference</span>
        </div>

        {/* Header */}
        <div className="ger-header">
          <div>
            <h3 className="ger-title">GE Reference</h3>
            <p className="ger-subtitle">Manage part number references</p>
          </div>
          <span className="ger-role-pill">Role: {role}</span>
        </div>

        {/* Toolbar */}
        <div className="ger-toolbar">
          <div className="input-group ger-search">
            <span className="input-group-text"><i className="bi bi-search"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by Customer PN, CFTI PN, Status..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="btn btn-outline-secondary" onClick={() => setSearch('')}>
                <i className="bi bi-x"></i>
              </button>
            )}
          </div>
          {canModify && (
            <button className="btn ger-btn-primary" onClick={handleOpenAdd}>
              <i className="bi bi-plus-lg me-1"></i>Add
            </button>
          )}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`alert alert-${message.type} py-2 mb-2 ger-alert`}>
            {message.type === 'success' && <i className="bi bi-check-circle me-2"></i>}
            {message.type === 'danger'  && <i className="bi bi-exclamation-triangle me-2"></i>}
            {message.type === 'warning' && <i className="bi bi-info-circle me-2"></i>}
            {message.text}
          </div>
        )}

        {/* Main split layout */}
        <div className={`ger-main ${showForm ? 'ger-split' : ''}`}>

          {/* ── Table ── */}
          <div className="ger-table-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="ger-records">Records: {filtered.length}</span>
              <span className="ger-page-info">Page {page} of {totalPages}</span>
            </div>

            <div className="table-responsive ger-table-container">
              <table className="table table-sm table-hover align-middle ger-table">
                <thead>
                  <tr>
                    <th style={{ width: '5%'  }}>Sno</th>
                    <th style={{ width: '38%' }}>Customer_partno</th>
                    <th style={{ width: '38%' }}>Cfti_partno</th>
                    <th style={{ width: '19%' }} className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4">
                        <div className="spinner-border spinner-border-sm me-2"
                          style={{ color: '#8B0000' }}></div>
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
                        className={selected?.Sno === r.Sno ? 'ger-row-selected' : ''}
                        title={canModify ? 'Double-click to view details' : ''}
                      >
                        <td>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                        <td>
                          <span className="ger-custpn-badge">{r.Customer_partno}</span>
                        </td>
                        <td>
                          <span className="ger-cftipn-badge">{r.Cfti_partno}</span>
                        </td>
                        <td className="text-center">
                          {canModify ? (
                            <div
                              className={`ger-toggle ${r.status === 'Active' ? 'ger-toggle-on' : 'ger-toggle-off'}`}
                              onClick={() => handleToggle(r)}
                              title={`Click to set ${r.status === 'Active' ? 'Inactive' : 'Active'}`}
                            >
                              <div className="ger-toggle-thumb"></div>
                              <span className="ger-toggle-label">{r.status}</span>
                            </div>
                          ) : (
                            <span className={`badge ${r.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
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
              <button className="btn btn-sm btn-outline-secondary"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}>
                <i className="bi bi-chevron-left"></i> Prev
              </button>
              <div className="small text-muted">
                Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
                –{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </div>
              <button className="btn btn-sm btn-outline-secondary"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                Next <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>

          {/* ── Form / Info Panel ── */}
          {showForm && (
            <div className="ger-form-panel">
              <h5 className="ger-form-title">
                <i className={`bi ${isAdd ? 'bi-plus-circle' : 'bi-info-circle'} me-2`}></i>
                {isAdd ? 'Add Reference' : 'Reference Info'}
              </h5>
              <p className="ger-form-subtitle">
                {isAdd
                  ? <>Fields marked <span className="req">*</span> are mandatory</>
                  : <><i className="bi bi-lock-fill me-1"></i>Both fields are locked — toggle status to change</>
                }
              </p>

              <form onSubmit={isAdd ? handleSubmit : (e) => e.preventDefault()}
                noValidate className="ger-form-scroll">

                {/* Customer PN */}
                <div className="mb-3">
                  <label className="form-label">
                    Customer PN {isAdd && <span className="req">*</span>}
                  </label>
                  {isAdd ? (
                    <input
                      type="text"
                      className={`form-control ger-input ${errors.Customer_partno ? 'is-invalid' : ''}`}
                      name="Customer_partno"
                      value={form.Customer_partno}
                      onChange={handleChange}
                      maxLength={36}
                      placeholder="e.g. GE-VALVE-001"
                      autoComplete="off"
                    />
                  ) : (
                    <input type="text" className="form-control ger-input ger-locked"
                      value={form.Customer_partno} disabled />
                  )}
                  {errors.Customer_partno &&
                    <div className="invalid-feedback d-block">{errors.Customer_partno}</div>}
                </div>

                {/* CFTI PN */}
                <div className="mb-3">
                  <label className="form-label">
                    CFTI PN {isAdd && <span className="req">*</span>}
                  </label>
                  {isAdd ? (
                    <input
                      type="text"
                      className={`form-control ger-input ${errors.Cfti_partno || pairError ? 'is-invalid' : ''}`}
                      name="Cfti_partno"
                      value={form.Cfti_partno}
                      onChange={handleChange}
                      maxLength={18}
                      placeholder="e.g. CFTI-001-A"
                      autoComplete="off"
                    />
                  ) : (
                    <input type="text" className="form-control ger-input ger-locked"
                      value={form.Cfti_partno} disabled />
                  )}
                  {errors.Cfti_partno &&
                    <div className="invalid-feedback d-block">{errors.Cfti_partno}</div>}
                </div>

                {/* Pair duplicate error */}
                {pairError && (
                  <div className="alert alert-danger py-2 mb-3" style={{ fontSize: '.8rem' }}>
                    <i className="bi bi-exclamation-triangle me-1"></i>{pairError}
                    {checking && <span className="ms-2 text-muted">Checking...</span>}
                  </div>
                )}
                {checking && !pairError && (
                  <small className="text-muted d-block mb-2">
                    <i className="bi bi-arrow-repeat me-1"></i>Checking pair uniqueness...
                  </small>
                )}

                {/* Info for edit mode — current status */}
                {!isAdd && selected && (
                  <div className="ger-info-box">
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="ger-info-label">Current Status</span>
                      <span className={`badge ${selected.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                        {selected.status}
                      </span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mt-2">
                      <span className="ger-info-label">Sno</span>
                      <span className="ger-info-value">#{selected.Sno}</span>
                    </div>
                    <p className="ger-info-hint mt-2">
                      <i className="bi bi-info-circle me-1"></i>
                      Use the toggle in the table row to change status.
                    </p>
                  </div>
                )}

                <div className="d-flex gap-2 mt-3">
                  {isAdd && (
                    <button
                      type="submit"
                      className="btn ger-btn-primary flex-fill"
                      disabled={!canModify || !!pairError || checking}
                    >
                      <i className="bi bi-save me-1"></i>Save
                    </button>
                  )}
                  <button type="button" className="btn ger-btn-outline flex-fill" onClick={resetForm}>
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

export default GEReference;
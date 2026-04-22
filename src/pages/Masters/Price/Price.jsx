import React, { useEffect, useMemo, useRef, useState } from 'react';
import DashboardNavbar from '../../../components/DashboardNavbar/DashboardNavbar';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import './Price.css';

const PAGE_SIZE = 50;

const CURRENCY_OPTIONS = ['USD', 'INR', 'EUR'];
const MARKET_OPTIONS   = ['FM', 'AM'];

const initStdForm = {
  Customer_partno: '', Cfti_partno: '', Description: '',
  ListPrice: '', Start_Date: '', Exp_Date: '',
  Curr: '', Leadtime: '', DeliveryTerm: '', Product: '', Market: ''
};

const initLtsaForm = {
  LTSA_Code: '', Customer_partno: '', Cfti_partno: '', Description: '',
  SplPrice: '', Start_Date: '', Exp_Date: '',
  Curr: '', Leadtime: '', DeliveryTerm: '', Product: '', Market: ''
};

const Price = () => {
  const { user }   = useAuth();
  const role       = user?.role || 'View-only';
  const canModify  = role === 'Manager' || role === 'Admin';

  const [isLtsa,        setIsLtsa]        = useState(false);
  const [rows,          setRows]          = useState([]);
  const [search,        setSearch]        = useState('');
  const [page,          setPage]          = useState(1);
  const [loading,       setLoading]       = useState(false);
  const [selected,      setSelected]      = useState(null);
  const [showForm,      setShowForm]      = useState(false);
  const [isAdd,         setIsAdd]         = useState(false);
  const [message,       setMessage]       = useState({ text: '', type: '' });
  const [checking,      setChecking]      = useState(false);
  const [errors,        setErrors]        = useState({});
  const [form,          setForm]          = useState(initStdForm);

  /* ── Upload / Download state ── */
  const [uploading,     setUploading]     = useState(false);
  const [uploadResult,  setUploadResult]  = useState(null);
  const [showErrDetail, setShowErrDetail] = useState(false);
  const [dlOpen,        setDlOpen]        = useState(false);

  const fileInputRef  = useRef(null);
  const dlDropdownRef = useRef(null);

  /* Close download dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (dlDropdownRef.current && !dlDropdownRef.current.contains(e.target))
        setDlOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const showMsg = (text, type) => {
    setMessage({ text, type });
    if (text) setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  /* ── Fetch rows ── */
  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await api.get(isLtsa ? '/prices/ltsa' : '/prices/standard');
      setRows(res.data.data || []);
    } catch {
      showMsg('Failed to load prices', 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    setSearch('');
    setPage(1);
    setShowForm(false);
    setSelected(null);
    setUploadResult(null);
  }, [isLtsa]);

  /* ── Auto-fetch next LTSA code on add ── */
  useEffect(() => {
    if (!isAdd || !isLtsa) return;
    api.get('/prices/next-ltsa-code')
      .then(res => setForm(prev => ({ ...prev, LTSA_Code: res.data.nextCode })))
      .catch(() => {});
  }, [isAdd, isLtsa]);

  /* ── Live LTSA code uniqueness check ── */
  useEffect(() => {
    if (!isLtsa || !isAdd || !form.LTSA_Code) {
      setErrors(prev => ({ ...prev, LTSA_Code: '' }));
      return;
    }
    const t = setTimeout(async () => {
      setChecking(true);
      try {
        const res = await api.get('/prices/check-ltsa-code', { params: { ltsaCode: form.LTSA_Code } });
        setErrors(prev => ({ ...prev, LTSA_Code: res.data.exists ? res.data.message : '' }));
      } catch {
        setErrors(prev => ({ ...prev, LTSA_Code: '' }));
      } finally {
        setChecking(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [form.LTSA_Code, isAdd, isLtsa]);

  /* ── Dynamic filter ── */
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(r =>
      [r.LTSA_Code, r.Customer_partno, r.Cfti_partno, r.Description,
       isLtsa ? r.SplPrice : r.ListPrice, r.Start_Date, r.Exp_Date,
       r.Curr, r.Leadtime, r.DeliveryTerm, r.Product, r.Market, r.status]
        .some(v => String(v ?? '').toLowerCase().includes(q))
    );
  }, [rows, search, isLtsa]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows   = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  useEffect(() => { setPage(1); }, [search]);

  /* ── Reset ── */
  const resetForm = () => {
    setForm(isLtsa ? initLtsaForm : initStdForm);
    setSelected(null);
    setIsAdd(false);
    setShowForm(false);
    setErrors({});
    setMessage({ text: '', type: '' });
  };

  const handleOpenAdd = () => {
    if (!canModify) return;
    setForm(isLtsa ? { ...initLtsaForm } : { ...initStdForm });
    setSelected(null);
    setIsAdd(true);
    setShowForm(true);
    setErrors({});
    setMessage({ text: '', type: '' });
  };

  /* ── Double-click row → edit ── */
  const handleRowDoubleClick = (row) => {
    if (!canModify) return;
    if (row.status !== 'Active') {
      showMsg(`"${row.LTSA_Code}" is Inactive and cannot be edited.`, 'warning');
      return;
    }
    setSelected(row);
    setIsAdd(false);
    setShowForm(true);
    setErrors({});
    setMessage({ text: '', type: '' });
    setForm(isLtsa ? {
      LTSA_Code:       row.LTSA_Code       || '',
      Customer_partno: row.Customer_partno || '',
      Cfti_partno:     row.Cfti_partno     || '',
      Description:     row.Description     || '',
      SplPrice:        row.SplPrice        || '',
      Start_Date:      row.Start_Date      || '',
      Exp_Date:        row.Exp_Date        || '',
      Curr:            row.Curr            || '',
      Leadtime:        row.Leadtime        || '',
      DeliveryTerm:    row.DeliveryTerm    || '',
      Product:         row.Product         || '',
      Market:          row.Market          || ''
    } : {
      Customer_partno: row.Customer_partno || '',
      Cfti_partno:     row.Cfti_partno     || '',
      Description:     row.Description     || '',
      ListPrice:       row.ListPrice       || '',
      Start_Date:      row.Start_Date      || '',
      Exp_Date:        row.Exp_Date        || '',
      Curr:            row.Curr            || '',
      Leadtime:        row.Leadtime        || '',
      DeliveryTerm:    row.DeliveryTerm    || '',
      Product:         row.Product         || '',
      Market:          row.Market          || ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  /* ── Validation ── */
  const validate = () => {
    const e = {};
    if (isLtsa) {
      if (!form.LTSA_Code?.trim())       e.LTSA_Code       = 'Required';
      if (!form.Customer_partno?.trim()) e.Customer_partno = 'Required';
      if (!form.Cfti_partno?.trim())     e.Cfti_partno     = 'Required';
      if (!form.SplPrice)                e.SplPrice        = 'Required';
      if (!form.Start_Date)              e.Start_Date      = 'Required';
      if (!form.Exp_Date)                e.Exp_Date        = 'Required';
      if (!form.Curr?.trim())            e.Curr            = 'Required';
      if (!form.Leadtime?.trim())        e.Leadtime        = 'Required';
      if (!form.DeliveryTerm?.trim())    e.DeliveryTerm    = 'Required';
      if (!form.Product?.trim())         e.Product         = 'Required';
      if (!form.Market?.trim())          e.Market          = 'Required';
    } else {
      if (isAdd) {
        if (!form.Customer_partno?.trim()) e.Customer_partno = 'Required';
        if (!form.Cfti_partno?.trim())     e.Cfti_partno     = 'Required';
        if (!form.ListPrice)               e.ListPrice       = 'Required';
        if (!form.Start_Date)              e.Start_Date      = 'Required';
        if (!form.Exp_Date)                e.Exp_Date        = 'Required';
        if (!form.Curr?.trim())            e.Curr            = 'Required';
        if (!form.Product?.trim())         e.Product         = 'Required';
        if (!form.Market?.trim())          e.Market          = 'Required';
      }
      if (!form.Leadtime?.trim())     e.Leadtime     = 'Required';
      if (!form.DeliveryTerm?.trim()) e.DeliveryTerm = 'Required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit ── */
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    if (errors.LTSA_Code) return;
    try {
      if (isAdd) {
        await api.post(isLtsa ? '/prices/ltsa' : '/prices/standard', form);
        showMsg(isLtsa ? 'LTSA Price added successfully!' : 'Price added successfully!', 'success');
        setForm(isLtsa ? { ...initLtsaForm } : { ...initStdForm });
      } else {
        const payload = isLtsa
          ? { Leadtime: form.Leadtime, DeliveryTerm: form.DeliveryTerm }
          : { Description: form.Description, Leadtime: form.Leadtime, DeliveryTerm: form.DeliveryTerm };
        await api.put(`${isLtsa ? '/prices/ltsa' : '/prices/standard'}/${selected.Sno}`, payload);
        showMsg('Price updated successfully!', 'success');
        setShowForm(false);
        setSelected(null);
      }
      await fetchRows();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Operation failed', 'danger');
    }
  };

  /* ── Toggle status ── */
  const handleToggle = async (row) => {
    if (!canModify) return;
    try {
      const endpoint = isLtsa
        ? `/prices/ltsa/${row.Sno}/status`
        : `/prices/standard/${row.Sno}/status`;
      const res = await api.patch(endpoint);
      const ns  = res.data.status;
      setRows(prev => prev.map(r => r.Sno === row.Sno ? { ...r, status: ns } : r));
      showMsg(`Status changed to ${ns}.`, 'success');
      if (selected?.Sno === row.Sno && ns !== 'Active') { setShowForm(false); setSelected(null); }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Toggle failed', 'danger');
    }
  };

  /* ── Download Data ── */
  const handleDownloadData = async () => {
    setDlOpen(false);
    try {
      const endpoint = isLtsa ? '/prices/download-ltsa' : '/prices/download-standard';
      const res  = await api.get(endpoint, { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `${isLtsa ? 'ltsa' : 'standard'}_price.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showMsg('Data downloaded!', 'success');
    } catch {
      showMsg('Download failed', 'danger');
    }
  };

  /* ── Download Template ── */
  const handleDownloadTemplate = async () => {
    setDlOpen(false);
    try {
      const endpoint = isLtsa
        ? '/prices/download-template-ltsa'
        : '/prices/download-template-standard';
      const res  = await api.get(endpoint, { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href  = url;
      link.setAttribute('download', `${isLtsa ? 'ltsa' : 'standard'}_price_template.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showMsg('Template downloaded!', 'success');
    } catch {
      showMsg('Template download failed', 'danger');
    }
  };

  /* ── Upload ── */
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);
    setShowErrDetail(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = isLtsa ? '/prices/upload-ltsa' : '/prices/upload-standard';
      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadResult(res.data);
      if (res.data.inserted > 0) await fetchRows();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Upload failed', 'danger');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  /* ── Helpers ── */
  const fmtDate = (d) => (!d ? '—' : String(d).substring(0, 10));

  return (
    <div className="pri-page">
      <DashboardNavbar />
      <div className="pri-body">

        {/* Breadcrumb */}
        <div className="pri-breadcrumb">
          <span onClick={() => window.history.back()} className="pri-crumb-link">
            <i className="bi bi-chevron-left me-1"></i>Masters
          </span>
          <span className="pri-crumb-sep">/</span>
          <span className="pri-crumb-active">Price</span>
        </div>

        {/* Header */}
        <div className="pri-header">
          <div>
            <h3 className="pri-title">Price Master</h3>
            <p className="pri-subtitle">{isLtsa ? 'LTSA Price List' : 'Standard Price List'}</p>
          </div>
          <span className="pri-role-pill">Role: {role}</span>
        </div>

        {/* Tab Buttons */}
        <div className="pri-tabs">
          <button
            className={`pri-tab ${!isLtsa ? 'pri-tab-active' : ''}`}
            onClick={() => { setIsLtsa(false); resetForm(); }}
          >
            <i className="bi bi-tags-fill me-1"></i>Standard Price
          </button>
          <button
            className={`pri-tab ${isLtsa ? 'pri-tab-active' : ''}`}
            onClick={() => { setIsLtsa(true); resetForm(); }}
          >
            <i className="bi bi-lightning-fill me-1"></i>LTSA Price
          </button>
        </div>

        {/* Toolbar */}
        <div className="pri-toolbar">
          <div className="input-group pri-search">
            <span className="input-group-text"><i className="bi bi-search"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by any column..."
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
            <button className="btn pri-btn-primary" onClick={handleOpenAdd}>
              <i className="bi bi-plus-lg me-1"></i>Add
            </button>
          )}

          {/* ── Download dropdown ── */}
          <div className="pri-dl-wrapper" ref={dlDropdownRef}>
            <button
              className="btn pri-btn-download pri-dl-toggle"
              onClick={() => setDlOpen(o => !o)}
            >
              <i className="bi bi-download me-1"></i>Download
              <i className={`bi bi-chevron-${dlOpen ? 'up' : 'down'} pri-dl-caret`}></i>
            </button>
            {dlOpen && (
              <div className="pri-dl-menu">
                <button className="pri-dl-item" onClick={handleDownloadTemplate}>
                  <i className="bi bi-file-earmark-text me-2 text-muted"></i>
                  <span>
                    <strong>Template</strong>
                    <small className="d-block text-muted">Headers only (.csv)</small>
                  </span>
                </button>
                <div className="pri-dl-divider"></div>
                <button className="pri-dl-item" onClick={handleDownloadData}>
                  <i className="bi bi-file-earmark-spreadsheet me-2 text-muted"></i>
                  <span>
                    <strong>Download Data</strong>
                    <small className="d-block text-muted">All records (.csv)</small>
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* ── Upload ── */}
          {canModify && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                className="d-none"
                accept=".xlsx"
                onChange={handleUpload}
              />
              <button
                className="btn pri-btn-upload"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                title="Upload bulk data (.xlsx)"
              >
                {uploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1"></span>
                    Uploading…
                  </>
                ) : (
                  <><i className="bi bi-upload me-1"></i>Upload</>
                )}
              </button>
            </>
          )}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`alert alert-${message.type} py-2 mb-2 pri-alert`}>
            {message.type === 'success' && <i className="bi bi-check-circle me-2"></i>}
            {message.type === 'danger'  && <i className="bi bi-exclamation-triangle me-2"></i>}
            {message.type === 'warning' && <i className="bi bi-info-circle me-2"></i>}
            {message.text}
          </div>
        )}

        {/* ── Upload Result Panel ── */}
        {uploadResult && (
          <div className={`pri-upload-result ${uploadResult.failed === 0 ? 'pri-upload-all-ok' : uploadResult.inserted === 0 ? 'pri-upload-all-fail' : 'pri-upload-partial'}`}>
            <div className="pri-upload-summary">
              <div className="pri-upload-stats">
                <span className="pri-upload-stat pri-stat-total">
                  <i className="bi bi-file-earmark-spreadsheet me-1"></i>
                  {uploadResult.total} rows read
                </span>
                <span className="pri-upload-stat pri-stat-ok">
                  <i className="bi bi-check-circle-fill me-1"></i>
                  {uploadResult.inserted} inserted
                </span>
                {uploadResult.failed > 0 && (
                  <span className="pri-upload-stat pri-stat-fail">
                    <i className="bi bi-x-circle-fill me-1"></i>
                    {uploadResult.failed} failed
                  </span>
                )}
              </div>
              <div className="pri-upload-actions">
                {uploadResult.errors?.length > 0 && (
                  <button
                    className="btn btn-sm pri-btn-err-toggle"
                    onClick={() => setShowErrDetail(v => !v)}
                  >
                    <i className={`bi bi-chevron-${showErrDetail ? 'up' : 'down'} me-1`}></i>
                    {showErrDetail ? 'Hide' : 'Show'} errors
                  </button>
                )}
                <button
                  className="btn btn-sm btn-link pri-upload-close"
                  onClick={() => { setUploadResult(null); setShowErrDetail(false); }}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
            </div>

            {showErrDetail && uploadResult.errors?.length > 0 && (
              <div className="pri-upload-errors">
                {uploadResult.errors.map((e, i) => (
                  <div key={i} className="pri-upload-err-row">
                    <span className="pri-err-row-label">Row {e.row}</span>
                    <span className="pri-err-row-msgs">
                      {e.errors.map((msg, j) => (
                        <span key={j} className="pri-err-badge">{msg}</span>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main split layout */}
        <div className={`pri-main ${showForm ? 'pri-split' : ''}`}>

          {/* ── Table ── */}
          <div className="pri-table-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="pri-records">Records: {filtered.length}</span>
              <span className="pri-page-info">Page {page} of {totalPages}</span>
            </div>

            <div className="table-responsive pri-table-container">
              <table className="table table-sm table-hover align-middle pri-table">
                <thead>
                  <tr>
                    <th>LTSA_Code</th>
                    <th>Customer_PN</th>
                    <th>CFTI_PN</th>
                    <th>Description</th>
                    <th className="text-end">Price</th>
                    <th>Start_Date</th>
                    <th>Expiry</th>
                    <th>Currency</th>
                    <th>Lead_Time</th>
                    <th>Product</th>
                    <th>Market</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={12} className="text-center py-4">
                        <div className="spinner-border spinner-border-sm me-2" style={{ color: '#8B0000' }}></div>
                        Loading...
                      </td>
                    </tr>
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="text-center py-3 text-muted">No records found</td>
                    </tr>
                  ) : (
                    pageRows.map((r) => (
                      <tr
                        key={r.Sno}
                        onDoubleClick={() => handleRowDoubleClick(r)}
                        className={selected?.Sno === r.Sno ? 'pri-row-selected' : ''}
                        title={canModify ? 'Double-click to edit' : ''}
                      >
                        <td><span className="pri-badge">{r.LTSA_Code}</span></td>
                        <td>{r.Customer_partno || '—'}</td>
                        <td>{r.Cfti_partno     || '—'}</td>
                        <td className="pri-desc-cell">{r.Description || '—'}</td>
                        <td className="text-end fw-semibold">
                          {isLtsa ? r.SplPrice : r.ListPrice}
                        </td>
                        <td>{fmtDate(r.Start_Date)}</td>
                        <td>{fmtDate(r.Exp_Date)}</td>
                        <td>{r.Curr     || '—'}</td>
                        <td>{r.Leadtime || '—'}</td>
                        <td>{r.Product  || '—'}</td>
                        <td>{r.Market   || '—'}</td>
                        <td className="text-center">
                          {canModify ? (
                            <div
                              className={`pri-toggle ${r.status === 'Active' ? 'pri-toggle-on' : 'pri-toggle-off'}`}
                              onClick={() => handleToggle(r)}
                              title={`Click to set ${r.status === 'Active' ? 'Inactive' : 'Active'}`}
                            >
                              <div className="pri-toggle-thumb"></div>
                              <span className="pri-toggle-label">{r.status}</span>
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
                disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                <i className="bi bi-chevron-left"></i> Prev
              </button>
              <div className="small text-muted">
                Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
                –{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </div>
              <button className="btn btn-sm btn-outline-secondary"
                disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                Next <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>

          {/* ── Form Panel ── */}
          {showForm && (
            <div className="pri-form-panel">
              <h5 className="pri-form-title">
                <i className={`bi ${isAdd ? 'bi-plus-circle' : 'bi-pencil-square'} me-2`}></i>
                {isAdd ? `Add ${isLtsa ? 'LTSA' : 'Standard'} Price` : 'Edit Price'}
              </h5>
              <p className="pri-form-subtitle">
                Fields marked <span className="req">*</span> are mandatory
                {!isAdd && <span className="ms-2 text-warning">🔒 = locked</span>}
              </p>

              <form onSubmit={handleSubmit} noValidate className="pri-form-scroll">

                {isLtsa && (
                  <div className="mb-2">
                    <label className="form-label">LTSA Code <span className="req">*</span></label>
                    <input
                      type="text"
                      className={`form-control pri-input ${errors.LTSA_Code ? 'is-invalid' : ''}`}
                      name="LTSA_Code"
                      value={form.LTSA_Code}
                      readOnly
                      disabled
                    />
                    <small className="text-muted">Auto-generated</small>
                    {checking && <small className="text-muted ms-2"> Checking...</small>}
                    {errors.LTSA_Code && <div className="invalid-feedback d-block">{errors.LTSA_Code}</div>}
                  </div>
                )}

                <div className="mb-2">
                  <label className="form-label">Customer PN <span className="req">*</span></label>
                  {isAdd ? (
                    <input type="text"
                      className={`form-control pri-input ${errors.Customer_partno ? 'is-invalid' : ''}`}
                      name="Customer_partno" value={form.Customer_partno}
                      onChange={handleChange} maxLength={36} />
                  ) : (
                    <input type="text" className="form-control pri-input pri-locked"
                      value={form.Customer_partno} disabled />
                  )}
                  {errors.Customer_partno && <div className="invalid-feedback d-block">{errors.Customer_partno}</div>}
                </div>

                <div className="mb-2">
                  <label className="form-label">CFTI PN <span className="req">*</span></label>
                  {isAdd ? (
                    <input type="text"
                      className={`form-control pri-input ${errors.Cfti_partno ? 'is-invalid' : ''}`}
                      name="Cfti_partno" value={form.Cfti_partno}
                      onChange={handleChange} maxLength={20} />
                  ) : (
                    <input type="text" className="form-control pri-input pri-locked"
                      value={form.Cfti_partno} disabled />
                  )}
                  {errors.Cfti_partno && <div className="invalid-feedback d-block">{errors.Cfti_partno}</div>}
                </div>

                <div className="mb-2">
                  <label className="form-label">Description</label>
                  {(!isAdd && isLtsa) ? (
                    <textarea className="form-control pri-input pri-locked"
                      value={form.Description} disabled rows={2} />
                  ) : (
                    <textarea className="form-control pri-input"
                      name="Description" value={form.Description}
                      onChange={handleChange} rows={2} maxLength={52} placeholder="Optional" />
                  )}
                </div>

                <div className="mb-2">
                  <label className="form-label">
                    {isLtsa ? 'Special Price' : 'List Price'} <span className="req">*</span>
                  </label>
                  {isAdd ? (
                    <input type="number"
                      className={`form-control pri-input ${errors.SplPrice || errors.ListPrice ? 'is-invalid' : ''}`}
                      name={isLtsa ? 'SplPrice' : 'ListPrice'}
                      value={isLtsa ? form.SplPrice : form.ListPrice}
                      onChange={handleChange} step="0.01" min="0" />
                  ) : (
                    <input type="number" className="form-control pri-input pri-locked"
                      value={isLtsa ? form.SplPrice : form.ListPrice} disabled />
                  )}
                  {(errors.SplPrice || errors.ListPrice) && (
                    <div className="invalid-feedback d-block">{errors.SplPrice || errors.ListPrice}</div>
                  )}
                </div>

                <div className="mb-2">
                  <label className="form-label">Start Date <span className="req">*</span></label>
                  {isAdd ? (
                    <input type="date"
                      className={`form-control pri-input ${errors.Start_Date ? 'is-invalid' : ''}`}
                      name="Start_Date" value={form.Start_Date} onChange={handleChange} />
                  ) : (
                    <input type="date" className="form-control pri-input pri-locked"
                      value={String(form.Start_Date).substring(0, 10)} disabled />
                  )}
                  {errors.Start_Date && <div className="invalid-feedback d-block">{errors.Start_Date}</div>}
                </div>

                <div className="mb-2">
                  <label className="form-label">Expiry Date <span className="req">*</span></label>
                  {isAdd ? (
                    <input type="date"
                      className={`form-control pri-input ${errors.Exp_Date ? 'is-invalid' : ''}`}
                      name="Exp_Date" value={form.Exp_Date} onChange={handleChange} />
                  ) : (
                    <input type="date" className="form-control pri-input pri-locked"
                      value={String(form.Exp_Date).substring(0, 10)} disabled />
                  )}
                  {errors.Exp_Date && <div className="invalid-feedback d-block">{errors.Exp_Date}</div>}
                </div>

                <div className="mb-2">
                  <label className="form-label">Currency <span className="req">*</span></label>
                  {isAdd ? (
                    <select className={`form-control pri-input ${errors.Curr ? 'is-invalid' : ''}`}
                      name="Curr" value={form.Curr} onChange={handleChange}>
                      <option value="">-- Select --</option>
                      {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <input type="text" className="form-control pri-input pri-locked"
                      value={form.Curr} disabled />
                  )}
                  {errors.Curr && <div className="invalid-feedback d-block">{errors.Curr}</div>}
                </div>

                <div className="mb-2">
                  <label className="form-label">Lead Time <span className="req">*</span></label>
                  <input type="text"
                    className={`form-control pri-input ${errors.Leadtime ? 'is-invalid' : ''}`}
                    name="Leadtime" value={form.Leadtime}
                    onChange={handleChange} maxLength={15} placeholder="e.g. 4 weeks" />
                  {errors.Leadtime && <div className="invalid-feedback d-block">{errors.Leadtime}</div>}
                </div>

                <div className="mb-2">
                  <label className="form-label">Delivery Term <span className="req">*</span></label>
                  <input type="text"
                    className={`form-control pri-input ${errors.DeliveryTerm ? 'is-invalid' : ''}`}
                    name="DeliveryTerm" value={form.DeliveryTerm}
                    onChange={handleChange} maxLength={16} placeholder="e.g. FOB, CIF" />
                  {errors.DeliveryTerm && <div className="invalid-feedback d-block">{errors.DeliveryTerm}</div>}
                </div>

                <div className="mb-2">
                  <label className="form-label">Product <span className="req">*</span></label>
                  {isAdd ? (
                    <input type="text"
                      className={`form-control pri-input ${errors.Product ? 'is-invalid' : ''}`}
                      name="Product" value={form.Product}
                      onChange={handleChange} maxLength={15} placeholder="e.g. PUMP" />
                  ) : (
                    <input type="text" className="form-control pri-input pri-locked"
                      value={form.Product} disabled />
                  )}
                  {errors.Product && <div className="invalid-feedback d-block">{errors.Product}</div>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Market <span className="req">*</span></label>
                  {isAdd ? (
                    <select className={`form-control pri-input ${errors.Market ? 'is-invalid' : ''}`}
                      name="Market" value={form.Market} onChange={handleChange}>
                      <option value="">-- Select --</option>
                      {MARKET_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  ) : (
                    <input type="text" className="form-control pri-input pri-locked"
                      value={form.Market} disabled />
                  )}
                  {errors.Market && <div className="invalid-feedback d-block">{errors.Market}</div>}
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn pri-btn-primary flex-fill"
                    disabled={!canModify || checking}>
                    <i className="bi bi-save me-1"></i>{isAdd ? 'Save' : 'Update'}
                  </button>
                  <button type="button" className="btn pri-btn-outline flex-fill" onClick={resetForm}>
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

export default Price;
import React, { useEffect, useMemo, useRef, useState } from 'react';
import DashboardNavbar from '../../../components/DashboardNavbar/DashboardNavbar';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../services/api';
import './Buyer.css';

const PAGE_SIZE = 50;

/* ── Searchable Select ─────────────────────────────── */
const SearchableSelect = ({ options = [], value, onChange, placeholder, disabled, labelKey, valueKey }) => {
  const [query, setQuery] = useState('');
  const [open,  setOpen]  = useState(false);
  const ref = useRef(null);

  const getLabel = (o) => labelKey ? o[labelKey] : o;
  const getValue = (o) => valueKey ? o[valueKey] : o;

  const filtered = options.filter(o =>
    getLabel(o).toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const select = (opt) => { onChange(getValue(opt), opt); setQuery(''); setOpen(false); };

  return (
    <div className="byr-sel-wrap" ref={ref}>
      <div
        className={`byr-sel-trigger ${disabled ? 'byr-sel-disabled' : ''} ${open ? 'byr-sel-open' : ''}`}
        onClick={() => !disabled && setOpen(o => !o)}
      >
        <span className={value ? 'byr-sel-val' : 'byr-sel-ph'}>{value || placeholder}</span>
        <i className={`bi bi-chevron-${open ? 'up' : 'down'} byr-sel-arr`}></i>
      </div>
      {open && !disabled && (
        <div className="byr-sel-drop">
          <input
            className="byr-sel-search"
            placeholder="Search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onClick={e => e.stopPropagation()}
            autoFocus
          />
          <div className="byr-sel-list">
            {filtered.length === 0
              ? <div className="byr-sel-empty">No results</div>
              : filtered.map((opt, i) => (
                  <div
                    key={i}
                    className={`byr-sel-item ${getValue(opt) === value ? 'byr-sel-item-active' : ''}`}
                    onClick={() => select(opt)}
                  >
                    {getLabel(opt)}
                  </div>
                ))
            }
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Helper: split pipe-separated contact ─────────── */
const splitContact = (contactStr) => {
  const parts = (contactStr || '').split('|');
  return {
    contact1: parts[0] || '',
    contact2: parts[1] || '',
    contact3: parts[2] || ''
  };
};

/* ── Main Component ───────────────────────────────── */
const Buyer = () => {
  const { user }  = useAuth();
  const role      = user?.role || 'View-only';
  const canModify = role === 'Manager' || role === 'Admin';

  const [rows,      setRows]     = useState([]);
  const [custOpts,  setCustOpts] = useState([]);  // [{customer_name, Location}]
  const [search,    setSearch]   = useState('');
  const [page,      setPage]     = useState(1);
  const [loading,   setLoading]  = useState(false);
  const [selected,  setSelected] = useState(null);
  const [showForm,  setShowForm] = useState(false);
  const [isAdd,     setIsAdd]    = useState(false);
  const [message,   setMessage]  = useState({ text: '', type: '' });

  const initForm = {
    Customer: '', Buyer_name: '', Designation: '',
    email1: '', email2: '',
    contact1: '', contact2: '', contact3: '',
    Location: '', Comments: ''
  };
  const [form, setForm] = useState(initForm);

  const showMsg = (text, type) => {
    setMessage({ text, type });
    if (text) setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const fetchRows = async () => {
    setLoading(true);
    try {
      const res = await api.get('/buyers');
      setRows(res.data.data || []);
    } catch {
      showMsg('Failed to load buyers', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const res = await api.get('/buyers/dropdown/customers');
      setCustOpts(res.data || []);
    } catch {}
  };

  useEffect(() => { fetchRows(); fetchDropdowns(); }, []);

  /* Customer dropdown options — display "Name - Location" */
  const custDisplayOpts = useMemo(() =>
    custOpts.map(c => ({
      ...c,
      displayLabel: c.Location ? `${c.customer_name} - ${c.Location}` : c.customer_name
    })),
  [custOpts]);

  /* Filter */
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(r =>
      [r.Customer, r.Buyer_name, r.Designation, r.email1, r.email2,
       r.contact, r.Location, r.status]
        .some(v => String(v || '').toLowerCase().includes(q))
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows   = useMemo(() => {
    const s = (page - 1) * PAGE_SIZE;
    return filtered.slice(s, s + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(() => { setPage(1); }, [search]);

  const resetForm = () => {
    setForm(initForm);
    setSelected(null);
    setIsAdd(false);
    setShowForm(false);
    setMessage({ text: '', type: '' });
  };

  const handleOpenAdd = () => {
    if (!canModify) return;
    setForm(initForm);
    setSelected(null);
    setIsAdd(true);
    setShowForm(true);
    setMessage({ text: '', type: '' });
  };

  const handleRowDoubleClick = (row) => {
    if (!canModify) return;
    if (row.status !== 'Active') {
      showMsg(`Buyer "${row.Buyer_name}" is Inactive and cannot be edited.`, 'warning');
      return;
    }
    const { contact1, contact2, contact3 } = splitContact(row.contact);
    setSelected(row);
    setForm({
      Customer:    row.Customer    || '',
      Buyer_name:  row.Buyer_name  || '',
      Designation: row.Designation || '',
      email1:      row.email1      || '',
      email2:      row.email2      || '',
      contact1, contact2, contact3,
      Location:    row.Location    || '',
      Comments:    row.Comments    || ''
    });
    setIsAdd(false);
    setShowForm(true);
    setMessage({ text: '', type: '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  /* When customer selected in add mode — auto-fill Location */
  const handleCustomerSelect = (val, opt) => {
    setForm(prev => ({
      ...prev,
      Customer: val,
      Location: opt?.Location || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isAdd && (!form.Customer || !form.Buyer_name)) {
      showMsg('Customer and Buyer Name are mandatory.', 'danger');
      return;
    }
    try {
      if (isAdd) {
        await api.post('/buyers', form);
        showMsg('Added successfully.', 'success');
        setForm(initForm);
      } else if (selected) {
        await api.put(`/buyers/${selected.Sno}`, {
          Designation: form.Designation,
          email1:      form.email1,
          email2:      form.email2,
          contact1:    form.contact1,
          contact2:    form.contact2,
          contact3:    form.contact3,
          Comments:    form.Comments
        });
        showMsg('Updated successfully.', 'success');
        setShowForm(false);
        setSelected(null);
      }
      await fetchRows();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Operation failed', 'danger');
    }
  };

  const handleToggle = async (row) => {
    if (!canModify) return;
    try {
      const res = await api.patch(`/buyers/${row.Sno}/status`);
      const ns  = res.data.status;
      setRows(prev => prev.map(r => r.Sno === row.Sno ? { ...r, status: ns } : r));
      showMsg(`Status changed to ${ns} for "${row.Buyer_name}".`, 'success');
      if (selected?.Sno === row.Sno && ns !== 'Active') { setShowForm(false); setSelected(null); }
    } catch (err) {
      showMsg(err.response?.data?.message || 'Failed', 'danger');
    }
  };

  return (
    <div className="byr-page">
      <DashboardNavbar />
      <div className="byr-body">

        {/* Breadcrumb */}
        <div className="byr-breadcrumb">
          <span onClick={() => window.history.back()} className="byr-crumb-link">
            <i className="bi bi-chevron-left me-1"></i>Masters
          </span>
          <span className="byr-crumb-sep">/</span>
          <span className="byr-crumb-active">Buyer</span>
        </div>

        {/* Header */}
        <div className="byr-header">
          <div>
            <h3 className="byr-title">Buyer</h3>
            <p className="byr-subtitle">Manage buyer master data</p>
          </div>
          <span className="byr-role-pill">Role: {role}</span>
        </div>

        {/* Toolbar */}
        <div className="byr-toolbar">
          <div className="input-group byr-search">
            <span className="input-group-text"><i className="bi bi-search"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by Customer, Buyer Name, Email, Contact, Location..."
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
            <button className="btn byr-btn-primary" onClick={handleOpenAdd}>
              <i className="bi bi-plus-lg me-1"></i>Add
            </button>
          )}
        </div>

        {/* Message */}
        {message.text && (
          <div className={`alert alert-${message.type} py-2 mb-2 byr-alert`}>
            {message.type === 'success' && <i className="bi bi-check-circle me-2"></i>}
            {message.type === 'danger'  && <i className="bi bi-exclamation-triangle me-2"></i>}
            {message.type === 'warning' && <i className="bi bi-info-circle me-2"></i>}
            {message.text}
          </div>
        )}

        {/* Main layout */}
        <div className={`byr-main ${showForm ? 'byr-split' : ''}`}>

          {/* ── Table ── */}
          <div className="byr-table-wrapper">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="byr-records">Records: {filtered.length}</span>
              <span className="byr-page-info">Page {page} of {totalPages}</span>
            </div>

            <div className="table-responsive byr-table-container">
              <table className="table table-sm table-hover align-middle byr-table">
                <thead>
                  <tr>
                    <th style={{ width: '4%'  }}>Sno</th>
                    <th style={{ width: '16%' }}>Customer</th>
                    <th style={{ width: '13%' }}>Buyer_Name</th>
                    <th style={{ width: '12%' }}>Designation</th>
                    <th style={{ width: '14%' }}>Email_1</th>
                    <th style={{ width: '14%' }}>Email_2</th>
                    <th style={{ width: '12%' }}>Contact</th>
                    <th style={{ width: '8%'  }}>Location</th>
                    <th style={{ width: '7%'  }} className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="text-center py-4">
                        <div className="spinner-border spinner-border-sm me-2" style={{ color: '#8B0000' }}></div>
                        Loading...
                      </td>
                    </tr>
                  ) : pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-3 text-muted">No records found</td>
                    </tr>
                  ) : (
                    pageRows.map((r, idx) => {
                      const { contact1, contact2, contact3 } = splitContact(r.contact);
                      return (
                        <tr
                          key={r.Sno}
                          onDoubleClick={() => handleRowDoubleClick(r)}
                          className={selected?.Sno === r.Sno ? 'byr-row-selected' : ''}
                        >
                          <td>{(page - 1) * PAGE_SIZE + idx + 1}</td>
                          <td className="fw-semibold">{r.Customer}</td>
                          <td>{r.Buyer_name}</td>
                          <td>{r.Designation || '—'}</td>
                          <td className="byr-email">{r.email1 || '—'}</td>
                          <td className="byr-email">{r.email2 || '—'}</td>
                          <td>
                            {r.contact ? (
                              <div className="byr-contact-cell">
                                {contact1 && <span title="Mobile"><i className="bi bi-phone-fill me-1"></i>{contact1}</span>}
                                {contact2 && <span title="Landline"><i className="bi bi-telephone-fill me-1"></i>{contact2}</span>}
                                {contact3 && <span title="Fax"><i className="bi bi-printer-fill me-1"></i>{contact3}</span>}
                              </div>
                            ) : '—'}
                          </td>
                          <td>{r.Location || '—'}</td>
                          <td className="text-center">
                            {canModify ? (
                              <div
                                className={`byr-toggle ${r.status === 'Active' ? 'byr-toggle-on' : 'byr-toggle-off'}`}
                                onClick={() => handleToggle(r)}
                                title={`Click to set ${r.status === 'Active' ? 'Inactive' : 'Active'}`}
                              >
                                <div className="byr-toggle-thumb"></div>
                                <span className="byr-toggle-label">{r.status}</span>
                              </div>
                            ) : (
                              <span className={`badge ${r.status === 'Active' ? 'bg-success' : 'bg-secondary'}`}>
                                {r.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="d-flex justify-content-between align-items-center mt-2">
              <button className="btn btn-sm btn-outline-secondary" disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}>
                <i className="bi bi-chevron-left"></i> Prev
              </button>
              <div className="small text-muted">
                Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}
                –{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </div>
              <button className="btn btn-sm btn-outline-secondary" disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                Next <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </div>

          {/* ── Form Panel ── */}
          {showForm && (
            <div className="byr-form-panel">
              <h5 className="byr-form-title">
                <i className={`bi ${isAdd ? 'bi-person-plus' : 'bi-pencil-square'} me-2`}></i>
                {isAdd ? 'Add Buyer' : 'Edit Buyer'}
              </h5>
              <p className="byr-form-subtitle">
                Fields marked <span className="req">*</span> are mandatory
              </p>

              <form onSubmit={handleSubmit} noValidate className="byr-form-scroll">

                {/* Customer */}
                <div className="mb-2">
                  <label className="form-label">Customer <span className="req">*</span></label>
                  {isAdd ? (
                    <SearchableSelect
                      options={custDisplayOpts}
                      value={form.Customer}
                      onChange={handleCustomerSelect}
                      placeholder="-- Select Customer --"
                      labelKey="displayLabel"
                      valueKey="customer_name"
                    />
                  ) : (
                    <>
                      <input type="text" className="form-control byr-input" value={form.Customer} disabled />
                      <small className="text-muted"><i className="bi bi-lock-fill me-1"></i>Cannot be changed.</small>
                    </>
                  )}
                </div>

                {/* Location (auto-filled, always locked) */}
                <div className="mb-2">
                  <label className="form-label">Location</label>
                  <input type="text" className="form-control byr-input" value={form.Location}
                    disabled placeholder="Auto-filled from customer" />
                  <small className="text-muted"><i className="bi bi-lock-fill me-1"></i>Auto-filled from Customer.</small>
                </div>

                {/* Buyer Name */}
                <div className="mb-2">
                  <label className="form-label">Buyer Name <span className="req">*</span></label>
                  {isAdd ? (
                    <input type="text" className="form-control byr-input" name="Buyer_name"
                      value={form.Buyer_name} onChange={handleChange}
                      placeholder="Enter buyer name" required />
                  ) : (
                    <>
                      <input type="text" className="form-control byr-input" value={form.Buyer_name} disabled />
                      <small className="text-muted"><i className="bi bi-lock-fill me-1"></i>Cannot be changed.</small>
                    </>
                  )}
                </div>

                {/* Designation */}
                <div className="mb-2">
                  <label className="form-label">Designation</label>
                  <input type="text" className="form-control byr-input" name="Designation"
                    value={form.Designation} onChange={handleChange}
                    placeholder="Enter designation (optional)" />
                </div>

                {/* Email 1 */}
                <div className="mb-2">
                  <label className="form-label">Email 1</label>
                  <input type="email" className="form-control byr-input" name="email1"
                    value={form.email1} onChange={handleChange}
                    placeholder="abc@gmail.com" />
                </div>

                {/* Email 2 */}
                <div className="mb-2">
                  <label className="form-label">Email 2</label>
                  <input type="email" className="form-control byr-input" name="email2"
                    value={form.email2} onChange={handleChange}
                    placeholder="abc@gmail.com" />
                </div>

                {/* Contact — Mobile / Landline / Fax */}
                <div className="mb-1">
                  <label className="form-label">Mobile</label>
                  <input type="text" className="form-control byr-input" name="contact1"
                    value={form.contact1} onChange={handleChange}
                    placeholder="Mobile number"
                    maxLength={form.Customer && (custOpts.find(c => c.customer_name === form.Customer)?.Location || '').toLowerCase().includes('india') ? 10 : 35}
                  />
                </div>
                <div className="mb-1">
                  <label className="form-label">Landline</label>
                  <input type="text" className="form-control byr-input" name="contact2"
                    value={form.contact2} onChange={handleChange}
                    placeholder="Landline number" />
                </div>
                <div className="mb-2">
                  <label className="form-label">Fax</label>
                  <input type="text" className="form-control byr-input" name="contact3"
                    value={form.contact3} onChange={handleChange}
                    placeholder="Fax number" />
                </div>

                {/* Comments */}
                <div className="mb-3">
                  <label className="form-label">Comments</label>
                  <textarea className="form-control byr-input" name="Comments" rows={3}
                    value={form.Comments} onChange={handleChange}
                    placeholder="Enter comments (optional)" maxLength={500} />
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn byr-btn-primary flex-fill" disabled={!canModify}>
                    <i className="bi bi-save me-1"></i>{isAdd ? 'Save' : 'Update'}
                  </button>
                  <button type="button" className="btn byr-btn-outline flex-fill" onClick={resetForm}>
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

export default Buyer;
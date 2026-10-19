import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { createItem, getItemById, updateItem } from '../services/itemService';

const emptyForm = { title: '', category: '', description: '', location: '', date: '', image: '' };

const ReportItemPage = ({ type }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const editingId = new URLSearchParams(location.search).get('edit');
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(Boolean(editingId));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!editingId) return undefined;
    getItemById(editingId).then((item) => {
      if (item.type !== type) throw new Error('This report type does not match the selected form.');
      setForm({ title: item.title, category: item.category, description: item.description, location: item.location, date: item.date.slice(0, 10), image: item.image || '' });
    }).catch((err) => setError(err.response?.data?.message || err.message || 'Unable to load report.')).finally(() => setLoading(false));
    return undefined;
  }, [editingId, type]);

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
      if (!form.title.trim() || !form.category.trim() || !form.description.trim() || !form.location.trim() || !form.date || Number.isNaN(Date.parse(form.date))) {
      setError('Complete all required fields before submitting.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) await updateItem(editingId, form);
      else await createItem({ ...form, type });
      setSuccess(editingId ? 'Your report was updated.' : 'Your report was created.');
      window.setTimeout(() => navigate('/my-reports'), 700);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save this report.');
    } finally {
      setSaving(false);
    }
  };

  return <WorkspaceLayout><div className="form-shell"><div className="form-copy"><p className={`eyebrow${type === 'Found' ? ' terracotta' : ''}`}>REPORT {type.toUpperCase()}</p><h2>{editingId ? 'Edit your report' : type === 'Lost' ? 'Lost something?' : 'Found something?'}</h2><p>{type === 'Lost' ? 'Keep a clear record and help the right people find it.' : 'Give its owner a chance to find it.'}</p><ol className="step-list"><li className="active">01 Details</li><li>02 Location</li><li>03 Finish</li></ol></div><form className={`form-card${type === 'Found' ? ' accent' : ''}`} onSubmit={handleSubmit}>{loading ? <p className="section-lead">Loading report...</p> : <><div className="field-grid"><label><span>Item title</span><input name="title" value={form.title} onChange={handleChange} placeholder={type === 'Lost' ? 'Leica M6 Classic Camera' : 'Vintage Tortoiseshell Glasses'} /></label><label><span>Category</span><input name="category" value={form.category} onChange={handleChange} placeholder="Accessories" /></label></div><label><span>Description</span><textarea name="description" rows="4" value={form.description} onChange={handleChange} placeholder="Describe the item and any distinctive details." /></label><div className="field-grid"><label><span>{type === 'Lost' ? 'Location lost' : 'Location found'}</span><input name="location" value={form.location} onChange={handleChange} placeholder="Kinsale Library, Reading Room" /></label><label><span>{type === 'Lost' ? 'Date lost' : 'Date found'}</span><input type="date" name="date" value={form.date} onChange={handleChange} /></label></div><label><span>Optional image URL</span><input type="url" name="image" value={form.image} onChange={handleChange} placeholder="https://example.com/item.jpg" /></label>{error && <p className="error-text">{error}</p>}{success && <p className="success-text">{success}</p>}<button className={`primary-btn ${type === 'Found' ? 'light terracotta' : 'dark'} action-button`} disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save changes' : `Report ${type} Item`}</button></>}</form></div></WorkspaceLayout>;
};

export default ReportItemPage;

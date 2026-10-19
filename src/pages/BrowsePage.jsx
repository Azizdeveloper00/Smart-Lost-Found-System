import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { getItems } from '../services/itemService';

const categories = ['Accessories', 'Photography', 'Electronics', 'Stationery', 'Documents', 'Keys', 'Other'];
const initialFilters = { keyword: '', type: '', category: '', location: '', status: '' };

const BrowsePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [filters, setFilters] = useState(() => {
    const params = new URLSearchParams(location.search);
    return Object.fromEntries(Object.keys(initialFilters).map((key) => [key, params.get(key) || '']));
  });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadItems = (nextFilters) => {
    setLoading(true);
    setError('');
    getItems(nextFilters).then(setItems).catch((err) => setError(err.response?.data?.message || 'Unable to load items.')).finally(() => setLoading(false));
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlFilters = Object.fromEntries(Object.keys(initialFilters).map((key) => [key, params.get(key) || '']));
    setFilters(urlFilters);
    loadItems(urlFilters);
  }, [location.search]);

  const handleChange = (event) => setFilters({ ...filters, [event.target.name]: event.target.value });
  const applyFilters = (event) => {
    event.preventDefault();
    const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, value]) => value)));
    navigate(params.toString() ? `/browse?${params.toString()}` : '/browse');
  };
  const clearFilters = () => { setFilters(initialFilters); navigate('/browse'); };

  return <WorkspaceLayout><div className="page-header-row"><div><p className="eyebrow">Browse Items</p><h2>Browse items</h2><p className="section-lead">Search through recent lost and found reports.</p></div></div><form className="browse-filters" onSubmit={applyFilters}><label className="catalog-search"><span>⌕</span><input name="keyword" value={filters.keyword} onChange={handleChange} placeholder="Search title or description..." /></label><label><span>Type</span><select name="type" value={filters.type} onChange={handleChange}><option value="">All types</option><option value="Lost">Lost</option><option value="Found">Found</option></select></label><label><span>Category</span><select name="category" value={filters.category} onChange={handleChange}><option value="">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label><label><span>Location</span><input name="location" value={filters.location} onChange={handleChange} placeholder="Any location" /></label><label><span>Status</span><select name="status" value={filters.status} onChange={handleChange}><option value="">All statuses</option><option value="Active">Active</option><option value="Resolved">Resolved</option></select></label><div className="filter-actions"><button className="primary-btn dark" type="submit">Search</button><button className="primary-btn light" type="button" onClick={clearFilters}>Clear</button></div></form>{loading && <p className="section-lead">Loading items...</p>}{error && <p className="error-text">{error}</p>}{!loading && !error && !items.length && <div className="panel empty-state"><h3>No matching reports found.</h3><p>Try clearing a filter or adjusting your search.</p></div>}<div className="catalog-grid">{items.map((item) => <article className="catalog-card" key={item._id} onClick={() => navigate(`/items/${item._id}`)} role="button" tabIndex="0" onKeyDown={(event) => event.key === 'Enter' && navigate(`/items/${item._id}`)}><div className={`catalog-image ${item.image ? '' : item.type === 'Lost' ? 'image-one' : 'image-two'}`} style={item.image ? { backgroundImage: `url(${item.image})` } : undefined}></div><div className="catalog-card-body"><span className={`type-pill ${item.type.toLowerCase()}`}>{item.type.toUpperCase()}</span><h4>{item.title}</h4><p>{item.category} · {item.location}</p><div className="card-meta"><span>{new Date(item.date).toLocaleDateString()}</span><span>{item.status}</span></div></div></article>)}</div></WorkspaceLayout>;
};

export default BrowsePage;

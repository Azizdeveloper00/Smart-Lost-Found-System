import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { getDashboardStats } from '../services/dashboardService';

const formatDate = (value) => new Date(value).toLocaleDateString();
const errorMessage = (error) => error.response?.data?.message || (error.code === 'ERR_NETWORK' ? 'Unable to reach the server.' : 'Unable to load dashboard data.');

const DashboardPage = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      setDashboard(await getDashboardStats());
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const totalReports = (dashboard?.activeReports || 0) + (dashboard?.resolved || 0);
  const resolvedRate = totalReports ? Math.round((dashboard.resolved / totalReports) * 100) : 0;

  return (
    <WorkspaceLayout>
      <section className="view active" id="dashboardView">
        <div className="intro-row">
          <div className="intro-copy"><p className="eyebrow">SMART LOST &amp; FOUND • CUSTODY BULLETIN</p><h1>Find what matters.<br />Return what's missing.</h1><p className="lead">A quiet, dignified registry to record, discover, and peacefully reunite lost artifacts with their owners.</p></div>
          <div className="intro-actions"><button className="primary-btn dark" type="button" onClick={() => navigate('/report-lost')}>Report Lost</button><button className="primary-btn light" type="button" onClick={() => navigate('/report-found')}>Report Found</button></div>
        </div>

        <div className="bulletin-strip"><span>{loading ? 'Loading your report activity...' : `${dashboard?.activeReports || 0} active reports in your workspace`}</span><span className="dot">•</span><span>{loading ? 'Please wait.' : `${dashboard?.resolved || 0} resolved.`}</span><button type="button" onClick={() => navigate('/my-reports')}>INSPECT LOG →</button></div>
        {error && <div className="panel dashboard-error"><p className="error-text">{error}</p><button className="primary-btn light" type="button" onClick={loadDashboard}>Retry</button></div>}

        <div className="dashboard-grid">
          <div className="panel report-panel"><div className="panel-header"><h3>Your reports</h3><span className="badge">{loading ? '—' : `${dashboard?.activeReports || 0} active`}</span><button className="text-link" type="button" onClick={() => navigate('/my-reports')}>View all →</button></div><div className="timeline">
            {loading && <div className="dashboard-loading">Loading your latest reports...</div>}
            {!loading && !dashboard?.recentReports?.length && <div className="empty-state"><h3>No report activity yet</h3><p>Report a lost or found item to begin your registry.</p></div>}
            {!loading && dashboard?.recentReports?.map((report) => <article className="report-item" key={report._id} onClick={() => navigate(`/items/${report._id}`)} role="button" tabIndex="0" onKeyDown={(event) => event.key === 'Enter' && navigate(`/items/${report._id}`)}><div className="timeline-dot"></div><div className={`report-thumb ${report.type === 'Lost' ? 'thumb-camera' : 'thumb-glasses'}`} style={report.image ? { backgroundImage: `url(${report.image})` } : undefined} role="img" aria-label={`${report.type} item: ${report.title}`}></div><div className="report-copy"><div className="report-topline"><h4>{report.title}</h4><span className={`type-pill ${report.type.toLowerCase()}`}>{report.type.toUpperCase()}</span></div><p>{report.location} · {formatDate(report.date)}</p><div className="report-bottomline"><span>{report.status} · Updated {formatDate(report.updatedAt)}</span><button type="button" aria-label={`View ${report.title}`} onClick={(event) => { event.stopPropagation(); navigate(`/items/${report._id}`); }}>→</button></div></div></article>)}
          </div></div>

          <div className="stats-column"><div className="panel stat-panel large"><div className="stat-header"><span>SYSTEM VOLUME</span></div><div className="stat-body"><h2>{loading ? '—' : (dashboard?.activeReports || 0)}</h2><p>Active reports recorded</p><small>Reports in your workspace</small></div><div className="progress-block"><span>Resolution rate</span><strong>{loading ? '—' : `${resolvedRate}%`}</strong></div><div className="progress-bar"><span style={{ width: loading ? '0%' : `${resolvedRate}%` }}></span></div></div><div className="panel split-panel"><div className="split-box terracotta"><span>LOSS REGISTER</span><h3>{loading ? '—' : (dashboard?.totalLost || 0)}</h3><small>Total lost reports</small></div><div className="split-box forest"><span>VAULT INTAKE</span><h3>{loading ? '—' : (dashboard?.totalFound || 0)}</h3><small>Total found reports</small></div></div><div className="panel mini-panel"><div className="mini-icon">◎</div><div><span>REUNION INDEX</span><h3>{loading ? '—' : (dashboard?.resolved || 0)}</h3><small>Resolved reports</small><p>Updated from your report records</p></div></div></div>
        </div>

        <div className="bottom-grid"><section className="panel recent-found"><div className="panel-header compact"><h3>Recently Found</h3><button className="text-link" type="button" onClick={() => navigate('/browse?type=Found')}>Browse all →</button></div><div className="mini-cards">{loading && <p className="section-lead">Loading recently found items...</p>}{!loading && !dashboard?.recentlyFound?.length && <p className="section-lead">No found items have been reported yet.</p>}{!loading && dashboard?.recentlyFound?.map((item) => <article className="mini-item-card" key={item._id} onClick={() => navigate(`/items/${item._id}`)} role="button" tabIndex="0" onKeyDown={(event) => event.key === 'Enter' && navigate(`/items/${item._id}`)}><div className="mini-thumb" style={item.image ? { backgroundImage: `url(${item.image})` } : undefined} role="img" aria-label={`Found item: ${item.title}`}></div><div><span className="type-pill found">FOUND</span><h4>{item.title}</h4><p>{item.category} · {item.location} · {formatDate(item.date)}</p><small>{item.status}</small></div></article>)}</div></section><section className="panel quick-action"><div className="quick-icon">⌂</div><h3>Found something?</h3><p>Help someone get it back.</p><button className="primary-btn light terracotta" type="button" onClick={() => navigate('/report-found')}>Report a found item</button></section></div>
      </section>
    </WorkspaceLayout>
  );
};

export default DashboardPage;

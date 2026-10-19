import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import { approveClaim, getMyClaims, getReceivedClaims, rejectClaim } from '../services/claimService';
import { deleteItem, getMyItems, updateItemStatus } from '../services/itemService';

const claimClass = (status) => `claim-status ${status.toLowerCase()}`;
const errorMessage = (error, fallback) => error.response?.data?.message || (error.code === 'ERR_NETWORK' ? 'Unable to reach the server.' : fallback);

const MyReportsPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [receivedClaims, setReceivedClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimsLoading, setClaimsLoading] = useState(true);
  const [error, setError] = useState('');
  const [claimError, setClaimError] = useState('');
  const [processingItem, setProcessingItem] = useState('');
  const [processingClaim, setProcessingClaim] = useState('');

  const reloadWorkspace = useCallback(async () => {
    setError('');
    setClaimError('');
    try {
      const [reports, submitted, received] = await Promise.all([getMyItems(), getMyClaims(), getReceivedClaims()]);
      setItems(reports);
      setMyClaims(submitted);
      setReceivedClaims(received);
    } catch (err) {
      setError(errorMessage(err, 'Unable to load your workspace.'));
    } finally {
      setLoading(false);
      setClaimsLoading(false);
    }
  }, []);

  useEffect(() => { reloadWorkspace(); }, [reloadWorkspace]);

  const remove = async (id) => {
    if (!window.confirm('Delete this report permanently?')) return;
    setProcessingItem(id);
    setError('');
    try {
      await deleteItem(id);
      await reloadWorkspace();
    } catch (err) {
      setError(errorMessage(err, 'Unable to delete report.'));
    } finally {
      setProcessingItem('');
    }
  };

  const changeStatus = async (id, status) => {
    setProcessingItem(id);
    setError('');
    try {
      await updateItemStatus(id, status);
      await reloadWorkspace();
    } catch (err) {
      setError(errorMessage(err, 'Unable to update status.'));
    } finally {
      setProcessingItem('');
    }
  };

  const processClaim = async (claim, action) => {
    setProcessingClaim(claim._id);
    setClaimError('');
    try {
      if (action === 'approve') await approveClaim(claim._id);
      else await rejectClaim(claim._id);
      await reloadWorkspace();
    } catch (err) {
      setClaimError(errorMessage(err, 'Unable to process claim.'));
    } finally {
      setProcessingClaim('');
    }
  };

  return (
    <WorkspaceLayout>
      <div className="page-header-row">
        <div>
          <p className="eyebrow">Workspace</p>
          <h2>My reports</h2>
          <p className="section-lead">Your reports, submitted claims, and claim requests.</p>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <section className="claims-section">
        <div className="panel-header compact"><h3>My Claims</h3></div>
        {claimsLoading && <p className="section-lead">Loading claims...</p>}
        {!claimsLoading && !myClaims.length && <p className="section-lead">You have not submitted any claims.</p>}
        <div className="claim-list">
          {myClaims.map((claim) => (
            <article className="claim-card panel" key={claim._id}>
              <div className="claim-card-top"><div><span className="type-pill found">FOUND</span><h4>{claim.item?.title || 'Item unavailable'}</h4></div><span className={claimClass(claim.status)}>{claim.status}</span></div>
              <p>{claim.item?.location || 'Location unavailable'} · Item {claim.item?.status || 'status unavailable'}</p>
              <blockquote>{claim.message}</blockquote>
              <div className="claim-request-footer"><small>Submitted {new Date(claim.createdAt).toLocaleDateString()}</small>{claim.item?._id && <button className="text-link" type="button" onClick={() => navigate(`/items/${claim.item._id}`)}>View item →</button>}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="claims-section">
        <div className="panel-header compact"><h3>Claim Requests</h3></div>
        {claimError && <p className="error-text">{claimError}</p>}
        {claimsLoading && <p className="section-lead">Loading requests...</p>}
        {!claimsLoading && !receivedClaims.length && <p className="section-lead">No claims have been submitted for your Found items.</p>}
        <div className="claim-list">
          {receivedClaims.map((claim) => (
            <article className="claim-card panel" key={claim._id}>
              <div className="claim-card-top"><div><span className="type-pill found">YOUR FOUND ITEM</span><h4>{claim.item?.title || 'Item unavailable'}</h4></div><span className={claimClass(claim.status)}>{claim.status}</span></div>
              <p><strong>{claim.claimant?.name || 'Community member'}</strong> · {claim.claimant?.email || ''}</p>
              <blockquote>{claim.message}</blockquote>
              <div className="claim-request-footer"><small>{new Date(claim.createdAt).toLocaleDateString()}</small>{claim.status === 'Pending' && <div className="claim-actions"><button className="primary-btn terracotta" disabled={processingClaim === claim._id} onClick={() => processClaim(claim, 'approve')}>{processingClaim === claim._id ? 'Saving...' : 'Approve'}</button><button className="primary-btn light" disabled={processingClaim === claim._id} onClick={() => processClaim(claim, 'reject')}>Reject</button></div>}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="claims-section">
        <div className="page-header-row"><div><p className="eyebrow">Workspace</p><h3>My item reports</h3><p className="section-lead">{items.length} report{items.length === 1 ? '' : 's'} in your account.</p></div></div>
        {loading && <p className="section-lead">Loading your reports...</p>}
        {!loading && !items.length && <div className="panel empty-state"><h3>No reports yet</h3><p>Use Report Lost or Report Found to create your first record.</p></div>}
        <div className="my-report-list">
          {items.map((item) => (
            <article className="report-row" key={item._id}>
              <div className={`row-thumb ${item.type === 'Lost' ? 'thumb-camera' : 'thumb-glasses'}`} style={item.image ? { backgroundImage: `url(${item.image})` } : undefined}></div>
              <div className="row-copy"><strong>{item.title}</strong><small>{item.type} · {item.category}</small></div>
              <span>{item.location}</span><span>{new Date(item.date).toLocaleDateString()}</span>
              <select className="status-select" value={item.status} disabled={processingItem === item._id} onChange={(event) => changeStatus(item._id, event.target.value)}><option>Active</option><option>Resolved</option></select>
              <div className="row-actions"><button type="button" onClick={() => navigate(`/items/${item._id}`)}>View</button><button type="button" onClick={() => navigate(`/report-${item.type.toLowerCase()}?edit=${item._id}`)}>Edit</button><button type="button" disabled={processingItem === item._id} onClick={() => remove(item._id)}>{processingItem === item._id ? '...' : 'Delete'}</button></div>
              <small className="report-timestamp">Created {new Date(item.createdAt).toLocaleDateString()} · Updated {new Date(item.updatedAt).toLocaleDateString()}</small>
            </article>
          ))}
        </div>
      </section>
    </WorkspaceLayout>
  );
};

export default MyReportsPage;

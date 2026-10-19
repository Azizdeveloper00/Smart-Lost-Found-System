import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import WorkspaceLayout from '../components/WorkspaceLayout';
import AuthContext from '../context/AuthContext';
import { createClaim } from '../services/claimService';
import { getItemById } from '../services/itemService';

const ItemDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimOpen, setClaimOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const [error, setError] = useState('');
  const [claimFeedback, setClaimFeedback] = useState('');

  useEffect(() => {
    getItemById(id).then(setItem).catch((err) => setError(err.response?.data?.message || 'Unable to load this item.')).finally(() => setLoading(false));
  }, [id]);

  const isReporter = item?.reportedBy?._id?.toString() === user?._id?.toString();

  const submitClaim = async (event) => {
    event.preventDefault();
    if (!message.trim()) {
      setClaimFeedback('Please add a message explaining why this item is yours.');
      return;
    }
    setClaimLoading(true);
    setClaimFeedback('');
    try {
      await createClaim({ itemId: item._id, message });
      setMessage('');
      setClaimOpen(false);
      setClaimFeedback('Claim submitted successfully.');
    } catch (err) {
      setClaimFeedback(err.response?.data?.message || 'Unable to submit claim.');
    } finally {
      setClaimLoading(false);
    }
  };

  return <WorkspaceLayout><button className="text-link back-link" onClick={() => navigate('/browse')}>← Back to browse</button>{loading && <p className="section-lead">Loading item...</p>}{error && <div className="panel empty-state"><h3>Unable to find item</h3><p className="error-text">{error}</p></div>}{claimFeedback && !claimOpen && <p className={claimFeedback.includes('successfully') ? 'success-text' : 'error-text'}>{claimFeedback}</p>}{item && <article className="item-detail panel"><div className="item-detail-image" style={item.image ? { backgroundImage: `url(${item.image})` } : undefined}></div><div className="item-detail-copy"><span className={`type-pill ${item.type.toLowerCase()}`}>{item.type.toUpperCase()}</span><h2>{item.title}</h2><p className="item-description">{item.description}</p><dl className="detail-list"><div><dt>Category</dt><dd>{item.category}</dd></div><div><dt>Location</dt><dd>{item.location}</dd></div><div><dt>Date</dt><dd>{new Date(item.date).toLocaleDateString()}</dd></div><div><dt>Status</dt><dd>{item.status}</dd></div><div><dt>Reported by</dt><dd>{item.reportedBy?.name || 'Community reporter'}</dd></div></dl>{item.type === 'Found' && !isReporter && !claimOpen && <button className="primary-btn terracotta claim-button" type="button" onClick={() => setClaimOpen(true)}>Claim This Item</button>}{item.type === 'Found' && !isReporter && claimOpen && <form className="claim-form" onSubmit={submitClaim}><label><span>Why is this item yours?</span><textarea rows="4" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="I believe this is my wallet because it has my college ID inside." /></label>{claimFeedback && <p className="error-text">{claimFeedback}</p>}<div className="claim-actions"><button className="primary-btn terracotta" disabled={claimLoading}>{claimLoading ? 'Submitting...' : 'Submit Claim'}</button><button className="primary-btn light" type="button" onClick={() => { setClaimOpen(false); setClaimFeedback(''); }}>Cancel</button></div></form>}</div></article>}</WorkspaceLayout>;
};

export default ItemDetailsPage;

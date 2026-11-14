import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  PackageSearch,
  MapPin,
  Calendar,
  Sparkles,
  ShieldCheck,
  Check,
  Upload,
  User,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { format } from 'date-fns';

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [item, setItem] = useState(null);
  const [claims, setClaims] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Claim Form State
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [proofDescription, setProofDescription] = useState('');
  const [proofFiles, setProofFiles] = useState([]);
  const [submittingClaim, setSubmittingClaim] = useState(false);

  const fetchItemAndMatches = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/lostfound/${id}`);
      setItem(res.data?.item);
      setClaims(res.data?.claims || []);

      // If user is authenticated, also check suggested matches (Algorithm G)
      if (user) {
        try {
          const matchRes = await api.get(`/lostfound/${id}/matches`);
          setMatches(matchRes.data || []);
        } catch (mErr) {
          console.error(mErr);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load item');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItemAndMatches();
  }, [id]);

  const handleConfirmMatch = async (targetItemId) => {
    if (!window.confirm('Confirm that these two items are a verified match?')) return;
    try {
      const res = await api.post(`/lostfound/${id}/confirm-match`, { targetItemId });
      toast.success(res.message);
      fetchItemAndMatches();
    } catch (err) {
      toast.error(err.message || 'Failed to confirm match');
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    if (!proofDescription) {
      toast.error('Please provide a proof description');
      return;
    }

    setSubmittingClaim(true);
    try {
      const formData = new FormData();
      formData.append('proofDescription', proofDescription);
      proofFiles.forEach((file) => {
        formData.append('proofImages', file);
      });

      const res = await api.post(`/lostfound/${id}/claims`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(res.message || 'Claim filed successfully');
      setClaimModalOpen(false);
      setProofDescription('');
      setProofFiles([]);
      fetchItemAndMatches();
    } catch (err) {
      toast.error(err.message || 'Failed to file claim');
    } finally {
      setSubmittingClaim(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!item) return <div className="p-8 text-center">Item not found</div>;

  const isOwner = user?._id === item.reportedBy?._id;
  const isLost = item.type === 'lost';
  const apiBase =
    import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : '';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top back button & header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Board
        </button>

        <span
          className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            isLost
              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
          }`}
        >
          {item.type} Item &bull; {item.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Photos & Details */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            {/* Image Gallery */}
            {item.images && item.images.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {item.images.map((img, idx) => (
                  <div
                    key={idx}
                    className="h-56 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700"
                  >
                    <img
                      src={`${apiBase}${img}`}
                      alt={`${item.title}-${idx}`}
                      className="h-full w-full object-cover"
                      onError={(e) => (e.target.style.display = 'none')}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-48 rounded-lg bg-slate-100 dark:bg-slate-700/40 flex items-center justify-center text-slate-400 mb-6">
                <PackageSearch className="h-12 w-12" />
              </div>
            )}

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                {item.category?.replace('_', ' ')}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {item.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 py-3 border-y border-slate-100 dark:border-slate-700/60 my-4">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{item.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span>Occurred: {format(new Date(item.dateOccurred), 'MMMM d, yyyy')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Description
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Matched banner if already matched */}
              {item.status === 'matched' && item.matchedWith && (
                <div className="mt-6 p-4 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs">
                  <div className="flex items-center gap-2 font-bold text-teal-800 dark:text-teal-300 mb-1">
                    <CheckCircle2 className="h-4 w-4" /> Match Confirmed with Opposite Item
                  </div>
                  <p className="text-teal-700 dark:text-teal-400">
                    This item has been officially matched with{' '}
                    <Link
                      to={`/m2/items/${item.matchedWith._id || item.matchedWith}`}
                      className="font-bold underline"
                    >
                      {item.matchedWith.title || 'Matching Counterpart'}
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Algorithm G Suggested Matches Panel */}
          {matches.length > 0 && item.status !== 'matched' && (
            <Card
              title="Suggested Smart Matches (Algorithm G)"
              subtitle="Calculated based on Category, Keyword Jaccard Overlap, Location, and Date Proximity"
            >
              <div className="space-y-3">
                {matches.map((m) => (
                  <div
                    key={m.item._id}
                    className="p-3.5 rounded-xl border border-brand-200 dark:border-brand-900/60 bg-brand-50/50 dark:bg-brand-950/20 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {m.item.title}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-600 text-white">
                          {m.score}% Match
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        Location: {m.item.location} &bull; Category: {m.item.category}
                      </p>
                      <div className="flex gap-2 text-[10px] text-slate-500 mt-1">
                        <span>Cat: {m.breakdown?.categoryScore}pts</span>
                        <span>Keywords: {m.breakdown?.keywordScore}pts</span>
                        <span>Location: {m.breakdown?.locationScore}pts</span>
                        <span>Date: {m.breakdown?.dateScore}pts</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/m2/items/${m.item._id}`}
                        className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 font-medium"
                      >
                        Inspect
                      </Link>

                      {(isOwner || ['admin', 'security'].includes(user?.role)) && (
                        <Button
                          size="sm"
                          variant="teal"
                          onClick={() => handleConfirmMatch(m.item._id)}
                        >
                          Confirm Match
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Existing Claims list */}
          {claims.length > 0 && (
            <Card title="Submitted Claims History" subtitle="Verification records for this item">
              <div className="space-y-3">
                {claims.map((c) => (
                  <div
                    key={c._id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        Claimed by {c.claimant?.name} ({c.claimant?.rollNo || c.claimant?.email})
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] capitalize ${
                          c.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                      Proof: {c.proofDescription}
                    </p>
                    {c.remark && (
                      <p className="text-[11px] text-slate-500 italic mt-1">
                        Staff Remark: {c.remark}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Actions & Ownership */}
        <div className="space-y-6">
          {/* Claim Action Box */}
          {!isOwner && !isLost && item.status !== 'claimed' && (
            <Card title="Is this your item?" subtitle="Submit proof of ownership to claim">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-4">
                To prevent fraud, explain identifying features not visible in photos (e.g. serial numbers, passcodes, internal content).
              </p>
              <Button onClick={() => setClaimModalOpen(true)} className="w-full gap-2">
                <ShieldCheck className="h-4 w-4" /> Claim Ownership
              </Button>
            </Card>
          )}

          {/* Reporter details */}
          <Card title="Reported By">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs uppercase text-slate-700 dark:text-slate-200">
                {item.reportedBy?.name?.slice(0, 2) || 'RP'}
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {item.reportedBy?.name}
                </p>
                <p className="text-slate-500">{item.reportedBy?.email}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Claim Submission Modal */}
      <Modal
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        title="Submit Proof of Ownership"
      >
        <form onSubmit={handleClaimSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Proof Details *
            </label>
            <textarea
              required
              rows="4"
              value={proofDescription}
              onChange={(e) => setProofDescription(e.target.value)}
              placeholder="Provide specific details verifying you are the rightful owner (e.g. wallpapers, unique stickers, internal files, invoice copy)..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Proof Images (optional invoice / receipt / old photo)
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => setProofFiles(Array.from(e.target.files).slice(0, 3))}
              className="text-xs text-slate-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setClaimModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submittingClaim}>
              Submit Claim
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ItemDetail;

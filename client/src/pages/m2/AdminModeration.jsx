import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { ShieldCheck, Check, X, FileText, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

const AdminModeration = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);

  // Decision Modal
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionStatus, setDecisionStatus] = useState('approved');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await api.get('/claims');
      setClaims(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const openDecisionModal = (claim, status) => {
    setSelectedClaim(claim);
    setDecisionStatus(status);
    setRemark('');
    setDecisionModalOpen(true);
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClaim) return;

    setSubmitting(true);
    try {
      const res = await api.patch(`/claims/${selectedClaim._id}/decision`, {
        status: decisionStatus,
        remark,
      });
      toast.success(res.message);
      setDecisionModalOpen(false);
      setSelectedClaim(null);
      fetchClaims();
    } catch (err) {
      toast.error(err.message || 'Failed to update claim decision');
    } finally {
      setSubmitting(false);
    }
  };

  const apiBase =
    import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-brand-600" /> Claims & Moderation Panel
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review ownership claims, verify claimant proofs, and approve handover of recovered belongings.
        </p>
      </div>

      <Card>
        {loading ? (
          <LoadingSpinner />
        ) : claims.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No claims filed"
            description="There are currently no ownership claims pending review."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Item Details</th>
                  <th className="py-3 px-4">Claimant</th>
                  <th className="py-3 px-4">Proof Description</th>
                  <th className="py-3 px-4">Date Filed</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {claims.map((claim) => (
                  <tr key={claim._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        {claim.item?.title || 'Item'}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {claim.item?.category} &bull; {claim.item?.location}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        {claim.claimant?.name}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {claim.claimant?.rollNo ? `Roll: ${claim.claimant.rollNo}` : claim.claimant?.email}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-slate-700 dark:text-slate-300 line-clamp-2">
                        {claim.proofDescription}
                      </p>
                      {claim.proofImages && claim.proofImages.length > 0 && (
                        <div className="flex gap-1.5 mt-1.5">
                          {claim.proofImages.map((img, i) => (
                            <a
                              key={i}
                              href={`${apiBase}${img}`}
                              target="_blank"
                              rel="noreferrer"
                              className="h-7 w-7 rounded overflow-hidden border border-slate-300 dark:border-slate-700 block"
                            >
                              <img src={`${apiBase}${img}`} alt="proof" className="h-full w-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {format(new Date(claim.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          claim.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : claim.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}
                      >
                        {claim.status}
                      </span>
                      {claim.remark && (
                        <p className="text-[10px] text-slate-400 mt-1 italic">
                          Remark: {claim.remark}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {claim.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openDecisionModal(claim, 'approved')}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60"
                            title="Approve Claim"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDecisionModal(claim, 'rejected')}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60"
                            title="Reject Claim"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Verified by {claim.verifiedBy?.name || 'Staff'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Decision Modal */}
      <Modal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        title={`${decisionStatus === 'approved' ? 'Approve' : 'Reject'} Ownership Claim`}
      >
        <form onSubmit={handleDecisionSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            You are setting claim by <strong>{selectedClaim?.claimant?.name}</strong> for item{' '}
            <strong>{selectedClaim?.item?.title}</strong> to{' '}
            <strong className={decisionStatus === 'approved' ? 'text-emerald-600' : 'text-rose-600'}>
              {decisionStatus}
            </strong>
            .
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Verification Notes / Staff Remark
            </label>
            <textarea
              rows="3"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="e.g. Identity verified via student ID at security desk. Handover completed."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setDecisionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={decisionStatus === 'approved' ? 'primary' : 'danger'}
              loading={submitting}
            >
              Confirm {decisionStatus}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminModeration;

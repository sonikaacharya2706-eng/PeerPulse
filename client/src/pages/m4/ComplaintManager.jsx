import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import {
  Sliders,
  Search,
  ShieldAlert,
  UserCheck,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';

const ComplaintManager = () => {
  const [complaints, setComplaints] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');

  // Assign Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [targetComplaint, setTargetComplaint] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [assignRemark, setAssignRemark] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: 50,
        ...(status && { status }),
        ...(category && { category }),
        ...(priority && { priority }),
      });

      const [complaintsRes, techRes] = await Promise.all([
        api.get(`/complaints?${params.toString()}`),
        api.get('/users?role=maintenance'),
      ]);

      setComplaints(complaintsRes.data || []);
      setTechnicians(techRes.data || []);
      if (techRes.data?.length > 0 && !selectedStaff) {
        setSelectedStaff(techRes.data[0]._id);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [status, category, priority]);

  const openAssignModal = (complaint) => {
    setTargetComplaint(complaint);
    setAssignRemark('');
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!targetComplaint || !selectedStaff) return;

    setAssigning(true);
    try {
      const res = await api.patch(`/complaints/${targetComplaint._id}/assign`, {
        assignedTo: selectedStaff,
        remark: assignRemark,
      });
      toast.success(res.message);
      setAssignModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to assign complaint');
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Sliders className="h-6 w-6 text-brand-600" /> Admin Complaint Manager
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dispatch reported campus defects to maintenance technicians and track SLA escalations.
          </p>
        </div>

        <Link to="/m4/analytics">
          <Button variant="outline" size="sm">
            View SLA & Metrics Analytics &rarr;
          </Button>
        </Link>
      </div>

      {/* Filter Row */}
      <Card className="p-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Status Filter
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 capitalize"
            >
              <option value="">All Statuses</option>
              <option value="submitted">Submitted (Unassigned)</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 capitalize"
            >
              <option value="">All Categories</option>
              <option value="electrical">Electrical</option>
              <option value="plumbing">Plumbing</option>
              <option value="internet">Internet / WiFi</option>
              <option value="furniture">Furniture</option>
              <option value="cleaning">Cleaning</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 capitalize"
            >
              <option value="">All Priorities</option>
              <option value="critical">Critical (4h)</option>
              <option value="high">High (24h)</option>
              <option value="medium">Medium (72h)</option>
              <option value="low">Low (120h)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Complaints Table */}
      <Card>
        {loading ? (
          <LoadingSpinner />
        ) : complaints.length === 0 ? (
          <EmptyState
            icon={Sliders}
            title="No complaints matching query"
            description="All maintenance tickets are up to date."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Category & Location</th>
                  <th className="py-3 px-4">Priority / SLA</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned Technician</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {complaints.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                      <Link to={`/m4/complaints/${c._id}`} className="hover:underline">
                        {c.ticketId}
                      </Link>
                      <span className="block font-sans text-[10px] text-slate-400 font-normal">
                        by {c.raisedBy?.name}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 capitalize block">
                        {c.category}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {c.building} ({c.room})
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            c.priority === 'critical'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : c.priority === 'high'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {c.priority}
                        </span>

                        {c.escalated && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-600 text-white animate-pulse">
                            ESCALATED
                          </span>
                        )}
                      </div>
                      <span className="block text-[10px] text-slate-400 mt-1">
                        Due: {format(new Date(c.slaDueAt), 'MMM d, h:mm a')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {c.assignedTo ? (
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {c.assignedTo.name}
                          </p>
                          <p className="text-[10px] text-slate-400">{c.assignedTo.phone || c.assignedTo.email}</p>
                        </div>
                      ) : (
                        <span className="text-amber-600 font-semibold italic text-[11px]">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openAssignModal(c)}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium text-[11px] transition"
                        >
                          {c.assignedTo ? 'Reassign' : 'Assign'}
                        </button>

                        <Link to={`/m4/complaints/${c._id}`}>
                          <Button variant="ghost" size="sm">
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Assign Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Ticket ${targetComplaint?.ticketId}`}
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Issue: <strong>{targetComplaint?.category}</strong> in <strong>{targetComplaint?.building} {targetComplaint?.room}</strong> ({targetComplaint?.priority} priority).
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Select Maintenance Staff *
            </label>
            <select
              required
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {technicians.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Assignment Note / Instructions
            </label>
            <textarea
              rows="3"
              value={assignRemark}
              onChange={(e) => setAssignRemark(e.target.value)}
              placeholder="e.g. Please bring replacement ballasts and inspect wiring by 2 PM."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={assigning}>
              Confirm Assignment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ComplaintManager;

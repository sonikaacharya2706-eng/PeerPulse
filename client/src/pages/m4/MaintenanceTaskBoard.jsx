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
  Wrench,
  Clock,
  Play,
  CheckCircle2,
  Upload,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  X,
} from 'lucide-react';
import { format } from 'date-fns';

const MaintenanceTaskBoard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Status Update Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [targetStatus, setTargetStatus] = useState('in_progress');
  const [statusRemark, setStatusRemark] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await api.get('/complaints');
      setTasks(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load maintenance tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const openStatusModal = (task, newStatus) => {
    setSelectedTask(task);
    setTargetStatus(newStatus);
    setStatusRemark('');
    setSelectedFiles([]);
    setPreviews([]);
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 3);
    setSelectedFiles(files);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('status', targetStatus);
      formData.append('remark', statusRemark);
      selectedFiles.forEach((f) => formData.append('images', f));

      const res = await api.patch(`/complaints/${selectedTask._id}/status`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(res.message);
      setModalOpen(false);
      fetchTasks();
    } catch (err) {
      toast.error(err.message || 'Failed to update task status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Wrench className="h-6 w-6 text-brand-600" /> Maintenance Staff Task Board
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Assigned repair tickets, SLA priorities, and work order completion controls.
          </p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No maintenance tasks assigned"
          description="You currently have zero pending work orders. Check back later or notify admin."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task) => {
            const isEscalated = task.escalated;
            const canStart = task.status === 'assigned';
            const canResolve = task.status === 'in_progress';

            return (
              <Card
                key={task._id}
                className={`flex flex-col justify-between border ${
                  isEscalated
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/10'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">
                      {task.ticketId}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          task.priority === 'critical'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : task.priority === 'high'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {task.priority}
                      </span>

                      {isEscalated && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-600 text-white animate-pulse">
                          SLA BREACH
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 capitalize">
                    {task.category} &bull; {task.building} ({task.room})
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-2">
                    {task.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-1 text-xs text-slate-500">
                    <p>Complainant: {task.raisedBy?.name} ({task.raisedBy?.phone || 'No phone'})</p>
                    <p className="text-[11px] text-slate-400">
                      SLA Deadline: {format(new Date(task.slaDueAt), 'MMM d, h:mm a')}
                    </p>
                    <p>Current Status: <strong className="uppercase">{task.status.replace('_', ' ')}</strong></p>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <Link to={`/m4/complaints/${task._id}`}>
                    <Button variant="ghost" size="sm">
                      Details &rarr;
                    </Button>
                  </Link>

                  <div className="flex gap-2">
                    {canStart && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openStatusModal(task, 'in_progress')}
                        className="gap-1.5"
                      >
                        <Play className="h-3.5 w-3.5" /> Start Work
                      </Button>
                    )}

                    {canResolve && (
                      <Button
                        size="sm"
                        variant="teal"
                        onClick={() => openStatusModal(task, 'resolved')}
                        className="gap-1.5"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Mark Resolved
                      </Button>
                    )}

                    {['resolved', 'closed'].includes(task.status) && (
                      <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Work Complete
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Advance Status Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Advance Task: ${selectedTask?.ticketId} to ${targetStatus.replace('_', ' ').toUpperCase()}`}
      >
        <form onSubmit={handleStatusSubmit} className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Location: <strong>{selectedTask?.building} {selectedTask?.room}</strong> ({selectedTask?.category} defect).
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Technician Work Notes *
            </label>
            <textarea
              required
              rows="3"
              value={statusRemark}
              onChange={(e) => setStatusRemark(e.target.value)}
              placeholder={
                targetStatus === 'resolved'
                  ? 'Describe repair completed (e.g. Replaced faulty circuit breaker and verified voltage)...'
                  : 'Describe work started (e.g. Arrived on site, diagnosed short circuit)...'
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {targetStatus === 'resolved' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Upload After-Repair Proof Photos (Max 3)
              </label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="text-xs text-slate-500"
              />
              {previews.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {previews.map((u, i) => (
                    <div key={i} className="h-16 w-16 rounded overflow-hidden border">
                      <img src={u} alt="after" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Confirm Status Update
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MaintenanceTaskBoard;

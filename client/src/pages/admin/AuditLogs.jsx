import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { FileText, Shield, User, Globe, Clock } from 'lucide-react';
import { format } from 'date-fns';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 25,
        ...(actionFilter && { action: actionFilter }),
        ...(entityFilter && { entity: entityFilter }),
      });
      const res = await api.get(`/audit-logs?${params.toString()}`);
      setLogs(res.data || []);
      setMeta(res.meta || { total: 0, pages: 1 });
    } catch (err) {
      toast.error(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Security & System Audit Logs
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Immutable event log of critical operations across campus entities.
        </p>
      </div>

      <Card>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <input
            type="text"
            placeholder="Filter by Action (e.g. LOGIN, CREATE_USER)"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          <input
            type="text"
            placeholder="Filter by Entity (e.g. User, RoomBooking)"
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />

          {(actionFilter || entityFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActionFilter('');
                setEntityFilter('');
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No audit logs found"
            description="No system activity recorded matching your filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Details / Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {log.actor ? (
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {log.actor.name}
                          </p>
                          <p className="text-[10px] text-slate-500">{log.actor.email}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">System / Anonymous</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {log.entity}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {log.ip || '127.0.0.1'}
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-500" title={JSON.stringify(log.meta)}>
                      {JSON.stringify(log.meta)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {meta.pages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-4 mt-4 text-xs">
            <span className="text-slate-500">
              Page {meta.page} of {meta.pages} ({meta.total} records total)
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.pages}
                onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuditLogs;

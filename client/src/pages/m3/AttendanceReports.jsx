import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { BarChart3, Download, FileSpreadsheet, FileText, Filter } from 'lucide-react';
import { format } from 'date-fns';

const AttendanceReports = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState('CSE');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(subject && { subject }),
        ...(department && { department }),
        ...(from && { from }),
        ...(to && { to }),
        format: 'json',
      });

      const res = await api.get(`/attendance/report?${params.toString()}`);
      setRecords(res.data?.records || []);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch attendance reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [subject, department, from, to]);

  const handleExport = (type) => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      ...(subject && { subject }),
      ...(department && { department }),
      ...(from && { from }),
      ...(to && { to }),
      format: type,
    });

    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/attendance/report?${params.toString()}`;

    // Download via link with auth token
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `attendance_report_${Date.now()}.${type}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast.success(`${type.toUpperCase()} report downloaded!`);
      })
      .catch(() => toast.error(`Failed to export ${type.toUpperCase()}`));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-brand-600" /> Attendance Reports & Exports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Query class attendances and generate formatted CSV and PDF compliance documents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('pdf')}
            className="gap-2"
          >
            <FileText className="h-4 w-4 text-rose-600" /> Export PDF
          </Button>
        </div>
      </div>

      {/* Filter Card */}
      <Card title="Filter Criteria">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Department
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. CSE"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Subject Name
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Data Structures"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
      </Card>

      {/* Report Table */}
      <Card>
        {loading ? (
          <LoadingSpinner />
        ) : records.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="No records found"
            description="No student attendance records matched your filter criteria."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4 text-right">Time Marked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {r.session?.startedAt ? format(new Date(r.session.startedAt), 'MMM d, yyyy') : '—'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {r.session?.subject}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                      {r.student?.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-teal-600 dark:text-teal-400">
                      {r.student?.rollNo || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 uppercase text-[10px] text-slate-500">
                      {r.method}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono">
                      {new Date(r.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AttendanceReports;

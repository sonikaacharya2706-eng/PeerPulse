import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { Users, QrCode, Download, CheckCircle2, UserCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const VisitorRegister = () => {
  const user = useAuthStore((state) => state.user);

  const [hosts, setHosts] = useState([]);
  const [createdVisitor, setCreatedVisitor] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    purpose: '',
    personToMeet: '',
    idProofType: 'Driver License',
    idProofNumber: '',
    expectedDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const fetchHosts = async () => {
      try {
        const res = await api.get('/users?role=faculty&limit=50');
        setHosts(res.data || []);
        if (res.data?.length > 0) {
          setForm((prev) => ({ ...prev, personToMeet: res.data[0]._id }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchHosts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/visitors', form);
      setCreatedVisitor(res.data);
      toast.success('Visitor pass generated successfully!');
      setForm({
        name: '',
        phone: '',
        email: '',
        purpose: '',
        personToMeet: hosts[0]?._id || '',
        idProofType: 'Driver License',
        idProofNumber: '',
        expectedDate: new Date().toISOString().split('T')[0],
      });
    } catch (err) {
      toast.error(err.message || 'Failed to register visitor');
    } finally {
      setLoading(false);
    }
  };

  const apiBase =
    import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : '';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Users className="h-6 w-6 text-brand-600" /> Campus Visitor Pass Registration
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {user?.role === 'security'
            ? 'Issue on-the-spot guest gate passes with encoded QR authorization'
            : 'Pre-register upcoming campus visitors to speed up security check-in at the gate'}
        </p>
      </div>

      {createdVisitor && (
        <Card className="bg-gradient-to-tr from-brand-50 to-teal-50 dark:from-slate-800 dark:to-slate-800/60 border-brand-200 dark:border-brand-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center sm:text-left">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                Pass Active
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Visitor: {createdVisitor.name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Host: {createdVisitor.personToMeet?.name} ({createdVisitor.personToMeet?.department})
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Purpose: {createdVisitor.purpose}
              </p>

              <div className="pt-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                  Pass Code (Alphanumeric)
                </span>
                <span className="text-2xl font-extrabold font-mono text-brand-700 dark:text-brand-300 tracking-wider">
                  {createdVisitor.passCode}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="p-3 bg-white rounded-xl shadow-md border border-slate-200 mb-2">
                <img
                  src={`${apiBase}/api/visitors/${createdVisitor._id}/pass`}
                  alt="Visitor Pass QR"
                  className="h-32 w-32"
                />
              </div>
              <a
                href={`${apiBase}/api/visitors/${createdVisitor._id}/pass`}
                download={`Visitor_Pass_${createdVisitor.passCode}.png`}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <Download className="h-3.5 w-3.5" /> Download QR Pass
              </a>
            </div>
          </div>
        </Card>
      )}

      <Card title="Visitor & Meeting Information">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Visitor Full Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Michael Smith"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="michael@external.com"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Host / Person to Meet *
              </label>
              <select
                required
                value={form.personToMeet}
                onChange={(e) => setForm({ ...form, personToMeet: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {hosts.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name} ({h.department})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                ID Proof Type *
              </label>
              <select
                value={form.idProofType}
                onChange={(e) => setForm({ ...form, idProofType: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="National ID">National ID / Aadhaar</option>
                <option value="Driver License">Driver's License</option>
                <option value="Passport">Passport</option>
                <option value="College ID">Visiting College ID</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                ID Proof Number *
              </label>
              <input
                type="text"
                required
                value={form.idProofNumber}
                onChange={(e) => setForm({ ...form, idProofNumber: e.target.value })}
                placeholder="e.g. DL-12345678"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Visit Date *
              </label>
              <input
                type="date"
                required
                value={form.expectedDate}
                onChange={(e) => setForm({ ...form, expectedDate: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Purpose of Visit *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Guest Lecture, Lab Inspection, Vendor Meeting"
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end pt-3">
            <Button type="submit" loading={loading} className="gap-2">
              Generate Visitor Pass
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default VisitorRegister;

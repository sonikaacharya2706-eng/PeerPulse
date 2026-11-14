import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { AlertTriangle, Upload, X } from 'lucide-react';

const CATEGORIES = [
  'electrical',
  'plumbing',
  'internet',
  'furniture',
  'cleaning',
  'other',
];

const RaiseComplaint = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    category: 'electrical',
    building: '',
    room: '',
    description: '',
    priority: 'medium',
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 3) {
      toast.error('You can upload a maximum of 3 photos');
      return;
    }
    const merged = [...selectedFiles, ...files].slice(0, 3);
    setSelectedFiles(merged);
    setPreviews(merged.map((f) => URL.createObjectURL(f)));
  };

  const removeFile = (idx) => {
    const newFiles = selectedFiles.filter((_, i) => i !== idx);
    setSelectedFiles(newFiles);
    setPreviews(previews.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.building || !form.room || !form.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('category', form.category);
      formData.append('building', form.building);
      formData.append('room', form.room);
      formData.append('description', form.description);
      formData.append('priority', form.priority);

      selectedFiles.forEach((f) => formData.append('images', f));

      const res = await api.post('/complaints', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(`Complaint ${res.data.ticketId} created!`);
      navigate(`/m4/complaints/${res.data._id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to raise complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-brand-600" /> Raise Maintenance Complaint
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Submit campus infrastructure issues with automated SLA timers and resolution tracking.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 capitalize"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Priority *
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="low">Low (120-hour SLA resolution)</option>
                <option value="medium">Medium (72-hour SLA resolution)</option>
                <option value="high">High (24-hour SLA resolution)</option>
                <option value="critical">Critical (4-hour Emergency SLA)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Building Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Science Block A, Hostels"
                value={form.building}
                onChange={(e) => setForm({ ...form, building: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Room / Area Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Room 204, 2nd Floor Corridor"
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Issue Description *
            </label>
            <textarea
              required
              rows="4"
              placeholder="Describe the failure in detail (e.g. AC leaking water onto lab computers, projector HDMI port broken, power socket sparkling)..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Photos Upload */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Upload Photos of Damage (Max 3, up to 5MB each)
            </label>

            <div className="flex flex-wrap items-center gap-3">
              {previews.map((url, idx) => (
                <div
                  key={idx}
                  className="relative h-20 w-20 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700"
                >
                  <img src={url} alt="damage-preview" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 p-0.5 rounded-full bg-slate-900/80 text-white hover:bg-rose-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {selectedFiles.length < 3 && (
                <label className="h-20 w-20 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-brand-600 transition">
                  <Upload className="h-5 w-5" />
                  <span className="text-[10px] mt-1 font-medium">Add Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700/60">
            <Button variant="ghost" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Submit Complaint
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default RaiseComplaint;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { PlusCircle, Upload, X, AlertCircle, CheckCircle } from 'lucide-react';

const CATEGORIES = [
  'electronics',
  'books',
  'id_cards',
  'clothing',
  'accessories',
  'keys',
  'bags',
  'other',
];

const ReportItem = () => {
  const navigate = useNavigate();

  const [type, setType] = useState('lost');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('electronics');
  const [description, setDescription] = useState('');
  const [dateOccurred, setDateOccurred] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedFiles.length > 3) {
      toast.error('You can upload a maximum of 3 images');
      return;
    }

    const newFiles = [...selectedFiles, ...files].slice(0, 3);
    setSelectedFiles(newFiles);

    // Create previews
    const urls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const removeFile = (index) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    setPreviewUrls(newUrls);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !location || !dateOccurred) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('title', title);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('dateOccurred', dateOccurred);
      formData.append('location', location);

      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      const res = await api.post('/lostfound', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.meta?.suggestedMatchesCount > 0) {
        toast.success(
          `Item reported! Algorithm G found ${res.meta.suggestedMatchesCount} potential matching item(s)!`
        );
      } else {
        toast.success(res.message || 'Item reported successfully');
      }

      navigate(`/m2/items/${res.data._id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to report item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <PlusCircle className="h-6 w-6 text-brand-600" /> Report Lost or Found Item
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Provide accurate item details to enable our Algorithm G automatic match detection.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Lost vs Found Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Report Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('lost')}
                className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                  type === 'lost'
                    ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 ring-2 ring-rose-500/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                I Lost Something
              </button>

              <button
                type="button"
                onClick={() => setType('found')}
                className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                  type === 'found'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-2 ring-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                I Found Something
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Item Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Blue Dell Laptop Charger or Silver Keyring"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 capitalize"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date Occurred / Found *
              </label>
              <input
                type="date"
                required
                value={dateOccurred}
                onChange={(e) => setDateOccurred(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Campus Location *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Central Library 2nd Floor, Room 102, Cafeteria"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Detailed Description *
            </label>
            <textarea
              required
              rows="3"
              placeholder="Describe brand, color, stickers, unique scratches, distinguishing markings..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Image Upload Area */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Upload Photos (Max 3, up to 5MB each)
            </label>

            <div className="flex flex-wrap items-center gap-3">
              {previewUrls.map((url, idx) => (
                <div
                  key={idx}
                  className="relative h-20 w-20 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700"
                >
                  <img src={url} alt="preview" className="h-full w-full object-cover" />
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
                <label className="h-20 w-20 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-400 flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-brand-600 transition">
                  <Upload className="h-5 w-5" />
                  <span className="text-[10px] mt-1 font-medium">Add Photo</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
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
            <Button type="submit" loading={loading} className="gap-2">
              Submit Report
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ReportItem;

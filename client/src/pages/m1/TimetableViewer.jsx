import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { useAuthStore } from '../../store/authStore';
import {
  BookOpen,
  Calendar,
  Filter,
  User,
  Building,
  Upload,
  Image as ImageIcon,
  ZoomIn,
  Download,
  Trash2,
  Eye,
  CheckCircle2,
  FileText,
  Sparkles,
} from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TimetableViewer = () => {
  const user = useAuthStore((state) => state.user);
  const isFacultyOrAdmin = user?.role === 'faculty' || user?.role === 'admin';

  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'images'
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [classrooms, setClassrooms] = useState([]);
  const [faculties, setFaculties] = useState([]);

  // Filter state (defaults to student's department/year if student)
  const [filters, setFilters] = useState({
    department: user?.role === 'student' && user?.department ? user.department : 'ISE',
    year: user?.role === 'student' && user?.year ? String(user.year) : '2',
    section: 'A',
    faculty: '',
    classroom: '',
  });

  // Timetable Image Sheets State
  const [timetableImages, setTimetableImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    title: '',
    department: user?.department || 'ISE',
    year: '2',
    section: 'A',
    semester: 'Odd Semester 2026',
    description: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const apiBase =
    import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL.startsWith('http')
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : '';

  const getFullImageUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    return `${apiBase}${path}`;
  };

  const fetchDropdowns = async () => {
    try {
      const [roomsRes, usersRes] = await Promise.all([
        api.get('/classrooms'),
        api.get('/users?role=faculty&limit=50'),
      ]);
      setClassrooms(roomsRes.data || []);
      setFaculties(usersRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTimetable = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      if (filters.year) params.append('year', filters.year);
      if (filters.section) params.append('section', filters.section);
      if (filters.faculty) params.append('faculty', filters.faculty);
      if (filters.classroom) params.append('classroom', filters.classroom);

      const res = await api.get(`/timetable?${params.toString()}`);
      setEntries(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to fetch timetable');
    } finally {
      setLoading(false);
    }
  };

  const fetchTimetableImages = async () => {
    setLoadingImages(true);
    try {
      const params = new URLSearchParams();
      if (filters.department) params.append('department', filters.department);
      if (filters.year) params.append('year', filters.year);
      if (filters.section) params.append('section', filters.section);

      const res = await api.get(`/timetable/images?${params.toString()}`);
      setTimetableImages(res.data || []);
    } catch (err) {
      console.error('Failed to fetch timetable images:', err);
    } finally {
      setLoadingImages(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchTimetable();
    fetchTimetableImages();
  }, [filters]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      toast.error('Please select a timetable image to upload');
      return;
    }
    if (!uploadForm.title.trim()) {
      toast.error('Please enter a timetable title');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', uploadForm.title.trim());
      formData.append('department', uploadForm.department);
      formData.append('year', uploadForm.year);
      formData.append('section', uploadForm.section);
      formData.append('semester', uploadForm.semester);
      formData.append('description', uploadForm.description);
      formData.append('image', imageFile);

      const res = await api.post('/timetable/images', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Timetable image uploaded successfully! Students can now view it.');
      setUploadModalOpen(false);
      setImageFile(null);
      setFilePreviewUrl('');
      setUploadForm({
        title: '',
        department: user?.department || 'ISE',
        year: '2',
        section: 'A',
        semester: 'Odd Semester 2026',
        description: '',
      });
      fetchTimetableImages();
    } catch (err) {
      toast.error(err.message || 'Failed to upload timetable image');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this timetable sheet?')) return;
    try {
      await api.delete(`/timetable/images/${imageId}`);
      toast.success('Timetable sheet deleted');
      fetchTimetableImages();
    } catch (err) {
      toast.error(err.message || 'Failed to delete timetable sheet');
    }
  };

  // Group entries by Day of Week (0-6)
  const groupedByDay = DAYS.map((dayName, dayIndex) => {
    return {
      dayIndex,
      dayName,
      slots: entries.filter((e) => e.dayOfWeek === dayIndex),
    };
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-brand-600" /> Timetable Viewer
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse weekly classroom schedules and official faculty timetable sheets.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Tab Switcher */}
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 text-xs">
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                activeTab === 'grid'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" /> Weekly Grid
            </button>
            <button
              onClick={() => setActiveTab('images')}
              className={`px-3 py-1.5 rounded-md font-medium transition flex items-center gap-1.5 ${
                activeTab === 'images'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="h-3.5 w-3.5" /> Official Sheets ({timetableImages.length})
            </button>
          </div>

          {/* Faculty Upload Button */}
          {isFacultyOrAdmin && (
            <Button
              onClick={() => setUploadModalOpen(true)}
              className="gap-1.5 text-xs py-2 px-3.5 bg-gradient-to-r from-brand-600 to-teal-600 text-white"
            >
              <Upload className="h-3.5 w-3.5" /> Upload Timetable Sheet
            </Button>
          )}
        </div>
      </div>

      {/* Student Banner: If official timetable images are available */}
      {user?.role === 'student' && timetableImages.length > 0 && activeTab === 'grid' && (
        <div className="rounded-xl p-3.5 bg-gradient-to-r from-brand-50 to-teal-50 dark:from-brand-950/40 dark:to-teal-950/30 border border-brand-200 dark:border-brand-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-brand-600 shrink-0" />
            <p className="text-slate-800 dark:text-slate-200">
              <span className="font-semibold">Official Faculty Timetable Sheet available!</span>{' '}
              Prof. {timetableImages[0].uploadedBy?.name || 'Faculty'} uploaded{' '}
              <span className="font-medium italic">"{timetableImages[0].title}"</span> for your class.
            </p>
          </div>
          <button
            onClick={() => {
              setActiveTab('images');
              setPreviewImage(timetableImages[0]);
            }}
            className="px-3 py-1 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition shrink-0 ml-3"
          >
            View Sheet
          </button>
        </div>
      )}

      {/* Filter Header */}
      <Card title="Filter Schedule & Class Sheets" subtitle="Select Class or Faculty / Room">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Department
            </label>
            <input
              type="text"
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              placeholder="e.g. ISE"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Year
            </label>
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Any Year</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Section
            </label>
            <input
              type="text"
              value={filters.section}
              onChange={(e) => setFilters({ ...filters, section: e.target.value })}
              placeholder="e.g. A"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Faculty
            </label>
            <select
              value={filters.faculty}
              onChange={(e) => setFilters({ ...filters, faculty: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Faculty</option>
              {faculties.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase text-slate-500 mb-1">
              Classroom
            </label>
            <select
              value={filters.classroom}
              onChange={(e) => setFilters({ ...filters, classroom: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Classrooms</option>
              {classrooms.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.roomNo} ({c.building})
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* TAB 1: WEEKLY GRID VIEW */}
      {activeTab === 'grid' && (
        <>
          {loading ? (
            <LoadingSpinner />
          ) : entries.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No timetable schedule found"
              description="Try broadening your department, year, section, or faculty filter, or switch to Official Sheets tab."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {groupedByDay.map(({ dayIndex, dayName, slots }) => {
                if (dayIndex === 0 && slots.length === 0) return null;

                return (
                  <div
                    key={dayIndex}
                    className="bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col"
                  >
                    <div className="bg-slate-100 dark:bg-slate-700/50 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        {dayName}
                      </h3>
                      <span className="text-[10px] text-slate-500">{slots.length} classes</span>
                    </div>

                    <div className="p-3 space-y-2.5 flex-1">
                      {slots.length === 0 ? (
                        <p className="text-[11px] text-slate-400 text-center py-6">
                          No classes scheduled
                        </p>
                      ) : (
                        slots.map((slot) => (
                          <div
                            key={slot._id}
                            className="p-3 rounded-lg border border-brand-200/70 dark:border-brand-900/40 bg-brand-50/40 dark:bg-brand-950/20 text-xs transition hover:shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span className="font-bold text-brand-900 dark:text-brand-200 line-clamp-1">
                                {slot.subject}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white dark:bg-slate-800 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 shrink-0">
                                {slot.classroom?.roomNo || 'Room'}
                              </span>
                            </div>

                            <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                              {slot.startTime} &ndash; {slot.endTime}
                            </p>

                            <div className="mt-2 pt-2 border-t border-brand-100 dark:border-brand-900/40 text-[10px] text-slate-500 flex items-center justify-between">
                              <span className="truncate">Prof. {slot.faculty?.name || 'Faculty'}</span>
                              <span>Sec {slot.section}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: OFFICIAL TIMETABLE IMAGE SHEETS */}
      {activeTab === 'images' && (
        <div>
          {loadingImages ? (
            <LoadingSpinner />
          ) : timetableImages.length === 0 ? (
            <EmptyState
              icon={ImageIcon}
              title="No timetable image sheets found"
              description={
                isFacultyOrAdmin
                  ? 'No official timetable image has been uploaded for this class yet. Click "Upload Timetable Sheet" above to upload an image for students.'
                  : 'Your faculty has not uploaded an image sheet for this selection yet. You can view the Weekly Grid schedule above.'
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {timetableImages.map((sheet) => {
                const fullUrl = getFullImageUrl(sheet.imageUrl);
                const canDelete =
                  user?.role === 'admin' ||
                  (user?.role === 'faculty' && sheet.uploadedBy?._id === user?._id);

                return (
                  <div
                    key={sheet._id}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300">
                            {sheet.department} Year {sheet.year} &bull; Sec {sheet.section}
                          </span>
                          <span className="text-[10px] text-slate-400">{sheet.semester}</span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">
                          {sheet.title}
                        </h3>
                      </div>

                      {canDelete && (
                        <button
                          onClick={() => handleDeleteImage(sheet._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                          title="Delete timetable sheet"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Image Thumbnail Container */}
                    <div
                      onClick={() => setPreviewImage(sheet)}
                      className="relative h-60 bg-slate-900/5 dark:bg-slate-900/40 cursor-pointer group overflow-hidden"
                    >
                      <img
                        src={fullUrl}
                        alt={sheet.title}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white">
                        <span className="p-2 rounded-full bg-slate-900/70 backdrop-blur-sm">
                          <ZoomIn className="h-5 w-5" />
                        </span>
                        <span className="text-xs font-semibold">Click to Zoom</span>
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="p-4 bg-slate-50/50 dark:bg-slate-800/40 flex-1 flex flex-col justify-between text-xs border-t border-slate-100 dark:border-slate-700">
                      {sheet.description && (
                        <p className="text-slate-600 dark:text-slate-400 mb-3 text-[11px] italic">
                          "{sheet.description}"
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-slate-500">
                        <div className="flex items-center gap-1.5 truncate">
                          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">Prof. {sheet.uploadedBy?.name || 'Faculty'}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setPreviewImage(sheet)}
                            className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-brand-50 hover:text-brand-600 transition flex items-center gap-1 text-[11px] font-medium"
                          >
                            <Eye className="h-3 w-3" /> View
                          </button>
                          <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={`timetable-${sheet.department}-yr${sheet.year}.jpg`}
                            className="px-2.5 py-1 rounded bg-brand-600 text-white hover:bg-brand-700 transition flex items-center gap-1 text-[11px] font-medium"
                          >
                            <Download className="h-3 w-3" /> Save
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FACULTY UPLOAD TIMETABLE SHEET MODAL */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Class Timetable Sheet"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Upload an official timetable sheet image (PNG, JPG, WebP) visible to enrolled students.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Timetable Title *
            </label>
            <input
              type="text"
              required
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              placeholder="e.g. ISE 3rd Year Sec A Odd Semester Timetable"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department *
              </label>
              <input
                type="text"
                required
                value={uploadForm.department}
                onChange={(e) => setUploadForm({ ...uploadForm, department: e.target.value.toUpperCase() })}
                placeholder="ISE"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Year *
              </label>
              <select
                value={uploadForm.year}
                onChange={(e) => setUploadForm({ ...uploadForm, year: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Section
              </label>
              <input
                type="text"
                value={uploadForm.section}
                onChange={(e) => setUploadForm({ ...uploadForm, section: e.target.value.toUpperCase() })}
                placeholder="A"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Semester
            </label>
            <input
              type="text"
              value={uploadForm.semester}
              onChange={(e) => setUploadForm({ ...uploadForm, semester: e.target.value })}
              placeholder="e.g. Odd Semester 2026"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Image File Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Timetable Sheet Image (Max 5MB) *
            </label>
            <input
              type="file"
              required
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-slate-800 dark:file:text-slate-200"
            />
          </div>

          {/* Image Preview */}
          {filePreviewUrl && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 bg-slate-50 dark:bg-slate-900">
              <span className="text-[10px] font-semibold text-slate-400 uppercase mb-1 block">Selected Preview:</span>
              <img
                src={filePreviewUrl}
                alt="Upload preview"
                className="max-h-48 rounded object-contain mx-auto"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Optional Notes / Circular Number
            </label>
            <textarea
              rows={2}
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              placeholder="e.g. Revised schedule with updated lab timings, effective Monday."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={uploading} className="gap-2">
              <Upload className="h-4 w-4" /> Upload Sheet
            </Button>
          </div>
        </form>
      </Modal>

      {/* FULLSCREEN IMAGE ZOOM PREVIEW MODAL */}
      {previewImage && (
        <Modal
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          title={previewImage.title}
          size="2xl"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-700">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {previewImage.department} Year {previewImage.year} (Sec {previewImage.section})
                </span>{' '}
                &bull; {previewImage.semester}
              </div>
              <div>Uploaded by Prof. {previewImage.uploadedBy?.name || 'Faculty'}</div>
            </div>

            <div className="max-h-[70vh] overflow-auto bg-slate-900/90 rounded-xl p-2 flex items-center justify-center">
              <img
                src={getFullImageUrl(previewImage.imageUrl)}
                alt={previewImage.title}
                className="max-w-full h-auto object-contain rounded shadow-lg"
              />
            </div>

            {previewImage.description && (
              <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 italic">
                "{previewImage.description}"
              </p>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-400">
                Uploaded: {new Date(previewImage.createdAt).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreviewImage(null)}>
                  Close
                </Button>
                <a
                  href={getFullImageUrl(previewImage.imageUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={`timetable-${previewImage.department}-yr${previewImage.year}.jpg`}
                >
                  <Button size="sm" className="gap-1.5">
                    <Download className="h-3.5 w-3.5" /> Download Full Resolution
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TimetableViewer;

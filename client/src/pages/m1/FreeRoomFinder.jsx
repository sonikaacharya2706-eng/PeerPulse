import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { Search, Users, Layers, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const FreeRoomFinder = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const todayStr = new Date().toISOString().split('T')[0];

  const [searchParams, setSearchParams] = useState({
    date: todayStr,
    startTime: '10:00',
    endTime: '11:00',
    minCapacity: '',
    type: '',
    facilities: '',
  });

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchParams.date || !searchParams.startTime || !searchParams.endTime) {
      toast.error('Date, start time, and end time are required');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('date', searchParams.date);
      params.append('startTime', searchParams.startTime);
      params.append('endTime', searchParams.endTime);
      if (searchParams.minCapacity) params.append('minCapacity', searchParams.minCapacity);
      if (searchParams.type) params.append('type', searchParams.type);
      if (searchParams.facilities) params.append('facilities', searchParams.facilities);

      const res = await api.get(`/rooms/free-search?${params.toString()}`);
      setRooms(res.data || []);
      setHasSearched(true);
      toast.success(`Found ${res.data?.length || 0} available classrooms!`);
    } catch (err) {
      toast.error(err.message || 'Error searching free rooms');
    } finally {
      setLoading(false);
    }
  };

  const handleBookRedirect = (room) => {
    navigate('/m1/bookings', {
      state: {
        prefillRoomId: room._id,
        prefillDate: searchParams.date,
        prefillStartTime: searchParams.startTime,
        prefillEndTime: searchParams.endTime,
      },
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Search className="h-6 w-6 text-brand-600" /> Free Room Finder
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Zero-clash availability search. Automatically filters out active timetable classes and approved bookings, sorted by smallest sufficient capacity.
        </p>
      </div>

      {/* Search Criteria Card */}
      <Card title="Search Parameters" subtitle="Define the date, time slot, and required room amenities">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={searchParams.date}
                onChange={(e) => setSearchParams({ ...searchParams, date: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={searchParams.startTime}
                onChange={(e) => setSearchParams({ ...searchParams, startTime: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                End Time *
              </label>
              <input
                type="time"
                required
                value={searchParams.endTime}
                onChange={(e) => setSearchParams({ ...searchParams, endTime: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Min Capacity
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 40"
                value={searchParams.minCapacity}
                onChange={(e) => setSearchParams({ ...searchParams, minCapacity: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Room Type
              </label>
              <select
                value={searchParams.type}
                onChange={(e) => setSearchParams({ ...searchParams, type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Any Type</option>
                <option value="lecture">Lecture Hall</option>
                <option value="lab">Computer / Science Lab</option>
                <option value="seminar">Seminar Room</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Facilities (comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Projector, AC"
                value={searchParams.facilities}
                onChange={(e) => setSearchParams({ ...searchParams, facilities: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" loading={loading} className="gap-2">
              <Search className="h-4 w-4" /> Find Available Rooms
            </Button>
          </div>
        </form>
      </Card>

      {/* Search Results */}
      <div>
        {loading ? (
          <LoadingSpinner />
        ) : !hasSearched ? null : rooms.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No free rooms available"
            description="All eligible rooms have clashing timetable lectures or approved bookings during this slot."
          />
        ) : (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Found {rooms.length} clash-free rooms (Sorted by optimal capacity):
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rooms.map((room) => (
                <div
                  key={room._id}
                  className="rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                        {room.roomNo}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {room.building} &bull; Floor {room.floor}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <CheckCircle2 className="h-3 w-3" /> Available
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 py-3 border-y border-slate-100 dark:border-slate-700/60 my-3">
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <span>Capacity: {room.capacity}</span>
                    </div>
                    <div className="flex items-center gap-1 capitalize">
                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                      <span>{room.type}</span>
                    </div>
                  </div>

                  {room.facilities && room.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {room.facilities.map((f, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-600 dark:text-slate-300"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  )}

                  {['faculty', 'admin'].includes(user?.role) && (
                    <Button
                      variant="teal"
                      size="sm"
                      onClick={() => handleBookRedirect(room)}
                      className="w-full gap-1.5"
                    >
                      Book Room <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FreeRoomFinder;

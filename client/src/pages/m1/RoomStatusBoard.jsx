import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import {
  Clock,
  RotateCw,
  Building,
  Users,
  CheckCircle,
  AlertCircle,
  Clock3,
  Calendar,
  Layers,
} from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';

const RoomStatusBoard = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulatedTime, setSimulatedTime] = useState('');
  const [buildingFilter, setBuildingFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const socket = useSocket();

  const fetchStatus = async (overrideTime = simulatedTime) => {
    try {
      const params = new URLSearchParams();
      if (overrideTime) params.append('time', overrideTime);

      const res = await api.get(`/classrooms/status?${params.toString()}`);
      setRooms(res.data || []);
      setLastRefreshed(new Date());
    } catch (err) {
      toast.error(err.message || 'Failed to fetch room status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto-refresh 60s
    const timer = setInterval(() => {
      fetchStatus();
    }, 60000);
    return () => clearInterval(timer);
  }, [simulatedTime]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket) return;
    const handleRoomChanged = (data) => {
      fetchStatus();
    };
    socket.on('room:status-changed', handleRoomChanged);
    return () => socket.off('room:status-changed', handleRoomChanged);
  }, [socket]);

  // Extract unique buildings
  const buildings = Array.from(new Set(rooms.map((r) => r.building))).filter(Boolean);

  // Filtered rooms
  const filteredRooms = rooms.filter((r) => {
    if (buildingFilter && r.building !== buildingFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Available':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40">
            <CheckCircle className="h-3.5 w-3.5" /> Available
          </span>
        );
      case 'Occupied':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300/40">
            <AlertCircle className="h-3.5 w-3.5" /> Occupied
          </span>
        );
      case 'Upcoming':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/40">
            <Clock3 className="h-3.5 w-3.5" /> Starting Soon
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building className="h-6 w-6 text-brand-600" />
            Room Status Board
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time occupancy tracking, upcoming schedules, and instant availability. Auto-refreshes every 60s.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchStatus()}
            className="gap-2"
          >
            <RotateCw className="h-3.5 w-3.5" /> Refresh Now
          </Button>
          <span className="text-[11px] text-slate-400">
            Updated: {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Filter / Simulator Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Building
            </label>
            <select
              value={buildingFilter}
              onChange={(e) => setBuildingFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Buildings</option>
              {buildings.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Occupied">Occupied</option>
              <option value="Upcoming">Starting Soon (&le;30 min)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center justify-between">
              <span>Simulate Time</span>
              {simulatedTime && (
                <button
                  type="button"
                  onClick={() => setSimulatedTime('')}
                  className="text-brand-600 dark:text-brand-400 hover:underline text-[10px]"
                >
                  Reset to Live
                </button>
              )}
            </label>
            <input
              type="time"
              value={simulatedTime}
              onChange={(e) => setSimulatedTime(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex sm:justify-end gap-2 pt-3 sm:pt-0">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Total Rooms</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {filteredRooms.length} of {rooms.length}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Grid of Classrooms */}
      {loading ? (
        <LoadingSpinner />
      ) : filteredRooms.length === 0 ? (
        <EmptyState
          icon={Building}
          title="No rooms match the criteria"
          description="Try clearing your building or status filter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRooms.map((room) => {
            const isOcc = room.status === 'Occupied';
            const isUp = room.status === 'Upcoming';

            return (
              <div
                key={room._id}
                className={`rounded-xl border p-5 shadow-sm transition-all hover:shadow-md bg-white dark:bg-slate-800 ${
                  isOcc
                    ? 'border-rose-200/80 dark:border-rose-900/40'
                    : isUp
                    ? 'border-amber-200/80 dark:border-amber-900/40'
                    : 'border-emerald-200/80 dark:border-emerald-900/40'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                      {room.roomNo}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {room.building} &bull; Floor {room.floor}
                    </p>
                  </div>
                  {getStatusBadge(room.status)}
                </div>

                {/* Badges / Meta */}
                <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 py-2 border-y border-slate-100 dark:border-slate-700/60 my-3">
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>Cap: {room.capacity}</span>
                  </div>
                  <div className="flex items-center gap-1 capitalize">
                    <Layers className="h-3.5 w-3.5 text-slate-400" />
                    <span>{room.type}</span>
                  </div>
                </div>

                {/* Dynamic State Info (Algorithm A) */}
                <div className="space-y-2 text-xs">
                  {isOcc && (
                    <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200">
                      <p className="font-semibold truncate">
                        {room.currentSlot?.subject || 'Class in session'}
                      </p>
                      <p className="text-[11px] text-rose-700 dark:text-rose-300">
                        {room.currentSlot?.faculty} &bull; Until {room.freeUntil}
                      </p>
                    </div>
                  )}

                  {isUp && room.nextClass && (
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200">
                      <p className="font-semibold truncate">
                        Starts soon: {room.nextClass.subject}
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300">
                        {room.nextClass.faculty} ({room.nextClass.time})
                      </p>
                    </div>
                  )}

                  {!isOcc && !isUp && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200">
                      <p className="font-medium">
                        Free until:{' '}
                        <span className="font-bold">{room.freeUntil || 'End of Day'}</span>
                      </p>
                      {room.nextClass && (
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300 truncate mt-0.5">
                          Next: {room.nextClass.subject} ({room.nextClass.time})
                        </p>
                      )}
                    </div>
                  )}

                  {/* Facilities chips */}
                  {room.facilities && room.facilities.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {room.facilities.map((f, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/60 text-[10px] text-slate-600 dark:text-slate-300"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoomStatusBoard;

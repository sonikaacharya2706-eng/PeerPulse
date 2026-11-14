import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import {
  PackageSearch,
  PlusCircle,
  Search,
  MapPin,
  Calendar,
  Tag,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { format } from 'date-fns';

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

const LostFoundBoard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [type, setType] = useState(''); // '' | 'lost' | 'found'
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 12,
        ...(type && { type }),
        ...(category && { category }),
        ...(status && { status }),
        ...(search && { q: search }),
      });

      const res = await api.get(`/lostfound?${params.toString()}`);
      setItems(res.data || []);
      setMeta(res.meta || { total: 0, pages: 1 });
    } catch (err) {
      toast.error(err.message || 'Failed to load lost & found items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [type, category, status, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchItems();
  };

  return (
    <div className="space-y-6">
      {/* Title & CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <PackageSearch className="h-6 w-6 text-brand-600" /> Digital Lost-and-Found Board
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse reported campus belongings or report misplaced items with AI keyword matching.
          </p>
        </div>

        <Link to="/m2/report">
          <Button className="gap-2 w-full sm:w-auto">
            <PlusCircle className="h-4 w-4" /> Report Lost / Found Item
          </Button>
        </Link>
      </div>

      {/* Filter Controls */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <form onSubmit={handleSearchSubmit} className="relative sm:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, keywords..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </form>

          {/* Type Filter */}
          <div>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">All Types (Lost & Found)</option>
              <option value="lost">Lost Items</option>
              <option value="found">Found Items</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 capitalize"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 capitalize"
            >
              <option value="">All Statuses</option>
              <option value="reported">Reported</option>
              <option value="matched">Matched</option>
              <option value="claimed">Claimed</option>
              <option value="returned">Returned</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Grid of Items */}
      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="No items found"
          description="Try clearing your filters or report a new lost or found item."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => {
            const isLost = item.type === 'lost';
            const imageUrl = item.images && item.images.length > 0
              ? `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${item.images[0]}`
              : null;

            return (
              <div
                key={item._id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
              >
                {/* Image or placeholder banner */}
                <div className="h-40 w-full bg-slate-100 dark:bg-slate-700/50 relative overflow-hidden flex items-center justify-center">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.title}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <PackageSearch className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                  )}

                  {/* Type Badge */}
                  <span
                    className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm ${
                      isLost
                        ? 'bg-rose-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {item.type}
                  </span>

                  {/* Status Badge */}
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-900/80 text-white backdrop-blur-sm capitalize">
                    {item.status}
                  </span>
                </div>

                {/* Content body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {item.category?.replace('_', ' ')}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5 line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{format(new Date(item.dateOccurred), 'MMM d, yyyy')}</span>
                    </div>

                    <div className="pt-2">
                      <Link
                        to={`/m2/items/${item._id}`}
                        className="inline-flex items-center justify-center w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-brand-600 hover:text-white dark:hover:bg-brand-600 dark:hover:text-white transition gap-1"
                      >
                        View Details & Claim <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {meta.pages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-4 text-xs">
          <span className="text-slate-500">
            Page {meta.page} of {meta.pages} ({meta.total} items)
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
    </div>
  );
};

export default LostFoundBoard;

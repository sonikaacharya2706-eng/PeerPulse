import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import Card from '../../components/common/Card';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { Search, Building, Calendar, PackageSearch, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';

const GlobalSearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const executeSearch = async () => {
      if (!query.trim()) {
        setResults(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}`);
        setResults(res.data);
      } catch (err) {
        toast.error(err.message || 'Search failed');
      } finally {
        setLoading(false);
      }
    };
    executeSearch();
  }, [query]);

  if (loading) return <LoadingSpinner />;

  const totalHits =
    (results?.classrooms?.length || 0) +
    (results?.events?.length || 0) +
    (results?.lostFound?.length || 0) +
    (results?.complaints?.length || 0) +
    (results?.timetables?.length || 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Search className="h-6 w-6 text-brand-600" /> Search Results for "{query}"
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Unified campus discovery across classrooms, events, lost belongings, and complaints ({totalHits} results).
        </p>
      </div>

      {totalHits === 0 ? (
        <EmptyState
          icon={Search}
          title="No campus records matched your search"
          description="Try checking for typos or searching a broader term."
        />
      ) : (
        <div className="space-y-6">
          {/* Classrooms */}
          {results.classrooms?.length > 0 && (
            <Card title={`Classrooms (${results.classrooms.length})`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {results.classrooms.map((c) => (
                  <Link
                    key={c._id}
                    to="/m1/rooms/status"
                    className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900 hover:border-brand-500 transition text-xs flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{c.roomNo}</p>
                      <p className="text-slate-500">{c.building} &bull; Floor {c.floor} (Cap: {c.capacity})</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Events */}
          {results.events?.length > 0 && (
            <Card title={`Campus Events (${results.events.length})`}>
              <div className="space-y-2.5">
                {results.events.map((e) => (
                  <Link
                    key={e._id}
                    to={`/m5/events/${e._id}`}
                    className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900 hover:border-brand-500 transition text-xs flex justify-between items-center block"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{e.title}</p>
                      <p className="text-slate-500">{e.category} &bull; {e.venue}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Lost & Found */}
          {results.lostFound?.length > 0 && (
            <Card title={`Lost & Found Items (${results.lostFound.length})`}>
              <div className="space-y-2.5">
                {results.lostFound.map((item) => (
                  <Link
                    key={item._id}
                    to={`/m2/items/${item._id}`}
                    className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900 hover:border-brand-500 transition text-xs flex justify-between items-center block"
                  >
                    <div>
                      <span className="font-bold uppercase text-[10px] text-teal-600 mr-2">{item.type}</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{item.title}</span>
                      <p className="text-slate-500">{item.category} &bull; Location: {item.location}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Complaints */}
          {results.complaints?.length > 0 && (
            <Card title={`Maintenance Complaints (${results.complaints.length})`}>
              <div className="space-y-2.5">
                {results.complaints.map((c) => (
                  <Link
                    key={c._id}
                    to={`/m4/complaints/${c._id}`}
                    className="p-3 rounded-lg border bg-slate-50 dark:bg-slate-900 hover:border-brand-500 transition text-xs flex justify-between items-center block"
                  >
                    <div>
                      <span className="font-mono font-bold text-brand-600 mr-2">{c.ticketId}</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 capitalize">{c.category} in {c.building} ({c.room})</span>
                      <p className="text-slate-500">{c.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearchPage;

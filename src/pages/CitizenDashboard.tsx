import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { IComplaint } from '../types.ts';
import { 
  ShieldAlert, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter,
  ExternalLink,
  ChevronRight,
  Eye,
  Calendar
} from 'lucide-react';

interface CitizenDashboardProps {
  onOpenReportModal: () => void;
  onSelectComplaint: (complaint: IComplaint) => void;
}

export const CitizenDashboard: React.FC<CitizenDashboardProps> = ({
  onOpenReportModal,
  onSelectComplaint
}) => {
  const { user, token } = useAuth();
  const [complaints, setComplaints] = useState<IComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchMyComplaints = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/complaints?myOnly=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error('Error fetching citizen complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyComplaints();
  }, [token]);

  const filtered = complaints.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        c.reference.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.roadName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalSubmitted = complaints.length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned' || c.status === 'Under Review').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 max-w-7xl mx-auto">
      
      {/* Top Banner & Quick Report Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Citizen Reporting Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <strong>{user?.name}</strong> ({user?.email}) · Direct civic tracking
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenReportModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Report Road Problem</span>
        </button>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Submitted
          </span>
          <div className="text-3xl font-extrabold text-slate-900 font-mono tabular-nums">
            {totalSubmitted}
          </div>
          <span className="text-[11px] text-slate-400">All registered reports</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">
            Under Investigation / In Progress
          </span>
          <div className="text-3xl font-extrabold text-sky-600 font-mono tabular-nums">
            {inProgressCount}
          </div>
          <span className="text-[11px] text-slate-400">Assigned to maintenance squads</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-teal-600 uppercase tracking-wider">
            Officially Resolved
          </span>
          <div className="text-3xl font-extrabold text-teal-600 font-mono tabular-nums">
            {resolvedCount}
          </div>
          <span className="text-[11px] text-slate-400">Verified repair completions</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by reference, road, or title..."
            className="w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolution Submitted">Resolution Submitted</option>
            <option value="Resolved">Resolved</option>
            <option value="Escalated">Escalated</option>
          </select>
        </div>
      </div>

      {/* Complaints List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Loading your complaints...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No complaints found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't reported any road problems in this filter, or your queue is clear.
            </p>
            <button
              type="button"
              onClick={onOpenReportModal}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs"
            >
              Report a Road Problem Now
            </button>
          </div>
        ) : (
          filtered.map(c => {
            const thumbnail = c.evidence?.[0]?.url;
            return (
              <div
                key={c.id}
                onClick={() => onSelectComplaint(c)}
                className="bg-white hover:bg-slate-50/80 rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 cursor-pointer transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt="damage"
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-6 h-6 text-slate-400" />
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                        {c.reference}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {c.category}
                      </span>
                      <span className="text-[11px] text-slate-400">·</span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        c.priority === 'Critical' ? 'bg-red-50 text-red-700' :
                        c.priority === 'High' ? 'bg-orange-50 text-orange-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {c.priority} Priority
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      {c.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{c.roadName}, {c.panchayatLocality}</span>
                      </span>
                      {c.expectedCompletionDate && (
                        <span className="flex items-center gap-1 text-sky-700">
                          <Calendar className="w-3 h-3" />
                          <span>Target: {c.expectedCompletionDate}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 gap-2">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    c.status === 'Resolved' ? 'bg-teal-100 text-teal-800' :
                    c.status === 'In Progress' ? 'bg-sky-100 text-sky-800' :
                    c.status === 'Resolution Submitted' ? 'bg-indigo-100 text-indigo-800' :
                    c.status === 'Escalated' ? 'bg-red-100 text-red-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {c.status}
                  </span>

                  <span className="text-[11px] text-slate-400 flex items-center gap-1 hover:text-slate-700">
                    <span>View full history</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

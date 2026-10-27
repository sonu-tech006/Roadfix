import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { IComplaint } from '../types.ts';
import { 
  Building, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Filter, 
  CheckCircle2, 
  UserPlus, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';

interface LocalAdminDashboardProps {
  onSelectComplaint: (complaint: IComplaint) => void;
}

export const LocalAdminDashboard: React.FC<LocalAdminDashboardProps> = ({
  onSelectComplaint
}) => {
  const { user, token } = useAuth();
  const [complaints, setComplaints] = useState<IComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');

  const locality = user?.jurisdiction?.panchayatLocality || 'Indiranagar - Ward 14';

  const loadWardComplaints = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/complaints', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
      }
    } catch (err) {
      console.error('Error fetching ward complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWardComplaints();
  }, [token]);

  const filtered = complaints.filter(c => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.reference.toLowerCase().includes(q) ||
        c.roadName.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingAction = complaints.filter(c => c.status === 'Submitted' || c.status === 'Under Review').length;
  const inProgress = complaints.filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
  const resolutionPending = complaints.filter(c => c.status === 'Resolution Submitted').length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;

  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 max-w-7xl mx-auto">
      
      {/* Jurisdiction Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">
            <Building className="w-3.5 h-3.5" />
            <span>Panchayat / Local-Level Administration</span>
          </div>
          <h1 className="text-2xl font-bold">
            {locality} Road Maintenance Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authorized Officer: <strong>{user?.name}</strong> · Department: {user?.jurisdiction?.departmentId || 'Ward 14 Road Works'}
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700 px-4 py-2.5 rounded-xl text-right">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
            Local Assigned Area
          </span>
          <span className="text-sm font-bold text-teal-400">
            Strict Jurisdiction Scoping
          </span>
        </div>
      </div>

      {/* Actionable KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider">
            Pending Inspection
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {pendingAction}
          </div>
          <span className="text-[10px] text-slate-400">New citizen reports</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-sky-600 uppercase tracking-wider">
            In Active Repair
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {inProgress}
          </div>
          <span className="text-[10px] text-slate-400">Squads on site</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
            Resolution Awaiting Verification
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {resolutionPending}
          </div>
          <span className="text-[10px] text-slate-400">With District Admin</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider">
            Verified Resolved
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {resolved}
          </div>
          <span className="text-[10px] text-slate-400">Closed with photo proof</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ward reference, road name..."
            className="w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted (New)</option>
            <option value="Under Review">Under Review</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolution Submitted">Resolution Submitted</option>
            <option value="Resolved">Resolved</option>
            <option value="Escalated">Escalated</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700"
          >
            <option value="all">All Priorities</option>
            <option value="Critical">Critical Only</option>
            <option value="High">High Only</option>
            <option value="Medium">Medium Only</option>
          </select>
        </div>
      </div>

      {/* Ward Complaints Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Ward 14 Active Complaints Queue ({filtered.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            Click row to assign squads or submit resolution
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Ref & Date</th>
                <th className="py-3 px-4">Road & Category</th>
                <th className="py-3 px-4">Severity / Priority</th>
                <th className="py-3 px-4">Assigned Contractor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading ward complaints...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No complaints found matching current filters.
                  </td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => onSelectComplaint(c)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-teal-800">{c.reference}</span>
                      <span className="block text-[10px] text-slate-400">{c.createdAt.slice(0, 10)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block truncate max-w-xs">{c.roadName}</span>
                      <span className="text-[11px] text-slate-500">{c.category}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                        c.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {c.assignedTeamOrContractor || (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        c.status === 'Resolved' ? 'bg-teal-100 text-teal-800' :
                        c.status === 'In Progress' ? 'bg-sky-100 text-sky-800' :
                        c.status === 'Resolution Submitted' ? 'bg-indigo-100 text-indigo-800' :
                        c.status === 'Escalated' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        className="px-3 py-1 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 font-semibold rounded text-[11px] border border-slate-200"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

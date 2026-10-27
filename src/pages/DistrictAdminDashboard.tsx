import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { IComplaint } from '../types.ts';
import { 
  Building2, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Layers,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface DistrictAdminDashboardProps {
  onSelectComplaint: (complaint: IComplaint) => void;
}

export const DistrictAdminDashboard: React.FC<DistrictAdminDashboardProps> = ({
  onSelectComplaint
}) => {
  const { user, token } = useAuth();
  const [complaints, setComplaints] = useState<IComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'verification' | 'all' | 'analytics'>('verification');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const district = user?.jurisdiction?.district || 'Bengaluru Urban';

  const loadDistrictData = async () => {
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
      console.error('Error fetching district complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDistrictData();
  }, [token]);

  // Export CSV
  const handleExportCsv = () => {
    if (!token) return;
    window.location.href = `/api/admin/export`;
  };

  const pendingVerification = complaints.filter(c => c.status === 'Resolution Submitted');
  const escalated = complaints.filter(c => c.status === 'Escalated');
  const critical = complaints.filter(c => c.priority === 'Critical' && c.status !== 'Resolved');

  // Chart data preparation
  const categoryCounts: Record<string, number> = {};
  complaints.forEach(c => {
    categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
  });

  const chartData = Object.entries(categoryCounts).map(([name, count]) => ({
    name: name.length > 18 ? `${name.slice(0, 15)}...` : name,
    count
  }));

  const COLORS = ['#0d9488', '#0284c7', '#f97316', '#6366f1', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 max-w-7xl mx-auto">
      
      {/* Top District Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>District Administration Oversight</span>
          </div>
          <h1 className="text-2xl font-bold">
            {district} Magistrate Road Infrastructure Command
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authorized Magistrate: <strong>{user?.name}</strong> · Division: BBMP East & District Works
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-teal-400" />
            <span>Export District CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
            Verification Queue
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {pendingVerification.length}
          </div>
          <span className="text-[10px] text-slate-400">Repairs awaiting sign-off</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-red-600 uppercase tracking-wider">
            Escalated Issues
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {escalated.length}
          </div>
          <span className="text-[10px] text-slate-400">Exceeding local ward capacity</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider">
            Critical Hazards
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {critical.length}
          </div>
          <span className="text-[10px] text-slate-400">High priority corridors</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-teal-600 uppercase tracking-wider">
            Total District Reports
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900">
            {complaints.length}
          </div>
          <span className="text-[10px] text-slate-400">Active database records</span>
        </div>
      </div>

      {/* View Segmented Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold text-slate-600">
        <button
          type="button"
          onClick={() => setActiveTab('verification')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'verification' ? 'border-indigo-600 text-indigo-700 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Resolution Verification Queue ({pendingVerification.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'all' ? 'border-indigo-600 text-indigo-700 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>All District Complaints ({complaints.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'analytics' ? 'border-indigo-600 text-indigo-700 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Category & Area Analytics</span>
        </button>
      </div>

      {/* TAB 1: VERIFICATION QUEUE (SECTION 8 WORKFLOW) */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 text-xs text-indigo-900">
            <strong>Verification Protocol:</strong> As District Administrator, review the submitted completion evidence and before/after photographs below. Approving marks the complaint Resolved and issues an official certificate to the citizen.
          </div>

          {pendingVerification.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-xs text-slate-400">
              No resolutions currently pending verification in {district}.
            </div>
          ) : (
            pendingVerification.map(c => (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                      {c.reference}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{c.title}</h3>
                    <p className="text-xs text-slate-500">
                      {c.roadName}, {c.panchayatLocality} · Squad: <strong>{c.assignedTeamOrContractor || 'City Maintenance Squad'}</strong>
                    </p>
                  </div>

                  <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full">
                    Resolution Submitted
                  </span>
                </div>

                {/* Before & After Photo Proof Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <div className="relative aspect-video">
                      <img
                        src={c.evidence?.[0]?.url || '/src/assets/images/road_pothole_sample_1793122603266.jpg'}
                        alt="Initial damage"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        Before Repair
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <div className="relative aspect-video">
                      <img
                        src={c.resolutionSubmission?.afterPhotos?.[0] || c.evidence?.find(e => e.stage === 'completion')?.url || '/src/assets/images/road_repaired_sample_1793122603809.jpg'}
                        alt="Completed repair"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        After Repair
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submission Description */}
                {c.resolutionSubmission && (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                    <div className="font-semibold text-slate-800">
                      Solution: {c.resolutionSubmission.solutionDescription}
                    </div>
                    <div className="text-slate-600 text-[11px]">
                      Work: {c.resolutionSubmission.workPerformed}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onSelectComplaint(c)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    Review & Verify Sign-Off
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: ALL DISTRICT COMPLAINTS */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search across all subordinate wards..."
                className="w-full text-xs pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="Submitted">Submitted</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolution Submitted">Resolution Submitted</option>
              <option value="Resolved">Resolved</option>
              <option value="Escalated">Escalated</option>
            </select>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ref & Ward</th>
                  <th className="py-3 px-4">Road & Category</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Department / Contractor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => onSelectComplaint(c)}
                    className="hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono">
                      <span className="font-bold text-teal-800">{c.reference}</span>
                      <span className="block text-[10px] text-slate-400">{c.panchayatLocality}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block truncate max-w-xs">{c.roadName}</span>
                      <span className="text-[11px] text-slate-500">{c.category}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.priority === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {c.assignedTeamOrContractor || c.responsibleDepartment || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === 'Resolved' ? 'bg-teal-100 text-teal-800' :
                        c.status === 'In Progress' ? 'bg-sky-100 text-sky-800' :
                        c.status === 'Resolution Submitted' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-400 inline" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ANALYTICS CHARTS */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Complaints by Road Damage Category
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              SLA Target Performance & Turnaround
            </h3>
            <div className="space-y-4 text-xs text-slate-600">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span>Average District Resolution Time:</span>
                <strong className="font-mono text-slate-900">2.4 Days</strong>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span>Critical Hazard First Response SLA:</span>
                <strong className="font-mono text-teal-700">96.8% Compliant</strong>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span>Citizen Appeal & Reopen Rate:</span>
                <strong className="font-mono text-slate-900">3.2%</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Subordinate Wards Scoped:</span>
                <strong className="font-mono text-slate-900">198 Local Wards</strong>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

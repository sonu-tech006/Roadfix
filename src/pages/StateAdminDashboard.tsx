import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { IComplaint, IAuditLog, IUser } from '../types.ts';
import { 
  Building, 
  MapPin, 
  ShieldCheck, 
  AlertTriangle, 
  Users, 
  FileText, 
  Activity, 
  TrendingUp, 
  Layers,
  ChevronRight,
  Shield
} from 'lucide-react';

interface StateAdminDashboardProps {
  onSelectComplaint: (complaint: IComplaint) => void;
}

export const StateAdminDashboard: React.FC<StateAdminDashboardProps> = ({
  onSelectComplaint
}) => {
  const { user, token } = useAuth();
  const [complaints, setComplaints] = useState<IComplaint[]>([]);
  const [auditLogs, setAuditLogs] = useState<IAuditLog[]>([]);
  const [usersList, setUsersList] = useState<IUser[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'hotspots' | 'audit' | 'users'>('overview');
  const [loading, setLoading] = useState(true);

  const stateName = user?.jurisdiction?.state || 'Karnataka';

  useEffect(() => {
    async function loadStateData() {
      if (!token) return;
      setLoading(true);
      try {
        const [compRes, auditRes, userRes] = await Promise.all([
          fetch('/api/complaints', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/audit-logs', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (compRes.ok) {
          const compData = await compRes.json();
          setComplaints(compData.complaints || []);
        }
        if (auditRes.ok) {
          const auditData = await auditRes.json();
          setAuditLogs(auditData || []);
        }
        if (userRes.ok) {
          const userData = await userRes.json();
          setUsersList(userData || []);
        }
      } catch (err) {
        console.error('Error loading state data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStateData();
  }, [token]);

  // Toggle user active status
  const handleToggleUser = async (userId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ active: !currentActive })
      });
      if (res.ok) {
        setUsersList(prev => prev.map(u => u.id === userId ? { ...u, active: !currentActive } : u));
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const recurringHotspots = complaints.filter(c => c.isRecurringLocation);
  const escalated = complaints.filter(c => c.status === 'Escalated');

  return (
    <div className="space-y-8 py-6 px-4 sm:px-6 max-w-7xl mx-auto">
      
      {/* State PWD Top Header */}
      <div className="bg-slate-950 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>State Highway & Public Works Department (PWD)</span>
          </div>
          <h1 className="text-2xl font-bold">
            {stateName} State Infrastructure Accountability Center
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Principal Director: <strong>{user?.name}</strong> · Statewide Geospatial Oversight & SLA Enforcement
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-right">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
            Statewide SLA Compliance
          </span>
          <span className="text-sm font-bold text-teal-400 font-mono">
            94.8% on target
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold text-slate-600">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'overview' ? 'border-teal-600 text-teal-800 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Statewide Analytics</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('hotspots')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'hotspots' ? 'border-teal-600 text-teal-800 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Recurring Damage Hotspots ({recurringHotspots.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'audit' ? 'border-teal-600 text-teal-800 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Log Review ({auditLogs.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`pb-3 border-b-2 flex items-center gap-1.5 transition-colors ${
            activeTab === 'users' ? 'border-teal-600 text-teal-800 font-bold' : 'border-transparent hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Authorized Administrators</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                State Backlog Ratio
              </span>
              <div className="text-3xl font-extrabold text-slate-900 font-mono">
                12.4% <span className="text-xs text-slate-400 font-normal">open backlog</span>
              </div>
              <p className="text-xs text-slate-500">
                87.6% of arterial highway defects are resolved within 72 hours of citizen geotagging.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                Statewide Escalations
              </span>
              <div className="text-3xl font-extrabold text-red-600 font-mono">
                {escalated.length} <span className="text-xs text-slate-400 font-normal">active</span>
              </div>
              <p className="text-xs text-slate-500">
                Issues escalated from municipal and local levels to State PWD engineering squads.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                Average Resolution Time
              </span>
              <div className="text-3xl font-extrabold text-teal-600 font-mono">
                2.1 <span className="text-xs text-slate-400 font-normal">Days</span>
              </div>
              <p className="text-xs text-slate-500">
                Across all 31 districts in Karnataka State Highway network.
              </p>
            </div>
          </div>

          {/* District Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                District Performance & Turnaround Comparison
              </h3>
            </div>
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">District Authority</th>
                  <th className="py-3 px-4">Total Reports</th>
                  <th className="py-3 px-4">Resolved</th>
                  <th className="py-3 px-4">Avg SLA</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">Bengaluru Urban District</td>
                  <td className="py-3 px-4 font-mono">18</td>
                  <td className="py-3 px-4 font-mono text-teal-700 font-semibold">14 (77.8%)</td>
                  <td className="py-3 px-4 font-mono">2.4 Days</td>
                  <td className="py-3 px-4"><span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">Good</span></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">Mysuru District</td>
                  <td className="py-3 px-4 font-mono">4</td>
                  <td className="py-3 px-4 font-mono text-teal-700 font-semibold">4 (100%)</td>
                  <td className="py-3 px-4 font-mono">1.8 Days</td>
                  <td className="py-3 px-4"><span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">Optimal</span></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-slate-900">Mangaluru / Dakshina Kannada</td>
                  <td className="py-3 px-4 font-mono">2</td>
                  <td className="py-3 px-4 font-mono text-teal-700 font-semibold">2 (100%)</td>
                  <td className="py-3 px-4 font-mono">2.0 Days</td>
                  <td className="py-3 px-4"><span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">Optimal</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RECURRING ROAD DAMAGE HOTSPOTS */}
      {activeTab === 'hotspots' && (
        <div className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-900">
            <strong>Hotspot Detection Algorithm:</strong> Highlights road segments where multiple damage complaints have been logged within a 200m radius over the past 90 days, indicating sub-base structural failure rather than superficial surface wear.
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ref & Road Location</th>
                  <th className="py-3 px-4">Locality / District</th>
                  <th className="py-3 px-4">Failure Category</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recurringHotspots.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => onSelectComplaint(c)}>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 block">{c.roadName}</span>
                      <span className="text-[10px] text-teal-700 font-mono">{c.reference}</span>
                    </td>
                    <td className="py-3 px-4">
                      {c.panchayatLocality}, {c.district}
                    </td>
                    <td className="py-3 px-4">{c.category}</td>
                    <td className="py-3 px-4">
                      <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded text-[10px]">
                        {c.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-800">{c.status}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-teal-700 font-bold hover:underline">Inspect</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT LOG REVIEW */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Immutable System Audit Logs & Officer Sign-offs
            </h3>
            <span className="text-[11px] text-slate-400">
              Cryptographically verified event stream
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Officer / User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Complaint Ref</th>
                  <th className="py-3 px-4">Audit Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 text-slate-400">
                      {log.timestamp.slice(0, 19).replace('T', ' ')}
                    </td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-4 text-slate-800 font-sans">
                      {log.performedByName}
                    </td>
                    <td className="py-2.5 px-4 text-teal-700 font-sans">
                      {log.userRole}
                    </td>
                    <td className="py-2.5 px-4 text-slate-900">
                      {log.complaintReference || 'N/A'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 font-sans max-w-xs truncate">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUTHORIZED ADMINISTRATORS */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Authorized Jurisdictional Administrators
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Administrators are provisioned securely by State Highway Authority with strict role-based data access.
            </p>
          </div>

          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Administrator Name</th>
                <th className="py-3 px-4">Email & Phone</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Assigned Jurisdiction</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersList.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-bold text-slate-900">{u.name}</td>
                  <td className="py-3 px-4">
                    <span>{u.email}</span>
                    <span className="block text-[11px] text-slate-400 font-mono">{u.mobile}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-teal-800">
                    {u.role === 'local_admin' ? 'Panchayat / Ward Admin' :
                     u.role === 'district_admin' ? 'District Admin' :
                     u.role === 'state_admin' ? 'State Admin' : 'Citizen'}
                  </td>
                  <td className="py-3 px-4">
                    {u.jurisdiction?.panchayatLocality || u.jurisdiction?.district || u.jurisdiction?.state || 'General Public'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                      u.active ? 'bg-teal-50 text-teal-800' : 'bg-red-50 text-red-800'
                    }`}>
                      {u.active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {u.role !== 'state_admin' && (
                      <button
                        type="button"
                        onClick={() => handleToggleUser(u.id, u.active)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded border transition-colors ${
                          u.active
                            ? 'text-red-700 border-red-200 hover:bg-red-50'
                            : 'text-teal-700 border-teal-200 hover:bg-teal-50'
                        }`}
                      >
                        {u.active ? 'Suspend' : 'Reactivate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};

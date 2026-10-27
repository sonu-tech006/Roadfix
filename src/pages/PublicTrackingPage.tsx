import React, { useState, useEffect } from 'react';
import { IComplaint } from '../types.ts';
import { 
  Search, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Building, 
  Printer, 
  Share2,
  Calendar,
  Lock
} from 'lucide-react';

interface PublicTrackingPageProps {
  initialReference?: string;
  onSelectComplaint?: (c: Partial<IComplaint>) => void;
}

export const PublicTrackingPage: React.FC<PublicTrackingPageProps> = ({
  initialReference = 'RF-2026-8941',
  onSelectComplaint
}) => {
  const [reference, setReference] = useState(initialReference);
  const [complaint, setComplaint] = useState<Partial<IComplaint> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTracking = async (refCode: string) => {
    if (!refCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/complaints/track/${encodeURIComponent(refCode.trim())}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Complaint not found');
      }
      const data = await res.json();
      setComplaint(data);
    } catch (err: any) {
      setError(err.message || 'Error tracking reference');
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialReference) {
      fetchTracking(initialReference);
    }
  }, [initialReference]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTracking(reference);
  };

  return (
    <div className="space-y-8 py-8 px-4 sm:px-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full uppercase tracking-wider">
          Public Accountability Registry
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          Track Road Problem & Resolution Audit
        </h1>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Enter any complaint reference code to view genuine field inspection photos, contractor dispatch status, and official resolution verification.
        </p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-lg mx-auto">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="e.g. RF-2026-8941"
            className="w-full text-xs font-mono font-bold uppercase pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shrink-0"
        >
          {loading ? 'Searching...' : 'Track Reference'}
        </button>
      </form>

      {/* Suggested Quick Reference Chips */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <span>Try demo reference:</span>
        <button
          type="button"
          onClick={() => { setReference('RF-2026-8941'); fetchTracking('RF-2026-8941'); }}
          className="font-mono text-teal-700 font-bold hover:underline"
        >
          RF-2026-8941
        </button>
        <span>·</span>
        <button
          type="button"
          onClick={() => { setReference('RF-2026-8910'); fetchTracking('RF-2026-8910'); }}
          className="font-mono text-teal-700 font-bold hover:underline"
        >
          RF-2026-8910
        </button>
        <span>·</span>
        <button
          type="button"
          onClick={() => { setReference('RF-2026-8802'); fetchTracking('RF-2026-8802'); }}
          className="font-mono text-teal-700 font-bold hover:underline"
        >
          RF-2026-8802
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 text-center max-w-lg mx-auto">
          {error}
        </div>
      )}

      {/* Complaint Details Card */}
      {complaint && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6 sm:p-8 space-y-6">
          
          {/* Top Status Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold font-mono text-teal-800 bg-teal-50 border border-teal-200 px-3 py-1 rounded-lg">
                  {complaint.reference}
                </span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  complaint.status === 'Resolved' ? 'bg-teal-100 text-teal-800' :
                  complaint.status === 'In Progress' ? 'bg-sky-100 text-sky-800' :
                  complaint.status === 'Resolution Submitted' ? 'bg-indigo-100 text-indigo-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {complaint.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Category: <strong>{complaint.category}</strong> · Severity: <strong>{complaint.severity}</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Certificate</span>
              </button>
            </div>
          </div>

          {/* Title & Description */}
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">{complaint.title}</h2>
            <p className="text-xs text-slate-600 leading-relaxed">{complaint.description}</p>
          </div>

          {/* Location & Authority */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>Road Location</span>
              </span>
              <p className="font-bold text-slate-900">{complaint.roadName}</p>
              {complaint.landmark && <p className="text-slate-500">Landmark: {complaint.landmark}</p>}
              <p className="text-slate-500">
                {complaint.panchayatLocality}, {complaint.district}, {complaint.state}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-600" />
                <span>Jurisdictional Responsibility</span>
              </span>
              <p className="font-bold text-slate-900">
                {complaint.responsibleDepartment || 'Civic Road Authority'}
              </p>
              {complaint.assignedTeamOrContractor && (
                <p className="text-slate-600">Assigned Squad: {complaint.assignedTeamOrContractor}</p>
              )}
              {complaint.expectedCompletionDate && (
                <p className="text-slate-600">Expected Date: {complaint.expectedCompletionDate}</p>
              )}
            </div>
          </div>

          {/* Photographic Evidence */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-900">
              Photographic Evidence Registry
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {complaint.evidence?.map((ev, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex flex-col">
                  <div className="relative aspect-video">
                    <img src={ev.url} alt="road evidence" className="w-full h-full object-cover" />
                    <span className={`absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white ${
                      ev.stage === 'completion' ? 'bg-teal-600' : 'bg-orange-600'
                    }`}>
                      {ev.stage === 'completion' ? 'Verified Repair Proof' : 'Initial Citizen Evidence'}
                    </span>
                  </div>
                  <div className="p-2 text-xs text-slate-600 bg-white">
                    <p className="font-medium text-slate-800 truncate">{ev.caption || 'Field Proof'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official Verification Sign-off */}
          {complaint.resolutionVerification && (
            <div className="p-4 bg-teal-900 text-white rounded-xl space-y-1 text-xs">
              <div className="flex items-center gap-2 font-bold text-teal-300">
                <CheckCircle2 className="w-4 h-4" />
                <span>District Administration Official Verification</span>
              </div>
              <p className="text-slate-200">"{complaint.resolutionVerification.comments}"</p>
              <div className="text-[11px] text-teal-300 pt-1 font-mono">
                Verified Date: {complaint.resolutionVerification.verifiedAt.slice(0, 10)}
              </div>
            </div>
          )}

          {/* Privacy Note */}
          <div className="p-3 bg-slate-100 rounded-xl flex items-center gap-2 text-[11px] text-slate-500">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>
              Citizen personal mobile and email records are strictly protected under the Civic Privacy Policy and redacted from public views.
            </span>
          </div>

        </div>
      )}

    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { IComplaint, ComplaintStatus } from '../types.ts';
import { 
  X, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Upload, 
  ArrowRight, 
  UserCheck, 
  ExternalLink,
  RotateCcw,
  Building,
  Calendar,
  Layers
} from 'lucide-react';

interface ComplaintDetailModalProps {
  complaint: IComplaint | null;
  isOpen: boolean;
  onClose: () => void;
  onComplaintUpdated: (updated: IComplaint) => void;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaint,
  isOpen,
  onClose,
  onComplaintUpdated
}) => {
  const { user, token } = useAuth();

  // Local Admin: Repair completion checkbox & form state
  const [markCompletedChecked, setMarkCompletedChecked] = useState(false);
  const [workPerformed, setWorkPerformed] = useState('');
  const [solutionDescription, setSolutionDescription] = useState('');
  const [completionDate, setCompletionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [contractorTeam, setContractorTeam] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState('');
  const [officerConfirmation, setOfficerConfirmation] = useState(false);
  const [afterPhotos, setAfterPhotos] = useState<string[]>([]);
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  // Local Admin: Assignment state
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignedSquad, setAssignedSquad] = useState('');
  const [expectedDate, setExpectedDate] = useState('');

  // District Admin: Resolution Verification state
  const [verificationDecision, setVerificationDecision] = useState<'approved' | 'rejected' | 'returned'>('approved');
  const [verificationComments, setVerificationComments] = useState('');

  // Citizen: Appeal state
  const [showAppealForm, setShowAppealForm] = useState(false);
  const [appealReason, setAppealReason] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  if (!isOpen || !complaint) return null;

  const isLocalAdmin = user?.role === 'local_admin';
  const isDistrictAdmin = user?.role === 'district_admin';
  const isStateAdmin = user?.role === 'state_admin';
  const isCitizen = user?.role === 'citizen';

  // Handle uploading completion proof photo
  const handleUploadProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingProof(true);
    const formData = new FormData();
    formData.append('photo', file);
    formData.append('stage', 'completion');
    formData.append('caption', 'Completed repair proof');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setAfterPhotos(prev => [...prev, data.url]);
      }
    } catch (err) {
      console.error('Proof upload error:', err);
    } finally {
      setIsUploadingProof(false);
    }
  };

  // Submit Resolution (Local Admin)
  const handleSubmitResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerConfirmation) {
      setActionError('Officer confirmation checkbox is required.');
      return;
    }
    setIsLoading(true);
    setActionError('');

    try {
      const res = await fetch(`/api/complaints/${complaint.id}/resolution-submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          workPerformed,
          solutionDescription,
          completionDate,
          teamOrContractor: contractorTeam || user?.name,
          materialsUsed,
          officerConfirmation,
          beforePhotos: complaint.evidence.filter(e => e.stage === 'damage').map(e => e.url),
          afterPhotos: afterPhotos.length > 0 ? afterPhotos : ['/src/assets/images/road_repaired_sample_1793122603809.jpg']
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit resolution');

      onComplaintUpdated(data.complaint);
      setMarkCompletedChecked(false);
    } catch (err: any) {
      setActionError(err.message || 'Error submitting resolution');
    } finally {
      setIsLoading(false);
    }
  };

  // Verify Resolution (District Admin)
  const handleVerifyResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationComments.trim()) {
      setActionError('Verification comments are required.');
      return;
    }
    setIsLoading(true);
    setActionError('');

    try {
      const res = await fetch(`/api/complaints/${complaint.id}/resolution-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          decision: verificationDecision,
          comments: verificationComments
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify resolution');

      onComplaintUpdated(data.complaint);
    } catch (err: any) {
      setActionError(err.message || 'Error during resolution verification');
    } finally {
      setIsLoading(false);
    }
  };

  // Assign Squad (Local or District Admin)
  const handleAssignSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedSquad || !expectedDate) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/complaints/${complaint.id}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          teamOrContractor: assignedSquad,
          expectedDate
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign squad');

      onComplaintUpdated(data.complaint);
      setShowAssignForm(false);
    } catch (err: any) {
      setActionError(err.message || 'Error assigning squad');
    } finally {
      setIsLoading(false);
    }
  };

  // Escalate Complaint
  const handleEscalate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/complaints/${complaint.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'Escalated',
          notes: 'Escalated from local administration for higher tier engineering intervention.'
        })
      });
      const data = await res.json();
      if (res.ok) onComplaintUpdated(data.complaint);
    } catch (err) {
      console.error('Escalation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Citizen Appeal
  const handleAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealReason.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/complaints/${complaint.id}/appeal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: appealReason })
      });
      const data = await res.json();
      if (res.ok) {
        onComplaintUpdated(data.complaint);
        setShowAppealForm(false);
      }
    } catch (err) {
      console.error('Appeal error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
              {complaint.reference}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
              complaint.status === 'Resolved' ? 'bg-teal-100 text-teal-800' :
              complaint.status === 'In Progress' ? 'bg-sky-100 text-sky-800' :
              complaint.status === 'Escalated' ? 'bg-red-100 text-red-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              {complaint.status}
            </span>
            <span className="text-xs text-slate-500 font-mono hidden sm:inline-block">
              Priority: <strong className="text-slate-800">{complaint.priority}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {actionError}
            </div>
          )}

          {/* Title & Category Info */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              {complaint.category} · Reported {complaint.createdAt.slice(0, 10)}
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">
              {complaint.title}
            </h2>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {complaint.description}
            </p>
          </div>

          {/* Location & Department Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>Road Location</span>
              </span>
              <p className="font-medium text-slate-900">{complaint.roadName}</p>
              {complaint.landmark && (
                <p className="text-slate-500">Landmark: {complaint.landmark}</p>
              )}
              <p className="text-slate-500">
                {complaint.panchayatLocality}, {complaint.district}, {complaint.state}
              </p>
              <p className="text-[11px] font-mono text-slate-400">
                GPS: {complaint.coordinates[1].toFixed(5)}, {complaint.coordinates[0].toFixed(5)}
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-600" />
                <span>Responsible Department</span>
              </span>
              <p className="font-medium text-slate-900">
                {complaint.responsibleDepartment || 'Awaiting Jurisdiction Review'}
              </p>
              {complaint.assignedTeamOrContractor && (
                <p className="text-slate-600">
                  Assigned Squad: <strong>{complaint.assignedTeamOrContractor}</strong>
                </p>
              )}
              {complaint.expectedCompletionDate && (
                <p className="text-slate-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Target Date: {complaint.expectedCompletionDate}</span>
                </p>
              )}
            </div>
          </div>

          {/* Photographs Comparison */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Evidence Photographs (Before & After)</span>
              <span className="text-[11px] text-slate-400">
                {complaint.evidence.length} Photo Asset(s)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {complaint.evidence.map((ev, i) => (
                <div key={ev.id || i} className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex flex-col">
                  <div className="relative aspect-video">
                    <img src={ev.url} alt="road proof" className="w-full h-full object-cover" />
                    <span className={`absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded text-white ${
                      ev.stage === 'completion' ? 'bg-teal-600' : 'bg-orange-600'
                    }`}>
                      {ev.stage === 'completion' ? 'Verified Repair Proof' : 'Reported Damage'}
                    </span>
                  </div>
                  <div className="p-2.5 text-xs text-slate-600 bg-white">
                    <p className="font-medium text-slate-800 truncate">{ev.caption || 'Evidence Capture'}</p>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {ev.uploadedAt ? ev.uploadedAt.slice(0, 16).replace('T', ' ') : 'Archived'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resolution Submission Details (If submitted or resolved) */}
          {complaint.resolutionSubmission && (
            <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-teal-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Work Completion Submission</span>
                </span>
                <span className="text-[11px] text-teal-700 font-mono">
                  {complaint.resolutionSubmission.completionDate}
                </span>
              </div>
              <p className="text-slate-800">
                <strong>Solution:</strong> {complaint.resolutionSubmission.solutionDescription}
              </p>
              <p className="text-slate-700">
                <strong>Work Executed:</strong> {complaint.resolutionSubmission.workPerformed}
              </p>
              {complaint.resolutionSubmission.materialsUsed && (
                <p className="text-slate-600">
                  <strong>Materials:</strong> {complaint.resolutionSubmission.materialsUsed}
                </p>
              )}
              <div className="text-[11px] text-slate-500 pt-1 border-t border-teal-200/60 flex items-center justify-between">
                <span>Submitted by: {complaint.resolutionSubmission.submittedByName}</span>
                <span>Team: {complaint.resolutionSubmission.teamOrContractor}</span>
              </div>
            </div>
          )}

          {/* District Verification Decision (If exists) */}
          {complaint.resolutionVerification && (
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5 text-teal-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Official Resolution Verification</span>
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {complaint.resolutionVerification.verifiedAt.slice(0, 10)}
                </span>
              </div>
              <p className="text-slate-200">
                "{complaint.resolutionVerification.comments}"
              </p>
              <p className="text-[11px] text-slate-400">
                Verified by: <strong>{complaint.resolutionVerification.verifiedByName}</strong> (District Authority)
              </p>
            </div>
          )}

          {/* Status Timeline */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>Full Audit Timeline & Accountability History</span>
            </span>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {complaint.statusHistory.map((item, idx) => (
                <div key={idx} className="relative text-xs">
                  <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-teal-600 ring-4 ring-white" />
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{item.status}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {item.timestamp.slice(0, 16).replace('T', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-0.5 text-[11px]">{item.notes || 'Status updated.'}</p>
                  <span className="text-[10px] text-slate-400">
                    By: {item.changedByName} ({item.role})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ROLE SPECIFIC ADMINISTRATIVE WORKFLOWS */}

          {/* LOCAL ADMIN ACTIONS */}
          {isLocalAdmin && complaint.status !== 'Resolved' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Local Ward Actions (Indiranagar Ward 14)
                </span>
                <button
                  type="button"
                  onClick={handleEscalate}
                  disabled={isLoading}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Escalate to District Admin
                </button>
              </div>

              {/* Assignment Form Toggle */}
              {complaint.status === 'Submitted' || complaint.status === 'Under Review' ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowAssignForm(!showAssignForm)}
                    className="text-xs font-semibold text-teal-700 hover:text-teal-900"
                  >
                    {showAssignForm ? 'Close Assignment Form' : '+ Assign Maintenance Team / Squad'}
                  </button>

                  {showAssignForm && (
                    <form onSubmit={handleAssignSquad} className="p-3 bg-white rounded-lg border border-slate-200 space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Squad or Contractor Name *
                        </label>
                        <input
                          type="text"
                          value={assignedSquad}
                          onChange={(e) => setAssignedSquad(e.target.value)}
                          placeholder="e.g. Apex Infrastructure Squad #4"
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Estimated Completion Target Date *
                        </label>
                        <input
                          type="date"
                          value={expectedDate}
                          onChange={(e) => setExpectedDate(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="px-3 py-1.5 bg-teal-600 text-white rounded text-xs font-semibold"
                      >
                        Confirm Assignment
                      </button>
                    </form>
                  )}
                </div>
              ) : null}

              {/* SECTION 8: "Mark repair work as completed" CHECKBOX WORKFLOW */}
              <div className="pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={markCompletedChecked}
                    onChange={(e) => setMarkCompletedChecked(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                  />
                  <span className="text-xs font-bold text-slate-900">
                    Mark repair work as completed
                  </span>
                </label>

                {/* Reveals required resolution form */}
                {markCompletedChecked && (
                  <form onSubmit={handleSubmitResolution} className="mt-3 p-4 bg-white rounded-xl border border-teal-200 shadow-sm space-y-3">
                    <h4 className="text-xs font-bold text-teal-800">
                      Work Completion Submission & Evidence Form
                    </h4>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Work Performed & Solution Description *
                      </label>
                      <textarea
                        value={workPerformed}
                        onChange={(e) => setWorkPerformed(e.target.value)}
                        placeholder="Detail asphalt cold-mix compaction, tack coat, surface sealing..."
                        rows={2}
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Executive Summary of Solution *
                      </label>
                      <input
                        type="text"
                        value={solutionDescription}
                        onChange={(e) => setSolutionDescription(e.target.value)}
                        placeholder="e.g. 50mm Dense Bituminous Macadam overlay compacted level"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Completion Date *
                        </label>
                        <input
                          type="date"
                          value={completionDate}
                          onChange={(e) => setCompletionDate(e.target.value)}
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Repair Team / Contractor
                        </label>
                        <input
                          type="text"
                          value={contractorTeam}
                          onChange={(e) => setContractorTeam(e.target.value)}
                          placeholder="e.g. Apex Civil Maintenance"
                          className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Materials / Specifications Used
                      </label>
                      <input
                        type="text"
                        value={materialsUsed}
                        onChange={(e) => setMaterialsUsed(e.target.value)}
                        placeholder="e.g. IRC-SP-100 compliant VG-30 Bitumen mix"
                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-1.5"
                      />
                    </div>

                    {/* Upload Post-Repair Evidence */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Upload Completed Work Photograph
                      </label>
                      <label className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100 text-xs text-slate-600">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isUploadingProof ? 'Uploading...' : 'Choose repair completion photo'}</span>
                        <input type="file" accept="image/*" onChange={handleUploadProof} className="hidden" />
                      </label>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={officerConfirmation}
                        onChange={(e) => setOfficerConfirmation(e.target.checked)}
                        className="w-4 h-4 text-teal-600 rounded border-slate-300"
                        required
                      />
                      <span className="text-[11px] font-medium text-slate-700">
                        I confirm this repair was inspected and conforms to municipal roadway standards.
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs transition-colors"
                    >
                      {isLoading ? 'Submitting...' : 'Submit Resolution for District Verification'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* DISTRICT ADMIN ACTIONS: VERIFICATION */}
          {isDistrictAdmin && complaint.status === 'Resolution Submitted' && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3 text-xs">
              <h4 className="font-bold text-indigo-950 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>District Administration Resolution Verification</span>
              </h4>
              <p className="text-slate-600 text-[11px]">
                Verify the submitted repair photographs and work specifications before finalizing status to Resolved.
              </p>

              <form onSubmit={handleVerifyResolution} className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="approved"
                      checked={verificationDecision === 'approved'}
                      onChange={() => setVerificationDecision('approved')}
                    />
                    <span className="text-teal-800">Approve & Mark Resolved</span>
                  </label>

                  <label className="flex items-center gap-1.5 font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="returned"
                      checked={verificationDecision === 'returned'}
                      onChange={() => setVerificationDecision('returned')}
                    />
                    <span className="text-orange-800">Return to Squad (Rework Needed)</span>
                  </label>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Inspection Comments & Quality Sign-Off *
                  </label>
                  <textarea
                    value={verificationComments}
                    onChange={(e) => setVerificationComments(e.target.value)}
                    placeholder="e.g. Visual compaction and level tolerance verified. Approved for closure."
                    rows={2}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs"
                >
                  {isLoading ? 'Recording Verification...' : 'Submit Final Verification Decision'}
                </button>
              </form>
            </div>
          )}

          {/* CITIZEN APPEAL / REOPEN */}
          {isCitizen && (complaint.status === 'Resolved' || complaint.status === 'Rejected with Reason') && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">
                  Not satisfied with the repair quality?
                </span>
                <button
                  type="button"
                  onClick={() => setShowAppealForm(!showAppealForm)}
                  className="text-xs text-orange-600 hover:text-orange-800 font-bold underline"
                >
                  {showAppealForm ? 'Cancel Appeal' : 'Submit Appeal / Reopen'}
                </button>
              </div>

              {showAppealForm && (
                <form onSubmit={handleAppeal} className="space-y-2 pt-2">
                  <textarea
                    value={appealReason}
                    onChange={(e) => setAppealReason(e.target.value)}
                    placeholder="Explain why this resolution is incomplete or if the road damage has recurred..."
                    rows={2}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-orange-600 text-white rounded text-xs font-semibold"
                  >
                    Confirm Reopen Request
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Complaint Reference: <strong>{complaint.reference}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ComplaintCategory, ComplaintSeverity, IComplaint, IEvidenceAsset } from '../types.ts';
import { InteractiveMap } from './InteractiveMap.tsx';
import { 
  X, 
  Upload, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Compass, 
  Trash2, 
  Info,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface ReportComplaintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplaintCreated: (complaint: IComplaint) => void;
}

const CATEGORIES: ComplaintCategory[] = [
  'Pothole',
  'Broken or damaged road surface',
  'Road subsidence',
  'Waterlogging caused by road damage',
  'Damaged footpath',
  'Broken or missing manhole cover',
  'Damaged road divider',
  'Missing or damaged road signs',
  'Unsafe road obstruction',
  'Other road infrastructure issues'
];

export const ReportComplaintModal: React.FC<ReportComplaintModalProps> = ({
  isOpen,
  onClose,
  onComplaintCreated
}) => {
  const { user, token } = useAuth();

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('Pothole');
  const [severity, setSeverity] = useState<ComplaintSeverity>('Medium');
  const [roadName, setRoadName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [stateName, setStateName] = useState('Karnataka');
  const [district, setDistrict] = useState('Bengaluru Urban');
  const [panchayatLocality, setPanchayatLocality] = useState('Indiranagar - Ward 14');
  const [coordinates, setCoordinates] = useState<[number, number]>([77.6412, 12.9716]); // [lng, lat]
  const [isManualLocation, setIsManualLocation] = useState(false);
  const [observedAt, setObservedAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Uploaded Photos State
  const [evidence, setEvidence] = useState<IEvidenceAsset[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Duplicate Detection State
  const [duplicateCandidates, setDuplicateCandidates] = useState<IComplaint[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [ignoreDuplicates, setIgnoreDuplicates] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);

  // Check for duplicates when location / category / road changes
  useEffect(() => {
    if (!roadName || !category || ignoreDuplicates) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch('/api/complaints/duplicate-candidates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: coordinates[1],
            lng: coordinates[0],
            category,
            roadName
          })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.hasDuplicates && data.potentialDuplicates.length > 0) {
            setDuplicateCandidates(data.potentialDuplicates);
            setShowDuplicateWarning(true);
          } else {
            setDuplicateCandidates([]);
            setShowDuplicateWarning(false);
          }
        }
      } catch (err) {
        console.warn('Duplicate check warning:', err);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [coordinates, category, roadName, ignoreDuplicates]);

  if (!isOpen) return null;

  // Handle genuine file uploads
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError('');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('stage', 'damage');
      formData.append('caption', `Damage evidence: ${file.name}`);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to upload photo');
        }

        const data = await res.json();
        setEvidence(prev => [
          ...prev,
          {
            id: `ev-${Date.now()}-${i}`,
            url: data.url,
            publicId: data.publicId,
            caption: data.caption,
            stage: 'damage',
            uploadedAt: data.uploadedAt
          }
        ]);
      } catch (err: any) {
        setUploadError(err.message || 'Error uploading file');
      }
    }

    setIsUploading(false);
    e.target.value = '';
  };

  const removeEvidence = (index: number) => {
    setEvidence(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!user) {
      setFormError('You must be signed in as a citizen to submit a complaint.');
      return;
    }

    if (!title.trim() || !description.trim() || !roadName.trim()) {
      setFormError('Please fill in title, description, and road name.');
      return;
    }

    if (evidence.length === 0) {
      setFormError('Please attach at least one genuine photograph of the road damage.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          category,
          severity,
          roadName,
          landmark,
          state: stateName,
          district,
          panchayatLocality,
          coordinates,
          isManualLocation,
          observedAt,
          additionalNotes,
          evidence
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit report');
      }

      onComplaintCreated(data.complaint);
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Error submitting report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-orange-600" />
              <span>Report a Road Infrastructure Problem</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Citizen Reporting & Jurisdiction Routing Engine
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Severity & Critical Warning */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Problem Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ComplaintCategory)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Severity Level *
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['Low', 'Medium', 'High', 'Critical'] as ComplaintSeverity[]).map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition-all text-center ${
                      severity === s
                        ? s === 'Critical'
                          ? 'bg-red-600 text-white border-red-600 shadow-sm'
                          : s === 'High'
                          ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                          : 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Date & Time Observed
              </label>
              <input
                type="datetime-local"
                value={observedAt}
                onChange={(e) => setObservedAt(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {severity === 'Critical' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Critical Safety Hazard Protocol</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Critical severity automatically triggers an expedited alert to the assigned highway division. If there is imminent risk of fatal collision, also contact traffic police emergency (112).
              </p>
            </div>
          )}

          {/* Title & Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Complaint Short Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Deep pothole crater near 100 Feet Road signal"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Detailed Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe width, depth, traffic hazard, and condition in detail..."
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          {/* Location Fields */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>Geographical Location & Jurisdiction</span>
              </span>

              <button
                type="button"
                onClick={() => setShowMapPicker(!showMapPicker)}
                className="text-xs text-teal-700 hover:text-teal-900 font-medium underline"
              >
                {showMapPicker ? 'Hide Map Picker' : 'Choose on Interactive Map'}
              </button>
            </div>

            {showMapPicker && (
              <div className="space-y-1">
                <InteractiveMap
                  isPickerMode={true}
                  selectedCoordinates={coordinates}
                  onCoordinatesChange={(coords) => {
                    setCoordinates(coords);
                    setIsManualLocation(true);
                  }}
                  height="220px"
                  center={[coordinates[1], coordinates[0]]}
                  zoom={15}
                />
                <span className="text-[11px] text-slate-500 block">
                  Coordinates: {coordinates[1].toFixed(5)}, {coordinates[0].toFixed(5)}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Road / Street Name *
                </label>
                <input
                  type="text"
                  value={roadName}
                  onChange={(e) => setRoadName(e.target.value)}
                  placeholder="e.g. 100 Feet Road"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Prominent Landmark
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Opposite Metro Pillar 84"
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  District *
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Panchayat / Ward *
                </label>
                <input
                  type="text"
                  value={panchayatLocality}
                  onChange={(e) => setPanchayatLocality(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Duplicate Detection Warning Banner */}
          {showDuplicateWarning && duplicateCandidates.length > 0 && !ignoreDuplicates && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <Info className="w-4 h-4 text-amber-600" />
                  <span>Potential Duplicate Reports Found Nearby ({duplicateCandidates.length})</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIgnoreDuplicates(true)}
                  className="text-[11px] text-amber-800 hover:text-amber-950 underline font-medium"
                >
                  Dismiss & Proceed Anyway
                </button>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto">
                {duplicateCandidates.map(c => (
                  <div key={c.id} className="bg-white p-2.5 rounded-lg border border-amber-200 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800">
                        {c.reference} · {c.roadName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Status: <strong className="text-teal-700">{c.status}</strong> · {c.category}
                      </div>
                    </div>
                    {c.evidence?.[0] && (
                      <img src={c.evidence[0].url} alt="existing" className="w-12 h-12 object-cover rounded-md border" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Genuine Photograph Uploads */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-teal-600" />
                <span>Damage Photographs & Evidence *</span>
              </label>
              <span className="text-[11px] text-slate-500">
                {evidence.length} photo(s) added
              </span>
            </div>

            {uploadError && (
              <p className="text-xs text-red-600">{uploadError}</p>
            )}

            {/* Photo Previews */}
            {evidence.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {evidence.map((ev, idx) => (
                  <div key={ev.id || idx} className="relative group rounded-lg overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                    <img src={ev.url} alt={`evidence-${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeEvidence(idx)}
                      className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-md opacity-90 hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Input Button */}
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-teal-500 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-teal-50/20 transition-all text-center">
              <Upload className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-xs font-semibold text-slate-700">
                {isUploading ? 'Uploading genuine photograph...' : 'Click or drag road damage photos'}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Supports JPEG, PNG, WebP up to 15MB. Preserves genuine metadata & timestamps.
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Additional Notes (Optional)
            </label>
            <input
              type="text"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Near temporary bus stop, caution cones already placed by locals"
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 rounded-lg shadow-sm transition-colors"
            >
              {isSubmitting ? 'Registering Report...' : 'Submit Damage Report'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import mongoose, { Schema } from 'mongoose';

export const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true },
  passwordHash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['citizen', 'local_admin', 'district_admin', 'state_admin'], 
    default: 'citizen' 
  },
  jurisdiction: {
    state: { type: String },
    district: { type: String },
    panchayatLocality: { type: String },
    departmentId: { type: String }
  },
  active: { type: Boolean, default: true },
  preferredNotifications: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    sms: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now }
});

export const ComplaintSchema = new Schema({
  reference: { type: String, required: true, unique: true, index: true },
  userId: { type: String, required: true, index: true },
  citizenName: { type: String, required: true },
  citizenEmail: { type: String, required: true },
  citizenMobile: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true, index: true },
  severity: { type: String, required: true, enum: ['Low', 'Medium', 'High', 'Critical'] },
  priority: { type: String, required: true, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  priorityReason: { type: String },
  
  roadName: { type: String, required: true },
  landmark: { type: String, default: '' },
  state: { type: String, required: true, index: true },
  district: { type: String, required: true, index: true },
  panchayatLocality: { type: String, required: true, index: true },
  
  // GeoJSON 2dsphere index support
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  isManualLocation: { type: Boolean, default: false },
  
  responsibleDepartment: { type: String },
  assignedTeamOrContractor: { type: String },
  expectedCompletionDate: { type: String },
  
  evidence: [{
    url: { type: String, required: true },
    publicId: { type: String },
    caption: { type: String },
    stage: { type: String, enum: ['damage', 'inspection', 'progress', 'completion'], default: 'damage' },
    uploadedAt: { type: String },
    uploadedBy: { type: String }
  }],
  
  status: { 
    type: String, 
    required: true, 
    enum: [
      'Submitted', 
      'Under Review', 
      'Assigned', 
      'In Progress', 
      'Resolution Submitted', 
      'Resolved', 
      'Awaiting Jurisdiction Review', 
      'More Information Required', 
      'Rejected with Reason', 
      'Escalated', 
      'Reopened'
    ],
    default: 'Submitted',
    index: true
  },
  
  statusHistory: [{
    status: { type: String, required: true },
    changedBy: { type: String, required: true },
    changedByName: { type: String, required: true },
    role: { type: String, required: true },
    notes: { type: String },
    timestamp: { type: String, required: true }
  }],
  
  resolutionSubmission: {
    workPerformed: { type: String },
    solutionDescription: { type: String },
    completionDate: { type: String },
    teamOrContractor: { type: String },
    notes: { type: String },
    materialsUsed: { type: String },
    officerConfirmation: { type: Boolean },
    beforePhotos: [{ type: String }],
    afterPhotos: [{ type: String }],
    submittedAt: { type: String },
    submittedBy: { type: String },
    submittedByName: { type: String }
  },
  
  resolutionVerification: {
    verifiedBy: { type: String },
    verifiedByName: { type: String },
    role: { type: String },
    decision: { type: String, enum: ['approved', 'rejected', 'returned'] },
    comments: { type: String },
    verifiedAt: { type: String }
  },
  
  rejectionReason: { type: String },
  isRecurringLocation: { type: Boolean, default: false },
  observedAt: { type: String, required: true },
  additionalNotes: { type: String },
  resolvedAt: { type: String }
}, {
  timestamps: true
});

ComplaintSchema.index({ location: '2dsphere' });
ComplaintSchema.index({ status: 1, category: 1, district: 1 });

export const NotificationSchema = new Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  complaintReference: { type: String },
  complaintId: { type: String },
  read: { type: Boolean, default: false },
  type: { type: String, enum: ['status_change', 'assignment', 'resolution', 'escalation', 'alert'], default: 'status_change' },
  createdAt: { type: String, default: () => new Date().toISOString() }
});

export const AuditLogSchema = new Schema({
  action: { type: String, required: true },
  performedBy: { type: String, required: true },
  performedByName: { type: String, required: true },
  userRole: { type: String, required: true },
  complaintReference: { type: String },
  details: { type: String, required: true },
  timestamp: { type: String, default: () => new Date().toISOString() }
});

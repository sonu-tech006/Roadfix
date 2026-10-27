export type UserRole = 'citizen' | 'local_admin' | 'district_admin' | 'state_admin';

export interface UserJurisdiction {
  state: string;
  district?: string;
  panchayatLocality?: string;
  departmentId?: string;
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  jurisdiction?: UserJurisdiction;
  active: boolean;
  preferredNotifications: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
  };
  createdAt: string;
}

export type ComplaintCategory =
  | 'Pothole'
  | 'Broken or damaged road surface'
  | 'Road subsidence'
  | 'Waterlogging caused by road damage'
  | 'Damaged footpath'
  | 'Broken or missing manhole cover'
  | 'Damaged road divider'
  | 'Missing or damaged road signs'
  | 'Unsafe road obstruction'
  | 'Other road infrastructure issues';

export type ComplaintSeverity = 'Low' | 'Medium' | 'High' | 'Critical';

export type ComplaintStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'In Progress'
  | 'Resolution Submitted'
  | 'Resolved'
  | 'Awaiting Jurisdiction Review'
  | 'More Information Required'
  | 'Rejected with Reason'
  | 'Escalated'
  | 'Reopened';

export interface IEvidenceAsset {
  id: string;
  url: string;
  publicId?: string;
  caption?: string;
  stage: 'damage' | 'inspection' | 'progress' | 'completion';
  uploadedAt: string;
  uploadedBy?: string;
}

export interface IStatusHistoryItem {
  status: ComplaintStatus;
  changedBy: string;
  changedByName: string;
  role: UserRole;
  notes?: string;
  timestamp: string;
}

export interface IResolutionSubmission {
  workPerformed: string;
  solutionDescription: string;
  completionDate: string;
  teamOrContractor: string;
  notes?: string;
  materialsUsed?: string;
  officerConfirmation: boolean;
  beforePhotos: string[];
  afterPhotos: string[];
  submittedAt: string;
  submittedBy: string;
  submittedByName: string;
}

export interface IResolutionVerification {
  verifiedBy: string;
  verifiedByName: string;
  role: UserRole;
  decision: 'approved' | 'rejected' | 'returned';
  comments: string;
  verifiedAt: string;
}

export interface IComplaint {
  id: string;
  reference: string;
  userId: string;
  citizenName: string;
  citizenEmail: string;
  citizenMobile: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  severity: ComplaintSeverity;
  priority: ComplaintSeverity;
  priorityReason?: string;
  
  roadName: string;
  landmark: string;
  state: string;
  district: string;
  panchayatLocality: string;
  coordinates: [number, number];
  isManualLocation: boolean;
  
  responsibleDepartment?: string;
  assignedTeamOrContractor?: string;
  expectedCompletionDate?: string;
  
  evidence: IEvidenceAsset[];
  status: ComplaintStatus;
  statusHistory: IStatusHistoryItem[];
  
  resolutionSubmission?: IResolutionSubmission;
  resolutionVerification?: IResolutionVerification;
  rejectionReason?: string;
  
  isRecurringLocation?: boolean;
  observedAt: string;
  additionalNotes?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface INotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  complaintReference?: string;
  complaintId?: string;
  read: boolean;
  type: 'status_change' | 'assignment' | 'resolution' | 'escalation' | 'alert';
  createdAt: string;
}

export interface IAuditLog {
  id: string;
  action: string;
  performedBy: string;
  performedByName: string;
  userRole: UserRole;
  complaintReference?: string;
  details: string;
  timestamp: string;
}

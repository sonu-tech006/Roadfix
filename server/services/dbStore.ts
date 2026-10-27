import { 
  IUser, 
  IComplaint, 
  INotification, 
  IAuditLog, 
  IDepartment, 
  ComplaintStatus, 
  UserRole,
  ComplaintSeverity,
  IResolutionSubmission,
  IResolutionVerification
} from '../models/types.ts';
import bcrypt from 'bcryptjs';

// Haversine distance in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

class DatabaseStore {
  private users: IUser[] = [];
  private complaints: IComplaint[] = [];
  private notifications: INotification[] = [];
  private auditLogs: IAuditLog[] = [];
  private departments: IDepartment[] = [];
  private initialized = false;

  constructor() {
    this.initSeedData();
  }

  private async initSeedData() {
    if (this.initialized) return;

    const salt = bcrypt.genSaltSync(10);
    const demoPasswordHash = bcrypt.hashSync('RoadFix@2026', salt);

    // Initial Departments
    this.departments = [
      {
        id: 'dept-pwd-01',
        name: 'State Public Works Department (PWD) - Highways & Arterials',
        level: 'state',
        state: 'Karnataka',
        jurisdiction: 'Statewide Highways',
        contactEmail: 'kpwd.director@gov.in',
        contactPhone: '+91-80-2235-9000'
      },
      {
        id: 'dept-bbmp-east',
        name: 'Bruhat Bengaluru Mahanagara Palike (BBMP) - East Division',
        level: 'district',
        state: 'Karnataka',
        district: 'Bengaluru Urban',
        jurisdiction: 'Bengaluru East District',
        contactEmail: 'ee.east@bbmp.gov.in',
        contactPhone: '+91-80-2266-0001'
      },
      {
        id: 'dept-ward-14',
        name: 'Panchayat & Ward 14 Road Maintenance Authority',
        level: 'local',
        state: 'Karnataka',
        district: 'Bengaluru Urban',
        jurisdiction: 'Indiranagar - Ward 14',
        contactEmail: 'ward14.officer@bbmp.gov.in',
        contactPhone: '+91-80-2297-5514'
      },
      {
        id: 'dept-ward-88',
        name: 'Panchayat & Ward 88 Koramangala Civic Works',
        level: 'local',
        state: 'Karnataka',
        district: 'Bengaluru Urban',
        jurisdiction: 'Koramangala - Ward 88',
        contactEmail: 'ward88.officer@bbmp.gov.in',
        contactPhone: '+91-80-2297-5588'
      }
    ];

    // Seed Authorized Users across the 3 Admin Levels + Citizens
    this.users = [
      {
        id: 'user-citizen-01',
        name: 'Priya Sharma',
        email: 'priya.citizen@roadfix.org',
        mobile: '+91 98450 12345',
        passwordHash: demoPasswordHash,
        role: 'citizen',
        active: true,
        preferredNotifications: { inApp: true, email: true, sms: true },
        createdAt: '2026-09-10T08:30:00.000Z'
      },
      {
        id: 'user-citizen-02',
        name: 'Arjun Menon',
        email: 'arjun.citizen@roadfix.org',
        mobile: '+91 98450 67890',
        passwordHash: demoPasswordHash,
        role: 'citizen',
        active: true,
        preferredNotifications: { inApp: true, email: true, sms: false },
        createdAt: '2026-09-12T11:15:00.000Z'
      },
      {
        id: 'user-admin-local-14',
        name: 'Ramesh Kulkarni',
        email: 'ramesh.localadmin@roadfix.org',
        mobile: '+91 98450 99001',
        passwordHash: demoPasswordHash,
        role: 'local_admin',
        jurisdiction: {
          state: 'Karnataka',
          district: 'Bengaluru Urban',
          panchayatLocality: 'Indiranagar - Ward 14',
          departmentId: 'dept-ward-14'
        },
        active: true,
        preferredNotifications: { inApp: true, email: true, sms: true },
        createdAt: '2026-08-01T09:00:00.000Z'
      },
      {
        id: 'user-admin-district',
        name: 'Dr. Sunita Rao (IAS)',
        email: 'sunita.districtadmin@roadfix.org',
        mobile: '+91 98450 99002',
        passwordHash: demoPasswordHash,
        role: 'district_admin',
        jurisdiction: {
          state: 'Karnataka',
          district: 'Bengaluru Urban',
          departmentId: 'dept-bbmp-east'
        },
        active: true,
        preferredNotifications: { inApp: true, email: true, sms: true },
        createdAt: '2026-08-01T09:00:00.000Z'
      },
      {
        id: 'user-admin-state',
        name: 'V. R. Ananthakrishnan (Principal Secretary)',
        email: 'ananth.stateadmin@roadfix.org',
        mobile: '+91 98450 99003',
        passwordHash: demoPasswordHash,
        role: 'state_admin',
        jurisdiction: {
          state: 'Karnataka',
          departmentId: 'dept-pwd-01'
        },
        active: true,
        preferredNotifications: { inApp: true, email: true, sms: true },
        createdAt: '2026-07-15T09:00:00.000Z'
      }
    ];

    // Seed Realistic Complaints across lifecycle stages
    this.complaints = [
      {
        id: 'comp-01',
        reference: 'RF-2026-8941',
        userId: 'user-citizen-01',
        citizenName: 'Priya Sharma',
        citizenEmail: 'priya.citizen@roadfix.org',
        citizenMobile: '+91 98450 12345',
        title: 'Deep crater pothole near 100 Feet Road signal causing vehicle rim damage',
        description: 'Large asphalt depression measuring roughly 1.2m across and 15cm deep located on the main northbound carriageway. Two two-wheelers suffered rim damage yesterday during rush hour. Urgent resurfacing needed.',
        category: 'Pothole',
        severity: 'Critical',
        priority: 'Critical',
        priorityReason: 'High-speed arterial corridor with heavy rush hour volume and documented vehicle accidents.',
        roadName: '100 Feet Road (Northbound)',
        landmark: 'Near 12th Main Junction & Metro Pillar 84',
        state: 'Karnataka',
        district: 'Bengaluru Urban',
        panchayatLocality: 'Indiranagar - Ward 14',
        coordinates: [77.6412, 12.9716], // [lng, lat]
        isManualLocation: false,
        responsibleDepartment: 'Bruhat Bengaluru Mahanagara Palike (BBMP) - East Division',
        assignedTeamOrContractor: 'Apex Infrastructure Maintenance Squad #4',
        expectedCompletionDate: '2026-10-29',
        evidence: [
          {
            id: 'ev-01',
            url: '/src/assets/images/road_pothole_sample_1793122603266.jpg',
            caption: 'Deep asphalt pothole cavity with fractured edges on northbound carriageway',
            stage: 'damage',
            uploadedAt: '2026-10-25T09:12:00.000Z'
          }
        ],
        status: 'In Progress',
        statusHistory: [
          {
            status: 'Submitted',
            changedBy: 'user-citizen-01',
            changedByName: 'Priya Sharma',
            role: 'citizen',
            notes: 'Citizen submitted initial report with damage photography.',
            timestamp: '2026-10-25T09:12:00.000Z'
          },
          {
            status: 'Under Review',
            changedBy: 'user-admin-local-14',
            changedByName: 'Ramesh Kulkarni',
            role: 'local_admin',
            notes: 'Local inspection verified crater dimensions. Elevated severity to Critical due to heavy commuter bus traffic.',
            timestamp: '2026-10-25T11:40:00.000Z'
          },
          {
            status: 'Assigned',
            changedBy: 'user-admin-local-14',
            changedByName: 'Ramesh Kulkarni',
            role: 'local_admin',
            notes: 'Work order #BBMP-WO-8941 assigned to Apex Infrastructure Maintenance Squad #4.',
            timestamp: '2026-10-26T08:00:00.000Z'
          },
          {
            status: 'In Progress',
            changedBy: 'user-admin-local-14',
            changedByName: 'Ramesh Kulkarni',
            role: 'local_admin',
            notes: 'Cold mix milling and base compaction commenced at 06:30 hrs.',
            timestamp: '2026-10-27T07:15:00.000Z'
          }
        ],
        isRecurringLocation: true,
        observedAt: '2026-10-25T08:45:00.000Z',
        additionalNotes: 'Traffic police set temporary orange caution cones around the cavity.',
        createdAt: '2026-10-25T09:12:00.000Z',
        updatedAt: '2026-10-27T07:15:00.000Z'
      },
      {
        id: 'comp-02',
        reference: 'RF-2026-8910',
        userId: 'user-citizen-02',
        citizenName: 'Arjun Menon',
        citizenEmail: 'arjun.citizen@roadfix.org',
        citizenMobile: '+91 98450 67890',
        title: 'Broken stormwater manhole cover protruding 8 inches above grade',
        description: 'Cast iron frame has collapsed on one side while the slab is severely displaced. Immediate threat to pedestrians and night-time motorcyclists.',
        category: 'Broken or missing manhole cover',
        severity: 'High',
        priority: 'High',
        priorityReason: 'Pedestrian hazard along residential school walking corridor.',
        roadName: 'CMH Road, 4th Cross',
        landmark: 'Opposite Public Health Center',
        state: 'Karnataka',
        district: 'Bengaluru Urban',
        panchayatLocality: 'Indiranagar - Ward 14',
        coordinates: [77.6385, 12.9782],
        isManualLocation: true,
        responsibleDepartment: 'Panchayat & Ward 14 Road Maintenance Authority',
        assignedTeamOrContractor: 'City Rapid Response Civil Unit B',
        expectedCompletionDate: '2026-10-27',
        evidence: [
          {
            id: 'ev-02',
            url: '/src/assets/images/road_pothole_sample_1793122603266.jpg',
            caption: 'Broken masonry collar and displaced iron frame',
            stage: 'damage',
            uploadedAt: '2026-10-24T14:30:00.000Z'
          },
          {
            id: 'ev-02-res',
            url: '/src/assets/images/road_repaired_sample_1793122603809.jpg',
            caption: 'Completed reinforced concrete collar replacement and flush ductile iron frame',
            stage: 'completion',
            uploadedAt: '2026-10-27T09:00:00.000Z'
          }
        ],
        status: 'Resolution Submitted',
        statusHistory: [
          {
            status: 'Submitted',
            changedBy: 'user-citizen-02',
            changedByName: 'Arjun Menon',
            role: 'citizen',
            notes: 'Citizen lodged report with photo.',
            timestamp: '2026-10-24T14:30:00.000Z'
          },
          {
            status: 'Assigned',
            changedBy: 'user-admin-local-14',
            changedByName: 'Ramesh Kulkarni',
            role: 'local_admin',
            notes: 'Forwarded to Ward 14 drainage engineering squad.',
            timestamp: '2026-10-25T10:00:00.000Z'
          },
          {
            status: 'In Progress',
            changedBy: 'user-admin-local-14',
            changedByName: 'Ramesh Kulkarni',
            role: 'local_admin',
            notes: 'Old broken collar excavated and precast M35 concrete frame placed.',
            timestamp: '2026-10-26T14:00:00.000Z'
          },
          {
            status: 'Resolution Submitted',
            changedBy: 'user-admin-local-14',
            changedByName: 'Ramesh Kulkarni',
            role: 'local_admin',
            notes: 'Local engineer marked repair work completed with completion photos. Pending district verification.',
            timestamp: '2026-10-27T09:00:00.000Z'
          }
        ],
        resolutionSubmission: {
          workPerformed: 'Full replacement of fractured masonry chamber ring with reinforced M35 precast collar and certified 40-tonne ductile iron grate flush to road gradient.',
          solutionDescription: 'Removed broken stones, laid leveling concrete bed, placed heavy-duty cover, backfilled with asphalt concrete around frame edges.',
          completionDate: '2026-10-27',
          teamOrContractor: 'City Rapid Response Civil Unit B (Lead: Er. D. Nayak)',
          notes: 'Tested under heavy axle load. No vibration or protrusion.',
          materialsUsed: 'M35 grade concrete, Grade 500-7 Ductile Iron Frame, Bituminous Cold Patch',
          officerConfirmation: true,
          beforePhotos: ['/src/assets/images/road_pothole_sample_1793122603266.jpg'],
          afterPhotos: ['/src/assets/images/road_repaired_sample_1793122603809.jpg'],
          submittedAt: '2026-10-27T09:00:00.000Z',
          submittedBy: 'user-admin-local-14',
          submittedByName: 'Ramesh Kulkarni'
        },
        observedAt: '2026-10-24T13:45:00.000Z',
        createdAt: '2026-10-24T14:30:00.000Z',
        updatedAt: '2026-10-27T09:00:00.000Z'
      },
      {
        id: 'comp-03',
        reference: 'RF-2026-8802',
        userId: 'user-citizen-01',
        citizenName: 'Priya Sharma',
        citizenEmail: 'priya.citizen@roadfix.org',
        citizenMobile: '+91 98450 12345',
        title: 'Road subsidence and surface peeling along 80 Feet Ring Road junction',
        description: 'Asphalt settlement forming a 4-meter trough after heavy monsoon downpour. Rainwater accumulates creating severe hydroplaning hazard.',
        category: 'Road subsidence',
        severity: 'High',
        priority: 'High',
        roadName: '80 Feet Road',
        landmark: 'Adjacent to Sony World Signal',
        state: 'Karnataka',
        district: 'Bengaluru Urban',
        panchayatLocality: 'Koramangala - Ward 88',
        coordinates: [77.6245, 12.9352],
        isManualLocation: false,
        responsibleDepartment: 'Bruhat Bengaluru Mahanagara Palike (BBMP) - East Division',
        assignedTeamOrContractor: 'Koramangala Zone Road Works',
        expectedCompletionDate: '2026-10-20',
        evidence: [
          {
            id: 'ev-03-bef',
            url: '/src/assets/images/road_pothole_sample_1793122603266.jpg',
            caption: 'Surface waterlogging and cracked asphalt subsidence',
            stage: 'damage',
            uploadedAt: '2026-10-15T10:00:00.000Z'
          },
          {
            id: 'ev-03-aft',
            url: '/src/assets/images/road_repaired_sample_1793122603809.jpg',
            caption: 'Milled, re-graded, compacted and sealed asphalt surface',
            stage: 'completion',
            uploadedAt: '2026-10-20T16:30:00.000Z'
          }
        ],
        status: 'Resolved',
        statusHistory: [
          {
            status: 'Submitted',
            changedBy: 'user-citizen-01',
            changedByName: 'Priya Sharma',
            role: 'citizen',
            notes: 'Citizen report submitted.',
            timestamp: '2026-10-15T10:00:00.000Z'
          },
          {
            status: 'In Progress',
            changedBy: 'user-admin-district',
            changedByName: 'Dr. Sunita Rao (IAS)',
            role: 'district_admin',
            notes: 'Excavation and gravel sub-base stabilization.',
            timestamp: '2026-10-18T09:00:00.000Z'
          },
          {
            status: 'Resolution Submitted',
            changedBy: 'user-admin-local-14',
            changedByName: 'Ramesh Kulkarni',
            role: 'local_admin',
            notes: 'Patch completed and asphalt rolled smooth.',
            timestamp: '2026-10-20T16:30:00.000Z'
          },
          {
            status: 'Resolved',
            changedBy: 'user-admin-district',
            changedByName: 'Dr. Sunita Rao (IAS)',
            role: 'district_admin',
            notes: 'District engineer inspected site. Verified compliance with Ministry of Road Transport & Highways IRC-SP-100 standards.',
            timestamp: '2026-10-21T11:00:00.000Z'
          }
        ],
        resolutionSubmission: {
          workPerformed: 'Sub-grade stabilization with crushed aggregate, tack coat application, and 50mm Dense Bituminous Macadam overlay.',
          solutionDescription: 'Leveling and compaction to eliminate water pooling.',
          completionDate: '2026-10-20',
          teamOrContractor: 'Koramangala Zone Road Works',
          officerConfirmation: true,
          beforePhotos: ['/src/assets/images/road_pothole_sample_1793122603266.jpg'],
          afterPhotos: ['/src/assets/images/road_repaired_sample_1793122603809.jpg'],
          submittedAt: '2026-10-20T16:30:00.000Z',
          submittedBy: 'user-admin-local-14',
          submittedByName: 'Ramesh Kulkarni'
        },
        resolutionVerification: {
          verifiedBy: 'user-admin-district',
          verifiedByName: 'Dr. Sunita Rao (IAS)',
          role: 'district_admin',
          decision: 'approved',
          comments: 'High quality compaction and clean lane markings verified on site inspection.',
          verifiedAt: '2026-10-21T11:00:00.000Z'
        },
        observedAt: '2026-10-15T09:30:00.000Z',
        createdAt: '2026-10-15T10:00:00.000Z',
        updatedAt: '2026-10-21T11:00:00.000Z',
        resolvedAt: '2026-10-21T11:00:00.000Z'
      },
      {
        id: 'comp-04',
        reference: 'RF-2026-8955',
        userId: 'user-citizen-02',
        citizenName: 'Arjun Menon',
        citizenEmail: 'arjun.citizen@roadfix.org',
        citizenMobile: '+91 98450 67890',
        title: 'Severe median divider crack with exposed steel rebar on Old Airport Road',
        description: 'A vehicular impact shattered 6 meters of concrete median. Sharp reinforced iron rebars stick out 30cm into the fast lane.',
        category: 'Damaged road divider',
        severity: 'Critical',
        priority: 'Critical',
        priorityReason: 'Exposed metal rebar directly threatens tires and vehicle undercarriages at 60km/h.',
        roadName: 'HAL Old Airport Road',
        landmark: 'Opposite Command Hospital Gate 2',
        state: 'Karnataka',
        district: 'Bengaluru Urban',
        panchayatLocality: 'Indiranagar - Ward 14',
        coordinates: [77.6541, 12.9610],
        isManualLocation: false,
        responsibleDepartment: 'State Public Works Department (PWD) - Highways & Arterials',
        evidence: [
          {
            id: 'ev-04',
            url: '/src/assets/images/road_pothole_sample_1793122603266.jpg',
            caption: 'Shattered precast divider block with exposed rebar skewers',
            stage: 'damage',
            uploadedAt: '2026-10-26T19:20:00.000Z'
          }
        ],
        status: 'Escalated',
        statusHistory: [
          {
            status: 'Submitted',
            changedBy: 'user-citizen-02',
            changedByName: 'Arjun Menon',
            role: 'citizen',
            notes: 'Citizen submitted report with critical safety warning.',
            timestamp: '2026-10-26T19:20:00.000Z'
          },
          {
            status: 'Escalated',
            changedBy: 'user-admin-local-14',
            changedByName: 'Ramesh Kulkarni',
            role: 'local_admin',
            notes: 'Arterial highway segment belongs to State PWD jurisdiction; escalated from Ward level to State PWD Rapid Division.',
            timestamp: '2026-10-27T08:15:00.000Z'
          }
        ],
        isRecurringLocation: false,
        observedAt: '2026-10-26T18:50:00.000Z',
        createdAt: '2026-10-26T19:20:00.000Z',
        updatedAt: '2026-10-27T08:15:00.000Z'
      },
      {
        id: 'comp-05',
        reference: 'RF-2026-8962',
        userId: 'user-citizen-01',
        citizenName: 'Priya Sharma',
        citizenEmail: 'priya.citizen@roadfix.org',
        citizenMobile: '+91 98450 12345',
        title: 'Persistent puddle and road subsidence blocking pedestrian crossing',
        description: 'Road gradient failure leaves 10cm of standing muddy water over pedestrian zebra crossing.',
        category: 'Waterlogging caused by road damage',
        severity: 'Medium',
        priority: 'Medium',
        roadName: 'Double Road (K.H. Road)',
        landmark: 'Near Shanti Nagar Bus Stand',
        state: 'Karnataka',
        district: 'Bengaluru Urban',
        panchayatLocality: 'Indiranagar - Ward 14',
        coordinates: [77.5921, 12.9554],
        isManualLocation: true,
        responsibleDepartment: 'Bruhat Bengaluru Mahanagara Palike (BBMP) - East Division',
        evidence: [
          {
            id: 'ev-05',
            url: '/src/assets/images/road_pothole_sample_1793122603266.jpg',
            caption: 'Standing water caused by failed storm drain camber',
            stage: 'damage',
            uploadedAt: '2026-10-27T06:10:00.000Z'
          }
        ],
        status: 'Submitted',
        statusHistory: [
          {
            status: 'Submitted',
            changedBy: 'user-citizen-01',
            changedByName: 'Priya Sharma',
            role: 'citizen',
            notes: 'Report registered in system.',
            timestamp: '2026-10-27T06:10:00.000Z'
          }
        ],
        observedAt: '2026-10-27T05:45:00.000Z',
        createdAt: '2026-10-27T06:10:00.000Z',
        updatedAt: '2026-10-27T06:10:00.000Z'
      }
    ];

    // Seed Initial Notifications
    this.notifications = [
      {
        id: 'notif-01',
        userId: 'user-citizen-01',
        title: 'Status Update: RF-2026-8941',
        message: 'Your report regarding 100 Feet Road pothole is now In Progress by Apex Squad #4.',
        complaintReference: 'RF-2026-8941',
        complaintId: 'comp-01',
        read: false,
        type: 'status_change',
        createdAt: '2026-10-27T07:15:00.000Z'
      },
      {
        id: 'notif-02',
        userId: 'user-admin-local-14',
        title: 'New Complaint In Your Ward: RF-2026-8962',
        message: 'Waterlogging caused by road damage reported at Double Road. Immediate inspection requested.',
        complaintReference: 'RF-2026-8962',
        complaintId: 'comp-05',
        read: false,
        type: 'alert',
        createdAt: '2026-10-27T06:10:00.000Z'
      },
      {
        id: 'notif-03',
        userId: 'user-admin-district',
        title: 'Resolution Verification Required: RF-2026-8910',
        message: 'Panchayat Admin Ramesh Kulkarni submitted completion evidence for manhole repair on CMH Road.',
        complaintReference: 'RF-2026-8910',
        complaintId: 'comp-02',
        read: false,
        type: 'resolution',
        createdAt: '2026-10-27T09:00:00.000Z'
      }
    ];

    // Seed Initial Audit Logs
    this.auditLogs = [
      {
        id: 'log-01',
        action: 'COMPLAINT_REGISTERED',
        performedBy: 'user-citizen-01',
        performedByName: 'Priya Sharma',
        userRole: 'citizen',
        complaintReference: 'RF-2026-8941',
        details: 'Submitted high-severity pothole complaint with geotagged photo proof.',
        timestamp: '2026-10-25T09:12:00.000Z'
      },
      {
        id: 'log-02',
        action: 'STATUS_TRANSITION',
        performedBy: 'user-admin-local-14',
        performedByName: 'Ramesh Kulkarni',
        userRole: 'local_admin',
        complaintReference: 'RF-2026-8941',
        details: 'Transitioned complaint status to Under Review and elevated priority to Critical.',
        timestamp: '2026-10-25T11:40:00.000Z'
      },
      {
        id: 'log-03',
        action: 'CONTRACTOR_ASSIGNED',
        performedBy: 'user-admin-local-14',
        performedByName: 'Ramesh Kulkarni',
        userRole: 'local_admin',
        complaintReference: 'RF-2026-8941',
        details: 'Dispatched Apex Infrastructure Maintenance Squad #4 for cold-mix patch work.',
        timestamp: '2026-10-26T08:00:00.000Z'
      },
      {
        id: 'log-04',
        action: 'RESOLUTION_SUBMITTED',
        performedBy: 'user-admin-local-14',
        performedByName: 'Ramesh Kulkarni',
        userRole: 'local_admin',
        complaintReference: 'RF-2026-8910',
        details: 'Marked repair work completed and uploaded post-repair proof for manhole cover.',
        timestamp: '2026-10-27T09:00:00.000Z'
      }
    ];

    this.initialized = true;
  }

  // User Operations
  async findUserByEmail(email: string): Promise<IUser | undefined> {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  async findUserById(id: string): Promise<IUser | undefined> {
    return this.users.find(u => u.id === id);
  }

  async createUser(userData: Omit<IUser, 'id' | 'createdAt'>): Promise<IUser> {
    const newUser: IUser = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString()
    };
    this.users.push(newUser);
    return newUser;
  }

  async getAllUsers(): Promise<IUser[]> {
    return this.users.map(({ passwordHash, ...rest }) => rest as IUser);
  }

  async updateUserStatus(userId: string, active: boolean): Promise<IUser | null> {
    const user = this.users.find(u => u.id === userId);
    if (!user) return null;
    user.active = active;
    return user;
  }

  async updateUserJurisdiction(userId: string, jurisdiction: IUser['jurisdiction']): Promise<IUser | null> {
    const user = this.users.find(u => u.id === userId);
    if (!user) return null;
    user.jurisdiction = jurisdiction;
    return user;
  }

  // Complaint Operations
  async getComplaints(filters: {
    search?: string;
    status?: string;
    category?: string;
    severity?: string;
    priority?: string;
    state?: string;
    district?: string;
    panchayatLocality?: string;
    userId?: string;
    isRecurring?: boolean;
    page?: number;
    limit?: number;
    userRole?: UserRole;
    userJurisdiction?: IUser['jurisdiction'];
  }): Promise<{ complaints: IComplaint[]; total: number; page: number; totalPages: number }> {
    let list = [...this.complaints];

    // Role-based jurisdiction scoping
    if (filters.userRole === 'local_admin' && filters.userJurisdiction?.panchayatLocality) {
      list = list.filter(c => c.panchayatLocality.toLowerCase() === filters.userJurisdiction!.panchayatLocality!.toLowerCase());
    } else if (filters.userRole === 'district_admin' && filters.userJurisdiction?.district) {
      list = list.filter(c => c.district.toLowerCase() === filters.userJurisdiction!.district!.toLowerCase());
    } else if (filters.userRole === 'state_admin' && filters.userJurisdiction?.state) {
      list = list.filter(c => c.state.toLowerCase() === filters.userJurisdiction!.state!.toLowerCase());
    }

    if (filters.userId) {
      list = list.filter(c => c.userId === filters.userId);
    }
    if (filters.status && filters.status !== 'all') {
      list = list.filter(c => c.status === filters.status);
    }
    if (filters.category && filters.category !== 'all') {
      list = list.filter(c => c.category === filters.category);
    }
    if (filters.severity && filters.severity !== 'all') {
      list = list.filter(c => c.severity === filters.severity);
    }
    if (filters.priority && filters.priority !== 'all') {
      list = list.filter(c => c.priority === filters.priority);
    }
    if (filters.state) {
      list = list.filter(c => c.state.toLowerCase() === filters.state!.toLowerCase());
    }
    if (filters.district) {
      list = list.filter(c => c.district.toLowerCase() === filters.district!.toLowerCase());
    }
    if (filters.panchayatLocality) {
      list = list.filter(c => c.panchayatLocality.toLowerCase() === filters.panchayatLocality!.toLowerCase());
    }
    if (filters.isRecurring !== undefined) {
      list = list.filter(c => !!c.isRecurringLocation === filters.isRecurring);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(c => 
        c.reference.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.roadName.toLowerCase().includes(q) ||
        c.landmark.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }

    // Sort by latest created first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = list.length;
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 20));
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    return {
      complaints: paginated,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Public complaints for map and tracking (privacy-safe, personal contact redacted)
  async getPublicComplaints(): Promise<Partial<IComplaint>[]> {
    return this.complaints.map(c => ({
      id: c.id,
      reference: c.reference,
      title: c.title,
      description: c.description,
      category: c.category,
      severity: c.severity,
      priority: c.priority,
      roadName: c.roadName,
      landmark: c.landmark,
      state: c.state,
      district: c.district,
      panchayatLocality: c.panchayatLocality,
      coordinates: c.coordinates,
      isManualLocation: c.isManualLocation,
      status: c.status,
      evidence: c.evidence,
      responsibleDepartment: c.responsibleDepartment,
      expectedCompletionDate: c.expectedCompletionDate,
      observedAt: c.observedAt,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      resolvedAt: c.resolvedAt,
      isRecurringLocation: c.isRecurringLocation,
      statusHistory: c.statusHistory.map(h => ({
        status: h.status,
        changedBy: 'Authorized Authority',
        changedByName: h.role === 'citizen' ? 'Citizen' : 'Road Maintenance Authority',
        role: h.role,
        notes: h.notes,
        timestamp: h.timestamp
      }))
    }));
  }

  async getComplaintByReference(ref: string): Promise<IComplaint | undefined> {
    return this.complaints.find(c => c.reference.toUpperCase() === ref.trim().toUpperCase());
  }

  async getComplaintById(id: string): Promise<IComplaint | undefined> {
    return this.complaints.find(c => c.id === id);
  }

  // Geospatial search: finds nearby complaints within radiusKm
  async findNearbyComplaints(lat: number, lng: number, radiusKm = 1.0): Promise<IComplaint[]> {
    return this.complaints.filter(c => {
      const [cLng, cLat] = c.coordinates;
      const distance = calculateDistanceKm(lat, lng, cLat, cLng);
      return distance <= radiusKm;
    });
  }

  // Duplicate candidates check
  async findDuplicateCandidates(lat: number, lng: number, category: string, roadName: string): Promise<IComplaint[]> {
    const nearby = await this.findNearbyComplaints(lat, lng, 0.6); // within 600m
    return nearby.filter(c => 
      c.status !== 'Resolved' && 
      (c.category === category || c.roadName.toLowerCase().includes(roadName.toLowerCase().trim()))
    );
  }

  // Create complaint with auto reference & routing
  async createComplaint(data: Omit<IComplaint, 'id' | 'reference' | 'createdAt' | 'updatedAt' | 'statusHistory' | 'priority' | 'status'> & { priority?: ComplaintSeverity; status?: ComplaintStatus }): Promise<IComplaint> {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const reference = `RF-2026-${randomDigits}`;
    const now = new Date().toISOString();

    // Check if recurring location (more than 1 complaints on same road or within 200m)
    const nearbySameSpot = await this.findNearbyComplaints(data.coordinates[1], data.coordinates[0], 0.2);
    const isRecurring = nearbySameSpot.length > 0;

    // Automatic Routing Logic:
    let responsibleDepartment = data.responsibleDepartment;
    let initialStatus: ComplaintStatus = 'Submitted';

    if (!responsibleDepartment) {
      if (data.roadName.toLowerCase().includes('highway') || data.roadName.toLowerCase().includes('expressway') || data.roadName.toLowerCase().includes('ring road')) {
        responsibleDepartment = 'State Public Works Department (PWD) - Highways & Arterials';
      } else if (data.panchayatLocality.includes('Ward 14') || data.panchayatLocality.includes('Indiranagar')) {
        responsibleDepartment = 'Panchayat & Ward 14 Road Maintenance Authority';
      } else {
        responsibleDepartment = 'Bruhat Bengaluru Mahanagara Palike (BBMP) - East Division';
      }
    }

    const priority = data.priority || data.severity;

    const newComplaint: IComplaint = {
      ...data,
      id: `comp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      reference,
      priority,
      responsibleDepartment,
      status: initialStatus,
      isRecurringLocation: isRecurring,
      statusHistory: [
        {
          status: 'Submitted',
          changedBy: data.userId,
          changedByName: data.citizenName,
          role: 'citizen',
          notes: 'Citizen submitted damage report with photographs.',
          timestamp: now
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    this.complaints.unshift(newComplaint);

    // Notify local and district admins
    const localAdmin = this.users.find(u => u.role === 'local_admin' && u.jurisdiction?.panchayatLocality === newComplaint.panchayatLocality);
    if (localAdmin) {
      await this.createNotification({
        userId: localAdmin.id,
        title: `New Report: ${newComplaint.reference}`,
        message: `${newComplaint.category} on ${newComplaint.roadName} reported. Severity: ${newComplaint.severity}.`,
        complaintReference: newComplaint.reference,
        complaintId: newComplaint.id,
        type: 'alert'
      });
    }

    return newComplaint;
  }

  async updateComplaintStatus(
    complaintId: string, 
    newStatus: ComplaintStatus, 
    userId: string, 
    userName: string, 
    role: UserRole, 
    notes?: string,
    rejectionReason?: string
  ): Promise<IComplaint | null> {
    const complaint = this.complaints.find(c => c.id === complaintId);
    if (!complaint) return null;

    const now = new Date().toISOString();
    complaint.status = newStatus;
    complaint.updatedAt = now;
    if (rejectionReason) {
      complaint.rejectionReason = rejectionReason;
    }
    if (newStatus === 'Resolved') {
      complaint.resolvedAt = now;
    }

    complaint.statusHistory.push({
      status: newStatus,
      changedBy: userId,
      changedByName: userName,
      role,
      notes,
      timestamp: now
    });

    // Notify citizen
    await this.createNotification({
      userId: complaint.userId,
      title: `Status Updated: ${complaint.reference}`,
      message: `Your report status changed to "${newStatus}". ${notes || ''}`.trim(),
      complaintReference: complaint.reference,
      complaintId: complaint.id,
      type: 'status_change'
    });

    // Log to Audit trail
    await this.createAuditLog({
      action: 'STATUS_TRANSITION',
      performedBy: userId,
      performedByName: userName,
      userRole: role,
      complaintReference: complaint.reference,
      details: `Status transitioned to "${newStatus}". Notes: ${notes || 'None'}`
    });

    return complaint;
  }

  async updateComplaintAssignment(
    complaintId: string,
    teamOrContractor: string,
    expectedDate: string,
    userId: string,
    userName: string,
    role: UserRole,
    department?: string
  ): Promise<IComplaint | null> {
    const complaint = this.complaints.find(c => c.id === complaintId);
    if (!complaint) return null;

    const now = new Date().toISOString();
    complaint.assignedTeamOrContractor = teamOrContractor;
    complaint.expectedCompletionDate = expectedDate;
    if (department) complaint.responsibleDepartment = department;
    complaint.status = 'Assigned';
    complaint.updatedAt = now;

    complaint.statusHistory.push({
      status: 'Assigned',
      changedBy: userId,
      changedByName: userName,
      role,
      notes: `Assigned to ${teamOrContractor}. Target completion: ${expectedDate}`,
      timestamp: now
    });

    await this.createNotification({
      userId: complaint.userId,
      title: `Team Assigned: ${complaint.reference}`,
      message: `Repair assigned to ${teamOrContractor}. Estimated target completion: ${expectedDate}.`,
      complaintReference: complaint.reference,
      complaintId: complaint.id,
      type: 'assignment'
    });

    await this.createAuditLog({
      action: 'CONTRACTOR_ASSIGNED',
      performedBy: userId,
      performedByName: userName,
      userRole: role,
      complaintReference: complaint.reference,
      details: `Dispatched ${teamOrContractor}. Target date: ${expectedDate}`
    });

    return complaint;
  }

  // Resolution workflow: "Mark repair work as completed" form submission
  async submitResolution(
    complaintId: string,
    submission: Omit<IResolutionSubmission, 'submittedAt' | 'submittedBy' | 'submittedByName'>,
    userId: string,
    userName: string,
    role: UserRole
  ): Promise<IComplaint | null> {
    const complaint = this.complaints.find(c => c.id === complaintId);
    if (!complaint) return null;

    const now = new Date().toISOString();
    const resolution: IResolutionSubmission = {
      ...submission,
      submittedAt: now,
      submittedBy: userId,
      submittedByName: userName
    };

    complaint.resolutionSubmission = resolution;
    complaint.status = 'Resolution Submitted';
    complaint.updatedAt = now;

    // Add completion photos to evidence
    if (submission.afterPhotos && submission.afterPhotos.length > 0) {
      submission.afterPhotos.forEach((photoUrl, idx) => {
        complaint.evidence.push({
          id: `ev-comp-${Date.now()}-${idx}`,
          url: photoUrl,
          caption: `Post-repair completion proof: ${submission.workPerformed.slice(0, 50)}...`,
          stage: 'completion',
          uploadedAt: now,
          uploadedBy: userId
        });
      });
    }

    complaint.statusHistory.push({
      status: 'Resolution Submitted',
      changedBy: userId,
      changedByName: userName,
      role,
      notes: `Repair marked completed. Solution: ${submission.solutionDescription}. Pending authorized verification.`,
      timestamp: now
    });

    // Notify citizen
    await this.createNotification({
      userId: complaint.userId,
      title: `Resolution Submitted: ${complaint.reference}`,
      message: `Repair team submitted completion proof. District administration verification in progress.`,
      complaintReference: complaint.reference,
      complaintId: complaint.id,
      type: 'resolution'
    });

    // Notify district admin for verification
    const districtAdmin = this.users.find(u => u.role === 'district_admin');
    if (districtAdmin) {
      await this.createNotification({
        userId: districtAdmin.id,
        title: `Verification Required: ${complaint.reference}`,
        message: `${userName} submitted repair completion for ${complaint.roadName}. Please verify before approval.`,
        complaintReference: complaint.reference,
        complaintId: complaint.id,
        type: 'resolution'
      });
    }

    await this.createAuditLog({
      action: 'RESOLUTION_SUBMITTED',
      performedBy: userId,
      performedByName: userName,
      userRole: role,
      complaintReference: complaint.reference,
      details: `Resolution submitted by ${userName}. Work: ${submission.workPerformed}`
    });

    return complaint;
  }

  // Verification workflow: District admin approves to "Resolved" or returns with reason to "In Progress"
  async verifyResolution(
    complaintId: string,
    decision: 'approved' | 'rejected' | 'returned',
    comments: string,
    userId: string,
    userName: string,
    role: UserRole
  ): Promise<IComplaint | null> {
    const complaint = this.complaints.find(c => c.id === complaintId);
    if (!complaint) return null;

    const now = new Date().toISOString();
    const verification: IResolutionVerification = {
      verifiedBy: userId,
      verifiedByName: userName,
      role,
      decision,
      comments,
      verifiedAt: now
    };

    complaint.resolutionVerification = verification;
    complaint.updatedAt = now;

    if (decision === 'approved') {
      complaint.status = 'Resolved';
      complaint.resolvedAt = now;

      complaint.statusHistory.push({
        status: 'Resolved',
        changedBy: userId,
        changedByName: userName,
        role,
        notes: `Verification APPROVED: ${comments}`,
        timestamp: now
      });

      await this.createNotification({
        userId: complaint.userId,
        title: `Complaint Resolved: ${complaint.reference}`,
        message: `Your report has been officially verified and closed by ${userName}. Thank you for helping keep our roads safe!`,
        complaintReference: complaint.reference,
        complaintId: complaint.id,
        type: 'resolution'
      });
    } else {
      complaint.status = 'In Progress'; // Return to in progress for remedy
      complaint.statusHistory.push({
        status: 'In Progress',
        changedBy: userId,
        changedByName: userName,
        role,
        notes: `Verification ${decision.toUpperCase()}: ${comments}. Returned for remedial works.`,
        timestamp: now
      });

      if (complaint.resolutionSubmission?.submittedBy) {
        await this.createNotification({
          userId: complaint.resolutionSubmission.submittedBy,
          title: `Resolution Returned: ${complaint.reference}`,
          message: `District admin returned resolution: "${comments}". Additional proof or rework required.`,
          complaintReference: complaint.reference,
          complaintId: complaint.id,
          type: 'alert'
        });
      }
    }

    await this.createAuditLog({
      action: `RESOLUTION_VERIFIED_${decision.toUpperCase()}`,
      performedBy: userId,
      performedByName: userName,
      userRole: role,
      complaintReference: complaint.reference,
      details: `Resolution verification decision: ${decision}. Comments: ${comments}`
    });

    return complaint;
  }

  // Citizen appeal or reopen
  async submitAppeal(complaintId: string, reason: string, userId: string, userName: string): Promise<IComplaint | null> {
    const complaint = this.complaints.find(c => c.id === complaintId);
    if (!complaint) return null;

    const now = new Date().toISOString();
    complaint.status = 'Reopened';
    complaint.updatedAt = now;

    complaint.statusHistory.push({
      status: 'Reopened',
      changedBy: userId,
      changedByName: userName,
      role: 'citizen',
      notes: `Citizen submitted appeal/reopen: "${reason}"`,
      timestamp: now
    });

    await this.createAuditLog({
      action: 'COMPLAINT_REOPENED_BY_CITIZEN',
      performedBy: userId,
      performedByName: userName,
      userRole: 'citizen',
      complaintReference: complaint.reference,
      details: `Citizen appeal reason: ${reason}`
    });

    return complaint;
  }

  // Statistics calculation for Local, District and State
  async getAdminStats(role: UserRole, jurisdiction?: IUser['jurisdiction']) {
    let list = [...this.complaints];

    if (role === 'local_admin' && jurisdiction?.panchayatLocality) {
      list = list.filter(c => c.panchayatLocality.toLowerCase() === jurisdiction.panchayatLocality!.toLowerCase());
    } else if (role === 'district_admin' && jurisdiction?.district) {
      list = list.filter(c => c.district.toLowerCase() === jurisdiction.district!.toLowerCase());
    } else if (role === 'state_admin' && jurisdiction?.state) {
      list = list.filter(c => c.state.toLowerCase() === jurisdiction.state!.toLowerCase());
    }

    const total = list.length;
    const submitted = list.filter(c => c.status === 'Submitted').length;
    const underReview = list.filter(c => c.status === 'Under Review').length;
    const assigned = list.filter(c => c.status === 'Assigned').length;
    const inProgress = list.filter(c => c.status === 'In Progress').length;
    const resolutionSubmitted = list.filter(c => c.status === 'Resolution Submitted').length;
    const resolved = list.filter(c => c.status === 'Resolved').length;
    const escalated = list.filter(c => c.status === 'Escalated').length;
    const reopened = list.filter(c => c.status === 'Reopened').length;
    const critical = list.filter(c => c.priority === 'Critical' && c.status !== 'Resolved').length;

    // Calculate average resolution time in days
    const resolvedItems = list.filter(c => c.status === 'Resolved' && c.resolvedAt);
    let avgDays = 2.4;
    if (resolvedItems.length > 0) {
      const totalDays = resolvedItems.reduce((acc, c) => {
        const diffMs = new Date(c.resolvedAt!).getTime() - new Date(c.createdAt).getTime();
        return acc + (diffMs / (1000 * 60 * 60 * 24));
      }, 0);
      avgDays = parseFloat((totalDays / resolvedItems.length).toFixed(1));
    }

    // Category breakdown
    const categoryCounts: Record<string, number> = {};
    list.forEach(c => {
      categoryCounts[c.category] = (categoryCounts[c.category] || 0) + 1;
    });

    // District breakdown
    const districtCounts: Record<string, { total: number; resolved: number; open: number }> = {};
    list.forEach(c => {
      const d = c.district || 'Other';
      if (!districtCounts[d]) districtCounts[d] = { total: 0, resolved: 0, open: 0 };
      districtCounts[d].total += 1;
      if (c.status === 'Resolved') districtCounts[d].resolved += 1;
      else districtCounts[d].open += 1;
    });

    // Recurring hotspots
    const recurringHotspots = list.filter(c => c.isRecurringLocation).map(c => ({
      reference: c.reference,
      roadName: c.roadName,
      locality: c.panchayatLocality,
      district: c.district,
      severity: c.severity,
      status: c.status
    }));

    return {
      total,
      submitted,
      underReview,
      assigned,
      inProgress,
      resolutionSubmitted,
      resolved,
      escalated,
      reopened,
      critical,
      avgResolutionDays: avgDays,
      slaComplianceRate: 94.2,
      categoryCounts,
      districtCounts,
      recurringHotspots
    };
  }

  // Notifications
  async createNotification(notif: Omit<INotification, 'id' | 'createdAt' | 'read'>): Promise<INotification> {
    const item: INotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      read: false,
      createdAt: new Date().toISOString()
    };
    this.notifications.unshift(item);
    return item;
  }

  async getNotificationsByUser(userId: string): Promise<INotification[]> {
    return this.notifications.filter(n => n.userId === userId);
  }

  async markNotificationRead(notifId: string): Promise<boolean> {
    const n = this.notifications.find(item => item.id === notifId);
    if (!n) return false;
    n.read = true;
    return true;
  }

  async markAllNotificationsRead(userId: string): Promise<boolean> {
    this.notifications.filter(n => n.userId === userId).forEach(n => n.read = true);
    return true;
  }

  // Audit Logs
  async createAuditLog(log: Omit<IAuditLog, 'id' | 'timestamp'>): Promise<IAuditLog> {
    const item: IAuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    this.auditLogs.unshift(item);
    return item;
  }

  async getAuditLogs(limit = 100): Promise<IAuditLog[]> {
    return this.auditLogs.slice(0, limit);
  }

  // Departments
  async getDepartments(): Promise<IDepartment[]> {
    return this.departments;
  }
}

export const db = new DatabaseStore();

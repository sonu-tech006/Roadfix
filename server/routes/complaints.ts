import { Router, Response } from 'express';
import { db } from '../services/dbStore.ts';
import { authenticate, authorizeRoles, AuthRequest } from '../middleware/auth.ts';
import { ComplaintStatus, UserRole } from '../models/types.ts';

const router = Router();

// Public privacy-safe complaints for map and statistics
router.get('/public', async (req, res): Promise<void> => {
  try {
    const list = await db.getPublicComplaints();
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching public complaints' });
  }
});

// Public single tracking by reference code (RF-2026-XXXX)
router.get('/track/:reference', async (req, res): Promise<void> => {
  try {
    const { reference } = req.params;
    const complaint = await db.getComplaintByReference(reference);
    if (!complaint) {
      res.status(404).json({ error: `Complaint reference "${reference}" was not found.` });
      return;
    }

    // Redact personal citizen contact details for public privacy
    const publicSafe = {
      reference: complaint.reference,
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      severity: complaint.severity,
      priority: complaint.priority,
      roadName: complaint.roadName,
      landmark: complaint.landmark,
      state: complaint.state,
      district: complaint.district,
      panchayatLocality: complaint.panchayatLocality,
      coordinates: complaint.coordinates,
      status: complaint.status,
      evidence: complaint.evidence,
      responsibleDepartment: complaint.responsibleDepartment,
      assignedTeamOrContractor: complaint.assignedTeamOrContractor,
      expectedCompletionDate: complaint.expectedCompletionDate,
      resolutionSubmission: complaint.resolutionSubmission ? {
        workPerformed: complaint.resolutionSubmission.workPerformed,
        solutionDescription: complaint.resolutionSubmission.solutionDescription,
        completionDate: complaint.resolutionSubmission.completionDate,
        teamOrContractor: complaint.resolutionSubmission.teamOrContractor,
        beforePhotos: complaint.resolutionSubmission.beforePhotos,
        afterPhotos: complaint.resolutionSubmission.afterPhotos,
        submittedAt: complaint.resolutionSubmission.submittedAt
      } : undefined,
      resolutionVerification: complaint.resolutionVerification ? {
        decision: complaint.resolutionVerification.decision,
        comments: complaint.resolutionVerification.comments,
        verifiedAt: complaint.resolutionVerification.verifiedAt
      } : undefined,
      statusHistory: complaint.statusHistory.map(h => ({
        status: h.status,
        changedByName: h.role === 'citizen' ? 'Citizen' : 'Road Maintenance Authority',
        role: h.role,
        notes: h.notes,
        timestamp: h.timestamp
      })),
      createdAt: complaint.createdAt,
      updatedAt: complaint.updatedAt,
      resolvedAt: complaint.resolvedAt
    };

    res.json(publicSafe);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error tracking complaint' });
  }
});

// Nearby complaints geospatial query
router.get('/nearby', async (req, res): Promise<void> => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radiusKm = parseFloat(req.query.radiusKm as string) || 1.5;

    if (isNaN(lat) || isNaN(lng)) {
      res.status(400).json({ error: 'Valid lat and lng query parameters required' });
      return;
    }

    const nearby = await db.findNearbyComplaints(lat, lng, radiusKm);
    res.json(nearby);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching nearby complaints' });
  }
});

// Duplicate candidate detection
router.post('/duplicate-candidates', async (req, res): Promise<void> => {
  try {
    const { lat, lng, category, roadName } = req.body;

    if (lat === undefined || lng === undefined) {
      res.status(400).json({ error: 'Coordinates (lat, lng) are required for duplicate detection' });
      return;
    }

    const duplicates = await db.findDuplicateCandidates(
      Number(lat), 
      Number(lng), 
      category || '', 
      roadName || ''
    );

    res.json({
      potentialDuplicates: duplicates,
      hasDuplicates: duplicates.length > 0
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error running duplicate search' });
  }
});

// Authenticated complaints listing with role-based jurisdiction scoping
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { 
      search, 
      status, 
      category, 
      severity, 
      priority, 
      state, 
      district, 
      panchayatLocality, 
      page, 
      limit,
      myOnly
    } = req.query;

    const result = await db.getComplaints({
      search: search as string,
      status: status as string,
      category: category as string,
      severity: severity as string,
      priority: priority as string,
      state: state as string,
      district: district as string,
      panchayatLocality: panchayatLocality as string,
      userId: myOnly === 'true' || user.role === 'citizen' ? user.id : undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
      userRole: user.role,
      userJurisdiction: user.jurisdiction
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching complaints' });
  }
});

// Get single complaint details
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const complaint = await db.getComplaintById(req.params.id);
    if (!complaint) {
      res.status(404).json({ error: 'Complaint not found' });
      return;
    }

    // Role check: Citizen can only view own complaint or public details
    if (req.user!.role === 'citizen' && complaint.userId !== req.user!.id) {
      res.status(403).json({ error: 'Not authorized to view other citizens private records' });
      return;
    }

    res.json(complaint);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching complaint' });
  }
});

// Submit a new complaint (Citizen)
router.post('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const {
      title,
      description,
      category,
      severity,
      roadName,
      landmark,
      state,
      district,
      panchayatLocality,
      coordinates,
      isManualLocation,
      observedAt,
      additionalNotes,
      evidence
    } = req.body;

    if (!title || !description || !category || !severity || !roadName || !state || !district || !panchayatLocality) {
      res.status(400).json({ error: 'Required fields missing: title, description, category, severity, roadName, state, district, and locality.' });
      return;
    }

    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      res.status(400).json({ error: 'Valid coordinates [longitude, latitude] required' });
      return;
    }

    const complaint = await db.createComplaint({
      userId: user.id,
      citizenName: user.name,
      citizenEmail: user.email,
      citizenMobile: user.mobile,
      title,
      description,
      category,
      severity,
      roadName,
      landmark: landmark || '',
      state,
      district,
      panchayatLocality,
      coordinates: [Number(coordinates[0]), Number(coordinates[1])] as [number, number],
      isManualLocation: !!isManualLocation,
      observedAt: observedAt || new Date().toISOString(),
      additionalNotes: additionalNotes || '',
      evidence: Array.isArray(evidence) ? evidence : []
    });

    // Audit log
    await db.createAuditLog({
      action: 'COMPLAINT_SUBMITTED',
      performedBy: user.id,
      performedByName: user.name,
      userRole: user.role,
      complaintReference: complaint.reference,
      details: `Submitted "${category}" complaint at ${roadName}, ${panchayatLocality}.`
    });

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error submitting complaint' });
  }
});

// Update complaint status (Authorized admins only)
router.patch('/:id/status', authenticate, authorizeRoles('local_admin', 'district_admin', 'state_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, notes, rejectionReason } = req.body as { status: ComplaintStatus; notes?: string; rejectionReason?: string };
    const user = req.user!;

    if (!status) {
      res.status(400).json({ error: 'Status is required' });
      return;
    }

    const updated = await db.updateComplaintStatus(
      req.params.id,
      status,
      user.id,
      user.name,
      user.role,
      notes,
      rejectionReason
    );

    if (!updated) {
      res.status(404).json({ error: 'Complaint not found' });
      return;
    }

    res.json({ message: 'Complaint status updated', complaint: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error updating status' });
  }
});

// Assign repair squad or contractor
router.patch('/:id/assign', authenticate, authorizeRoles('local_admin', 'district_admin', 'state_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamOrContractor, expectedDate, department } = req.body;
    const user = req.user!;

    if (!teamOrContractor || !expectedDate) {
      res.status(400).json({ error: 'teamOrContractor and expectedDate are required' });
      return;
    }

    const updated = await db.updateComplaintAssignment(
      req.params.id,
      teamOrContractor,
      expectedDate,
      user.id,
      user.name,
      user.role,
      department
    );

    if (!updated) {
      res.status(404).json({ error: 'Complaint not found' });
      return;
    }

    res.json({ message: 'Assignment registered', complaint: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error assigning team' });
  }
});

// "Mark repair work as completed" form submission (Local admin / authorized repair staff)
router.post('/:id/resolution-submit', authenticate, authorizeRoles('local_admin', 'district_admin', 'state_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      workPerformed,
      solutionDescription,
      completionDate,
      teamOrContractor,
      notes,
      materialsUsed,
      officerConfirmation,
      beforePhotos,
      afterPhotos
    } = req.body;

    const user = req.user!;

    if (!workPerformed || !solutionDescription || !completionDate || !officerConfirmation) {
      res.status(400).json({ 
        error: 'Work performed, solution description, completion date, and officer confirmation are mandatory to submit resolution.' 
      });
      return;
    }

    const updated = await db.submitResolution(
      req.params.id,
      {
        workPerformed,
        solutionDescription,
        completionDate,
        teamOrContractor: teamOrContractor || user.name,
        notes: notes || '',
        materialsUsed: materialsUsed || '',
        officerConfirmation: !!officerConfirmation,
        beforePhotos: beforePhotos || [],
        afterPhotos: afterPhotos || []
      },
      user.id,
      user.name,
      user.role
    );

    if (!updated) {
      res.status(404).json({ error: 'Complaint not found' });
      return;
    }

    res.json({
      message: 'Resolution submitted successfully. Routed for authorized verification.',
      complaint: updated
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error submitting resolution' });
  }
});

// Resolution verification (District Admin / State Admin authorized reviewer)
router.post('/:id/resolution-verify', authenticate, authorizeRoles('district_admin', 'state_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { decision, comments } = req.body as { decision: 'approved' | 'rejected' | 'returned'; comments: string };
    const user = req.user!;

    if (!decision || !comments) {
      res.status(400).json({ error: 'Verification decision (approved/rejected/returned) and comments are required.' });
      return;
    }

    const updated = await db.verifyResolution(
      req.params.id,
      decision,
      comments,
      user.id,
      user.name,
      user.role
    );

    if (!updated) {
      res.status(404).json({ error: 'Complaint not found' });
      return;
    }

    res.json({
      message: `Resolution verification recorded: ${decision}`,
      complaint: updated
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error during resolution verification' });
  }
});

// Citizen appeal / reopen request
router.post('/:id/appeal', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;
    const user = req.user!;

    if (!reason) {
      res.status(400).json({ error: 'Appeal / reopen reason is required' });
      return;
    }

    const updated = await db.submitAppeal(req.params.id, reason, user.id, user.name);
    if (!updated) {
      res.status(404).json({ error: 'Complaint not found' });
      return;
    }

    res.json({ message: 'Appeal submitted. Complaint marked as Reopened for review.', complaint: updated });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error submitting appeal' });
  }
});

export default router;

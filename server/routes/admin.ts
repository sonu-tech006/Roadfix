import { Router, Response } from 'express';
import { db } from '../services/dbStore.ts';
import { authenticate, authorizeRoles, AuthRequest } from '../middleware/auth.ts';

const router = Router();

// Admin Statistics (Scattered by Local, District, State)
router.get('/stats', authenticate, authorizeRoles('local_admin', 'district_admin', 'state_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const stats = await db.getAdminStats(user.role, user.jurisdiction);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error generating statistics' });
  }
});

// Audit Logs (District & State Admin)
router.get('/audit-logs', authenticate, authorizeRoles('district_admin', 'state_admin'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await db.getAuditLogs(100);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching audit logs' });
  }
});

// Manage Users (State Admin only)
router.get('/users', authenticate, authorizeRoles('state_admin'), async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await db.getAllUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error fetching users' });
  }
});

// Toggle user activation (State Admin only)
router.patch('/users/:id/status', authenticate, authorizeRoles('state_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { active } = req.body;
    const user = await db.updateUserStatus(req.params.id, !!active);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ message: 'User status updated', user });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error updating user' });
  }
});

// Export complaints to CSV
router.get('/export', authenticate, authorizeRoles('local_admin', 'district_admin', 'state_admin'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const { complaints } = await db.getComplaints({
      limit: 1000,
      userRole: user.role,
      userJurisdiction: user.jurisdiction
    });

    const headers = [
      'Reference',
      'Title',
      'Category',
      'Severity',
      'Priority',
      'Road Name',
      'Landmark',
      'District',
      'Locality',
      'Status',
      'Assigned Department',
      'Assigned Contractor',
      'Reported Date',
      'Resolved Date'
    ];

    const rows = complaints.map(c => [
      c.reference,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.category}"`,
      c.severity,
      c.priority,
      `"${c.roadName.replace(/"/g, '""')}"`,
      `"${(c.landmark || '').replace(/"/g, '""')}"`,
      `"${c.district}"`,
      `"${c.panchayatLocality}"`,
      c.status,
      `"${(c.responsibleDepartment || '').replace(/"/g, '""')}"`,
      `"${(c.assignedTeamOrContractor || '').replace(/"/g, '""')}"`,
      c.createdAt.slice(0, 10),
      c.resolvedAt ? c.resolvedAt.slice(0, 10) : 'N/A'
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="roadfix-report-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error exporting report' });
  }
});

export default router;

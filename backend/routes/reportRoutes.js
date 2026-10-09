import { Router } from 'express';
import {
  generateReport,
  getReportStatus,
  getReport,
  verifyReport,
  archiveReport,
} from '../controllers/reportController.js';

const router = Router();
router.post('/generate', generateReport);
router.get('/:id/status', getReportStatus);
router.get('/:id/verify', verifyReport);
router.get('/:id', getReport);
router.patch('/:id/archive', archiveReport);
export default router;

import { Router } from 'express';
import {
    createTicket,
    getMyTickets,
    getAllTicketsForAdmin,
    getTicketById,
    updateAdminTicket,
    updateTicketStatus,
    updateUserTicketStatus,
    getFaqs,
    createFaq,
    updateFaq,
    deleteFaq,
    getDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    getLineManager,
    getHrInfo,
    getContacts,
} from '../controllers/support.controller';
import { authorize } from '../../../shared/middleware/roleMiddleware';

const router = Router();

// Employee & Manager Ticket Endpoints
router.post('/tickets', createTicket);
router.get('/my-tickets', getMyTickets);
router.patch('/my-tickets/:id/status', updateUserTicketStatus);

// Admin Ticket Command Center Endpoints
router.get('/tickets', authorize('admin'), getAllTicketsForAdmin);
router.get('/tickets/:id', authorize('admin', 'manager'), getTicketById);
router.patch('/tickets/:id', authorize('admin'), updateAdminTicket);
router.patch('/tickets/:id/status', authorize('admin'), updateTicketStatus);

// FAQ Endpoints (Read by All, CRUD by Admin)
router.get('/faqs', getFaqs);
router.post('/faqs', authorize('admin'), createFaq);
router.patch('/faqs/:id', authorize('admin'), updateFaq);
router.delete('/faqs/:id', authorize('admin'), deleteFaq);

// Document Endpoints (Read by All, CRUD by Admin)
router.get('/documents', getDocuments);
router.post('/documents', authorize('admin'), createDocument);
router.patch('/documents/:id', authorize('admin'), updateDocument);
router.delete('/documents/:id', authorize('admin'), deleteDocument);

// General Info Endpoints
router.get('/manager', getLineManager);
router.get('/hr', getHrInfo);
router.get('/contacts', getContacts);

export default router;

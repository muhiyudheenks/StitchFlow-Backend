import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { SupportService } from '../services/support.service';
import { asyncHandler } from '../../../shared/errors';

const supportService = new SupportService();

export const createTicket = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const ticket = await supportService.createTicket(req.user?.id || '', req.body);
    return res.status(201).json({ success: true, message: 'Support ticket submitted successfully', data: ticket });
});

export const getMyTickets = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const tickets = await supportService.getMyTickets(req.user?.id || '');
    return res.status(200).json({ success: true, message: 'My support tickets loaded', data: tickets });
});

interface GetAllTicketsQuery {
    status?: string;
    category?: string;
    priority?: string;
    role?: string;
    search?: string;
}

export const getAllTicketsForAdmin = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { status, category, priority, role, search } = req.query as GetAllTicketsQuery;
    const tickets = await supportService.getAllTicketsForAdmin({ status, category, priority, role, search });
    return res.status(200).json({ success: true, message: 'All support tickets retrieved', data: tickets });
});

export const getTicketById = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const ticket = await supportService.getTicketById(id);
    return res.status(200).json({ success: true, message: 'Ticket details loaded', data: ticket });
});

export const updateAdminTicket = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const ticket = await supportService.updateAdminTicket(id, req.user?.id || '', req.body);
    return res.status(200).json({ success: true, message: 'Ticket updated successfully', data: ticket });
});

export const updateTicketStatus = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { status } = req.body;
    const ticket = await supportService.updateAdminTicket(id, req.user?.id || '', { status });
    return res.status(200).json({ success: true, message: 'Ticket status updated', data: ticket });
});

// FAQ Handlers
export const getFaqs = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const faqs = await supportService.getFaqs();
    return res.status(200).json({ success: true, message: 'FAQs retrieved', data: faqs });
});

export const createFaq = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const faq = await supportService.createFaq(req.body);
    return res.status(201).json({ success: true, message: 'FAQ created', data: faq });
});

export const updateFaq = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const faq = await supportService.updateFaq(id, req.body);
    return res.status(200).json({ success: true, message: 'FAQ updated', data: faq });
});

export const deleteFaq = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    await supportService.deleteFaq(id);
    return res.status(200).json({ success: true, message: 'FAQ deleted' });
});

// Document Handlers
export const getDocuments = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const documents = await supportService.getCompanyDocuments();
    return res.status(200).json({ success: true, message: 'Company documents retrieved', data: documents });
});

export const createDocument = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const doc = await supportService.createDocument(req.body);
    return res.status(201).json({ success: true, message: 'Document created', data: doc });
});

export const updateDocument = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const doc = await supportService.updateDocument(id, req.body);
    return res.status(200).json({ success: true, message: 'Document updated', data: doc });
});

export const deleteDocument = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    await supportService.deleteDocument(id);
    return res.status(200).json({ success: true, message: 'Document deleted' });
});

// Emergency Contacts & Manager Info
export const getLineManager = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = await supportService.getLineManager(req.user?.id || '');
    return res.status(200).json({ success: true, message: 'Manager info loaded', data });
});

export const getHrInfo = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const data = await supportService.getHrInfo();
    return res.status(200).json({ success: true, message: 'HR info loaded', data });
});

export const getContacts = asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
    const contacts = await supportService.getEmergencyContacts();
    return res.status(200).json({ success: true, message: 'Emergency contacts loaded', data: contacts });
});

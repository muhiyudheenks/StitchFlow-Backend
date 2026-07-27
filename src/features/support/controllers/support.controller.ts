import { Response } from 'express';
import { AuthRequest } from '../../../shared/types/roleTypes';
import { SupportService } from '../services/support.service';

const supportService = new SupportService();

export const createTicket = async (req: AuthRequest, res: Response) => {
    try {
        const ticket = await supportService.createTicket(req.user?.id || '', req.body);
        return res.status(201).json({ success: true, message: 'Support ticket submitted successfully', data: ticket });
    } catch (err: any) {
        return res.status(400).json({ success: false, message: err.message || 'Failed to create support ticket' });
    }
};

export const getMyTickets = async (req: AuthRequest, res: Response) => {
    try {
        const tickets = await supportService.getMyTickets(req.user?.id || '');
        return res.status(200).json({ success: true, message: 'My support tickets loaded', data: tickets });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const getAllTicketsForAdmin = async (req: AuthRequest, res: Response) => {
    try {
        const { status, category, priority, role, search } = req.query as any;
        const tickets = await supportService.getAllTicketsForAdmin({ status, category, priority, role, search });
        return res.status(200).json({ success: true, message: 'All support tickets retrieved', data: tickets });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const getTicketById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const ticket = await supportService.getTicketById(id);
        return res.status(200).json({ success: true, message: 'Ticket details loaded', data: ticket });
    } catch (err: any) {
        return res.status(404).json({ success: false, message: err.message || 'Ticket not found' });
    }
};

export const updateAdminTicket = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const ticket = await supportService.updateAdminTicket(id, req.user?.id || '', req.body);
        return res.status(200).json({ success: true, message: 'Ticket updated successfully', data: ticket });
    } catch (err: any) {
        return res.status(400).json({ success: false, message: err.message || 'Failed to update ticket' });
    }
};

export const updateTicketStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const ticket = await supportService.updateAdminTicket(id, req.user?.id || '', { status });
        return res.status(200).json({ success: true, message: 'Ticket status updated', data: ticket });
    } catch (err: any) {
        return res.status(400).json({ success: false, message: err.message || 'Failed to update status' });
    }
};

// FAQ Handlers
export const getFaqs = async (req: AuthRequest, res: Response) => {
    try {
        const faqs = await supportService.getFaqs();
        return res.status(200).json({ success: true, message: 'FAQs retrieved', data: faqs });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const createFaq = async (req: AuthRequest, res: Response) => {
    try {
        const faq = await supportService.createFaq(req.body);
        return res.status(201).json({ success: true, message: 'FAQ created', data: faq });
    } catch (err: any) {
        return res.status(400).json({ success: false, message: err.message || 'Failed to create FAQ' });
    }
};

export const updateFaq = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const faq = await supportService.updateFaq(id, req.body);
        return res.status(200).json({ success: true, message: 'FAQ updated', data: faq });
    } catch (err: any) {
        return res.status(400).json({ success: false, message: err.message || 'Failed to update FAQ' });
    }
};

export const deleteFaq = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await supportService.deleteFaq(id);
        return res.status(200).json({ success: true, message: 'FAQ deleted' });
    } catch (err: any) {
        return res.status(400).json({ success: false, message: err.message || 'Failed to delete FAQ' });
    }
};

// Document Handlers
export const getDocuments = async (req: AuthRequest, res: Response) => {
    try {
        const documents = await supportService.getCompanyDocuments();
        return res.status(200).json({ success: true, message: 'Company documents retrieved', data: documents });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const createDocument = async (req: AuthRequest, res: Response) => {
    try {
        const doc = await supportService.createDocument(req.body);
        return res.status(201).json({ success: true, message: 'Document created', data: doc });
    } catch (err: any) {
        return res.status(400).json({ success: false, message: err.message || 'Failed to create document' });
    }
};

export const updateDocument = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const doc = await supportService.updateDocument(id, req.body);
        return res.status(200).json({ success: true, message: 'Document updated', data: doc });
    } catch (err: any) {
        return res.status(400).json({ success: false, message: err.message || 'Failed to update document' });
    }
};

export const deleteDocument = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await supportService.deleteDocument(id);
        return res.status(200).json({ success: true, message: 'Document deleted' });
    } catch (err: any) {
        return res.status(400).json({ success: false, message: err.message || 'Failed to delete document' });
    }
};

// Emergency Contacts & Manager Info
export const getLineManager = async (req: AuthRequest, res: Response) => {
    try {
        const data = await supportService.getLineManager(req.user?.id || '');
        return res.status(200).json({ success: true, message: 'Manager info loaded', data });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const getHrInfo = async (req: AuthRequest, res: Response) => {
    try {
        const data = await supportService.getHrInfo();
        return res.status(200).json({ success: true, message: 'HR info loaded', data });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

export const getContacts = async (req: AuthRequest, res: Response) => {
    try {
        const contacts = await supportService.getEmergencyContacts();
        return res.status(200).json({ success: true, message: 'Emergency contacts loaded', data: contacts });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message || 'Server error' });
    }
};

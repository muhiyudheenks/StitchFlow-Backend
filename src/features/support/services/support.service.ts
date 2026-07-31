import { FilterQuery } from 'mongoose';
import User from '../../auth/models/userModel';
import SupportTicket, { ISupportTicket, IPopulatedSupportTicket } from '../models/supportTicketModel';
import FAQ, { IFAQ } from '../models/faqModel';
import SupportContact from '../models/supportContactModel';
import CompanyDocument, { ICompanyDocument } from '../models/companyDocumentModel';
import Notification from '../../notifications/models/notificationModel';

export class SupportService {
    // 1. Create Ticket (Employee or Manager)
    async createTicket(userId: string, data: {
        category: string;
        subject: string;
        description: string;
        priority: 'Low' | 'Medium' | 'High';
        attachment?: string;
    }) {
        const { category, subject, description, priority, attachment } = data;

        if (!category || !subject || !description || !priority) {
            throw new Error('Category, Subject, Description, and Priority are required');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const role: 'employee' | 'manager' = user.role === 'manager' ? 'manager' : 'employee';

        const ticket = new SupportTicket({
            createdBy: userId,
            role,
            employeeId: role === 'employee' ? userId : undefined,
            managerId: role === 'manager' ? userId : undefined,
            category: category.trim(),
            subject: subject.trim(),
            description: description.trim(),
            priority,
            attachment: attachment ? attachment.trim() : undefined,
            status: 'OPEN',
        });

        await ticket.save();

        // Dispatch Notification to Admins
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
            await Notification.create({
                recipient: admin._id,
                sender: userId,
                title: `New ${role === 'manager' ? 'Manager' : 'Employee'} Support Ticket`,
                message: `${user.fullName} logged ticket #${ticket._id.toString().slice(-6)}: "${ticket.subject}"`,
                type: 'TICKET',
                referenceId: ticket._id.toString(),
            });
        }

        return ticket;
    }

    // 2. Get User's Own Tickets (Employee / Manager)
    async getMyTickets(userId: string) {
        const tickets = await SupportTicket.find({ createdBy: userId })
            .sort({ createdAt: -1 })
            .populate<{ assignedAdmin?: { _id: any; fullName?: string; email?: string } }>('assignedAdmin', 'fullName email');

        return (tickets as unknown as IPopulatedSupportTicket[]).map((t: IPopulatedSupportTicket) => ({
            id: t._id.toString(),
            ticketId: `TCK-${t._id.toString().slice(-6).toUpperCase()}`,
            category: t.category,
            subject: t.subject,
            description: t.description,
            priority: t.priority,
            status: t.status,
            attachment: t.attachment,
            resolution: t.resolution,
            assignedAdmin: t.assignedAdmin?.fullName || 'Unassigned',
            createdAt: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString(),
            updatedAt: t.updatedAt ? new Date(t.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString(),
        }));
    }

    // 3. Admin: Get All Tickets with Filters & Search
    async getAllTicketsForAdmin(filters: {
        status?: string;
        category?: string;
        priority?: string;
        role?: string;
        search?: string;
    }) {
        const query: FilterQuery<ISupportTicket> = {};

        if (filters.status && filters.status !== 'ALL') {
            query.status = filters.status.toUpperCase() as any;
        }
        if (filters.category && filters.category !== 'ALL') {
            query.category = filters.category;
        }
        if (filters.priority && filters.priority !== 'ALL') {
            query.priority = filters.priority as any;
        }
        if (filters.role && filters.role !== 'ALL') {
            query.role = filters.role.toLowerCase() as any;
        }
        if (filters.search) {
            const regex = new RegExp(filters.search, 'i');
            query.$or = [{ subject: regex }, { description: regex }, { category: regex }];
        }

        const tickets = await SupportTicket.find(query)
            .sort({ createdAt: -1 })
            .populate('createdBy', 'fullName email role department designation')
            .populate('assignedAdmin', 'fullName email');

        return (tickets as unknown as IPopulatedSupportTicket[]).map((t: IPopulatedSupportTicket) => ({
            id: t._id.toString(),
            ticketId: `TCK-${t._id.toString().slice(-6).toUpperCase()}`,
            createdBy: t.createdBy?.fullName || 'User',
            createdEmail: t.createdBy?.email || '',
            role: t.role,
            category: t.category,
            subject: t.subject,
            description: t.description,
            priority: t.priority,
            status: t.status,
            attachment: t.attachment,
            assignedAdmin: t.assignedAdmin?.fullName || null,
            assignedAdminId: t.assignedAdmin?._id?.toString() || null,
            resolution: t.resolution || '',
            internalNotes: t.internalNotes || '',
            createdAt: t.createdAt ? new Date(t.createdAt).toLocaleString('en-IN') : new Date().toLocaleString(),
            updatedAt: t.updatedAt ? new Date(t.updatedAt).toLocaleString('en-IN') : new Date().toLocaleString(),
        }));
    }

    // 4. Admin: Get Single Ticket Details
    async getTicketById(ticketId: string) {
        const ticket = await SupportTicket.findById(ticketId)
            .populate('createdBy', 'fullName email role department designation')
            .populate('assignedAdmin', 'fullName email');

        if (!ticket) {
            throw new Error('Support ticket not found');
        }

        return ticket;
    }

    // 5. Admin: Update Ticket (Status, Assignment, Resolution, Internal Notes)
    async updateAdminTicket(ticketId: string, adminId: string, updates: {
        status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
        assignedAdmin?: string;
        resolution?: string;
        internalNotes?: string;
    }) {
        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) {
            throw new Error('Ticket not found');
        }

        if (updates.status) {
            ticket.status = updates.status;
            if (['RESOLVED', 'CLOSED'].includes(updates.status)) {
                ticket.resolvedAt = new Date();
            }
        }
        if (updates.assignedAdmin !== undefined) {
            ticket.assignedAdmin = updates.assignedAdmin || undefined;
        }
        if (updates.resolution !== undefined) {
            ticket.resolution = updates.resolution;
        }
        if (updates.internalNotes !== undefined) {
            ticket.internalNotes = updates.internalNotes;
        }

        await ticket.save();

        // Notify Ticket Creator
        await Notification.create({
            recipient: ticket.createdBy,
            sender: adminId,
            title: `Support Ticket #${ticket._id.toString().slice(-6)} Updated`,
            message: `Admin updated your ticket status to ${ticket.status}.${ticket.resolution ? ` Resolution: ${ticket.resolution}` : ''}`,
            type: 'TICKET',
            referenceId: ticket._id.toString(),
        });

        return ticket;
    }

    // 6. FAQs CRUD
    async getFaqs() {
        let faqs = await FAQ.find({ active: true }).sort({ displayOrder: 1, createdAt: 1 });
        if (faqs.length === 0) {
            const defaults = [
                { question: 'How do I request an emergency shift swap?', answer: 'Contact your Line Manager at least 24 hours prior to shift startup.', displayOrder: 1 },
                { question: 'Where can I download my official monthly payslip?', answer: 'Go to the Salary tab in your sidebar dashboard and click "Download Statement".', displayOrder: 2 },
                { question: 'How is my operator quality score calculated?', answer: 'Quality audit scores are measured by defect-free garment pieces verified during inline QC checks.', displayOrder: 3 },
                { question: 'What should I do if my sewing machine malfunctions?', answer: 'Log a support ticket under "Machine Issue" or "Machine Breakdown" immediately.', displayOrder: 4 },
            ];
            await FAQ.insertMany(defaults);
            faqs = await FAQ.find({ active: true }).sort({ displayOrder: 1 });
        }
        return faqs.map((f: IFAQ) => ({
            id: f._id.toString(),
            question: f.question,
            answer: f.answer,
        }));
    }

    async createFaq(data: { question: string; answer: string; displayOrder?: number }) {
        const faq = new FAQ({ question: data.question, answer: data.answer, displayOrder: data.displayOrder || 0 });
        await faq.save();
        return faq;
    }

    async updateFaq(id: string, data: Partial<{ question: string; answer: string; active: boolean; displayOrder: number }>) {
        return FAQ.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteFaq(id: string) {
        return FAQ.findByIdAndDelete(id);
    }

    // 7. Company Documents CRUD
    async getCompanyDocuments() {
        let docs = await CompanyDocument.find({ active: true }).sort({ createdAt: -1 });
        if (docs.length === 0) {
            const defaults = [
                { title: 'Employee Handbook & Code of Conduct 2026', fileUrl: '/documents/Employee_Handbook_2026.pdf', category: 'HR Policy' },
                { title: 'Garment Factory Floor Safety Rules', fileUrl: '/documents/Factory_Safety_Rules.pdf', category: 'Safety' },
                { title: 'StitchFlow Sewing Machine Operation Manual', fileUrl: '/documents/Machine_Operation_Manual.pdf', category: 'Operations' },
                { title: 'Annual Factory Holiday Calendar 2026', fileUrl: '/documents/Holiday_Calendar_2026.pdf', category: 'General' },
            ];
            await CompanyDocument.insertMany(defaults);
            docs = await CompanyDocument.find({ active: true });
        }
        return docs.map((d: ICompanyDocument) => ({
            id: d._id.toString(),
            title: d.title,
            fileUrl: d.fileUrl,
            category: d.category,
        }));
    }

    async createDocument(data: { title: string; fileUrl: string; category?: string }) {
        const doc = new CompanyDocument(data);
        await doc.save();
        return doc;
    }

    async updateDocument(id: string, data: Partial<{ title: string; fileUrl: string; category: string; active: boolean }>) {
        return CompanyDocument.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteDocument(id: string) {
        return CompanyDocument.findByIdAndDelete(id);
    }

    // Helpers
    async getLineManager(userId: string) {
        const employee = await User.findById(userId);
        let manager = null;
        if (employee && employee.managerId) {
            manager = await User.findById(employee.managerId);
        }
        if (!manager) {
            manager = await User.findOne({ role: 'manager', isBlock: { $ne: true } });
        }
        if (!manager) {
            return {
                id: 'mgr_default',
                fullName: 'Robert Vance',
                employeeId: 'EMP-MGR-001',
                department: 'Garment Assembly Line A',
                phone: '+91 98765 11223',
                email: 'robert.vance@stitchflow.ai',
                status: 'Online',
                designation: 'Senior Production Manager',
            };
        }
        return {
            id: manager._id.toString(),
            fullName: manager.fullName || 'Line Manager',
            employeeId: `EMP-${manager._id.toString().slice(-6).toUpperCase()}`,
            department: manager.department || 'Production & Assembly',
            phone: manager.phone || '+91 98765 11223',
            email: manager.email,
            status: 'Online',
            designation: manager.designation || 'Production Manager',
        };
    }

    async getHrInfo() {
        let contact = await SupportContact.findOne();
        if (!contact) {
            contact = new SupportContact();
            await contact.save();
        }
        return {
            hrName: contact.hrName,
            phone: contact.hrPhone,
            email: contact.hrEmail,
            officeExtension: contact.hrExtension,
            workingHours: contact.workingHours,
        };
    }

    async getEmergencyContacts() {
        let contact = await SupportContact.findOne();
        if (!contact) {
            contact = new SupportContact();
            await contact.save();
        }
        return {
            security: contact.securityPhone,
            maintenance: contact.maintenancePhone,
            firstAid: contact.firstAidPhone,
            hr: contact.hrPhone,
        };
    }
}

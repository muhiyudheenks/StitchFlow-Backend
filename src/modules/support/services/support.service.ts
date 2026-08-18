import mongoose, { FilterQuery } from 'mongoose';
import User from '../../auth/models/userModel';
import SupportTicket, { ISupportTicket, IPopulatedSupportTicket } from '../models/supportTicketModel';
import FAQ, { IFAQ } from '../models/faqModel';
import SupportContact from '../models/supportContactModel';
import CompanyDocument, { ICompanyDocument } from '../models/companyDocumentModel';
import Notification from '../../notifications/models/notificationModel';
import { AppError } from '../../../shared/errors/AppError';

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
            throw AppError.badRequest('Category, Subject, Description, and Priority are required');
        }

        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            throw AppError.badRequest('Invalid user ID');
        }

        const user = await User.findById(userId);
        if (!user) {
            throw AppError.notFound('User not found');
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

        // Dispatch Notification to Admins (soft failure)
        try {
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
        } catch (notifErr) {
            console.error('[SupportService] Failed to send new ticket notification:', notifErr);
        }

        return ticket;
    }

    // 2. Get User's Own Tickets (Employee / Manager)
    async getMyTickets(userId: string) {
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            throw AppError.badRequest('Invalid user ID');
        }

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
        if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
            throw AppError.notFound('Invalid ticket ID format');
        }

        const ticket = await SupportTicket.findById(ticketId)
            .populate('createdBy', 'fullName email role department designation')
            .populate('assignedAdmin', 'fullName email');

        if (!ticket) {
            throw AppError.notFound('Support ticket not found');
        }

        return ticket;
    }

    // 5. Admin: Update Ticket (Status, Assignment, Resolution, Internal Notes)
    // async updateAdminTicket(ticketId: string, adminId: string, updates: {
    //     status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    //     assignedAdmin?: string;
    //     resolution?: string;
    //     internalNotes?: string;
    // }) {
    //     if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
    //         throw AppError.notFound('Invalid ticket ID format');
    //     }

    //     const ticket = await SupportTicket.findById(ticketId);
    //     if (!ticket) {
    //         throw AppError.notFound('Support ticket not found');
    //     }

    //     if (updates.status === 'CLOSED') {
    //         throw AppError.forbidden('Only the ticket creator can confirm resolution and mark the ticket as CLOSED.');
    //     }

    //     if (updates.resolution !== undefined) {
    //         ticket.resolution = updates.resolution.trim();
    //     }
    //     if (updates.internalNotes !== undefined) {
    //         ticket.internalNotes = updates.internalNotes.trim();
    //     }
    //     if (updates.assignedAdmin !== undefined) {
    //         if (updates.assignedAdmin && mongoose.Types.ObjectId.isValid(updates.assignedAdmin)) {
    //             ticket.assignedAdmin = updates.assignedAdmin;
    //         } else {
    //             ticket.assignedAdmin = undefined;
    //         }
    //     }

    //     const prevStatus = ticket.status;

    //     if (updates.status) {
    //         if (updates.status === 'RESOLVED') {
    //             const effectiveResolution = updates.resolution !== undefined ? updates.resolution.trim() : (ticket.resolution || '');
    //             if (!effectiveResolution) {
    //                 throw AppError.badRequest('Resolution response is required when resolving a support ticket.');
    //             }
    //             ticket.resolution = effectiveResolution;
    //             ticket.resolvedAt = new Date();
    //         } else if (updates.status === 'IN_PROGRESS') {
    //             // Resolution response not required for IN_PROGRESS
    //         }
    //         ticket.status = updates.status;
    //     }

    //     await ticket.save();

    //     // Notify Ticket Creator if status changed or resolution added (soft failure)
    //     if (updates.status && updates.status !== prevStatus) {
    //         try {
    //             let notifTitle = `Support Ticket #${ticket._id.toString().slice(-6).toUpperCase()} Updated`;
    //             let notifMsg = `Admin updated your ticket status to ${ticket.status}.`;

    //             if (ticket.status === 'IN_PROGRESS') {
    //                 notifTitle = `Support Ticket #${ticket._id.toString().slice(-6).toUpperCase()} In Progress`;
    //                 notifMsg = `Admin has started investigating your support ticket.`;
    //             } else if (ticket.status === 'RESOLVED') {
    //                 notifTitle = `Support Ticket #${ticket._id.toString().slice(-6).toUpperCase()} RESOLVED`;
    //                 notifMsg = `Admin marked your support ticket as RESOLVED. Resolution: "${ticket.resolution}". Please review and confirm if solved.`;
    //             }

    //             const recipientId = (ticket.createdBy as any)?._id || ticket.createdBy;
    //             const senderId = (adminId && mongoose.Types.ObjectId.isValid(adminId)) ? adminId : undefined;

    //             if (recipientId) {
    //                 await Notification.create({
    //                     recipient: recipientId,
    //                     sender: senderId,
    //                     title: notifTitle,
    //                     message: notifMsg,
    //                     type: 'TICKET',
    //                     referenceId: ticket._id.toString(),
    //                 });
    //             }
    //         } catch (notifErr) {
    //             console.error('[SupportService] Failed to send ticket update notification:', notifErr);
    //         }
    //     }

    //     return ticket;
    // }

    // 5. Admin: Update Ticket (Status, Assignment, Resolution, Internal Notes)
    async updateAdminTicket(ticketId: string, adminId: string, updates: {
        status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
        assignedAdmin?: string;
        resolution?: string;
        internalNotes?: string;
    }) {
        if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
            throw AppError.notFound('Invalid ticket ID format');
        }

        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) {
            throw AppError.notFound('Support ticket not found');
        }

        if (updates.status === 'CLOSED') {
            throw AppError.forbidden('Only the ticket creator can confirm resolution and mark the ticket as CLOSED.');
        }

        const prevStatus = ticket.status;

        const setFields: any = {};
        if (updates.resolution !== undefined) {
            setFields.resolution = updates.resolution.trim();
        }
        if (updates.internalNotes !== undefined) {
            setFields.internalNotes = updates.internalNotes.trim();
        }
        if (updates.assignedAdmin !== undefined) {
            setFields.assignedAdmin =
                updates.assignedAdmin && mongoose.Types.ObjectId.isValid(updates.assignedAdmin)
                    ? updates.assignedAdmin
                    : null;
        }
        if (updates.status) {
            if (updates.status === 'RESOLVED') {
                const effectiveResolution =
                    updates.resolution !== undefined ? updates.resolution.trim() : (ticket.resolution || '');
                if (!effectiveResolution) {
                    throw AppError.badRequest('Resolution response is required when resolving a support ticket.');
                }
                setFields.resolution = effectiveResolution;
                setFields.resolvedAt = new Date();
            }
            setFields.status = updates.status;
        }

        const updatedTicket = await SupportTicket.findByIdAndUpdate(
            ticketId,
            { $set: setFields },
            { new: true, runValidators: false }
        );

        if (!updatedTicket) {
            throw AppError.notFound('Support ticket not found after update');
        }

        if (updates.status && updates.status !== prevStatus) {
            try {
                let notifTitle = `Support Ticket #${updatedTicket._id.toString().slice(-6).toUpperCase()} Updated`;
                let notifMsg = `Admin updated your ticket status to ${updatedTicket.status}.`;

                if (updatedTicket.status === 'IN_PROGRESS') {
                    notifTitle = `Support Ticket #${updatedTicket._id.toString().slice(-6).toUpperCase()} In Progress`;
                    notifMsg = `Admin has started investigating your support ticket.`;
                } else if (updatedTicket.status === 'RESOLVED') {
                    notifTitle = `Support Ticket #${updatedTicket._id.toString().slice(-6).toUpperCase()} RESOLVED`;
                    notifMsg = `Admin marked your support ticket as RESOLVED. Resolution: "${updatedTicket.resolution}". Please review and confirm if solved.`;
                }

                const recipientId = (updatedTicket.createdBy as any)?._id || updatedTicket.createdBy;
                const senderId = (adminId && mongoose.Types.ObjectId.isValid(adminId)) ? adminId : undefined;

                if (recipientId) {
                    await Notification.create({
                        recipient: recipientId,
                        sender: senderId,
                        title: notifTitle,
                        message: notifMsg,
                        type: 'TICKET',
                        referenceId: updatedTicket._id.toString(),
                    });
                }
            } catch (notifErr) {
                console.error('[SupportService] Failed to send ticket update notification:', notifErr);
            }
        }

        return updatedTicket;
    }
    // 6. Employee/Manager: Confirm Resolved or Reopen Ticket
    async updateUserTicketStatus(ticketId: string, userId: string, action: 'confirm' | 'reopen') {
        if (!ticketId || !mongoose.Types.ObjectId.isValid(ticketId)) {
            throw AppError.notFound('Invalid ticket ID format');
        }

        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) {
            throw AppError.notFound('Support ticket not found');
        }

        const creatorId = (ticket.createdBy as any)?._id?.toString() || ticket.createdBy?.toString();
        if (creatorId !== userId.toString()) {
            throw AppError.forbidden('Only the ticket creator can confirm or reopen this support ticket.');
        }

        if (ticket.status !== 'RESOLVED') {
            throw AppError.badRequest('Support ticket must be in RESOLVED status to confirm or reopen.');
        }

        const user = await User.findById(userId);
        const userName = user?.fullName || 'User';
        const ticketCode = ticket._id.toString().slice(-6).toUpperCase();

        if (action === 'confirm') {
            ticket.status = 'CLOSED';
            await ticket.save();

            try {
                const admins = await User.find({ role: 'admin' });
                for (const admin of admins) {
                    await Notification.create({
                        recipient: admin._id,
                        sender: userId,
                        title: `Support Ticket #${ticketCode} CLOSED`,
                        message: `${userName} confirmed the issue is solved and closed ticket #${ticketCode}.`,
                        type: 'TICKET',
                        referenceId: ticket._id.toString(),
                    });
                }
            } catch (notifErr) {
                console.error('[SupportService] Failed to send ticket closed notification:', notifErr);
            }
        } else if (action === 'reopen') {
            ticket.status = 'IN_PROGRESS';
            await ticket.save();

            try {
                const admins = await User.find({ role: 'admin' });
                for (const admin of admins) {
                    await Notification.create({
                        recipient: admin._id,
                        sender: userId,
                        title: `Support Ticket #${ticketCode} REOPENED`,
                        message: `${userName} indicated issue is not resolved. Ticket #${ticketCode} reopened for investigation.`,
                        type: 'TICKET',
                        referenceId: ticket._id.toString(),
                    });
                }
            } catch (notifErr) {
                console.error('[SupportService] Failed to send ticket reopened notification:', notifErr);
            }
        } else {
            throw AppError.badRequest('Invalid action. Action must be "confirm" or "reopen".');
        }

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

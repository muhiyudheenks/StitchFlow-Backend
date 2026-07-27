import LeaveRequest from '../models/leaveRequestModel';

export class LeaveService {
    async getMyLeaves(userId: string) {
        const requests = await LeaveRequest.find({ employeeId: userId }).sort({ createdAt: -1 });

        // Calculate dynamic leave balances from database
        const currentYear = new Date().getFullYear();
        const approvedInYear = requests.filter((r) => {
            if (r.status !== 'approved') return false;
            const year = new Date(r.startDate).getFullYear();
            return year === currentYear;
        });

        let casualUsed = 0;
        let sickUsed = 0;
        let annualUsed = 0;

        approvedInYear.forEach((r) => {
            const start = new Date(r.startDate).getTime();
            const end = new Date(r.endDate).getTime();
            const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);

            const type = (r.leaveType || '').toLowerCase();
            if (type.includes('casual')) {
                casualUsed += days;
            } else if (type.includes('sick')) {
                sickUsed += days;
            } else if (type.includes('annual')) {
                annualUsed += days;
            }
        });

        // Allocations per year
        const balances = {
            casual: Math.max(0, 12 - casualUsed),
            sick: Math.max(0, 10 - sickUsed),
            annual: Math.max(0, 15 - annualUsed),
        };

        const formattedRequests = requests.map((r) => {
            const typeStr = (r.leaveType || 'casual').toLowerCase();
            const label = typeStr.includes('sick')
                ? 'Sick Leave'
                : typeStr.includes('annual')
                ? 'Annual Leave'
                : 'Casual Leave';

            return {
                id: r._id.toString(),
                leaveType: label,
                startDate: new Date(r.startDate).toISOString().split('T')[0],
                endDate: new Date(r.endDate).toISOString().split('T')[0],
                reason: r.reason || '',
                status: r.status,
            };
        });

        return {
            balances,
            requests: formattedRequests,
        };
    }

    async getLeaveRequests() {
        const requests = await LeaveRequest.find()
            .populate('employeeId', 'fullName email department')
            .sort({ createdAt: -1 });

        return requests.map((r) => ({
            id: r._id.toString(),
            employeeName: (r.employeeId as any)?.fullName || 'Employee',
            employeeEmail: (r.employeeId as any)?.email || '',
            department: (r.employeeId as any)?.department || 'Production',
            leaveType: r.leaveType,
            startDate: new Date(r.startDate).toISOString().split('T')[0],
            endDate: new Date(r.endDate).toISOString().split('T')[0],
            reason: r.reason || '',
            status: r.status,
        }));
    }

    async applyLeave(userId: string, data: any) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            throw new Error('Invalid start or end date');
        }

        if (end < start) {
            throw new Error('End date cannot be earlier than start date');
        }

        const leave = await LeaveRequest.create({
            employeeId: userId,
            leaveType: data.leaveType || 'casual',
            startDate: start,
            endDate: end,
            reason: data.reason || '',
            status: 'pending',
        });

        return leave;
    }

    async updateLeaveStatus(requestId: string, status: 'approved' | 'rejected', reviewerId: string) {
        const updated = await LeaveRequest.findByIdAndUpdate(
            requestId,
            { status, reviewedBy: reviewerId },
            { new: true }
        );

        if (!updated) {
            throw new Error('Leave request not found');
        }

        return updated;
    }
}

import LeaveRequest from '../models/leaveRequestModel';

export class LeaveService {
    async getLeaveRequests() {
        const requests = await LeaveRequest.find().populate('employeeId', 'fullName email department').sort({ createdAt: -1 });
        if (requests.length === 0) {
            return [
                { id: 'lr1', employeeName: 'Michael Scott', employeeEmail: 'michael@stitchflow.ai', department: 'Assembly Line A', leaveType: 'Casual Leave', startDate: '2026-07-28', endDate: '2026-07-29', reason: 'Family event', status: 'pending' },
                { id: 'lr2', employeeName: 'Sarah Vance', employeeEmail: 'sarah@stitchflow.ai', department: 'Cutting Line', leaveType: 'Sick Leave', startDate: '2026-07-25', endDate: '2026-07-25', reason: 'Medical appointment', status: 'approved' },
            ];
        }
        return requests.map((r) => ({
            id: r._id.toString(),
            employeeName: (r.employeeId as any)?.fullName || 'Employee',
            employeeEmail: (r.employeeId as any)?.email || '',
            department: (r.employeeId as any)?.department || 'Production',
            leaveType: r.leaveType,
            startDate: r.startDate.toISOString().split('T')[0],
            endDate: r.endDate.toISOString().split('T')[0],
            reason: r.reason || '',
            status: r.status,
        }));
    }

    async applyLeave(userId: string, data: any) {
        return await LeaveRequest.create({
            employeeId: userId,
            leaveType: data.leaveType || 'casual',
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            reason: data.reason,
            status: 'pending',
        });
    }

    async updateLeaveStatus(requestId: string, status: 'approved' | 'rejected', reviewerId: string) {
        return await LeaveRequest.findByIdAndUpdate(
            requestId,
            { status, reviewedBy: reviewerId },
            { new: true }
        );
    }
}

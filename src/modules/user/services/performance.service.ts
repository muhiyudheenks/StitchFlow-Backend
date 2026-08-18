import User from '../../auth/models/userModel';
import Task, { ITask } from '../../tasks/models/taskModel';
import AttendanceRecord, { IAttendanceRecord } from '../../attendance/models/attendanceModel';
import LeaveRequest from '../../leave/models/leaveRequestModel';

export interface MonthlyPerformanceRecord {
    month: string;
    productivity: number;
    attendance: number;
    quality: number | null;
    overall: number;
}

export interface RecentPerformanceActivity {
    id: string;
    taskName: string;
    status: string;
    completedQuantity: number;
    targetQuantity: number;
    date: string;
}

export interface EmployeePerformanceData {
    productivityRate: number;
    attendanceScore: number;
    qualityScore: number | null;
    overallEfficiency: number;

    assignedTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;

    totalWorkingDays: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;

    monthlyPerformance: MonthlyPerformanceRecord[];
    recentPerformance: RecentPerformanceActivity[];
    hasData: boolean;
    generatedAt: string;
}

export class PerformanceService {
    async getEmployeePerformance(userId: string): Promise<EmployeePerformanceData> {
        const emptyResponse: EmployeePerformanceData = {
            productivityRate: 0,
            attendanceScore: 0,
            qualityScore: null,
            overallEfficiency: 0,

            assignedTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            overdueTasks: 0,

            totalWorkingDays: 0,
            presentDays: 0,
            absentDays: 0,
            leaveDays: 0,

            monthlyPerformance: [],
            recentPerformance: [],
            hasData: false,
            generatedAt: new Date().toISOString(),
        };

        if (!userId) {
            return emptyResponse;
        }

        const employee = await User.findById(userId);
        if (!employee) {
            return emptyResponse;
        }

        // 1. Task Metrics
        const now = new Date();
        const [assignedTasks, completedTasks, pendingTasks, overdueTasks, employeeTasks] = await Promise.all([
            Task.countDocuments({ assignedEmployee: userId }),
            Task.countDocuments({ assignedEmployee: userId, status: 'Completed' }),
            Task.countDocuments({ assignedEmployee: userId, status: { $in: ['Pending', 'In Progress', 'Under Review'] } }),
            Task.countDocuments({ assignedEmployee: userId, status: { $ne: 'Completed' }, dueDate: { $lt: now } }),
            Task.find({ assignedEmployee: userId }).sort({ updatedAt: -1 }).limit(10),
        ]);

        const productivityRate = assignedTasks > 0 ? Math.round((completedTasks / assignedTasks) * 100) : 0;

        // 2. Attendance & Leave Metrics
        const [attendanceRecords, leaveRequests] = await Promise.all([
            AttendanceRecord.find({ employeeId: userId }),
            LeaveRequest.find({ employeeId: userId, status: 'approved' }),
        ]);

        const presentDays = attendanceRecords.filter((r: IAttendanceRecord) =>
            ['present', 'late', 'Present', 'Late'].includes(r.status)
        ).length;

        const absentDays = attendanceRecords.filter((r: IAttendanceRecord) =>
            ['absent', 'Absent'].includes(r.status)
        ).length;

        const leaveDays = leaveRequests.length;
        const totalWorkingDays = presentDays + absentDays + leaveDays;

        const attendanceScore = totalWorkingDays > 0 ? Math.round(((presentDays + leaveDays) / totalWorkingDays) * 100) : (presentDays > 0 ? 100 : 0);

        // 3. Quality Score (Tasks verified by manager after inspection)
        const verifiedQCTasks = await Task.countDocuments({
            assignedEmployee: userId,
            status: 'Completed',
            verifiedByManager: { $exists: true, $ne: null },
        });

        const qualityScore: number | null = completedTasks > 0 ? Math.round((verifiedQCTasks / completedTasks) * 100) : null;

        // 4. Overall Efficiency (Weighted Average)
        const hasData = assignedTasks > 0 || totalWorkingDays > 0;
        let overallEfficiency = 0;

        if (hasData) {
            if (qualityScore !== null) {
                overallEfficiency = Math.min(100, Math.round(productivityRate * 0.5 + attendanceScore * 0.3 + qualityScore * 0.2));
            } else {
                overallEfficiency = Math.min(100, Math.round(productivityRate * 0.6 + attendanceScore * 0.4));
            }
        }

        // 5. Monthly Performance Trend (Last 12 Months Dynamically Calculated)
        const monthlyPerformance: MonthlyPerformanceRecord[] = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
            const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
            const monthLabel = d.toLocaleString('en-US', { month: 'short' });

            const mAssigned = await Task.countDocuments({
                assignedEmployee: userId,
                createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            });

            const mCompleted = await Task.countDocuments({
                assignedEmployee: userId,
                status: 'Completed',
                createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            });

            const mVerified = await Task.countDocuments({
                assignedEmployee: userId,
                status: 'Completed',
                verifiedByManager: { $exists: true, $ne: null },
                createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            });

            const mAttPresent = attendanceRecords.filter((r: IAttendanceRecord) => {
                const rDate = new Date(r.date || (r as any).createdAt);
                return rDate >= startOfMonth && rDate <= endOfMonth && ['present', 'late', 'Present', 'Late'].includes(r.status);
            }).length;

            const mAttTotal = attendanceRecords.filter((r: IAttendanceRecord) => {
                const rDate = new Date(r.date || (r as any).createdAt);
                return rDate >= startOfMonth && rDate <= endOfMonth;
            }).length;

            const mProd = mAssigned > 0 ? Math.round((mCompleted / mAssigned) * 100) : 0;
            const mAtt = mAttTotal > 0 ? Math.round((mAttPresent / mAttTotal) * 100) : (mAttPresent > 0 ? 100 : 0);
            const mQual = mCompleted > 0 ? Math.round((mVerified / mCompleted) * 100) : null;

            let mOverall = 0;
            if (mAssigned > 0 || mAttTotal > 0) {
                if (mQual !== null) {
                    mOverall = Math.round(mProd * 0.5 + mAtt * 0.3 + mQual * 0.2);
                } else {
                    mOverall = Math.round(mProd * 0.6 + mAtt * 0.4);
                }
            }

            monthlyPerformance.push({
                month: monthLabel,
                productivity: mProd,
                attendance: mAtt,
                quality: mQual,
                overall: mOverall,
            });
        }

        // 6. Recent Performance Activity List
        const recentPerformance: RecentPerformanceActivity[] = employeeTasks.map((t: ITask) => ({
            id: (t as any)._id.toString(),
            taskName: t.taskName || 'Production Task',
            status: t.status,
            completedQuantity: t.completedQuantity || 0,
            targetQuantity: t.targetQuantity || 100,
            date: (t as any).updatedAt ? new Date((t as any).updatedAt).toLocaleDateString() : new Date().toLocaleDateString(),
        }));

        return {
            productivityRate,
            attendanceScore,
            qualityScore,
            overallEfficiency,

            assignedTasks,
            completedTasks,
            pendingTasks,
            overdueTasks,

            totalWorkingDays,
            presentDays,
            absentDays,
            leaveDays,

            monthlyPerformance,
            recentPerformance,

            hasData,
            generatedAt: new Date().toISOString(),
        };
    }

    async getTeamPerformance(): Promise<{
        averageProductivity: number;
        averageAttendance: number;
        teamEfficiency: number;
        totalEmployees: number;
    }> {
        const employees = await User.find({ role: 'employee' });
        if (employees.length === 0) {
            return {
                averageProductivity: 0,
                averageAttendance: 0,
                teamEfficiency: 0,
                totalEmployees: 0,
            };
        }

        const perfPromises = employees.map((emp) => this.getEmployeePerformance(emp._id.toString()));
        const results = await Promise.all(perfPromises);

        const totalProd = results.reduce((sum, p) => sum + p.productivityRate, 0);
        const totalAtt = results.reduce((sum, p) => sum + p.attendanceScore, 0);
        const totalEff = results.reduce((sum, p) => sum + p.overallEfficiency, 0);

        return {
            averageProductivity: Math.round(totalProd / results.length),
            averageAttendance: Math.round(totalAtt / results.length),
            teamEfficiency: Math.round(totalEff / results.length),
            totalEmployees: results.length,
        };
    }
}

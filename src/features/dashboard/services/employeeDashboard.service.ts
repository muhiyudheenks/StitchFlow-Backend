import User from '../../auth/models/userModel';
import ProductionBatch from '../../production/models/productionBatchModel';
import Task from '../../tasks/models/taskModel';
import { ProfileService } from '../../profile/services/profile.service';
import { LeaveService } from '../../leave/services/leave.service';
import { SalaryService } from '../../salary/services/salary.service';
import AttendanceService from '../../attendance/services/attendance.service';

const profileService = new ProfileService();
const leaveService = new LeaveService();
const salaryService = new SalaryService();
const attendanceService = new AttendanceService();

export class EmployeeDashboardService {
    async getDashboardData(userId?: string) {
        let user = null;
        if (userId) {
            user = await User.findById(userId);
        }

        const employeeName = user?.fullName || 'Employee';
        const employeeEmail = user?.email || '';
        const department = user?.department || 'Production';
        const designation = user?.designation || 'Production Operator';
        const phone = user?.phone || '';

        // Fetch My Active Batch
        let myBatchData: any = null;
        let myManagerData: any = null;
        if (userId) {
            const batch = await ProductionBatch.findOne({ members: userId })
                .populate('manager', 'fullName email phone designation department');
            if (batch) {
                myManagerData = batch.manager;
                myBatchData = {
                    id: batch._id.toString(),
                    batchName: batch.batchName,
                    batchCode: batch.batchCode || 'BATCH-' + batch._id.toString().slice(-4),
                    productName: batch.productName || 'Garment Item',
                    quantity: batch.quantity || 100,
                    status: batch.status,
                    managerName: (batch.manager as any)?.fullName || 'Unassigned',
                };
            }
        }

        // Fetch My Assigned Tasks
        let realTasks: any[] = [];
        if (userId) {
            const tasksFromDb = await Task.find({ assignedEmployee: userId })
                .populate('batchId', 'batchName batchCode status')
                .populate('verifiedByManager', 'fullName email')
                .sort({ createdAt: -1 });

            realTasks = tasksFromDb.map((t: any) => ({
                id: t._id.toString(),
                taskName: t.taskName || 'Stitching Operation',
                title: t.taskName || 'Stitching Operation',
                batchName: t.batchName || (t.batchId as any)?.batchName || 'General Batch',
                batchCode: (t.batchId as any)?.batchCode || 'BATCH-000',
                operationName: t.operationName || t.taskName || 'General Operation',
                targetQuantity: t.targetQuantity || 100,
                completedQuantity: t.completedQuantity || 0,
                quantity: t.targetQuantity || 100,
                status: t.status,
                assignedToName: employeeName,
                verifiedByManagerName: (t.verifiedByManager as any)?.fullName || null,
                createdAt: t.createdAt,
            }));
        }

        // Fetch My Recent Attendance (via AttendanceService)
        let todayStatus = 'not_checked_in';
        let checkInTime = '--:--';
        let checkOutTime = '--:--';
        let monthPresentDays = 0;
        let monthHoursWorked = 0;

        if (userId) {
            const att = await attendanceService.getEmployeeDashboardSummary(userId);
            todayStatus = att.todayStatus || 'not_checked_in';
            checkInTime = att.checkInTime || '--:--';
            checkOutTime = att.checkOutTime || '--:--';
            monthPresentDays = att.monthPresentDays || 0;
            monthHoursWorked = att.monthHoursWorked || 0;
        }

        let profileData = null;
        let leaveSummary = null;
        if (userId) {
            try {
                profileData = await profileService.getProfile(userId);
            } catch (e) {
                profileData = null;
            }
            try {
                leaveSummary = await leaveService.getMyLeaves(userId);
            } catch (e) {
                leaveSummary = null;
            }
        }

        const totalTasksCount = realTasks.length;
        const completedTasksCount = realTasks.filter((t) => (t.status || '').toLowerCase() === 'completed' || (t.status || '').toLowerCase() === 'verified').length;
        const pendingTasksCount = realTasks.filter((t) => (t.status || '').toLowerCase() === 'pending' || (t.status || '').toLowerCase() === 'in_progress').length;
        const totalPiecesCompleted = realTasks.reduce((sum, t) => sum + (t.completedQuantity || 0), 0);
        const totalPiecesTarget = realTasks.reduce((sum, t) => sum + (t.targetQuantity || 0), 0) || 100;
        const efficiencyRate = totalPiecesTarget > 0 ? Math.min(100, Math.round((totalPiecesCompleted / totalPiecesTarget) * 100)) : 0;

        return {
            profile: profileData || {
                fullName: employeeName,
                email: employeeEmail,
                department,
                designation,
                phone,
            },
            myBatch: myBatchData,
            myManager: myManagerData,
            myTasks: realTasks,
            taskMetrics: {
                totalTasks: totalTasksCount,
                completedTasks: completedTasksCount,
                pendingTasks: pendingTasksCount,
                totalPiecesCompleted,
                totalPiecesTarget,
                efficiencyRate,
            },
            attendance: {
                todayStatus,
                checkInTime,
                checkOutTime,
                monthPresentDays,
                monthHoursWorked,
            },
            leaveSummary: leaveSummary || {
                totalQuota: 24,
                usedDays: 0,
                pendingRequests: 0,
                remainingBalance: 24,
            },
            production: {
                assignedBatchNumber: myBatchData?.batchCode || myBatchData?.batchName || 'N/A',
                productName: myBatchData?.productName || 'Garment Item',
                assignedLine: myBatchData?.batchName || 'Production Batch',
                todayTarget: totalPiecesTarget,
                completedQty: totalPiecesCompleted,
                remainingQty: Math.max(0, totalPiecesTarget - totalPiecesCompleted),
                efficiency: efficiencyRate,
            },
        };
    }

    async getMyTasks(userId?: string) {
        if (!userId) return [];
        return await Task.find({ assignedEmployee: userId })
            .populate('batchId', 'batchName batchCode status')
            .populate('verifiedByManager', 'fullName email')
            .sort({ createdAt: -1 });
    }

    async getMyAttendance(userId?: string) {
        if (!userId) return [];
        return await attendanceService.getAttendanceHistory(userId);
    }

    async getSalarySummary(userId?: string) {
        if (!userId) return null;
        return await salaryService.getSalaryOverview(userId);
    }

    async getLeaveStatus(userId?: string) {
        if (!userId) return null;
        return await leaveService.getMyLeaves(userId);
    }
}

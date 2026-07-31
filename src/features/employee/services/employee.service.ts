import User from '../../auth/models/userModel';
import AttendanceRecord from '../../attendance/models/attendanceModel';
import ProductionBatch from '../../production/models/productionBatchModel';
import Task from '../../manager/models/taskModel';
import { ProfileService } from '../../profile/services/profile.service';
import { LeaveService } from '../../leave/services/leave.service';

const profileService = new ProfileService();
const leaveService = new LeaveService();

export class EmployeeService {
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

        // Fetch My Assigned Tasks ONLY (Never see tasks assigned to other employees)
        let realTasks: any[] = [];
        if (userId) {
            const tasksFromDb = await Task.find({ assignedEmployee: userId })
                .populate('batchId', 'batchName batchCode status')
                .populate('verifiedByManager', 'fullName email')
                .sort({ createdAt: -1 });

            realTasks = tasksFromDb.map((t: any) => ({
                id: t._id.toString(),
                _id: t._id.toString(),
                title: t.taskName,
                taskName: t.taskName,
                description: t.description || '',
                batchName: t.batchId?.batchName || myBatchData?.batchName || 'Production Batch',
                priority: t.priority || 'Medium',
                status: t.status || 'Pending',
                targetQuantity: t.targetQuantity || 100,
                completedQuantity: t.completedQuantity || 0,
                progress: t.targetQuantity > 0 ? Math.round((t.completedQuantity / t.targetQuantity) * 100) : 0,
                dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : 'N/A',
                verifiedBy: t.verifiedByManager?.fullName || null,
            }));
        }

        const pendingCount = realTasks.filter((t) => (t.status || '').toLowerCase() === 'pending' || (t.status || '').toLowerCase() === 'in_progress').length;
        const completedCount = realTasks.filter((t) => (t.status || '').toLowerCase() === 'completed' || (t.status || '').toLowerCase() === 'verified').length;

        return {
            hero: {
                employeeName,
                greeting: 'Good shift,',
                department,
                designation,
                shift: 'Shift A (08:00 AM - 05:00 PM)',
                currentDate: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
                todayAttendanceStatus: 'Present',
            },
            kpis: {
                todayAttendanceStatus: 'Present (On Time)',
                pendingTasksCount: pendingCount,
                completedTasksCount: completedCount,
                monthlyAttendanceRate: 96.5,
                performanceScore: 94,
                todayProduction: 380,
                targetProduction: 420,
            },
            profile: {
                id: user?._id.toString() || 'EMP-8042',
                fullName: employeeName,
                email: employeeEmail,
                role: 'Employee',
                department,
                designation,
                shift: 'Shift A (Morning)',
                joiningDate: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
                reportingManager: myManagerData?.fullName || 'Production Manager',
                phone,
            },
            myBatch: myBatchData,
            myManager: myManagerData,
            myTasks: realTasks,
            attendance: {
                todayCheckIn: '08:42 AM',
                todayCheckOut: '—',
                workingHours: '8.0 hrs',
                attendancePercentage: 96.5,
                history: [],
            },
            leave: {
                balances: { casual: 6, sick: 4, annual: 12 },
                requests: [],
            },
            production: {
                assignedBatchNumber: myBatchData?.batchCode || 'N/A',
                productName: myBatchData?.productName || 'Garment Item',
                assignedLine: myBatchData?.batchName || 'Production Batch',
                todayTarget: 420,
                completedQty: 380,
                remainingQty: 40,
                efficiency: 94,
            },
            performance: {
                productivityScore: 94,
                attendanceScore: 97,
                qualityScore: 98,
                overallEfficiency: 95,
            },
        };
    }

    async updateProfile(userId: string, data: any) {
        return await profileService.updateProfile(userId, data);
    }

    async toggleAttendance(userId: string, action: 'check_in' | 'check_out') {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (action === 'check_in') {
            const record = await AttendanceRecord.create({
                employeeId: userId,
                date: dateStr,
                checkIn: timeStr,
                status: 'present',
            });
            return { action: 'check_in', time: timeStr, record };
        } else {
            const record = await AttendanceRecord.findOneAndUpdate(
                { employeeId: userId, date: dateStr },
                { checkOut: timeStr },
                { new: true }
            );
            return { action: 'check_out', time: timeStr, record };
        }
    }

    async applyLeave(userId: string, data: any) {
        return await leaveService.applyLeave(userId, data);
    }
}

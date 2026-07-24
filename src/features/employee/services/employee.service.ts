import User from '../../auth/models/userModel';
import AttendanceRecord from '../../attendance/models/attendanceModel';
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

        const employeeName = user?.fullName || 'Alexander Vance';
        const employeeEmail = user?.email || 'alexander@stitchflow.ai';
        const department = user?.department || 'Assembly Line A';
        const designation = user?.designation || 'Senior Line Operator';
        const phone = user?.phone || '+1 (555) 234-5678';

        return {
            hero: {
                employeeName,
                greeting: 'Good shift,',
                department,
                designation,
                shift: 'Shift A (08:00 AM - 05:00 PM)',
                currentDate: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
                todayAttendanceStatus: 'Checked In (08:42 AM)',
            },
            kpis: {
                todayAttendanceStatus: 'Present (On Time)',
                pendingTasksCount: 3,
                completedTasksCount: 14,
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
                joiningDate: '15 Jan 2024',
                reportingManager: 'Robert Vance (Line Manager)',
                phone,
                address: '742 Evergreen Terrace, Springfield, IL',
                emergencyContact: 'Sarah Vance (+1 555-998-1122)',
            },
            myTasks: [
                { id: 'et1', title: 'Stitch Denim Jacket Collar & Cuffs', description: 'Ensure double-stitching seam strength on Batch #BT-9042.', priority: 'urgent', status: 'in_progress', deadline: 'Today, 04:00 PM', progress: 70 },
                { id: 'et2', title: 'Inspect Machine #12 Tension Springs', description: 'Perform pre-shift calibration check before line startup.', priority: 'medium', status: 'pending', deadline: 'Tomorrow, 10:00 AM', progress: 0 },
                { id: 'et3', title: 'Attach Brass Zippers - Batch #BT-9044', description: 'Align zipper teeth and run pull test on 10 sample pieces.', priority: 'high', status: 'completed', deadline: 'Yesterday', progress: 100 },
            ],
            attendance: {
                todayCheckIn: '08:42 AM',
                todayCheckOut: '—',
                workingHours: '6.5 hrs',
                attendancePercentage: 96.5,
                history: [
                    { id: 'a1', date: '2026-07-23', checkIn: '08:42 AM', checkOut: '—', hours: '6.5h', status: 'present' },
                    { id: 'a2', date: '2026-07-22', checkIn: '08:50 AM', checkOut: '05:10 PM', hours: '8.2h', status: 'present' },
                    { id: 'a3', date: '2026-07-21', checkIn: '09:05 AM', checkOut: '05:05 PM', hours: '8.0h', status: 'late' },
                    { id: 'a4', date: '2026-07-20', checkIn: '08:45 AM', checkOut: '05:15 PM', hours: '8.5h', status: 'present' },
                ],
            },
            leave: {
                balances: { casual: 6, sick: 4, annual: 12 },
                requests: [
                    { id: 'l1', leaveType: 'Casual Leave', startDate: '2026-07-28', endDate: '2026-07-29', reason: 'Personal errands', status: 'pending' },
                    { id: 'l2', leaveType: 'Sick Leave', startDate: '2026-06-12', endDate: '2026-06-12', reason: 'Fever & Rest', status: 'approved' },
                ],
            },
            production: {
                assignedBatchNumber: 'BT-9042',
                productName: 'Men Outerwear Vintage Denim Jacket',
                assignedLine: 'Assembly Line A',
                todayTarget: 420,
                completedQty: 380,
                remainingQty: 40,
                efficiency: 92,
            },
            performance: {
                productivityScore: 94,
                attendanceScore: 97,
                qualityScore: 98,
                overallEfficiency: 95,
                monthlyTrend: [
                    { month: 'Jan', score: 88 },
                    { month: 'Feb', score: 90 },
                    { month: 'Mar', score: 92 },
                    { month: 'Apr', score: 91 },
                    { month: 'May', score: 95 },
                    { month: 'Jun', score: 94 },
                ],
            },
            salary: {
                baseSalary: '$3,800.00',
                overtime: '$450.00',
                incentives: '$250.00',
                netPay: '$4,500.00',
                lastPayDate: '15 July 2026',
                payslips: [
                    { month: 'June 2026', amount: '$4,500.00', status: 'Paid', downloadUrl: '#' },
                    { month: 'May 2026', amount: '$4,350.00', status: 'Paid', downloadUrl: '#' },
                    { month: 'April 2026', amount: '$4,400.00', status: 'Paid', downloadUrl: '#' },
                ],
            },
            notifications: [
                { id: 'n1', title: 'New Task Assigned', message: 'Robert Vance assigned task: Stitch Denim Jacket Collar & Cuffs', time: '1 hour ago', unread: true },
                { id: 'n2', title: 'Shift Attendance Approved', message: 'Your check-in at 08:42 AM was verified by supervisor.', time: '3 hours ago', unread: false },
                { id: 'n3', title: 'Company Announcement', message: 'Factory Safety Workshop scheduled for Friday 3:00 PM.', time: '1 day ago', unread: false },
            ],
            recentActivities: [
                { id: 'act1', title: 'Check In Logged', time: '08:42 AM Today', type: 'attendance' },
                { id: 'act2', title: 'Updated Progress on Task #et1 (70%)', time: '11:30 AM Today', type: 'task' },
                { id: 'act3', title: 'Completed Batch Segment #BT-9042', time: '02:15 PM Today', type: 'production' },
            ],
            supportFaqs: [
                { question: 'How do I request a shift swap?', answer: 'Contact your Line Manager at least 24 hours prior to shift startup.' },
                { question: 'Where can I view my monthly payslip breakdown?', answer: 'Go to the Salary tab and click Download Payslip for any previous month.' },
                { question: 'How is my quality score calculated?', answer: 'Quality score is measured by defect-free garments inspected during QC audit.' },
            ],
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

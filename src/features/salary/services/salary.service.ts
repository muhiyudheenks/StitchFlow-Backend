import User from '../../auth/models/userModel';
import Task from '../../tasks/models/taskModel';
import AttendanceRecord from '../../attendance/models/managerAttendance.model';
import Payroll, { IPayroll } from '../models/payrollModel';

export interface SalaryOverviewData {
    baseSalary: number;
    overtime: number;
    overtimeHours: number;
    incentives: number;
    deductions: number;
    netSalary: number;
    currency: string;
    lastPayDate: string;
    payrollHistory: {
        id: string;
        month: string;
        year: number;
        netSalary: number;
        status: string;
        paidDate: string;
        payslipUrl: string;
    }[];
    hasData: boolean;
}

export class SalaryService {
    async getSalaryOverview(userId?: string): Promise<SalaryOverviewData> {
        const emptyResponse: SalaryOverviewData = {
            baseSalary: 0,
            overtime: 0,
            overtimeHours: 0,
            incentives: 0,
            deductions: 0,
            netSalary: 0,
            currency: 'INR',
            lastPayDate: 'N/A',
            payrollHistory: [],
            hasData: false,
        };

        if (!userId) {
            return emptyResponse;
        }

        const user = await User.findById(userId);
        if (!user) {
            return emptyResponse;
        }

        // 1. Base Salary calculation from User profile (default INR 35,000 / month)
        const baseSalary = Number((user as any).monthlySalary || (user as any).baseSalary || 35000);

        // 2. Overtime calculation from AttendanceRecords
        const attendanceRecords = await AttendanceRecord.find({ employeeId: userId });
        const overtimeHours = attendanceRecords.reduce((sum: number, r: any) => sum + Number(r.overtimeHours || r.overtime || 0), 0);
        // Overtime rate: ~₹250 / hour
        const hourlyOtRate = Math.round((baseSalary / 160) * 1.5) || 250;
        const overtime = Math.round(overtimeHours * hourlyOtRate);

        // 3. Production Incentives from Completed Tasks
        const completedTasks = await Task.find({ assignedEmployee: userId, status: 'Completed' });
        const completedPieces = completedTasks.reduce((sum: number, t: any) => sum + Number(t.completedQuantity || 0), 0);
        // Incentive: ₹5 per completed garment piece
        const incentives = Math.round(completedPieces * 5);

        // 4. Deductions calculation from unapproved absences
        const absentDays = attendanceRecords.filter((r: any) => ['absent', 'Absent'].includes(r.status)).length;
        const dailyRate = Math.round(baseSalary / 30);
        const deductions = Math.round(absentDays * dailyRate);

        // 5. Net Salary calculation
        const netSalary = Math.max(0, Math.round(baseSalary + overtime + incentives - deductions));

        // 6. Fetch Payroll History from MongoDB
        let payrollRecords = await Payroll.find({ employeeId: userId }).sort({ year: -1, createdAt: -1 });

        // If no payroll records exist in DB yet, auto-provision current month payslip record dynamically
        if (payrollRecords.length === 0 && (attendanceRecords.length > 0 || completedTasks.length > 0)) {
            const now = new Date();
            const currentMonthStr = now.toLocaleString('en-US', { month: 'long' });
            const currentYear = now.getFullYear();

            const newPayroll = new Payroll({
                employeeId: userId,
                month: `${currentMonthStr} ${currentYear}`,
                year: currentYear,
                baseSalary,
                overtime,
                overtimeHours,
                incentives,
                deductions,
                netSalary,
                status: 'Paid',
                paidDate: now,
            });
            await newPayroll.save();
            payrollRecords = [newPayroll];
        }

        const payrollHistory = payrollRecords.map((p: IPayroll) => ({
            id: (p as any)._id.toString(),
            month: p.month || 'Current Month',
            year: p.year || new Date().getFullYear(),
            netSalary: p.netSalary || netSalary,
            status: p.status || 'Paid',
            paidDate: p.paidDate ? new Date(p.paidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '15th Monthly',
            payslipUrl: `/api/salary/payslip/${(p as any)._id.toString()}`,
        }));

        const lastPaidRecord = payrollRecords[0];
        const lastPayDate = lastPaidRecord?.paidDate
            ? new Date(lastPaidRecord.paidDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
            : '15th Monthly';

        return {
            baseSalary,
            overtime,
            overtimeHours,
            incentives,
            deductions,
            netSalary,
            currency: 'INR',
            lastPayDate,
            payrollHistory,
            hasData: true,
        };
    }

    async generatePayslipPdf(payrollId: string): Promise<{ filename: string; content: string }> {
        const payroll = await Payroll.findById(payrollId).populate('employeeId', 'fullName email department designation');
        if (!payroll) {
            throw new Error('Payslip record not found');
        }

        const empName = (payroll.employeeId as any)?.fullName || 'Employee';
        const dept = (payroll.employeeId as any)?.department || 'Production';

        const content = `
================================================================
                    STITCHFLOW GARMENT ERP
                    OFFICIAL PAYSLIP STATEMENT
================================================================
Employee Name : ${empName}
Department    : ${dept}
Pay Period    : ${payroll.month}
Disbursed On  : ${payroll.paidDate ? new Date(payroll.paidDate).toLocaleDateString() : 'N/A'}
Status        : ${payroll.status}
----------------------------------------------------------------
COMPENSATION BREAKDOWN (INR ₹)
----------------------------------------------------------------
Base Monthly Salary    : ₹${payroll.baseSalary.toLocaleString('en-IN')}
Overtime Allowance     : ₹${payroll.overtime.toLocaleString('en-IN')} (${payroll.overtimeHours} OT Hrs)
Production Incentives  : ₹${payroll.incentives.toLocaleString('en-IN')}
Deductions             : -₹${payroll.deductions.toLocaleString('en-IN')}
----------------------------------------------------------------
TOTAL NET TAKEHOME     : ₹${payroll.netSalary.toLocaleString('en-IN')}
================================================================
This is a system-generated payslip issued by StitchFlow ERP.
`;

        return {
            filename: `Payslip_${empName.replace(/\s+/g, '_')}_${payroll.month.replace(/\s+/g, '_')}.txt`,
            content,
        };
    }
}

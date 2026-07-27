import ProductionBatch from '../../production/models/productionBatchModel';
import Task from '../../manager/models/taskModel';
import AttendanceRecord from '../../manager/models/attendanceModel';
import User from '../../auth/models/userModel';

export class ReportsService {
    async getReports(role?: string) {
        const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        const [batchCount, taskCount, attendanceCount] = await Promise.all([
            ProductionBatch.countDocuments(),
            Task.countDocuments(),
            AttendanceRecord.countDocuments(),
        ]);

        const reports = [
            {
                id: 'rep1',
                title: 'Daily Shift Production Summary',
                category: 'Production',
                generatedAt: `Today (${batchCount} active batches)`,
                format: 'CSV',
            },
            {
                id: 'rep2',
                title: 'Weekly Attendance & Overtime Audit',
                category: 'Attendance',
                generatedAt: `Live (${attendanceCount} attendance logs)`,
                format: 'CSV',
            },
            {
                id: 'rep3',
                title: 'Garment Defect & QC Inspection Rate',
                category: 'Quality',
                generatedAt: `Calculated (${taskCount} task records)`,
                format: 'CSV',
            },
            {
                id: 'rep4',
                title: 'Operator Line Efficiency Matrix',
                category: 'Performance',
                generatedAt: `Real-Time System Log`,
                format: 'CSV',
            },
        ];

        return { reports };
    }

    async downloadReport(reportId: string): Promise<{ filename: string; csvContent: string }> {
        const timestamp = new Date().toISOString().split('T')[0];

        if (reportId === 'rep1') {
            // Production Summary
            const batches = await ProductionBatch.find().sort({ createdAt: -1 });
            const tasks = await Task.find();

            let csv = 'Batch ID,Batch Name,Manager ID,Notes,Status,Total Tasks,Completed Tasks\n';
            batches.forEach((b: any) => {
                const bTasks = tasks.filter((t) => (t as any).batchName === b.batchName);
                const done = bTasks.filter((t) => (t.status || '').toLowerCase() === 'completed').length;
                const mgr = b.manager || b.managerId || '';
                csv += `"${b._id}","${b.batchName}","${mgr}","${(b.notes || '').replace(/"/g, '""')}","${b.status}",${bTasks.length},${done}\n`;
            });

            return {
                filename: `Production_Summary_${timestamp}.csv`,
                csvContent: csv,
            };
        }

        if (reportId === 'rep2') {
            // Attendance Audit
            const records = await AttendanceRecord.find()
                .populate('employeeId', 'fullName email department')
                .sort({ date: -1 });

            let csv = 'Record ID,Employee Name,Email,Department,Date,Check In,Check Out,Total Hours,Status\n';
            records.forEach((r: any) => {
                const empName = r.employeeId?.fullName || 'Employee';
                const empEmail = r.employeeId?.email || '';
                const dept = r.employeeId?.department || 'Production';
                csv += `"${r._id}","${empName}","${empEmail}","${dept}","${r.date}","${r.checkIn || '—'}","${r.checkOut || '—'}",${r.totalHours || 0},"${r.status}"\n`;
            });

            return {
                filename: `Attendance_Audit_${timestamp}.csv`,
                csvContent: csv,
            };
        }

        if (reportId === 'rep3') {
            // Quality Inspection
            const tasks = await Task.find({ status: 'Completed' });
            let csv = 'Task ID,Task Name,Assigned Employee,Target Quantity,Completed Quantity,Due Date,Status\n';
            tasks.forEach((t: any) => {
                const taskTitle = t.taskName || (t as any).operationName || (t as any).title || 'QC Audit';
                csv += `"${t._id}","${taskTitle}","${(t.assignedEmployee as any)?.fullName || t.assignedEmployee || ''}",${t.targetQuantity || 0},${t.completedQuantity || 0},"${t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : ''}","${t.status}"\n`;
            });

            return {
                filename: `Quality_Inspection_${timestamp}.csv`,
                csvContent: csv,
            };
        }

        // Default / rep4 Performance Matrix
        const employees = await User.find({ role: 'employee' });
        const allTasks = await Task.find();

        let csv = 'Employee ID,Full Name,Email,Department,Total Assigned Tasks,Completed Tasks,Completion Rate %\n';
        employees.forEach((emp) => {
            const empTasks = allTasks.filter((t) => (t as any).assignedEmployee?.toString() === emp._id.toString() || (t as any).assignedTo?.toString() === emp._id.toString());
            const done = empTasks.filter((t) => (t.status || '').toLowerCase() === 'completed').length;
            const rate = empTasks.length ? Math.round((done / empTasks.length) * 100) : 100;
            csv += `"${emp._id}","${emp.fullName}","${emp.email}","${emp.department || 'Production'}",${empTasks.length},${done},${rate}%\n`;
        });

        return {
            filename: `Operator_Efficiency_Matrix_${timestamp}.csv`,
            csvContent: csv,
        };
    }
}

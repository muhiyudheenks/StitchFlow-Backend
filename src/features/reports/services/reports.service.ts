export class ReportsService {
    async getReports(role?: string) {
        const reports = [
            { id: 'rep1', title: 'Daily Shift Production Summary', category: 'Production', generatedAt: 'Today, 06:00 PM', format: 'PDF' },
            { id: 'rep2', title: 'Weekly Attendance & Overtime Audit', category: 'Attendance', generatedAt: '22 July 2026', format: 'XLSX' },
            { id: 'rep3', title: 'Garment Defect & QC Inspection Rate', category: 'Quality', generatedAt: '20 July 2026', format: 'PDF' },
            { id: 'rep4', title: 'Operator Line Efficiency Matrix', category: 'Performance', generatedAt: '18 July 2026', format: 'CSV' },
        ];
        return { reports };
    }
}

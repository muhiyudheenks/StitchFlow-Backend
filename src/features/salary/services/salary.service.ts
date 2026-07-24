export class SalaryService {
    async getSalaryOverview(userId?: string) {
        return {
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
        };
    }
}

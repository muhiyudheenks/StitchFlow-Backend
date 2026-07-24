import User from '../../auth/models/userModel';

export class ProfileService {
    async getProfile(userId: string) {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return {
                id: userId,
                fullName: 'Alexander Vance',
                email: 'alexander@stitchflow.ai',
                role: 'Employee',
                department: 'Assembly Line A',
                phone: '+1 (555) 234-5678',
                address: '742 Evergreen Terrace, Springfield, IL',
                emergencyContact: 'Sarah Vance (+1 555-998-1122)',
            };
        }
        return user;
    }

    async updateProfile(userId: string, data: any) {
        const updated = await User.findByIdAndUpdate(
            userId,
            {
                phone: data.phone,
                department: data.department,
            },
            { new: true }
        ).select('-password');
        return updated;
    }
}

import User, { IUser } from '../../auth/models/userModel';
import { CreateManagerDto, UpdateManagerDto } from '../dto/admin.dto';

export class ManagerRepository {
    async create(dto: CreateManagerDto): Promise<IUser> {
        const password = dto.password || 'Manager@123';
        const manager = new User({
            fullName: dto.fullName,
            email: dto.email,
            password: password,
            role: 'manager',
            companyName: dto.companyName,
            department: dto.department || 'Management',
            designation: dto.designation || 'Manager',
            phone: dto.phone,
            status: 'active',
            isVerified: true,
            isBlock: false,
        });
        return await manager.save();
    }

    async findById(id: string): Promise<IUser | null> {
        return await User.findOne({ _id: id, role: 'manager' });
    }

    async findByEmail(email: string): Promise<IUser | null> {
        return await User.findOne({ email: email.toLowerCase() });
    }

    async findAll(filter: any, skip: number, limit: number): Promise<{ managers: IUser[]; total: number }> {
        const query = { role: 'manager', ...filter };
        const [managers, total] = await Promise.all([
            User.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(query),
        ]);
        return { managers, total };
    }

    async update(id: string, dto: UpdateManagerDto): Promise<IUser | null> {
        return await User.findOneAndUpdate(
            { _id: id, role: 'manager' },
            { $set: dto },
            { new: true, runValidators: true }
        );
    }

    async delete(id: string): Promise<IUser | null> {
        // Unassign employees from this manager when deleted
        await User.updateMany({ managerId: id }, { $set: { managerId: null } });
        return await User.findOneAndDelete({ _id: id, role: 'manager' });
    }

    async assignEmployeesToManager(managerId: string, employeeIds: string[]): Promise<number> {
        const result = await User.updateMany(
            { _id: { $in: employeeIds }, role: 'employee' },
            { $set: { managerId: managerId } }
        );
        return result.modifiedCount;
    }

    async getManagedEmployees(managerId: string): Promise<IUser[]> {
        return await User.find({ managerId, role: 'employee' });
    }

    async count(filter: any = {}): Promise<number> {
        return await User.countDocuments({ role: 'manager', ...filter });
    }
}

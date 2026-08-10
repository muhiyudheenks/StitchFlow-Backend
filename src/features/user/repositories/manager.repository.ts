import User, { IUser } from '../../auth/models/userModel';
import { CreateManagerDto, UpdateManagerDto } from '../dto/admin.dto';

export class ManagerRepository {
    async create(dto: CreateManagerDto): Promise<IUser> {
        const designation = dto.designation || 'Production Manager';

        const manager = new User({
            fullName: dto.fullName,
            email: dto.email.toLowerCase(),
            phone: dto.phone,
            role: 'manager',
            employeeType: null,
            department: 'Production',
            designation,
            managerId: null,
            status: 'active',
            isVerified: false,
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

    async findAll(
        options: { search?: string; department?: string },
        skip: number,
        limit: number
    ): Promise<{ managers: IUser[]; total: number }> {
        const query: any = { role: 'manager' };

        if (options.search && options.search.trim()) {
            const regex = new RegExp(options.search.trim(), 'i');
            query.$or = [{ fullName: regex }, { email: regex }];
        }

        if (options.department && options.department !== 'All') {
            query.department = options.department;
        }

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
        const updateData: any = { ...dto, role: 'manager', employeeType: null };
        return await User.findOneAndUpdate(
            { _id: id, role: 'manager' },
            { $set: updateData },
            { new: true, runValidators: true }
        );
    }

    async delete(id: string): Promise<IUser | null> {
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

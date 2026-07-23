import User, { IUser } from '../../auth/models/userModel';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../dto/admin.dto';

export class EmployeeRepository {
    async create(dto: CreateEmployeeDto): Promise<IUser> {
        const password = dto.password || 'Employee@123';
        const employee = new User({
            fullName: dto.fullName,
            email: dto.email,
            password: password,
            role: 'employee',
            companyName: dto.companyName,
            managerId: dto.managerId || null,
            department: dto.department || 'General',
            designation: dto.designation || 'Staff',
            phone: dto.phone,
            status: dto.status || 'active',
            isVerified: true,
            isBlock: false,
        });
        return await employee.save();
    }

    async findById(id: string): Promise<IUser | null> {
        return await User.findOne({ _id: id, role: 'employee' }).populate('managerId', 'fullName email department');
    }

    async findByEmail(email: string): Promise<IUser | null> {
        return await User.findOne({ email: email.toLowerCase() });
    }

    async findAll(filter: any, skip: number, limit: number): Promise<{ employees: IUser[]; total: number }> {
        const query = { role: 'employee', ...filter };
        const [employees, total] = await Promise.all([
            User.find(query)
                .populate('managerId', 'fullName email department')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User.countDocuments(query),
        ]);
        return { employees, total };
    }

    async update(id: string, dto: UpdateEmployeeDto): Promise<IUser | null> {
        return await User.findOneAndUpdate(
            { _id: id, role: 'employee' },
            { $set: dto },
            { new: true, runValidators: true }
        ).populate('managerId', 'fullName email department');
    }

    async delete(id: string): Promise<IUser | null> {
        return await User.findOneAndDelete({ _id: id, role: 'employee' });
    }

    async count(filter: any = {}): Promise<number> {
        return await User.countDocuments({ role: 'employee', ...filter });
    }
}

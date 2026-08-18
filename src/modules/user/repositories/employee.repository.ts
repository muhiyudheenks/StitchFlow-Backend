import User, { IUser } from '../../auth/models/userModel';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../dto/admin.dto';
import { EMPLOYEE_TYPE_TO_DESIGNATION } from '../../../shared/constants/userSchema.constants';

export class EmployeeRepository {
    async create(dto: CreateEmployeeDto): Promise<IUser> {
        let employeeType = dto.employeeType || 'stitching_worker';
        if (employeeType === 'Stitching Worker') employeeType = 'stitching_worker';
        if (employeeType === 'Cutting Worker') employeeType = 'cutting_worker';
        if (employeeType === 'Finishing Worker') employeeType = 'finishing_worker';

        let designation = dto.designation || EMPLOYEE_TYPE_TO_DESIGNATION[employeeType] || 'Stitching Operator';

        const employee = new User({
            fullName: dto.fullName,
            email: dto.email.toLowerCase(),
            phone: dto.phone,
            employeeType,
            role: 'employee',
            department: 'Production',
            designation,
            managerId: null,
            status: 'active',
            isVerified: false,
            isBlock: false,
        });
        return await employee.save();
    }

    async findById(id: string): Promise<IUser | null> {
        return await User.findOne({ _id: id, role: 'employee' })
            .populate('managerId', 'fullName email department');
    }

    async findByEmail(email: string): Promise<IUser | null> {
        return await User.findOne({ email: email.toLowerCase() });
    }

    async findAll(
        options: { search?: string; department?: string; status?: string },
        skip: number,
        limit: number
    ): Promise<{ employees: IUser[]; total: number }> {
        const query: any = { role: 'employee' };

        if (options.search && options.search.trim()) {
            const regex = new RegExp(options.search.trim(), 'i');
            query.$or = [{ fullName: regex }, { email: regex }];
        }

        if (options.department && options.department !== 'All') {
            query.department = options.department;
        }

        if (options.status && options.status !== 'All') {
            const st = options.status.toLowerCase();
            query.status = st === 'on leave' || st === 'on_leave' ? 'on_leave' : st;
        }

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

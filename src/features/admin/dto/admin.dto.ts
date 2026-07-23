export interface CreateEmployeeDto {
    fullName: string;
    email: string;
    password?: string;
    companyName?: string;
    managerId?: string;
    department?: string;
    designation?: string;
    phone?: string;
    status?: 'active' | 'inactive' | 'on_leave';
}

export interface UpdateEmployeeDto {
    fullName?: string;
    email?: string;
    companyName?: string;
    managerId?: string;
    department?: string;
    designation?: string;
    phone?: string;
    status?: 'active' | 'inactive' | 'on_leave';
    isBlock?: boolean;
}

export interface CreateManagerDto {
    fullName: string;
    email: string;
    password?: string;
    companyName?: string;
    department?: string;
    designation?: string;
    phone?: string;
}

export interface UpdateManagerDto {
    fullName?: string;
    email?: string;
    companyName?: string;
    department?: string;
    designation?: string;
    phone?: string;
    isBlock?: boolean;
}

export interface AssignEmployeesDto {
    employeeIds: string[];
}

export interface CreateProductionDto {
    title: string;
    targetQuantity: number;
    completedQuantity?: number;
    managerId?: string;
    startDate?: string | Date;
    endDate?: string | Date;
    notes?: string;
    status?: 'pending' | 'in_progress' | 'completed' | 'delayed';
}

export interface UpdateProductionDto {
    title?: string;
    targetQuantity?: number;
    completedQuantity?: number;
    managerId?: string;
    startDate?: string | Date;
    endDate?: string | Date;
    notes?: string;
    status?: 'pending' | 'in_progress' | 'completed' | 'delayed';
}

export interface CreateInventoryItemDto {
    itemName: string;
    category: string;
    stockQuantity: number;
    minStockLevel: number;
    unit?: string;
    price?: number;
    description?: string;
}

export interface UpdateInventoryItemDto {
    itemName?: string;
    category?: string;
    stockQuantity?: number;
    minStockLevel?: number;
    unit?: string;
    price?: number;
    description?: string;
    status?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface StockAdjustDto {
    quantity: number;
    reason?: string;
}

export interface CheckInDto {
    employeeId: string;
    checkInTime?: string | Date;
    status?: 'present' | 'absent' | 'late' | 'half_day';
    notes?: string;
}

export interface CheckOutDto {
    attendanceId?: string;
    employeeId?: string;
    checkOutTime?: string | Date;
    notes?: string;
}

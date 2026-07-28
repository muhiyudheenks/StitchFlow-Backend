export interface CreateEmployeeDto {
    fullName: string;
    email: string;
    phone?: string;
    employeeType?: string;
    designation?: string;
}

export interface UpdateEmployeeDto {
    fullName?: string;
    email?: string;
    employeeType?: string | null;
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
    phone?: string;
    designation?: string;
}

export interface UpdateManagerDto {
    fullName?: string;
    email?: string;
    companyName?: string;
    department?: string;
    designation?: string;
    phone?: string;
    status?: 'active' | 'inactive' | 'on_leave';
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
    category?: string;
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

export interface StockInDto {
    inventoryId: string;
    quantity: number;
    unit?: string;
    supplier?: string;
    reason: string;
    notes?: string;
}

export interface StockOutDto {
    inventoryId: string;
    quantity: number;
    reason: string;
    productionBatch?: string;
    notes?: string;
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

export interface CreateProductionLineDto {
    name: string;
    code?: string;
    managerId?: string | null;
    targetPerDay?: number;
    status?: 'active' | 'maintenance' | 'inactive';
    description?: string;
}

export interface UpdateProductionLineDto {
    name?: string;
    code?: string;
    managerId?: string | null;
    targetPerDay?: number;
    status?: 'active' | 'maintenance' | 'inactive';
    description?: string;
}

export interface AssignEmployeesDto {
    employeeIds: string[];
}

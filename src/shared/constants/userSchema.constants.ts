export const MANAGER_DESIGNATIONS = ['Production Manager'] as const;
export type ManagerDesignation = typeof MANAGER_DESIGNATIONS[number];

export const EMPLOYEE_DESIGNATIONS = [
    'Stitching Operator',
    'Cutting Operator',
    'Finishing Operator',
] as const;
export type EmployeeDesignation = typeof EMPLOYEE_DESIGNATIONS[number];

export const ADMIN_DESIGNATION = 'Administrator';
export const ADMIN_DEPARTMENT = 'Administration';

export const EMPLOYEE_TYPE_TO_DESIGNATION: Record<string, string> = {
    'stitching_worker': 'Stitching Operator',
    'cutting_worker': 'Cutting Operator',
    'finishing_worker': 'Finishing Operator',
    'Stitching Worker': 'Stitching Operator',
    'Cutting Worker': 'Cutting Operator',
    'Finishing Worker': 'Finishing Operator',
};

export const DESIGNATION_TO_EMPLOYEE_TYPE: Record<string, string> = {
    'Stitching Operator': 'stitching_worker',
    'Cutting Operator': 'cutting_worker',
    'Finishing Operator': 'finishing_worker',
};

export const MANAGER_DESIGNATION_TO_DEPARTMENT: Record<string, string> = {
    'Production Manager': 'Production',
};

export const EMPLOYEE_TYPE_TO_DEPARTMENT: Record<string, string> = {
    'stitching_worker': 'Production',
    'cutting_worker': 'Production',
    'finishing_worker': 'Production',
    'Stitching Worker': 'Production',
    'Cutting Worker': 'Production',
    'Finishing Worker': 'Production',
};

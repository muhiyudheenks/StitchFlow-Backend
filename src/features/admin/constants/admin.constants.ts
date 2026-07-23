export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500,
} as const;

export const ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    EMPLOYEE: 'employee',
} as const;

export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
} as const;

export const RESPONSE_MESSAGES = {
    EMPLOYEE_CREATED: 'Employee created successfully',
    EMPLOYEE_UPDATED: 'Employee updated successfully',
    EMPLOYEE_DELETED: 'Employee deleted successfully',
    EMPLOYEE_STATUS_UPDATED: 'Employee status updated successfully',
    EMPLOYEE_NOT_FOUND: 'Employee not found',
    MANAGER_CREATED: 'Manager created successfully',
    MANAGER_UPDATED: 'Manager updated successfully',
    MANAGER_DELETED: 'Manager deleted successfully',
    MANAGER_NOT_FOUND: 'Manager not found',
    EMPLOYEES_ASSIGNED: 'Employees assigned to manager successfully',
    PRODUCTION_CREATED: 'Production entry created successfully',
    PRODUCTION_UPDATED: 'Production entry updated successfully',
    PRODUCTION_DELETED: 'Production entry deleted successfully',
    PRODUCTION_NOT_FOUND: 'Production entry not found',
    ITEM_CREATED: 'Inventory item created successfully',
    ITEM_UPDATED: 'Inventory item updated successfully',
    ITEM_DELETED: 'Inventory item deleted successfully',
    ITEM_NOT_FOUND: 'Inventory item not found',
    STOCK_IN_SUCCESS: 'Stock added successfully',
    STOCK_OUT_SUCCESS: 'Stock deducted successfully',
    ATTENDANCE_CHECKIN_SUCCESS: 'Attendance check-in recorded successfully',
    ATTENDANCE_CHECKOUT_SUCCESS: 'Attendance check-out recorded successfully',
    ATTENDANCE_RECORD_NOT_FOUND: 'Attendance record not found',
    ALREADY_CHECKED_IN: 'Employee has already checked in today',
} as const;

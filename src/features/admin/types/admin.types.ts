export interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    pagination?: PaginationMeta;
    error?: any;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginationQuery {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    department?: string;
    role?: string;
    startDate?: string;
    endDate?: string;
}

export interface OverviewCardsData {
    totalEmployees: number;
    totalManagers: number;
    todayAttendanceCount: number;
    todayAttendanceRate: number;
    productionProgress: number;
    lowStockItemCount: number;
}

export interface ProductionProgressSummary {
    totalTarget: number;
    totalCompleted: number;
    totalRemaining: number;
    overallEfficiency: number;
    todayCount: number;
    todayTarget: number;
    todayCompleted: number;
    todayEfficiency: number;
}

export interface InventoryStatusSummary {
    totalItems: number;
    inStock: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
}

export interface AnalyticsSummary {
    employeeStats: {
        total: number;
        active: number;
        inactive: number;
        onLeave: number;
    };
    managerStats: {
        total: number;
    };
    attendanceStats: {
        todayPresent: number;
        todayAbsent: number;
        todayLate: number;
        todayHalfDay: number;
        attendancePercentage: number;
    };
    productionStats: {
        totalBatches: number;
        completedBatches: number;
        inProgressBatches: number;
        delayedBatches: number;
        completionRate: number;
    };
    inventoryStats: {
        totalItems: number;
        lowStockItems: number;
        outOfStockItems: number;
    };
}

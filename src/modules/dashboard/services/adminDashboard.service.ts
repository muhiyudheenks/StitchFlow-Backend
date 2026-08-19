import * as employeeRepo from '../../user/repositories/employee.repository';
import * as managerRepo from '../../user/repositories/manager.repository';
import * as productionRepo from '../../production/repositories/production.repository';
import * as inventoryRepo from '../../inventory/repositories/inventory.repository';
import * as attendanceRepo from '../../attendance/repositories/attendance.repository';
import * as activityRepo from '../repositories/activity.repository';
import { OverviewCardsData, AnalyticsSummary } from '../../user/types/admin.types';

export async function getOverviewCards(): Promise<OverviewCardsData> {
    const [
        totalEmployees,
        totalManagers,
        todayAttendanceCount,
        productionStats,
        lowStockItems,
    ] = await Promise.all([
        employeeRepo.countEmployees(),
        managerRepo.countManagers(),
        attendanceRepo.countTodayPresent(),
        productionRepo.aggregateStats(),
        inventoryRepo.findLowStock(),
    ]);

    const attendanceRate = totalEmployees > 0
        ? Math.round((todayAttendanceCount / totalEmployees) * 100)
        : 0;

    const totalTarget = productionStats.length > 0 ? productionStats[0].totalTarget : 0;
    const totalCompleted = productionStats.length > 0 ? productionStats[0].totalCompleted : 0;
    const productionProgress = totalTarget > 0
        ? Math.min(100, Math.round((totalCompleted / totalTarget) * 100))
        : 0;

    return {
        totalEmployees,
        totalManagers,
        todayAttendanceCount,
        todayAttendanceRate: attendanceRate,
        productionProgress,
        lowStockItemCount: lowStockItems.length,
    };
}

export async function getProductionProgress() {
    const [stats, todayStats] = await Promise.all([
        productionRepo.aggregateStats(),
        productionRepo.aggregateTodayStats(),
    ]);

    const todayTarget = todayStats.todayTarget;
    const todayCompleted = todayStats.todayCompleted;

    const totalTarget = stats.length > 0 ? stats[0].totalTarget : 0;
    const totalCompleted = stats.length > 0 ? stats[0].totalCompleted : 0;

    return {
        overall: {
            totalTarget,
            totalCompleted,
            remaining: Math.max(0, totalTarget - totalCompleted),
            efficiency: totalTarget > 0 ? Math.min(100, Math.round((totalCompleted / totalTarget) * 100)) : 0,
        },
        today: {
            target: todayTarget,
            completed: todayCompleted,
            remaining: Math.max(0, todayTarget - todayCompleted),
            efficiency: todayTarget > 0 ? Math.min(100, Math.round((todayCompleted / todayTarget) * 100)) : 0,
        },
    };
}

export async function getInventoryStatus() {
    const summary = await inventoryRepo.aggregateSummary();
    const lowStockList = await inventoryRepo.findLowStock();

    let totalItems = 0;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    summary.forEach((s) => {
        totalItems += s.count;
        if (s._id === 'in_stock') inStock = s.count;
        if (s._id === 'low_stock') lowStock = s.count;
        if (s._id === 'out_of_stock') outOfStock = s.count;
    });

    return {
        totalItems,
        inStock,
        lowStock,
        outOfStock,
        lowStockItems: lowStockList,
    };
}

export async function getRecentActivities(limit: number = 20) {
    return await activityRepo.getRecentActivities(limit);
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const [
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        onLeaveEmployees,
        totalManagers,
        attendanceStats,
        prodStats,
        pendingProd,
        inProgressProd,
        completedProd,
        delayedProd,
        inventorySummary,
    ] = await Promise.all([
        employeeRepo.countEmployees(),
        employeeRepo.countEmployees({ status: 'active' }),
        employeeRepo.countEmployees({ status: 'inactive' }),
        employeeRepo.countEmployees({ status: 'on_leave' }),
        managerRepo.countManagers(),
        attendanceRepo.getTodayStats(),
        productionRepo.aggregateStats(),
        productionRepo.countBatches({ status: 'pending' }),
        productionRepo.countBatches({ status: 'in_progress' }),
        productionRepo.countBatches({ status: 'completed' }),
        productionRepo.countBatches({ status: 'delayed' }),
        inventoryRepo.aggregateSummary(),
    ]);

    let invTotal = 0;
    let invLow = 0;
    let invOut = 0;

    inventorySummary.forEach((s) => {
        invTotal += s.count;
        if (s._id === 'low_stock') invLow = s.count;
        if (s._id === 'out_of_stock') invOut = s.count;
    });

    const activeCount = activeEmployees;
    const presentPercentage = activeCount > 0
        ? Math.round(((attendanceStats.present + attendanceStats.late + attendanceStats.halfDay) / activeCount) * 100)
        : 0;

    const totalBatches = pendingProd + inProgressProd + completedProd + delayedProd;
    const completionRate = totalBatches > 0
        ? Math.round((completedProd / totalBatches) * 100)
        : 0;

    return {
        employeeStats: {
            total: totalEmployees,
            active: activeEmployees,
            inactive: inactiveEmployees,
            onLeave: onLeaveEmployees,
        },
        managerStats: {
            total: totalManagers,
        },
        attendanceStats: {
            todayPresent: attendanceStats.present,
            todayAbsent: Math.max(0, activeEmployees - (attendanceStats.present + attendanceStats.late + attendanceStats.halfDay)),
            todayLate: attendanceStats.late,
            todayHalfDay: attendanceStats.halfDay,
            attendancePercentage: presentPercentage,
        },
        productionStats: {
            totalBatches,
            completedBatches: completedProd,
            inProgressBatches: inProgressProd,
            delayedBatches: delayedProd,
            completionRate,
        },
        inventoryStats: {
            totalItems: invTotal,
            lowStockItems: invLow,
            outOfStockItems: invOut,
        },
    };
}

export const adminDashboardService = {
    getOverviewCards,
    getProductionProgress,
    getInventoryStatus,
    getRecentActivities,
    getAnalyticsSummary,
};

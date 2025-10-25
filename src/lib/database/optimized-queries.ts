import { prisma } from '../db';
import { Prisma } from '@prisma/client';

/**
 * Optimized BOM queries with field selection and filtering
 */
export const bomQueries = {
  /**
   * Get BOM items with pagination and field selection
   */
  async getItems(options: {
    page?: number;
    limit?: number;
    category?: string;
    lowStockOnly?: boolean;
  }) {
    const { page = 0, limit = 50, category, lowStockOnly } = options;

    const where: Prisma.BomItemWhereInput = {
      ...(category && { category }),
      ...(lowStockOnly && {
        currentStock: {
          lte: Prisma.sql`reorder_point` as any,
        },
      }),
    };

    const [items, total] = await Promise.all([
      prisma.bomItem.findMany({
        where,
        select: {
          id: true,
          partNumber: true,
          description: true,
          category: true,
          currentStock: true,
          reorderPoint: true,
          unitCost: true,
          supplier: true,
          leadTimeDays: true,
        },
        skip: page * limit,
        take: limit,
        orderBy: { partNumber: 'asc' },
      }),
      prisma.bomItem.count({ where }),
    ]);

    return { items, total, pages: Math.ceil(total / limit) };
  },

  /**
   * Get inventory value summary (optimized aggregation)
   */
  async getInventoryValue() {
    const result = await prisma.bomItem.aggregate({
      _sum: {
        currentStock: true,
      },
      where: {
        currentStock: { gt: 0 },
      },
    });

    // Calculate total value separately for precision
    const items = await prisma.bomItem.findMany({
      where: { currentStock: { gt: 0 } },
      select: {
        currentStock: true,
        unitCost: true,
      },
    });

    const totalValue = items.reduce(
      (sum, item) => sum + item.currentStock * item.unitCost,
      0
    );

    return {
      totalItems: result._sum.currentStock || 0,
      totalValue,
    };
  },

  /**
   * Get low stock items efficiently
   */
  async getLowStockItems() {
    return prisma.bomItem.findMany({
      where: {
        currentStock: {
          lte: Prisma.sql`reorder_point` as any,
        },
      },
      select: {
        partNumber: true,
        description: true,
        currentStock: true,
        reorderPoint: true,
        supplier: true,
        leadTimeDays: true,
      },
      orderBy: [{ currentStock: 'asc' }, { partNumber: 'asc' }],
    });
  },
};

/**
 * Optimized production schedule queries
 */
export const scheduleQueries = {
  /**
   * Get active schedules with related data
   */
  async getActiveSchedules() {
    return prisma.productionSchedule.findMany({
      where: {
        status: { in: ['planned', 'in-progress'] },
      },
      include: {
        product: {
          select: {
            sku: true,
            name: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  },

  /**
   * Get schedule with MRP data (optimized)
   */
  async getScheduleWithMRP(scheduleId: string) {
    return prisma.productionSchedule.findUnique({
      where: { scheduleId },
      include: {
        product: {
          include: {
            bom: {
              include: {
                bomItem: {
                  select: {
                    partNumber: true,
                    description: true,
                    currentStock: true,
                    unitCost: true,
                    reorderPoint: true,
                  },
                },
              },
            },
          },
        },
        materialReqs: true,
      },
    });
  },

  /**
   * Get schedules by date range with filters
   */
  async getSchedulesByDateRange(options: {
    startDate: Date;
    endDate: Date;
    status?: string;
    workstationId?: string;
  }) {
    const { startDate, endDate, status, workstationId } = options;

    return prisma.productionSchedule.findMany({
      where: {
        startDate: { gte: startDate },
        endDate: { lte: endDate },
        ...(status && { status }),
        ...(workstationId && { workstationId }),
      },
      include: {
        product: {
          select: {
            sku: true,
            name: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });
  },
};

/**
 * Optimized alert queries
 */
export const alertQueries = {
  /**
   * Get active alerts with filtering
   */
  async getActiveAlerts(options?: {
    severity?: string;
    type?: string;
    limit?: number;
  }) {
    const { severity, type, limit = 50 } = options || {};

    return prisma.alert.findMany({
      where: {
        status: 'active',
        ...(severity && { severity }),
        ...(type && { alertType: type }),
      },
      select: {
        id: true,
        alertType: true,
        severity: true,
        title: true,
        description: true,
        createdAt: true,
        reference: true,
      },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  },

  /**
   * Get alert statistics
   */
  async getAlertStats() {
    const [totalActive, criticalCount, warningCount, infoCount] =
      await Promise.all([
        prisma.alert.count({ where: { status: 'active' } }),
        prisma.alert.count({
          where: { status: 'active', severity: 'critical' },
        }),
        prisma.alert.count({
          where: { status: 'active', severity: 'warning' },
        }),
        prisma.alert.count({ where: { status: 'active', severity: 'info' } }),
      ]);

    return {
      totalActive,
      criticalCount,
      warningCount,
      infoCount,
    };
  },
};

/**
 * Optimized throughput queries
 */
export const throughputQueries = {
  /**
   * Get throughput data by date range
   */
  async getByDateRange(options: {
    startDate: Date;
    endDate: Date;
    productId?: string;
    workstationId?: string;
  }) {
    const { startDate, endDate, productId, workstationId } = options;

    return prisma.throughputData.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        ...(productId && { productId }),
        ...(workstationId && { workstationId }),
      },
      include: {
        product: {
          select: {
            sku: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });
  },

  /**
   * Get average efficiency by product
   */
  async getAverageEfficiencyByProduct(productId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await prisma.throughputData.aggregate({
      where: {
        productId,
        date: { gte: startDate },
      },
      _avg: {
        efficiency: true,
        defectRate: true,
      },
      _sum: {
        unitsProduced: true,
        hoursWorked: true,
      },
    });

    return {
      avgEfficiency: result._avg.efficiency || 0,
      avgDefectRate: result._avg.defectRate || 0,
      totalUnits: result._sum.unitsProduced || 0,
      totalHours: result._sum.hoursWorked || 0,
    };
  },
};

/**
 * Optimized inventory movement queries
 */
export const inventoryQueries = {
  /**
   * Get recent movements for a part
   */
  async getRecentMovements(partNumber: string, limit: number = 20) {
    return prisma.inventoryMovement.findMany({
      where: { partNumber },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  },

  /**
   * Get movements by date range
   */
  async getMovementsByDateRange(options: {
    startDate: Date;
    endDate: Date;
    partNumber?: string;
    movementType?: string;
  }) {
    const { startDate, endDate, partNumber, movementType } = options;

    return prisma.inventoryMovement.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
        ...(partNumber && { partNumber }),
        ...(movementType && { movementType }),
      },
      orderBy: { timestamp: 'desc' },
    });
  },
};

/**
 * Optimized sales order queries
 */
export const salesQueries = {
  /**
   * Get orders by priority
   */
  async getOrdersByPriority(priority: string = 'high') {
    return prisma.salesOrder.findMany({
      where: {
        priority,
        status: { not: 'completed' },
      },
      include: {
        product: {
          select: {
            sku: true,
            name: true,
          },
        },
      },
      orderBy: { timePeriod: 'asc' },
    });
  },

  /**
   * Get demand forecast for date range
   */
  async getDemandForecast(options: {
    startDate: Date;
    endDate: Date;
    productId?: string;
  }) {
    const { startDate, endDate, productId } = options;

    return prisma.salesOrder.findMany({
      where: {
        timePeriod: {
          gte: startDate,
          lte: endDate,
        },
        ...(productId && { productId }),
      },
      include: {
        product: {
          select: {
            sku: true,
            name: true,
          },
        },
      },
      orderBy: { timePeriod: 'asc' },
    });
  },
};

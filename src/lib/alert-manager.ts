/**
 * Alert Management System
 *
 * Comprehensive alert creation, resolution, and notification system
 * with automatic triggers for inventory, scheduling, cost, and quality issues
 */

import { prisma } from './db'
import { AlertType, Severity } from '@prisma/client'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type { AlertType, Severity }

export interface CreateAlertInput {
  type: AlertType
  severity: Severity
  title: string
  description: string
  reference?: string
}

export interface AlertFilters {
  type?: AlertType | AlertType[]
  severity?: Severity | Severity[]
  reference?: string
  status?: 'active' | 'resolved' | 'dismissed'
  createdAfter?: Date
  createdBefore?: Date
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedAlerts {
  alerts: any[]
  total: number
  page: number
  totalPages: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COST_VARIANCE_THRESHOLD = 0.1 // 10%
const DEFECT_RATE_THRESHOLD = 0.05 // 5%
const ALERT_AUTO_RESOLVE_HOURS = 72 // Auto-resolve after 72 hours

// Severity weights for sorting
const SEVERITY_WEIGHTS = {
  critical: 3,
  warning: 2,
  info: 1,
}

// ============================================================================
// CORE CRUD FUNCTIONS
// ============================================================================

/**
 * Create a new alert with duplicate prevention
 */
export async function createAlert(
  type: AlertType,
  severity: Severity,
  title: string,
  description: string,
  reference?: string
): Promise<any> {
  // Validate inputs
  if (!title || title.trim().length === 0) {
    throw new Error('Alert title is required')
  }
  if (!description || description.trim().length === 0) {
    throw new Error('Alert description is required')
  }

  // Check for duplicate active alerts (same type + reference)
  if (reference) {
    const existingAlert = await prisma.alert.findFirst({
      where: {
        alertType: type,
        reference,
        status: 'active',
      },
    })

    // If duplicate exists, update it instead of creating new
    if (existingAlert) {
      return await prisma.alert.update({
        where: { id: existingAlert.id },
        data: {
          severity,
          title,
          description,
          updatedAt: new Date(),
        },
      })
    }
  }

  // Create new alert
  const alert = await prisma.alert.create({
    data: {
      alertType: type,
      severity,
      title,
      description,
      reference: reference || null,
      status: 'active',
    },
  })

  // Trigger notification for critical alerts
  if (severity === 'critical') {
    await sendAlertNotification(alert, []).catch((error) => {
      console.error('Failed to send alert notification:', error)
      // Don't throw - notification failure shouldn't block alert creation
    })
  }

  return alert
}

/**
 * Resolve an alert with notes
 */
export async function resolveAlert(
  alertId: string,
  resolution: string,
  userId?: string
): Promise<any> {
  if (!resolution || resolution.trim().length === 0) {
    throw new Error('Resolution notes are required')
  }

  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
  })

  if (!alert) {
    throw new Error(`Alert not found: ${alertId}`)
  }

  if (alert.status !== 'active') {
    throw new Error(`Alert is already ${alert.status}`)
  }

  return await prisma.alert.update({
    where: { id: alertId },
    data: {
      status: 'resolved',
      resolvedAt: new Date(),
      resolution,
      resolvedBy: userId || null,
    },
  })
}

/**
 * Dismiss an alert
 */
export async function dismissAlert(alertId: string, reason?: string): Promise<any> {
  const alert = await prisma.alert.findUnique({
    where: { id: alertId },
  })

  if (!alert) {
    throw new Error(`Alert not found: ${alertId}`)
  }

  if (alert.status !== 'active') {
    throw new Error(`Alert is already ${alert.status}`)
  }

  return await prisma.alert.update({
    where: { id: alertId },
    data: {
      status: 'dismissed',
      dismissedAt: new Date(),
      dismissalReason: reason || null,
    },
  })
}

/**
 * Get active alerts with filtering and pagination
 */
export async function getActiveAlerts(
  filters: AlertFilters = {},
  pagination?: PaginationParams
): Promise<PaginatedAlerts> {
  const page = pagination?.page || 1
  const limit = pagination?.limit || 50
  const skip = (page - 1) * limit

  // Build where clause
  const where: any = {}

  // Status filter
  if (filters.status) {
    where.status = filters.status
  } else {
    where.status = 'active' // Default to active only
  }

  // Type filter
  if (filters.type) {
    where.alertType = Array.isArray(filters.type)
      ? { in: filters.type }
      : filters.type
  }

  // Severity filter
  if (filters.severity) {
    where.severity = Array.isArray(filters.severity)
      ? { in: filters.severity }
      : filters.severity
  }

  // Reference filter
  if (filters.reference) {
    where.reference = filters.reference
  }

  // Date filters
  if (filters.createdAfter || filters.createdBefore) {
    where.createdAt = {}
    if (filters.createdAfter) {
      where.createdAt.gte = filters.createdAfter
    }
    if (filters.createdBefore) {
      where.createdAt.lte = filters.createdBefore
    }
  }

  // Get total count
  const total = await prisma.alert.count({ where })

  // Get paginated results
  // Sort by severity (critical first), then by createdAt (newest first)
  const alerts = await prisma.alert.findMany({
    where,
    skip,
    take: limit,
    orderBy: [
      {
        severity: 'desc', // critical > warning > info
      },
      {
        createdAt: 'desc',
      },
    ],
  })

  return {
    alerts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Get alert history for a specific reference
 */
export async function getAlertHistory(
  reference: string,
  includeResolved: boolean = true
): Promise<any[]> {
  const where: any = { reference }

  if (!includeResolved) {
    where.status = 'active'
  }

  return await prisma.alert.findMany({
    where,
    orderBy: {
      createdAt: 'desc',
    },
  })
}

// ============================================================================
// ALERT TRIGGER FUNCTIONS
// ============================================================================

/**
 * Check inventory levels and create alerts if needed
 */
export async function checkInventoryAlerts(
  partNumber: string,
  currentStock: number
): Promise<any[]> {
  const alerts: any[] = []

  // Get BOM item details
  const bomItem = await prisma.bomItem.findUnique({
    where: { partNumber },
  })

  if (!bomItem) {
    throw new Error(`BOM item not found: ${partNumber}`)
  }

  // Critical: Stock is zero
  if (currentStock === 0) {
    const alert = await createAlert(
      'shortage',
      'critical',
      `Out of Stock: ${bomItem.description}`,
      `Part ${partNumber} is completely out of stock. Production may be blocked.`,
      partNumber
    )
    alerts.push(alert)
  }
  // Warning: Stock at or below reorder point
  else if (currentStock <= bomItem.reorderPoint) {
    const alert = await createAlert(
      'reorder',
      'warning',
      `Reorder Required: ${bomItem.description}`,
      `Part ${partNumber} stock (${currentStock}) is at or below reorder point (${bomItem.reorderPoint}). ` +
        `Supplier: ${bomItem.supplier}. Lead time: ${bomItem.leadTimeDays} days.`,
      partNumber
    )
    alerts.push(alert)
  }
  // Warning: Stock at or below safety stock
  else if (currentStock <= bomItem.safetyStock) {
    const alert = await createAlert(
      'reorder',
      'warning',
      `Low Stock: ${bomItem.description}`,
      `Part ${partNumber} stock (${currentStock}) is at or below safety stock (${bomItem.safetyStock}). ` +
        `Consider ordering soon. Reorder point: ${bomItem.reorderPoint}.`,
      partNumber
    )
    alerts.push(alert)
  }

  return alerts
}

/**
 * Check for schedule conflicts
 */
export async function checkScheduleConflicts(scheduleId: string): Promise<any[]> {
  const alerts: any[] = []

  // Get the schedule
  const schedule = await prisma.productionSchedule.findUnique({
    where: { scheduleId },
    include: {
      product: true,
      materialReqs: {
        include: {
          bomItem: true,
        },
      },
    },
  })

  if (!schedule) {
    throw new Error(`Schedule not found: ${scheduleId}`)
  }

  // Check 1: Overlapping schedules on same workstation
  const overlappingSchedules = await prisma.productionSchedule.findMany({
    where: {
      workstationId: schedule.workstationId,
      scheduleId: { not: scheduleId },
      status: 'active',
      OR: [
        {
          AND: [
            { startDate: { lte: schedule.endDate } },
            { endDate: { gte: schedule.startDate } },
          ],
        },
      ],
    },
    include: {
      product: true,
    },
  })

  if (overlappingSchedules.length > 0) {
    const conflictingProducts = overlappingSchedules
      .map((s) => s.product.name)
      .join(', ')
    const alert = await createAlert(
      'schedule_conflict',
      'critical',
      `Schedule Conflict: ${schedule.product.name}`,
      `Workstation ${schedule.workstationId} has ${overlappingSchedules.length} overlapping schedule(s). ` +
        `Conflicting products: ${conflictingProducts}`,
      scheduleId
    )
    alerts.push(alert)
  }

  // Check 2: Material shortages
  for (const materialReq of schedule.materialReqs) {
    if (materialReq.allocatedQuantity < materialReq.requiredQuantity) {
      const shortage = materialReq.requiredQuantity - materialReq.allocatedQuantity
      const alert = await createAlert(
        'shortage',
        'critical',
        `Material Shortage for ${schedule.product.name}`,
        `Part ${materialReq.partNumber} (${materialReq.bomItem.description}) ` +
          `has insufficient allocation. Required: ${materialReq.requiredQuantity}, ` +
          `Allocated: ${materialReq.allocatedQuantity}, Shortage: ${shortage}`,
        scheduleId
      )
      alerts.push(alert)
    }
  }

  // Check 3: Capacity warnings (based on historical throughput)
  const throughputData = await prisma.throughputData.findMany({
    where: {
      productId: schedule.productId,
      workstationId: schedule.workstationId,
    },
    orderBy: {
      date: 'desc',
    },
    take: 30, // Last 30 records
  })

  if (throughputData.length >= 5) {
    // Need at least 5 data points
    const avgUnitsPerDay =
      throughputData.reduce((sum, t) => {
        const hoursWorked = t.hoursWorked || 8
        const unitsPerHour = t.unitsProduced / hoursWorked
        return sum + unitsPerHour * 8 // Normalize to 8-hour day
      }, 0) / throughputData.length

    if (schedule.unitsToProducePerDay > avgUnitsPerDay * 1.1) {
      // >10% above average
      const capacityUtilization =
        (schedule.unitsToProducePerDay / avgUnitsPerDay) * 100
      const alert = await createAlert(
        'capacity_warning',
        'warning',
        `Capacity Warning: ${schedule.product.name}`,
        `Scheduled production rate (${schedule.unitsToProducePerDay}/day) exceeds historical ` +
          `average (${avgUnitsPerDay.toFixed(0)}/day) by ${(capacityUtilization - 100).toFixed(1)}%. ` +
          `Capacity utilization: ${capacityUtilization.toFixed(0)}%`,
        scheduleId
      )
      alerts.push(alert)
    }
  }

  return alerts
}

/**
 * Check cost variances
 */
export async function checkCostVariances(
  scheduleId: string,
  actualCost: number,
  estimatedCost: number
): Promise<any | null> {
  if (estimatedCost === 0) {
    return null // Can't calculate variance with zero estimate
  }

  const variance = (actualCost - estimatedCost) / estimatedCost

  if (Math.abs(variance) > COST_VARIANCE_THRESHOLD) {
    const variancePercent = variance * 100
    const varianceDollars = actualCost - estimatedCost

    const schedule = await prisma.productionSchedule.findUnique({
      where: { scheduleId },
      include: { product: true },
    })

    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`)
    }

    return await createAlert(
      'cost_overrun',
      variance > 0 ? 'critical' : 'info',
      `Cost ${variance > 0 ? 'Overrun' : 'Underrun'}: ${schedule.product.name}`,
      `Production costs are ${Math.abs(variancePercent).toFixed(1)}% ${
        variance > 0 ? 'over' : 'under'
      } budget. ` +
        `Estimated: $${estimatedCost.toLocaleString()}, ` +
        `Actual: $${actualCost.toLocaleString()}, ` +
        `Variance: ${variance > 0 ? '+' : ''}$${varianceDollars.toLocaleString()}`,
      scheduleId
    )
  }

  return null
}

/**
 * Check quality issues based on defect rate
 */
export async function checkQualityIssues(
  productId: string,
  defectRate: number
): Promise<any | null> {
  if (defectRate > DEFECT_RATE_THRESHOLD) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      throw new Error(`Product not found: ${productId}`)
    }

    // Get recent defect rate trend
    const recentThroughput = await prisma.throughputData.findMany({
      where: { productId },
      orderBy: { date: 'desc' },
      take: 7,
    })

    const avgDefectRate =
      recentThroughput.reduce((sum, t) => sum + t.defectRate, 0) /
      recentThroughput.length

    const trend =
      defectRate > avgDefectRate * 1.2
        ? 'increasing rapidly'
        : defectRate > avgDefectRate
        ? 'increasing'
        : 'stable'

    return await createAlert(
      'quality_issue',
      defectRate > DEFECT_RATE_THRESHOLD * 2 ? 'critical' : 'warning',
      `Quality Issue: ${product.name}`,
      `Defect rate (${(defectRate * 100).toFixed(1)}%) exceeds threshold (${(
        DEFECT_RATE_THRESHOLD * 100
      ).toFixed(1)}%). ` +
        `7-day average: ${(avgDefectRate * 100).toFixed(1)}%. Trend: ${trend}. ` +
        `Immediate investigation recommended.`,
      productId
    )
  }

  return null
}

/**
 * Check delivery risk based on schedule adherence and material availability
 */
export async function checkDeliveryRisk(
  orderId: string,
  dueDate: Date
): Promise<any | null> {
  const order = await prisma.salesOrder.findUnique({
    where: { orderId },
    include: { product: true },
  })

  if (!order) {
    throw new Error(`Sales order not found: ${orderId}`)
  }

  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  )

  // Check if there's a production schedule for this order
  const schedule = await prisma.productionSchedule.findFirst({
    where: {
      productId: order.productId,
      startDate: { lte: dueDate },
    },
    include: {
      materialReqs: {
        where: {
          status: { not: 'fulfilled' },
        },
      },
    },
  })

  if (!schedule && daysUntilDue <= 7) {
    return await createAlert(
      'delivery_risk',
      'critical',
      `Delivery Risk: ${order.product.name}`,
      `Order ${orderId} due in ${daysUntilDue} days but no production schedule exists. ` +
        `Quantity: ${order.forecastedUnits} units. Immediate scheduling required.`,
      orderId
    )
  }

  if (
    schedule &&
    schedule.materialReqs.length > 0 &&
    daysUntilDue <= schedule.materialReqs.length * 2
  ) {
    return await createAlert(
      'delivery_risk',
      'warning',
      `Material Risk: ${order.product.name}`,
      `Order ${orderId} has ${schedule.materialReqs.length} unfulfilled material requirements. ` +
        `Due in ${daysUntilDue} days. Material procurement may delay delivery.`,
      orderId
    )
  }

  return null
}

// ============================================================================
// NOTIFICATION SYSTEM
// ============================================================================

/**
 * Send alert notification
 * In production, integrate with email service (SendGrid, Nodemailer, etc.)
 */
export async function sendAlertNotification(
  alert: any,
  recipients: string[]
): Promise<void> {
  // TODO: Implement actual email/notification service
  // For now, just log
  console.log('🚨 ALERT NOTIFICATION:', {
    severity: alert.severity,
    type: alert.alertType,
    title: alert.title,
    description: alert.description,
    reference: alert.reference,
    recipients: recipients.length > 0 ? recipients : ['default@example.com'],
  })

  // Example integration with email service:
  /*
  const transporter = nodemailer.createTransport({...})

  await transporter.sendMail({
    from: 'alerts@erp-system.com',
    to: recipients.join(','),
    subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
    html: `
      <h2>${alert.title}</h2>
      <p><strong>Severity:</strong> ${alert.severity}</p>
      <p><strong>Type:</strong> ${alert.alertType}</p>
      <p><strong>Description:</strong> ${alert.description}</p>
      ${alert.reference ? `<p><strong>Reference:</strong> ${alert.reference}</p>` : ''}
      <p><a href="https://your-erp.com/alerts/${alert.id}">View Alert</a></p>
    `
  })
  */
}

/**
 * Auto-resolve old alerts
 * Run this as a cron job or scheduled task
 */
export async function autoResolveOldAlerts(): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setHours(cutoffDate.getHours() - ALERT_AUTO_RESOLVE_HOURS)

  const result = await prisma.alert.updateMany({
    where: {
      status: 'active',
      severity: 'info',
      createdAt: { lt: cutoffDate },
    },
    data: {
      status: 'resolved',
      resolvedAt: new Date(),
      resolution: 'Auto-resolved after 72 hours',
    },
  })

  return result.count
}

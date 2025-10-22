/**
 * Daily Financial Snapshot Cron Job
 *
 * Runs daily at midnight to:
 * - Calculate financial snapshot
 * - Store in database
 * - Compare with previous day
 * - Generate alerts for significant changes
 * - Log completion
 */

import cron from 'node-cron'
import {
  calculateFinancialSnapshot,
  storeFinancialSnapshot,
} from '../financial-calculator'
import { prisma } from '../db'

// ============================================================================
// JOB CONFIGURATION
// ============================================================================

const CRON_SCHEDULE = '0 0 * * *' // Midnight daily
const SIGNIFICANT_CHANGE_THRESHOLD = 0.15 // 15%

// ============================================================================
// MAIN JOB FUNCTION
// ============================================================================

export async function runDailyFinancialSnapshot(): Promise<void> {
  const startTime = Date.now()
  console.log(`[${new Date().toISOString()}] Starting daily financial snapshot job...`)

  try {
    // Step 1: Calculate financial snapshot
    console.log('  → Calculating financial snapshot...')
    const snapshot = await calculateFinancialSnapshot()

    // Step 2: Store in database
    console.log('  → Storing snapshot in database...')
    await storeFinancialSnapshot(snapshot)

    // Step 3: Compare with previous day
    console.log('  → Comparing with previous day...')
    const yesterday = new Date(snapshot.date)
    yesterday.setDate(yesterday.getDate() - 1)

    const previousSnapshot = await prisma.financialMetrics.findUnique({
      where: {
        date: yesterday,
      },
    })

    if (previousSnapshot) {
      // Calculate changes
      const inventoryChange =
        snapshot.totalInventoryValue - previousSnapshot.totalInventoryValue
      const inventoryChangePercent =
        previousSnapshot.totalInventoryValue > 0
          ? (inventoryChange / previousSnapshot.totalInventoryValue) * 100
          : 0

      const wipChange = snapshot.wipValue - previousSnapshot.wipValue
      const wipChangePercent =
        previousSnapshot.wipValue > 0
          ? (wipChange / previousSnapshot.wipValue) * 100
          : 0

      console.log(`  → Inventory change: ${inventoryChangePercent > 0 ? '+' : ''}${inventoryChangePercent.toFixed(2)}%`)
      console.log(`  → WIP change: ${wipChangePercent > 0 ? '+' : ''}${wipChangePercent.toFixed(2)}%`)

      // Step 4: Create alert if significant change
      const isSignificantChange =
        Math.abs(inventoryChangePercent) > SIGNIFICANT_CHANGE_THRESHOLD * 100 ||
        Math.abs(wipChangePercent) > SIGNIFICANT_CHANGE_THRESHOLD * 100

      if (isSignificantChange) {
        console.log('  ⚠ Significant change detected - creating alert...')

        await prisma.alert.create({
          data: {
            alertType: 'capacity_warning',
            severity:
              Math.abs(inventoryChangePercent) > 25 ||
              Math.abs(wipChangePercent) > 25
                ? 'critical'
                : 'warning',
            title: 'Significant Financial Change',
            description:
              `Daily financial snapshot shows significant changes from previous day:\n` +
              `• Inventory Value: ${inventoryChangePercent > 0 ? '+' : ''}${inventoryChangePercent.toFixed(1)}% ` +
              `($${snapshot.totalInventoryValue.toLocaleString()} vs $${previousSnapshot.totalInventoryValue.toLocaleString()})\n` +
              `• WIP Value: ${wipChangePercent > 0 ? '+' : ''}${wipChangePercent.toFixed(1)}% ` +
              `($${snapshot.wipValue.toLocaleString()} vs $${previousSnapshot.wipValue.toLocaleString()})`,
            reference: snapshot.date.toISOString(),
            status: 'active',
          },
        })
      }
    } else {
      console.log('  → No previous snapshot found for comparison')
    }

    // Step 5: Log completion
    const duration = Date.now() - startTime
    console.log(`✓ Daily financial snapshot completed successfully in ${duration}ms`)

    // Log to database
    await logJobExecution('daily-financial-snapshot', true, null, duration)

    // TODO: Step 6: Send summary email to finance team
    // This would require email service integration
    // await sendFinancialSummaryEmail(snapshot, previousSnapshot)
  } catch (error: any) {
    const duration = Date.now() - startTime
    console.error(`✗ Daily financial snapshot failed:`, error)

    // Log error to database
    await logJobExecution(
      'daily-financial-snapshot',
      false,
      error.message,
      duration
    )

    // Create alert for job failure
    try {
      await prisma.alert.create({
        data: {
          alertType: 'quality_issue',
          severity: 'critical',
          title: 'Daily Financial Snapshot Job Failed',
          description:
            `The daily financial snapshot job failed with error: ${error.message}. ` +
            `Manual intervention may be required.`,
          reference: 'daily-financial-snapshot',
          status: 'active',
        },
      })
    } catch (alertError) {
      console.error('Failed to create alert for job failure:', alertError)
    }

    // Re-throw to ensure proper error handling
    throw error
  }
}

// ============================================================================
// JOB LOGGING
// ============================================================================

async function logJobExecution(
  jobName: string,
  success: boolean,
  errorMessage: string | null,
  durationMs: number
): Promise<void> {
  try {
    // Note: You may want to create a dedicated JobLog table for this
    // For now, we'll just log to console
    console.log(
      `[Job Log] ${jobName}: ${success ? 'SUCCESS' : 'FAILED'} (${durationMs}ms)${errorMessage ? ` - ${errorMessage}` : ''}`
    )
  } catch (error) {
    console.error('Failed to log job execution:', error)
  }
}

// ============================================================================
// EMAIL NOTIFICATION (PLACEHOLDER)
// ============================================================================

async function sendFinancialSummaryEmail(
  snapshot: any,
  previousSnapshot: any
): Promise<void> {
  // TODO: Implement email service integration
  // Example using nodemailer or SendGrid:
  /*
  const emailContent = `
    Daily Financial Summary - ${snapshot.date.toISOString().split('T')[0]}

    Total Inventory Value: $${snapshot.totalInventoryValue.toLocaleString()}
    WIP Value: $${snapshot.wipValue.toLocaleString()}
    Projected Costs (30 days): $${snapshot.projectedCosts30Days.toLocaleString()}

    Average Daily Production Cost: $${snapshot.averageDailyProductionCost.toLocaleString()}
    Inventory Turnover Ratio: ${snapshot.inventoryTurnoverRatio.toFixed(2)}
    Days of Inventory on Hand: ${snapshot.daysOfInventoryOnHand.toFixed(0)}

    ${previousSnapshot ? `
    Changes from Previous Day:
    - Inventory: ${((snapshot.totalInventoryValue - previousSnapshot.totalInventoryValue) / previousSnapshot.totalInventoryValue * 100).toFixed(1)}%
    - WIP: ${((snapshot.wipValue - previousSnapshot.wipValue) / previousSnapshot.wipValue * 100).toFixed(1)}%
    ` : ''}
  `

  await emailService.send({
    to: 'finance@company.com',
    subject: 'Daily Financial Summary',
    text: emailContent
  })
  */

  console.log('  → Email notification would be sent here (not implemented)')
}

// ============================================================================
// CRON SCHEDULER
// ============================================================================

/**
 * Initialize and start the cron job
 * Call this from your application startup
 */
export function startDailyFinancialSnapshotJob(): void {
  console.log(`Scheduling daily financial snapshot job (${CRON_SCHEDULE})...`)

  cron.schedule(
    CRON_SCHEDULE,
    async () => {
      try {
        await runDailyFinancialSnapshot()
      } catch (error) {
        console.error('Cron job execution failed:', error)
      }
    },
    {
      timezone: 'America/New_York', // Adjust to your timezone
    }
  )

  console.log('✓ Daily financial snapshot job scheduled successfully')
}

/**
 * Run the job immediately (for testing)
 */
export async function runNow(): Promise<void> {
  console.log('Running financial snapshot job immediately...')
  await runDailyFinancialSnapshot()
}

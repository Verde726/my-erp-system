/**
 * Scheduled Reports System
 *
 * Automated report generation using node-cron
 * - Weekly inventory report (Monday 9 AM)
 * - Monthly financial report (1st of month, 9 AM)
 * - Daily production summary (6 PM daily)
 */

import cron from 'node-cron'
import { subDays, startOfWeek, startOfMonth, format as formatDate } from 'date-fns'
import { exportInventoryReport, exportProductionReport, exportFinancialReport } from '@/lib/exporters/pdf-exporter'
import { exportToExcel } from '@/lib/exporters/excel-exporter'
import { prisma } from '@/lib/db'

// ============================================================================
// TYPES
// ============================================================================

export interface ScheduledReport {
  id: string
  name: string
  type: 'inventory' | 'production' | 'financial'
  format: 'pdf' | 'xlsx'
  schedule: string // cron expression
  enabled: boolean
  recipients: string[] // email addresses
  lastRun?: Date
  nextRun?: Date
}

export interface ReportJobResult {
  success: boolean
  reportType: string
  timestamp: Date
  filename?: string
  error?: string
}

// ============================================================================
// EMAIL DELIVERY (Placeholder - integrate with nodemailer/SendGrid)
// ============================================================================

/**
 * Send report via email
 * TODO: Integrate with actual email service (nodemailer, SendGrid, etc.)
 */
async function sendReportEmail(
  recipients: string[],
  subject: string,
  body: string,
  attachment: { filename: string; content: Buffer }
): Promise<void> {
  console.log('📧 Sending email report:')
  console.log('  To:', recipients.join(', '))
  console.log('  Subject:', subject)
  console.log('  Attachment:', attachment.filename)

  // TODO: Implement actual email sending
  // Example with nodemailer:
  // const transporter = nodemailer.createTransport({ ... })
  // await transporter.sendMail({
  //   from: process.env.SMTP_FROM,
  //   to: recipients.join(','),
  //   subject,
  //   html: body,
  //   attachments: [{
  //     filename: attachment.filename,
  //     content: attachment.content,
  //   }],
  // })

  console.log('✅ Email sent (mock)')
}

// ============================================================================
// REPORT GENERATORS
// ============================================================================

/**
 * Generate weekly inventory report
 */
async function generateWeeklyInventoryReport(): Promise<ReportJobResult> {
  try {
    console.log('📊 Generating weekly inventory report...')

    const endDate = new Date()
    const startDate = startOfWeek(endDate, { weekStartsOn: 1 }) // Monday

    const dateRange = { start: startDate, end: endDate }
    const options = { includeMovements: true, groupByCategory: true }

    // Generate PDF report
    const buffer = await exportInventoryReport(dateRange, options)
    const filename = `inventory_weekly_${formatDate(startDate, 'yyyy-MM-dd')}_to_${formatDate(endDate, 'yyyy-MM-dd')}.pdf`

    // Send to recipients
    await sendReportEmail(
      [process.env.INVENTORY_REPORT_RECIPIENTS || 'operations@company.com'],
      `Weekly Inventory Report - ${formatDate(endDate, 'MMM dd, yyyy')}`,
      `
        <h2>Weekly Inventory Report</h2>
        <p>Period: ${formatDate(startDate, 'MMM dd, yyyy')} - ${formatDate(endDate, 'MMM dd, yyyy')}</p>
        <p>This report includes:</p>
        <ul>
          <li>Current inventory levels</li>
          <li>Stock movements for the week</li>
          <li>Items grouped by category</li>
          <li>Low stock warnings</li>
        </ul>
      `,
      { filename, content: buffer }
    )

    return {
      success: true,
      reportType: 'weekly_inventory',
      timestamp: new Date(),
      filename,
    }
  } catch (error: any) {
    console.error('Error generating weekly inventory report:', error)
    return {
      success: false,
      reportType: 'weekly_inventory',
      timestamp: new Date(),
      error: error.message,
    }
  }
}

/**
 * Generate monthly financial report
 */
async function generateMonthlyFinancialReport(): Promise<ReportJobResult> {
  try {
    console.log('💰 Generating monthly financial report...')

    const endDate = new Date()
    const startDate = startOfMonth(endDate)

    const dateRange = { start: startDate, end: endDate }

    // Generate PDF report
    const pdfBuffer = await exportFinancialReport(dateRange)
    const pdfFilename = `financial_monthly_${formatDate(startDate, 'yyyy-MM')}.pdf`

    // Also generate Excel with detailed data
    const metrics = await prisma.financialMetrics.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    })

    const bomItems = await prisma.bomItem.findMany()

    const excelBuffer = await exportToExcel(
      {
        'Financial Metrics': metrics,
        'Inventory Valuation': bomItems,
      },
      `financial_monthly_${formatDate(startDate, 'yyyy-MM')}.xlsx`
    )

    // Send to recipients
    await sendReportEmail(
      [process.env.FINANCIAL_REPORT_RECIPIENTS || 'finance@company.com,cfo@company.com'],
      `Monthly Financial Report - ${formatDate(startDate, 'MMMM yyyy')}`,
      `
        <h2>Monthly Financial Report</h2>
        <p>Period: ${formatDate(startDate, 'MMMM yyyy')}</p>
        <p>This report includes:</p>
        <ul>
          <li>PDF Summary Report with key metrics and charts</li>
          <li>Excel Workbook with detailed financial data</li>
          <li>Inventory valuation breakdown</li>
          <li>Cost variance analysis</li>
        </ul>
      `,
      { filename: pdfFilename, content: pdfBuffer }
    )

    return {
      success: true,
      reportType: 'monthly_financial',
      timestamp: new Date(),
      filename: pdfFilename,
    }
  } catch (error: any) {
    console.error('Error generating monthly financial report:', error)
    return {
      success: false,
      reportType: 'monthly_financial',
      timestamp: new Date(),
      error: error.message,
    }
  }
}

/**
 * Generate daily production summary
 */
async function generateDailyProductionSummary(): Promise<ReportJobResult> {
  try {
    console.log('🏭 Generating daily production summary...')

    const endDate = new Date()
    const startDate = subDays(endDate, 1) // Yesterday

    const dateRange = { start: startDate, end: endDate }

    // Generate PDF report
    const buffer = await exportProductionReport(dateRange)
    const filename = `production_daily_${formatDate(startDate, 'yyyy-MM-dd')}.pdf`

    // Send to recipients
    await sendReportEmail(
      [process.env.PRODUCTION_REPORT_RECIPIENTS || 'production@company.com,operations@company.com'],
      `Daily Production Summary - ${formatDate(startDate, 'MMM dd, yyyy')}`,
      `
        <h2>Daily Production Summary</h2>
        <p>Date: ${formatDate(startDate, 'MMMM dd, yyyy')}</p>
        <p>This report includes:</p>
        <ul>
          <li>Production schedules completed</li>
          <li>Throughput metrics and performance</li>
          <li>Resource utilization</li>
          <li>Issues and alerts</li>
        </ul>
      `,
      { filename, content: buffer }
    )

    return {
      success: true,
      reportType: 'daily_production',
      timestamp: new Date(),
      filename,
    }
  } catch (error: any) {
    console.error('Error generating daily production summary:', error)
    return {
      success: false,
      reportType: 'daily_production',
      timestamp: new Date(),
      error: error.message,
    }
  }
}

// ============================================================================
// CRON JOBS
// ============================================================================

let cronJobs: Map<string, cron.ScheduledTask> = new Map()

/**
 * Start all scheduled report jobs
 */
export function startScheduledReports(): void {
  console.log('🕒 Starting scheduled report jobs...')

  // Weekly inventory report - Monday at 9:00 AM
  const weeklyInventory = cron.schedule('0 9 * * 1', async () => {
    console.log('⏰ Triggered: Weekly Inventory Report')
    const result = await generateWeeklyInventoryReport()
    console.log('Result:', result)
  }, {
    scheduled: true,
    timezone: 'America/New_York', // TODO: Configure timezone
  })
  cronJobs.set('weekly_inventory', weeklyInventory)

  // Monthly financial report - 1st of month at 9:00 AM
  const monthlyFinancial = cron.schedule('0 9 1 * *', async () => {
    console.log('⏰ Triggered: Monthly Financial Report')
    const result = await generateMonthlyFinancialReport()
    console.log('Result:', result)
  }, {
    scheduled: true,
    timezone: 'America/New_York',
  })
  cronJobs.set('monthly_financial', monthlyFinancial)

  // Daily production summary - Every day at 6:00 PM
  const dailyProduction = cron.schedule('0 18 * * *', async () => {
    console.log('⏰ Triggered: Daily Production Summary')
    const result = await generateDailyProductionSummary()
    console.log('Result:', result)
  }, {
    scheduled: true,
    timezone: 'America/New_York',
  })
  cronJobs.set('daily_production', dailyProduction)

  console.log('✅ Scheduled report jobs started:')
  console.log('  - Weekly Inventory: Mondays at 9:00 AM')
  console.log('  - Monthly Financial: 1st of month at 9:00 AM')
  console.log('  - Daily Production: Every day at 6:00 PM')
}

/**
 * Stop all scheduled report jobs
 */
export function stopScheduledReports(): void {
  console.log('🛑 Stopping scheduled report jobs...')
  cronJobs.forEach((job, name) => {
    job.stop()
    console.log(`  - Stopped: ${name}`)
  })
  cronJobs.clear()
  console.log('✅ All scheduled report jobs stopped')
}

/**
 * Get status of all scheduled jobs
 */
export function getScheduledReportsStatus(): Record<string, boolean> {
  const status: Record<string, boolean> = {}
  cronJobs.forEach((job, name) => {
    // Check if job exists and is running
    status[name] = cronJobs.has(name)
  })
  return status
}

/**
 * Manually trigger a report (for testing or on-demand generation)
 */
export async function triggerReport(reportType: string): Promise<ReportJobResult> {
  switch (reportType) {
    case 'weekly_inventory':
      return generateWeeklyInventoryReport()
    case 'monthly_financial':
      return generateMonthlyFinancialReport()
    case 'daily_production':
      return generateDailyProductionSummary()
    default:
      throw new Error(`Unknown report type: ${reportType}`)
  }
}

// ============================================================================
// AUTO-START (if enabled)
// ============================================================================

// Automatically start scheduled reports in production
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_SCHEDULED_REPORTS === 'true') {
  startScheduledReports()
}

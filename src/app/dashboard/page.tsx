'use client'

/**
 * Executive Dashboard Page
 *
 * Single-pane-of-glass view for C-suite executives providing:
 * - Real-time KPIs
 * - Production schedules and timelines
 * - Inventory status
 * - Active alerts and material requirements
 */

import { useEffect, useState } from 'react'
import { KPICard } from '@/components/dashboard/KPICard'
import { ProductionTimeline } from '@/components/dashboard/ProductionTimeline'
import { ThroughputChart } from '@/components/dashboard/ThroughputChart'
import { InventoryBarChart } from '@/components/dashboard/InventoryBarChart'
import { MaterialRequirementsTable } from '@/components/dashboard/MaterialRequirementsTable'
import { AlertsTable } from '@/components/dashboard/AlertsTable'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Factory,
  Package,
  AlertTriangle,
  DollarSign,
  Settings,
  Bell,
  User,
  LogOut,
  Upload,
  FileSpreadsheet,
  Plus,
  Calendar,
} from 'lucide-react'
import { format } from 'date-fns'

// ============================================================================
// MOCK DATA (Replace with actual API calls)
// ============================================================================

const mockKPIs = {
  production: {
    unitsToday: 1247,
    scheduleAdherence: 92,
    nextProduction: {
      productName: 'HUSH 1.0g Cart',
      startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    },
  },
  inventory: {
    totalValue: 245890,
    itemsBelowReorder: 12,
    daysRemaining: 18,
  },
  alerts: {
    criticalCount: 3,
    warningCount: 7,
    pendingActions: 5,
  },
  financial: {
    productionCostToday: 8450,
    costVariance: -3.2,
    wipValue: 45600,
  },
}

const mockSchedules = [
  {
    scheduleId: 'SCH-001',
    productName: 'HUSH 1.0g Cart',
    productSku: 'HUSH-1G',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    unitsToProducePerDay: 500,
    workstationId: 'WS-01',
    priority: 'high' as const,
    capacityUtilization: 95,
  },
  {
    scheduleId: 'SCH-002',
    productName: 'HUSTLE 1.0g AIO',
    productSku: 'HUSTLE-1G',
    startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    unitsToProducePerDay: 350,
    workstationId: 'WS-02',
    priority: 'medium' as const,
    capacityUtilization: 75,
  },
]

const mockThroughput = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
  actual: Math.floor(Math.random() * 200 + 400),
  planned: 450,
}))

const mockInventory = [
  {
    partNumber: 'CART-510',
    description: '510 Thread Cartridge 1.0g',
    currentStock: 50,
    reorderPoint: 200,
    safetyStock: 100,
    status: 'critical' as const,
  },
  {
    partNumber: 'OIL-DIST',
    description: 'Cannabis Distillate Oil',
    currentStock: 180,
    reorderPoint: 150,
    safetyStock: 75,
    status: 'low' as const,
  },
  {
    partNumber: 'PKG-BOX',
    description: 'Product Packaging Box',
    currentStock: 800,
    reorderPoint: 300,
    safetyStock: 150,
    status: 'healthy' as const,
  },
]

const mockRequirements = [
  {
    id: 'REQ-001',
    partNumber: 'CART-510',
    description: '510 Thread Cartridge 1.0g',
    requiredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    requiredQuantity: 500,
    availableStock: 50,
    shortage: 450,
    orderStatus: 'critical' as const,
    productName: 'HUSH 1.0g Cart',
  },
  {
    id: 'REQ-002',
    partNumber: 'OIL-DIST',
    description: 'Cannabis Distillate Oil',
    requiredDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    requiredQuantity: 350,
    availableStock: 180,
    shortage: 170,
    orderStatus: 'pending' as const,
    productName: 'HUSH 1.0g Cart',
  },
]

const mockAlerts = [
  {
    id: 'ALERT-001',
    severity: 'critical' as const,
    alertType: 'shortage',
    title: 'Critical Material Shortage',
    description: '510 Thread Cartridge stock critically low. Production at risk.',
    reference: 'CART-510',
    referenceLink: '/bom',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    status: 'active' as const,
  },
  {
    id: 'ALERT-002',
    severity: 'critical' as const,
    alertType: 'schedule_conflict',
    title: 'Schedule Exceeds Capacity',
    description: 'Workstation WS-01 scheduled at 105% capacity for next week.',
    reference: 'SCH-001',
    referenceLink: '/sales',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    status: 'active' as const,
  },
  {
    id: 'ALERT-003',
    severity: 'warning' as const,
    alertType: 'cost_overrun',
    title: 'Production Cost Variance',
    description: 'Daily production costs 8% above budget.',
    reference: 'FIN-2024-01',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    status: 'active' as const,
  },
]

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ExecutiveDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [notificationCount] = useState(10)

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          {/* Logo and Title */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Factory className="h-6 w-6 text-primary" />
              <span className="font-bold text-lg">ERP Dashboard</span>
            </div>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {format(currentTime, 'EEEE, MMMM d, yyyy • HH:mm:ss')}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="ml-auto flex items-center gap-4">
            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {notificationCount}
                </Badge>
              )}
            </Button>

            {/* Settings */}
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Executive Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        <div className="space-y-8">
          {/* Page Title */}
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Executive Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Real-time operations overview and key performance indicators
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Production Status */}
            <KPICard
              title="Production Status"
              icon={Factory}
              metrics={[
                {
                  label: 'Units Produced Today',
                  value: mockKPIs.production.unitsToday.toLocaleString(),
                  status: 'success',
                },
                {
                  label: 'Schedule Adherence',
                  value: `${mockKPIs.production.scheduleAdherence}%`,
                  status:
                    mockKPIs.production.scheduleAdherence >= 95
                      ? 'success'
                      : mockKPIs.production.scheduleAdherence >= 85
                      ? 'warning'
                      : 'danger',
                },
                {
                  label: 'Next Production',
                  value: mockKPIs.production.nextProduction?.productName || 'None',
                  sublabel: mockKPIs.production.nextProduction
                    ? format(mockKPIs.production.nextProduction.startTime, 'h:mm a')
                    : undefined,
                },
              ]}
              actionLabel="View Schedule"
              actionHref="/sales"
            />

            {/* Inventory Health */}
            <KPICard
              title="Inventory Health"
              icon={Package}
              metrics={[
                {
                  label: 'Total Inventory Value',
                  value: `$${(mockKPIs.inventory.totalValue / 1000).toFixed(0)}K`,
                  status: 'neutral',
                },
                {
                  label: 'Items Below Reorder',
                  value: mockKPIs.inventory.itemsBelowReorder,
                  status: mockKPIs.inventory.itemsBelowReorder > 0 ? 'danger' : 'success',
                  badge:
                    mockKPIs.inventory.itemsBelowReorder > 0
                      ? { text: 'Action Required', variant: 'destructive' }
                      : undefined,
                },
                {
                  label: 'Days of Inventory',
                  value: mockKPIs.inventory.daysRemaining,
                  sublabel: 'days remaining',
                  status:
                    mockKPIs.inventory.daysRemaining < 15
                      ? 'danger'
                      : mockKPIs.inventory.daysRemaining < 30
                      ? 'warning'
                      : 'success',
                },
              ]}
              actionLabel="View Inventory"
              actionHref="/bom"
            />

            {/* Active Alerts */}
            <KPICard
              title="Active Alerts"
              icon={AlertTriangle}
              metrics={[
                {
                  label: 'Critical Alerts',
                  value: mockKPIs.alerts.criticalCount,
                  status: mockKPIs.alerts.criticalCount > 0 ? 'danger' : 'success',
                  badge:
                    mockKPIs.alerts.criticalCount > 0
                      ? { text: 'Urgent', variant: 'destructive' }
                      : undefined,
                },
                {
                  label: 'Warnings',
                  value: mockKPIs.alerts.warningCount,
                  status: mockKPIs.alerts.warningCount > 0 ? 'warning' : 'neutral',
                },
                {
                  label: 'Pending Actions',
                  value: mockKPIs.alerts.pendingActions,
                },
              ]}
              actionLabel="View All Alerts"
              pulse={mockKPIs.alerts.criticalCount > 0}
            />

            {/* Financial Summary */}
            <KPICard
              title="Financial Summary"
              icon={DollarSign}
              metrics={[
                {
                  label: "Today's Production Cost",
                  value: `$${mockKPIs.financial.productionCostToday.toLocaleString()}`,
                  status: 'neutral',
                },
                {
                  label: 'Cost Variance',
                  value: `${mockKPIs.financial.costVariance > 0 ? '+' : ''}${mockKPIs.financial.costVariance.toFixed(1)}%`,
                  status: mockKPIs.financial.costVariance > 0 ? 'danger' : 'success',
                  badge:
                    Math.abs(mockKPIs.financial.costVariance) > 5
                      ? {
                          text: mockKPIs.financial.costVariance > 0 ? 'Over Budget' : 'Under Budget',
                          variant:
                            mockKPIs.financial.costVariance > 0 ? 'destructive' : 'secondary',
                        }
                      : undefined,
                },
                {
                  label: 'WIP Value',
                  value: `$${(mockKPIs.financial.wipValue / 1000).toFixed(0)}K`,
                },
              ]}
              actionLabel="View Financials"
              actionHref="/financial"
            />
          </div>

          {/* Main Content Area - Two Columns */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Production Timeline */}
              <ProductionTimeline schedules={mockSchedules} daysToShow={30} />

              {/* Throughput Trends */}
              <ThroughputChart data={mockThroughput} daysToShow={30} />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Inventory Status */}
              <InventoryBarChart items={mockInventory} maxItems={10} />

              {/* Material Requirements */}
              <MaterialRequirementsTable
                requirements={mockRequirements}
                onOrderClick={(req) => {
                  console.log('Order clicked:', req)
                  // Handle order action
                }}
              />
            </div>
          </div>

          {/* Bottom Section: Active Alerts */}
          <AlertsTable
            alerts={mockAlerts}
            onResolve={(alert) => {
              console.log('Resolve alert:', alert)
              // Handle resolve action
            }}
            onDismiss={(alert) => {
              console.log('Dismiss alert:', alert)
              // Handle dismiss action
            }}
            onView={(alert) => {
              console.log('View alert:', alert)
              // Handle view action
            }}
            onRefresh={() => {
              console.log('Refresh alerts')
              // Handle refresh
            }}
          />

          {/* Quick Actions (Floating) */}
          <div className="fixed bottom-8 right-8 flex flex-col gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="lg" className="rounded-full shadow-lg h-14 w-14">
                  <Plus className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Generate Schedule
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload BOM
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Sales Data
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Add Manual Alert
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </main>
    </div>
  )
}

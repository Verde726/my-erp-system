import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ShoppingCart, Factory, BarChart3, LayoutDashboard } from 'lucide-react'

export default function Home() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">ERP/MRP System</h1>
          <p className="text-xl text-muted-foreground">
            Enterprise Resource Planning & Manufacturing Resource Planning
          </p>
        </div>

        {/* Featured: Executive Dashboard */}
        <Link href="/dashboard" className="block mb-8">
          <Card className="hover:border-primary transition-colors cursor-pointer bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-lg bg-primary/20 flex items-center justify-center">
                  <LayoutDashboard className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-2xl">Executive Dashboard</CardTitle>
                  <CardDescription className="text-base">
                    Single-pane-of-glass view with real-time KPIs, production schedules, inventory status, and active alerts
                  </CardDescription>
                </div>
                <Button size="lg" className="ml-auto">
                  Open Dashboard
                </Button>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/bom">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center mb-4">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>Bill of Materials</CardTitle>
                <CardDescription>
                  Manage raw materials, components, and parts inventory
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Open BOM Management</Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/sales">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-950 flex items-center justify-center mb-4">
                  <ShoppingCart className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>Sales & Production Planning</CardTitle>
                <CardDescription>
                  Import sales forecasts and generate production schedules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Open Sales Planning</Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/mrp">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center mb-4">
                  <Factory className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>Material Requirements Planning</CardTitle>
                <CardDescription>
                  Calculate material needs for production schedules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Open MRP Calculator</Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/financial">
            <Card className="hover:border-primary transition-colors cursor-pointer h-full">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-950 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Financial Dashboard</CardTitle>
                <CardDescription>
                  View financial metrics and inventory analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Open Financial Dashboard</Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}

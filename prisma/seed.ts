/**
 * Prisma Database Seed Script
 *
 * Populates the database with realistic test data for:
 * - BOM Items (Raw Materials & Components)
 * - Products (Finished Goods)
 * - Product BOMs (Relationships)
 * - Sales Orders
 * - Production Schedules
 * - Throughput Data
 * - Inventory Movements
 * - Financial Metrics
 * - Alerts
 *
 * Run with: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data (in reverse order of dependencies)
  console.log('🗑️  Clearing existing data...')
  await prisma.alert.deleteMany()
  await prisma.financialMetrics.deleteMany()
  await prisma.inventoryMovement.deleteMany()
  await prisma.throughputData.deleteMany()
  await prisma.materialRequirement.deleteMany()
  await prisma.productionSchedule.deleteMany()
  await prisma.salesOrder.deleteMany()
  await prisma.productBom.deleteMany()
  await prisma.product.deleteMany()
  await prisma.bomItem.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.user.deleteMany()

  console.log('✅ Cleared existing data')

  // ============================================================================
  // 1. USERS
  // ============================================================================
  console.log('👤 Creating users...')

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@erp.com',
        name: 'Admin User',
        role: 'admin',
      },
    }),
    prisma.user.create({
      data: {
        email: 'manager@erp.com',
        name: 'Production Manager',
        role: 'manager',
      },
    }),
    prisma.user.create({
      data: {
        email: 'operator@erp.com',
        name: 'Shop Floor Operator',
        role: 'operator',
      },
    }),
  ])

  console.log(`✅ Created ${users.length} users`)

  // ============================================================================
  // 2. CUSTOMERS
  // ============================================================================
  console.log('🏢 Creating customers...')

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Tech Solutions Inc',
        email: 'orders@techsolutions.com',
        phone: '555-0101',
        address: '123 Tech Street, Silicon Valley, CA 94025',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Global Manufacturing Co',
        email: 'procurement@globalmanuf.com',
        phone: '555-0102',
        address: '456 Industry Blvd, Detroit, MI 48201',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Retail Distributors LLC',
        email: 'buying@retaildist.com',
        phone: '555-0103',
        address: '789 Commerce Dr, New York, NY 10001',
      },
    }),
  ])

  console.log(`✅ Created ${customers.length} customers`)

  // ============================================================================
  // 3. SUPPLIERS
  // ============================================================================
  console.log('📦 Creating suppliers...')

  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: 'Steel & Metal Supply Co',
        email: 'sales@steelsupply.com',
        phone: '555-0201',
        address: '111 Industrial Park, Pittsburgh, PA 15222',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Electronics Components Ltd',
        email: 'orders@electrocomponents.com',
        phone: '555-0202',
        address: '222 Tech Way, San Jose, CA 95110',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Plastics & Polymers Inc',
        email: 'info@plasticspolymers.com',
        phone: '555-0203',
        address: '333 Chemical Rd, Houston, TX 77002',
      },
    }),
    prisma.supplier.create({
      data: {
        name: 'Packaging Solutions',
        email: 'sales@packagingsolutions.com',
        phone: '555-0204',
        address: '444 Box Lane, Memphis, TN 38103',
      },
    }),
  ])

  console.log(`✅ Created ${suppliers.length} suppliers`)

  // ============================================================================
  // 4. BOM ITEMS (Raw Materials & Components)
  // ============================================================================
  console.log('🔩 Creating BOM items...')

  const bomItems = await Promise.all([
    // Electronics Components
    prisma.bomItem.create({
      data: {
        partNumber: 'PCB-001',
        leadTimeDays: 14,
        description: 'Main Circuit Board - Model A',
        quantityPerUnit: 1,
        currentStock: 450,
        unitCost: 25.50,
        supplier: 'Electronics Components Ltd',
        reorderPoint: 100,
        category: 'Electronics',
        safetyStock: 50,
      },
    }),
    prisma.bomItem.create({
      data: {
        partNumber: 'RES-100',
        leadTimeDays: 7,
        description: '100Ω Resistor Pack (100 units)',
        quantityPerUnit: 1,
        currentStock: 2500,
        unitCost: 0.50,
        supplier: 'Electronics Components Ltd',
        reorderPoint: 500,
        category: 'Electronics',
        safetyStock: 200,
      },
    }),
    prisma.bomItem.create({
      data: {
        partNumber: 'CAP-047',
        leadTimeDays: 7,
        description: '0.47µF Capacitor Pack (50 units)',
        quantityPerUnit: 1,
        currentStock: 1800,
        unitCost: 0.75,
        supplier: 'Electronics Components Ltd',
        reorderPoint: 400,
        category: 'Electronics',
        safetyStock: 150,
      },
    }),
    prisma.bomItem.create({
      data: {
        partNumber: 'IC-555',
        leadTimeDays: 14,
        description: '555 Timer IC',
        quantityPerUnit: 1,
        currentStock: 850,
        unitCost: 1.25,
        supplier: 'Electronics Components Ltd',
        reorderPoint: 200,
        category: 'Electronics',
        safetyStock: 100,
      },
    }),

    // Metal Components
    prisma.bomItem.create({
      data: {
        partNumber: 'STEEL-SHEET-001',
        leadTimeDays: 7,
        description: 'Steel Sheet 1mm x 1m x 2m',
        quantityPerUnit: 1,
        currentStock: 120,
        unitCost: 45.00,
        supplier: 'Steel & Metal Supply Co',
        reorderPoint: 30,
        category: 'Metal',
        safetyStock: 15,
      },
    }),
    prisma.bomItem.create({
      data: {
        partNumber: 'ALU-PLATE-002',
        leadTimeDays: 7,
        description: 'Aluminum Plate 2mm x 500mm x 500mm',
        quantityPerUnit: 1,
        currentStock: 200,
        unitCost: 32.00,
        supplier: 'Steel & Metal Supply Co',
        reorderPoint: 50,
        category: 'Metal',
        safetyStock: 25,
      },
    }),
    prisma.bomItem.create({
      data: {
        partNumber: 'BRACKET-M8',
        leadTimeDays: 10,
        description: 'M8 Mounting Bracket - Stainless Steel',
        quantityPerUnit: 1,
        currentStock: 800,
        unitCost: 3.50,
        supplier: 'Steel & Metal Supply Co',
        reorderPoint: 200,
        category: 'Hardware',
        safetyStock: 100,
      },
    }),
    prisma.bomItem.create({
      data: {
        partNumber: 'SCREW-M8-50',
        leadTimeDays: 5,
        description: 'M8x50mm Hex Bolt (Pack of 100)',
        quantityPerUnit: 1,
        currentStock: 1500,
        unitCost: 12.00,
        supplier: 'Steel & Metal Supply Co',
        reorderPoint: 300,
        category: 'Hardware',
        safetyStock: 150,
      },
    }),

    // Plastic Components
    prisma.bomItem.create({
      data: {
        partNumber: 'CASE-PLASTIC-A',
        leadTimeDays: 10,
        description: 'Plastic Enclosure Case - Type A',
        quantityPerUnit: 1,
        currentStock: 600,
        unitCost: 8.75,
        supplier: 'Plastics & Polymers Inc',
        reorderPoint: 150,
        category: 'Plastics',
        safetyStock: 75,
      },
    }),
    prisma.bomItem.create({
      data: {
        partNumber: 'CASE-PLASTIC-B',
        leadTimeDays: 10,
        description: 'Plastic Enclosure Case - Type B (Premium)',
        quantityPerUnit: 1,
        currentStock: 400,
        unitCost: 12.50,
        supplier: 'Plastics & Polymers Inc',
        reorderPoint: 100,
        category: 'Plastics',
        safetyStock: 50,
      },
    }),
    prisma.bomItem.create({
      data: {
        partNumber: 'BUTTON-RED',
        leadTimeDays: 14,
        description: 'Red Push Button',
        quantityPerUnit: 1,
        currentStock: 1200,
        unitCost: 1.50,
        supplier: 'Plastics & Polymers Inc',
        reorderPoint: 300,
        category: 'Plastics',
        safetyStock: 150,
      },
    }),
    prisma.bomItem.create({
      data: {
        partNumber: 'BUTTON-GREEN',
        leadTimeDays: 14,
        description: 'Green Push Button',
        quantityPerUnit: 1,
        currentStock: 1100,
        unitCost: 1.50,
        supplier: 'Plastics & Polymers Inc',
        reorderPoint: 300,
        category: 'Plastics',
        safetyStock: 150,
      },
    }),

    // Packaging Materials
    prisma.bomItem.create({
      data: {
        partNumber: 'BOX-SMALL',
        leadTimeDays: 5,
        description: 'Small Cardboard Box 10x10x10cm',
        quantityPerUnit: 1,
        currentStock: 2000,
        unitCost: 0.50,
        supplier: 'Packaging Solutions',
        reorderPoint: 500,
        category: 'Packaging',
        safetyStock: 250,
      },
    }),
    prisma.bomItem.create({
      data: {
        partNumber: 'BOX-MEDIUM',
        leadTimeDays: 5,
        description: 'Medium Cardboard Box 20x20x20cm',
        quantityPerUnit: 1,
        currentStock: 1500,
        unitCost: 0.85,
        supplier: 'Packaging Solutions',
        reorderPoint: 400,
        category: 'Packaging',
        safetyStock: 200,
      },
    }),
    prisma.bomItem.create({
      data: {
        partNumber: 'LABEL-WARNING',
        description: 'Warning Label Sticker (100 pack)',
        quantityPerUnit: 1,
        currentStock: 800,
        unitCost: 5.00,
        supplier: 'Packaging Solutions',
        reorderPoint: 200,
        leadTimeDays: 7,
        category: 'Packaging',
        safetyStock: 100,
      },
    }),
    prisma.bomItem.create({
      data: {
        partNumber: 'MANUAL-EN',
        description: 'User Manual - English (100 pack)',
        quantityPerUnit: 1,
        currentStock: 600,
        unitCost: 15.00,
        supplier: 'Packaging Solutions',
        reorderPoint: 150,
        leadTimeDays: 10,
        category: 'Packaging',
        safetyStock: 75,
      },
    }),

    // Low stock items (for testing alerts)
    prisma.bomItem.create({
      data: {
        partNumber: 'LED-BLUE',
        description: 'Blue LED 5mm',
        quantityPerUnit: 1,
        currentStock: 85, // Below reorder point!
        unitCost: 0.35,
        supplier: 'Electronics Components Ltd',
        reorderPoint: 100,
        leadTimeDays: 14,
        category: 'Electronics',
        safetyStock: 50,
      },
    }),
    prisma.bomItem.create({
      data: {
        partNumber: 'CABLE-USB',
        description: 'USB Cable 1.5m',
        quantityPerUnit: 1,
        currentStock: 45, // Below reorder point!
        unitCost: 2.50,
        supplier: 'Electronics Components Ltd',
        reorderPoint: 50,
        leadTimeDays: 10,
        category: 'Electronics',
        safetyStock: 25,
      },
    }),
  ])

  console.log(`✅ Created ${bomItems.length} BOM items`)

  // ============================================================================
  // 5. PRODUCTS (Finished Goods)
  // ============================================================================
  console.log('📦 Creating products...')

  const products = await Promise.all([
    prisma.product.create({
      data: {
        sku: 'CTRL-UNIT-100',
        name: 'Control Unit Model 100',
        description: 'Basic control unit with standard features',
        category: 'Control Systems',
        targetMargin: 0.35,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'CTRL-UNIT-200',
        name: 'Control Unit Model 200',
        description: 'Advanced control unit with premium features and LED indicators',
        category: 'Control Systems',
        targetMargin: 0.40,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'SENSOR-PACK-A',
        name: 'Sensor Package A',
        description: 'Industrial sensor package for temperature and pressure monitoring',
        category: 'Sensors',
        targetMargin: 0.30,
      },
    }),
    prisma.product.create({
      data: {
        sku: 'PANEL-CTRL-50',
        name: 'Control Panel 50 Series',
        description: 'Wall-mounted control panel with buttons and display',
        category: 'Control Panels',
        targetMargin: 0.38,
      },
    }),
  ])

  console.log(`✅ Created ${products.length} products`)

  // ============================================================================
  // 6. PRODUCT BOMs (Bill of Materials Relationships)
  // ============================================================================
  console.log('🔗 Creating product BOM relationships...')

  const productBoms = await Promise.all([
    // CTRL-UNIT-100 BOM
    prisma.productBom.create({
      data: {
        productId: products[0].id,
        partNumber: 'PCB-001',
        quantityNeeded: 1,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[0].id,
        partNumber: 'RES-100',
        quantityNeeded: 2,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[0].id,
        partNumber: 'CAP-047',
        quantityNeeded: 3,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[0].id,
        partNumber: 'IC-555',
        quantityNeeded: 2,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[0].id,
        partNumber: 'CASE-PLASTIC-A',
        quantityNeeded: 1,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[0].id,
        partNumber: 'SCREW-M8-50',
        quantityNeeded: 1,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[0].id,
        partNumber: 'BOX-SMALL',
        quantityNeeded: 1,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[0].id,
        partNumber: 'MANUAL-EN',
        quantityNeeded: 1,
      },
    }),

    // CTRL-UNIT-200 BOM (Premium model with more components)
    prisma.productBom.create({
      data: {
        productId: products[1].id,
        partNumber: 'PCB-001',
        quantityNeeded: 1,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[1].id,
        partNumber: 'RES-100',
        quantityNeeded: 3,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[1].id,
        partNumber: 'CAP-047',
        quantityNeeded: 4,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[1].id,
        partNumber: 'IC-555',
        quantityNeeded: 3,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[1].id,
        partNumber: 'LED-BLUE', // Low stock item!
        quantityNeeded: 4,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[1].id,
        partNumber: 'CASE-PLASTIC-B',
        quantityNeeded: 1,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[1].id,
        partNumber: 'BUTTON-RED',
        quantityNeeded: 1,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[1].id,
        partNumber: 'BUTTON-GREEN',
        quantityNeeded: 1,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[1].id,
        partNumber: 'CABLE-USB', // Low stock item!
        quantityNeeded: 1,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[1].id,
        partNumber: 'BOX-MEDIUM',
        quantityNeeded: 1,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[1].id,
        partNumber: 'MANUAL-EN',
        quantityNeeded: 1,
      },
    }),

    // SENSOR-PACK-A BOM
    prisma.productBom.create({
      data: {
        productId: products[2].id,
        partNumber: 'PCB-001',
        quantityNeeded: 1,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[2].id,
        partNumber: 'RES-100',
        quantityNeeded: 4,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[2].id,
        partNumber: 'CAP-047',
        quantityNeeded: 5,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[2].id,
        partNumber: 'CASE-PLASTIC-A',
        quantityNeeded: 1,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[2].id,
        partNumber: 'BOX-SMALL',
        quantityNeeded: 1,
      },
    }),

    // PANEL-CTRL-50 BOM
    prisma.productBom.create({
      data: {
        productId: products[3].id,
        partNumber: 'ALU-PLATE-002',
        quantityNeeded: 1,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[3].id,
        partNumber: 'PCB-001',
        quantityNeeded: 2,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[3].id,
        partNumber: 'BUTTON-RED',
        quantityNeeded: 3,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[3].id,
        partNumber: 'BUTTON-GREEN',
        quantityNeeded: 3,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[3].id,
        partNumber: 'BRACKET-M8',
        quantityNeeded: 4,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[3].id,
        partNumber: 'SCREW-M8-50',
        quantityNeeded: 2,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[3].id,
        partNumber: 'BOX-MEDIUM',
        quantityNeeded: 1,
      },
    }),
    prisma.productBom.create({
      data: {
        productId: products[3].id,
        partNumber: 'LABEL-WARNING',
        quantityNeeded: 1,
      },
    }),
  ])

  console.log(`✅ Created ${productBoms.length} product BOM relationships`)

  // ============================================================================
  // 7. SALES ORDERS
  // ============================================================================
  console.log('📊 Creating sales orders...')

  const now = new Date()
  const salesOrders = await Promise.all([
    // Recent orders (this week)
    prisma.salesOrder.create({
      data: {
        orderId: 'SO-2025-001',
        productId: products[0].id,
        forecastedUnits: 100,
        timePeriod: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        priority: 'high',
        customerSegment: 'Enterprise',
        status: 'confirmed',
      },
    }),
    prisma.salesOrder.create({
      data: {
        orderId: 'SO-2025-002',
        productId: products[1].id,
        forecastedUnits: 50,
        timePeriod: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        priority: 'high',
        customerSegment: 'Enterprise',
        status: 'confirmed',
      },
    }),
    prisma.salesOrder.create({
      data: {
        orderId: 'SO-2025-003',
        productId: products[2].id,
        forecastedUnits: 75,
        timePeriod: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        priority: 'medium',
        customerSegment: 'SMB',
        status: 'pending',
      },
    }),

    // Future orders (next 2 weeks)
    prisma.salesOrder.create({
      data: {
        orderId: 'SO-2025-004',
        productId: products[0].id,
        forecastedUnits: 150,
        timePeriod: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
        priority: 'medium',
        customerSegment: 'Enterprise',
        status: 'pending',
      },
    }),
    prisma.salesOrder.create({
      data: {
        orderId: 'SO-2025-005',
        productId: products[3].id,
        forecastedUnits: 30,
        timePeriod: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
        priority: 'low',
        customerSegment: 'SMB',
        status: 'pending',
      },
    }),
    prisma.salesOrder.create({
      data: {
        orderId: 'SO-2025-006',
        productId: products[1].id,
        forecastedUnits: 80,
        timePeriod: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        priority: 'high',
        customerSegment: 'Enterprise',
        status: 'pending',
      },
    }),

    // Forecast for next month
    prisma.salesOrder.create({
      data: {
        orderId: 'SO-2025-007',
        productId: products[0].id,
        forecastedUnits: 200,
        timePeriod: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
        priority: 'medium',
        customerSegment: 'Enterprise',
        status: 'forecast',
      },
    }),
    prisma.salesOrder.create({
      data: {
        orderId: 'SO-2025-008',
        productId: products[2].id,
        forecastedUnits: 120,
        timePeriod: new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000),
        priority: 'medium',
        customerSegment: 'SMB',
        status: 'forecast',
      },
    }),
  ])

  console.log(`✅ Created ${salesOrders.length} sales orders`)

  // ============================================================================
  // 8. PRODUCTION SCHEDULES
  // ============================================================================
  console.log('🏭 Creating production schedules...')

  const productionSchedules = await Promise.all([
    // Active/In-Progress Schedules
    prisma.productionSchedule.create({
      data: {
        scheduleId: 'SCHED-2025-001',
        productId: products[0].id,
        unitsToProducePerDay: 100,
        actualUnitsProduced: 45,
        startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // Started 2 days ago
        endDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000), // Ends tomorrow
        workstationId: 'Assembly Line 1',
        shiftNumber: 1,
        status: 'in-progress',
      },
    }),
    prisma.productionSchedule.create({
      data: {
        scheduleId: 'SCHED-2025-002',
        productId: products[1].id,
        unitsToProducePerDay: 50,
        actualUnitsProduced: 0,
        startDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
        workstationId: 'Assembly Line 2',
        shiftNumber: 1,
        status: 'scheduled',
      },
    }),

    // Completed Schedules
    prisma.productionSchedule.create({
      data: {
        scheduleId: 'SCHED-2025-003',
        productId: products[0].id,
        unitsToProducePerDay: 80,
        actualUnitsProduced: 80,
        startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        workstationId: 'Assembly Line 1',
        shiftNumber: 1,
        status: 'completed',
      },
    }),
    prisma.productionSchedule.create({
      data: {
        scheduleId: 'SCHED-2025-004',
        productId: products[2].id,
        unitsToProducePerDay: 60,
        actualUnitsProduced: 58,
        startDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        workstationId: 'Assembly Line 1',
        shiftNumber: 1,
        status: 'completed',
      },
    }),

    // Future Schedules
    prisma.productionSchedule.create({
      data: {
        scheduleId: 'SCHED-2025-005',
        productId: products[3].id,
        unitsToProducePerDay: 30,
        actualUnitsProduced: 0,
        startDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000),
        workstationId: 'Assembly Line 2',
        shiftNumber: 1,
        status: 'scheduled',
      },
    }),
  ])

  console.log(`✅ Created ${productionSchedules.length} production schedules`)

  // ============================================================================
  // 9. THROUGHPUT DATA
  // ============================================================================
  console.log('📈 Creating throughput data...')

  const throughputData = []
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)

    // Product 0 throughput (Control Unit 100)
    throughputData.push(
      prisma.throughputData.create({
        data: {
          productId: products[0].id,
          date: date,
          unitsProduced: Math.floor(15 + Math.random() * 10),
          workstationId: 'Assembly Line 1',
          hoursWorked: 8,
          defectRate: 0.02,
          efficiency: 0.85,
        },
      })
    )

    // Product 1 throughput (Control Unit 200)
    if (i % 2 === 0) {
      throughputData.push(
        prisma.throughputData.create({
          data: {
            productId: products[1].id,
            date: date,
            unitsProduced: Math.floor(8 + Math.random() * 6),
            workstationId: 'Assembly Line 2',
            hoursWorked: 8,
            defectRate: 0.02,
            efficiency: 0.85,
          },
        })
      )
    }

    // Product 2 throughput (Sensor Pack A)
    if (i % 3 === 0) {
      throughputData.push(
        prisma.throughputData.create({
          data: {
            productId: products[2].id,
            date: date,
            unitsProduced: Math.floor(20 + Math.random() * 15),
            workstationId: 'Assembly Line 1',
            hoursWorked: 8,
            defectRate: 0.02,
            efficiency: 0.85,
          },
        })
      )
    }
  }

  await Promise.all(throughputData)
  console.log(`✅ Created ${throughputData.length} throughput data records`)

  // ============================================================================
  // 10. INVENTORY MOVEMENTS
  // ============================================================================
  console.log('📦 Creating inventory movements...')

  const inventoryMovements = await Promise.all([
    // Recent stock receipts
    prisma.inventoryMovement.create({
      data: {
        partNumber: 'PCB-001',
        movementType: 'in',
        quantity: 100,
        previousStock: 350,
        newStock: 450,
        reference: 'PO-2025-001',
        reason: 'Purchase order receipt',
        timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.inventoryMovement.create({
      data: {
        partNumber: 'CASE-PLASTIC-B',
        movementType: 'in',
        quantity: 200,
        previousStock: 200,
        newStock: 400,
        reference: 'PO-2025-002',
        reason: 'Purchase order receipt',
        timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      },
    }),

    // Production consumption
    prisma.inventoryMovement.create({
      data: {
        partNumber: 'PCB-001',
        movementType: 'out',
        quantity: 80,
        previousStock: 450,
        newStock: 370,
        reference: 'SCHED-2025-003',
        reason: 'Production consumption',
        timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.inventoryMovement.create({
      data: {
        partNumber: 'CASE-PLASTIC-A',
        movementType: 'out',
        quantity: 80,
        previousStock: 680,
        newStock: 600,
        reference: 'SCHED-2025-003',
        reason: 'Production consumption',
        timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
    }),

    // Adjustments
    prisma.inventoryMovement.create({
      data: {
        partNumber: 'LED-BLUE',
        movementType: 'adjustment',
        quantity: -5,
        previousStock: 90,
        newStock: 85,
        reason: 'Cycle count adjustment - damaged units',
        timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.inventoryMovement.create({
      data: {
        partNumber: 'CABLE-USB',
        movementType: 'adjustment',
        quantity: -15,
        previousStock: 60,
        newStock: 45,
        reason: 'Inventory audit correction',
        timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    }),
  ])

  console.log(`✅ Created ${inventoryMovements.length} inventory movements`)

  // ============================================================================
  // 11. FINANCIAL METRICS
  // ============================================================================
  console.log('💰 Creating financial metrics...')

  const financialMetrics = []
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    financialMetrics.push(
      prisma.financialMetrics.create({
        data: {
          date: date,
          totalInventoryValue: 45000 + Math.random() * 5000,
          wipValue: 8000 + Math.random() * 2000,
          finishedGoodsValue: 15000 + Math.random() * 5000,
          totalMaterialCost: 12000 + Math.random() * 3000,
          productionCostEst: 18000 + Math.random() * 4000,
        },
      })
    )
  }

  await Promise.all(financialMetrics)
  console.log(`✅ Created ${financialMetrics.length} financial metrics records`)

  // ============================================================================
  // 12. ALERTS
  // ============================================================================
  console.log('🚨 Creating alerts...')

  const alerts = await Promise.all([
    // Shortage alerts
    prisma.alert.create({
      data: {
        alertType: 'shortage',
        severity: 'critical',
        title: 'Low Stock: Blue LED',
        description: 'LED-BLUE stock (85 units) is below reorder point (100 units). Immediate reorder required.',
        reference: 'LED-BLUE',
        status: 'active',
      },
    }),
    prisma.alert.create({
      data: {
        alertType: 'shortage',
        severity: 'critical',
        title: 'Low Stock: USB Cable',
        description: 'CABLE-USB stock (45 units) is below reorder point (50 units). Immediate reorder required.',
        reference: 'CABLE-USB',
        status: 'active',
      },
    }),

    // Reorder alerts
    prisma.alert.create({
      data: {
        alertType: 'reorder',
        severity: 'warning',
        title: 'Reorder Recommendation: Blue LED',
        description: 'Recommended order quantity: 150 units. Lead time: 14 days. Supplier: Electronics Components Ltd',
        reference: 'LED-BLUE',
        status: 'active',
      },
    }),

    // Production alerts
    prisma.alert.create({
      data: {
        alertType: 'capacity_warning',
        severity: 'warning',
        title: 'High Capacity Utilization: Assembly Line 1',
        description: 'Assembly Line 1 running at 95% capacity. Consider scheduling overflow to Assembly Line 2.',
        reference: 'SCHED-2025-001',
        status: 'active',
      },
    }),

    // Cost alerts
    prisma.alert.create({
      data: {
        alertType: 'cost_overrun',
        severity: 'warning',
        title: 'Production Cost Variance',
        description: 'Actual production costs 8% above planned costs this week. Review material costs and efficiency.',
        reference: 'FINANCIAL',
        status: 'resolved',
      },
    }),

    // Info alerts
    prisma.alert.create({
      data: {
        alertType: 'quality_issue',
        severity: 'info',
        title: 'Quality Report Available',
        description: 'Weekly quality report shows 2% defect rate, within acceptable limits.',
        reference: 'QA-REPORT-W42',
        status: 'resolved',
      },
    }),
  ])

  console.log(`✅ Created ${alerts.length} alerts`)

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n🎉 Database seeding completed successfully!\n')
  console.log('📊 Summary:')
  console.log(`   - ${users.length} users`)
  console.log(`   - ${customers.length} customers`)
  console.log(`   - ${suppliers.length} suppliers`)
  console.log(`   - ${bomItems.length} BOM items`)
  console.log(`   - ${products.length} products`)
  console.log(`   - ${productBoms.length} product BOM relationships`)
  console.log(`   - ${salesOrders.length} sales orders`)
  console.log(`   - ${productionSchedules.length} production schedules`)
  console.log(`   - ${throughputData.length} throughput data records`)
  console.log(`   - ${inventoryMovements.length} inventory movements`)
  console.log(`   - ${financialMetrics.length} financial metrics`)
  console.log(`   - ${alerts.length} alerts`)
  console.log('\n✅ Your ERP system is now ready for testing!')
  console.log('\n🚀 Next steps:')
  console.log('   1. Run: npm run dev')
  console.log('   2. Open: http://localhost:3000')
  console.log('   3. Explore all features with realistic data!\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })

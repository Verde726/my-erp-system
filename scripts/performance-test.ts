/**
 * Performance Testing Script
 *
 * Tests key API endpoints and operations to ensure they meet performance targets.
 * Run with: npm run perf:test
 */

interface TestResult {
  name: string;
  duration: number;
  target: number;
  passed: boolean;
  details?: string;
}

class PerformanceTester {
  private results: TestResult[] = [];
  private baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  /**
   * Test an API endpoint
   */
  async testEndpoint(
    name: string,
    path: string,
    target: number,
    method: 'GET' | 'POST' = 'GET',
    body?: any
  ): Promise<TestResult> {
    const start = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: body
          ? {
              'Content-Type': 'application/json',
            }
          : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      const duration = Date.now() - start;

      if (!response.ok) {
        return {
          name,
          duration,
          target,
          passed: false,
          details: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const result: TestResult = {
        name,
        duration,
        target,
        passed: duration < target,
        details: response.ok ? 'Success' : 'Failed',
      };

      this.results.push(result);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      const result: TestResult = {
        name,
        duration,
        target,
        passed: false,
        details: error instanceof Error ? error.message : 'Unknown error',
      };

      this.results.push(result);
      return result;
    }
  }

  /**
   * Test a local operation (no HTTP)
   */
  async testOperation(
    name: string,
    operation: () => Promise<any>,
    target: number
  ): Promise<TestResult> {
    const start = Date.now();

    try {
      await operation();
      const duration = Date.now() - start;

      const result: TestResult = {
        name,
        duration,
        target,
        passed: duration < target,
        details: 'Success',
      };

      this.results.push(result);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      const result: TestResult = {
        name,
        duration,
        target,
        passed: false,
        details: error instanceof Error ? error.message : 'Unknown error',
      };

      this.results.push(result);
      return result;
    }
  }

  /**
   * Print results
   */
  printResults(): void {
    console.log('\n' + '='.repeat(80));
    console.log('PERFORMANCE TEST RESULTS');
    console.log('='.repeat(80) + '\n');

    this.results.forEach((result) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const durStr = `${result.duration}ms`;
      const targetStr = `(target: ${result.target}ms)`;

      console.log(`${status} ${result.name}`);
      console.log(`  Duration: ${durStr} ${targetStr}`);
      if (result.details) {
        console.log(`  Details: ${result.details}`);
      }
      console.log('');
    });

    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const total = this.results.length;

    console.log('='.repeat(80));
    console.log(`SUMMARY: ${passed}/${total} passed, ${failed}/${total} failed`);
    console.log('='.repeat(80) + '\n');
  }

  /**
   * Get summary statistics
   */
  getSummary(): {
    total: number;
    passed: number;
    failed: number;
    avgDuration: number;
    slowest: TestResult | null;
  } {
    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const avgDuration =
      this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    const slowest = this.results.reduce(
      (max, r) => (r.duration > (max?.duration || 0) ? r : max),
      null as TestResult | null
    );

    return {
      total: this.results.length,
      passed,
      failed,
      avgDuration,
      slowest,
    };
  }
}

/**
 * Main test suite
 */
async function runPerformanceTests() {
  const tester = new PerformanceTester();

  console.log('\n🚀 Starting Performance Tests...\n');
  console.log('Base URL:', tester['baseUrl']);
  console.log('');

  // Test 1: Dashboard KPIs (most critical endpoint)
  console.log('Testing Dashboard KPIs endpoint...');
  await tester.testEndpoint(
    'Dashboard KPIs',
    '/api/analytics/kpis',
    500 // 500ms target
  );

  // Test 2: BOM List (paginated)
  console.log('Testing BOM List endpoint...');
  await tester.testEndpoint(
    'BOM List (50 items)',
    '/api/bom?page=0&limit=50',
    300 // 300ms target
  );

  // Test 3: Production Schedules
  console.log('Testing Production Schedules endpoint...');
  await tester.testEndpoint(
    'Production Schedules',
    '/api/schedules/production',
    400 // 400ms target
  );

  // Test 4: Active Alerts
  console.log('Testing Active Alerts endpoint...');
  await tester.testEndpoint(
    'Active Alerts',
    '/api/alerts?status=active',
    200 // 200ms target
  );

  // Test 5: Inventory Value Summary
  console.log('Testing Inventory Value endpoint...');
  await tester.testEndpoint(
    'Inventory Value Summary',
    '/api/analytics/inventory-value',
    300 // 300ms target
  );

  // Test 6: Throughput Data (30 days)
  console.log('Testing Throughput Data endpoint...');
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  await tester.testEndpoint(
    'Throughput Data (30 days)',
    `/api/analytics/throughput?start=${startDate.toISOString()}&end=${endDate.toISOString()}`,
    400 // 400ms target
  );

  // Test 7: Sales Orders by Priority
  console.log('Testing Sales Orders endpoint...');
  await tester.testEndpoint(
    'Sales Orders (High Priority)',
    '/api/sales/orders?priority=high',
    300 // 300ms target
  );

  // Print results
  tester.printResults();

  // Summary
  const summary = tester.getSummary();

  if (summary.slowest) {
    console.log('⚠️  SLOWEST OPERATION:');
    console.log(`   ${summary.slowest.name}: ${summary.slowest.duration}ms`);
    console.log('');
  }

  console.log('📊 STATISTICS:');
  console.log(`   Average Duration: ${summary.avgDuration.toFixed(2)}ms`);
  console.log(`   Pass Rate: ${((summary.passed / summary.total) * 100).toFixed(1)}%`);
  console.log('');

  // Exit with error code if any tests failed
  if (summary.failed > 0) {
    console.log('❌ Some performance tests failed!');
    process.exit(1);
  } else {
    console.log('✅ All performance tests passed!');
    process.exit(0);
  }
}

/**
 * Database query performance tests (local operations)
 */
async function runDatabaseTests() {
  const tester = new PerformanceTester();

  console.log('\n🔍 Testing Database Query Performance...\n');

  // Import prisma client
  const { prisma } = await import('../src/lib/db');

  // Test 1: Simple BOM lookup
  await tester.testOperation(
    'BOM Item Lookup (by ID)',
    async () => {
      const items = await prisma.bomItem.findMany({ take: 1 });
      if (items.length > 0) {
        await prisma.bomItem.findUnique({
          where: { id: items[0].id },
        });
      }
    },
    50 // 50ms target
  );

  // Test 2: BOM List with pagination
  await tester.testOperation(
    'BOM List (paginated, 50 items)',
    async () => {
      await prisma.bomItem.findMany({
        take: 50,
        skip: 0,
        orderBy: { partNumber: 'asc' },
      });
    },
    100 // 100ms target
  );

  // Test 3: Low stock items (filtered query)
  await tester.testOperation(
    'Low Stock Items (filtered)',
    async () => {
      await prisma.bomItem.findMany({
        where: {
          currentStock: {
            lte: 100, // Simulating reorderPoint check
          },
        },
        orderBy: { currentStock: 'asc' },
      });
    },
    100 // 100ms target
  );

  // Test 4: Active schedules with product
  await tester.testOperation(
    'Active Schedules (with joins)',
    async () => {
      await prisma.productionSchedule.findMany({
        where: {
          status: { in: ['planned', 'in-progress'] },
        },
        include: {
          product: true,
        },
      });
    },
    200 // 200ms target
  );

  // Test 5: Inventory aggregation
  await tester.testOperation(
    'Inventory Value Aggregation',
    async () => {
      await prisma.bomItem.aggregate({
        _sum: {
          currentStock: true,
        },
        where: {
          currentStock: { gt: 0 },
        },
      });
    },
    200 // 200ms target
  );

  // Test 6: Alert count by severity
  await tester.testOperation(
    'Alert Statistics (aggregation)',
    async () => {
      await Promise.all([
        prisma.alert.count({ where: { status: 'active' } }),
        prisma.alert.count({ where: { status: 'active', severity: 'critical' } }),
        prisma.alert.count({ where: { status: 'active', severity: 'warning' } }),
      ]);
    },
    200 // 200ms target
  );

  // Cleanup
  await prisma.$disconnect();

  tester.printResults();

  const summary = tester.getSummary();

  if (summary.failed > 0) {
    console.log('❌ Some database tests failed!');
    process.exit(1);
  } else {
    console.log('✅ All database tests passed!');
    process.exit(0);
  }
}

/**
 * Check if server is running
 */
async function checkServer(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3000/api/health', {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'api';

  if (testType === 'db' || testType === 'database') {
    await runDatabaseTests();
  } else if (testType === 'api') {
    console.log('Checking if development server is running...');
    const serverRunning = await checkServer();

    if (!serverRunning) {
      console.error('\n❌ ERROR: Development server is not running!');
      console.error('Please start the server first:');
      console.error('  npm run dev\n');
      console.error('Or run database tests instead:');
      console.error('  npm run perf:test db\n');
      process.exit(1);
    }

    await runPerformanceTests();
  } else {
    console.error('Unknown test type. Use "api" or "db"');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('\n❌ Test execution failed:');
  console.error(error);
  process.exit(1);
});

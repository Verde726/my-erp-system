import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Health Check Endpoint
 *
 * Returns application health status including:
 * - API availability
 * - Database connectivity
 * - System uptime
 * - Environment info
 *
 * @route GET /api/health
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Database health check
    const dbHealthCheck = await checkDatabaseHealth();

    // System info
    const systemInfo = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || "development",
    };

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      database: dbHealthCheck,
      system: {
        uptime: `${Math.floor(systemInfo.uptime)}s`,
        memory: {
          used: `${Math.round(systemInfo.memory.heapUsed / 1024 / 1024)}MB`,
          total: `${Math.round(systemInfo.memory.heapTotal / 1024 / 1024)}MB`,
        },
        nodeVersion: systemInfo.nodeVersion,
        platform: systemInfo.platform,
        environment: systemInfo.environment,
      },
      version: process.env.npm_package_version || "1.0.0",
    }, { status: 200 });

  } catch (error) {
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 503 });
  }
}

/**
 * Database Health Check
 * Tests database connectivity and measures query performance
 */
async function checkDatabaseHealth() {
  const dbStartTime = Date.now();

  try {
    // Simple query to check database connectivity
    await prisma.$queryRaw`SELECT 1`;

    const dbResponseTime = Date.now() - dbStartTime;

    // Get basic database stats
    const [
      productCount,
      bomItemCount,
      salesOrderCount,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.bomItem.count(),
      prisma.salesOrder.count(),
    ]);

    return {
      status: "connected",
      responseTime: `${dbResponseTime}ms`,
      stats: {
        products: productCount,
        bomItems: bomItemCount,
        salesOrders: salesOrderCount,
      },
    };

  } catch (error) {
    return {
      status: "disconnected",
      error: error instanceof Error ? error.message : "Database connection failed",
    };
  }
}

/**
 * Detailed Health Check (Optional)
 * More comprehensive checks for monitoring systems
 *
 * @route GET /api/health/detailed
 */
export async function HEAD() {
  // Simple ping endpoint for load balancers
  return new NextResponse(null, { status: 200 });
}

#!/usr/bin/env tsx

/**
 * Test Runner for Smart Teaching System
 * Comprehensive test execution and reporting
 */

import { AutomatedTestSuite } from './automated-test-suite'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Smart Teaching System - Automated Test Runner')
  console.log('=' .repeat(60))
  
  try {
    // Check database connection
    console.log('🔍 Checking database connection...')
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Run the automated test suite
    const testSuite = new AutomatedTestSuite()
    const report = await testSuite.runAllTests()
    
    // Determine exit code based on results
    const exitCode = report.summary.overallStatus === 'PASSED' ? 0 : 1
    
    console.log(`\n🎯 Test execution completed with status: ${report.summary.overallStatus}`)
    console.log(`📊 Success rate: ${report.summary.successRate.toFixed(1)}%`)
    
    if (report.summary.criticalFailures > 0) {
      console.log(`🚨 Critical failures detected: ${report.summary.criticalFailures}`)
    }
    
    if (report.summary.performanceIssues > 0) {
      console.log(`⚡ Performance issues detected: ${report.summary.performanceIssues}`)
    }
    
    process.exit(exitCode)
    
  } catch (error) {
    console.error('❌ Test runner failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Test runner interrupted by user')
  await prisma.$disconnect()
  process.exit(1)
})

process.on('SIGTERM', async () => {
  console.log('\n🛑 Test runner terminated')
  await prisma.$disconnect()
  process.exit(1)
})

// Run the main function
main().catch(error => {
  console.error('❌ Unhandled error:', error)
  process.exit(1)
})

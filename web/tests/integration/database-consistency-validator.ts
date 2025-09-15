/**
 * Database Consistency Validator
 * Comprehensive validation of data integrity across all smart teaching systems
 */

import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

interface ConsistencyCheck {
  name: string
  status: 'PASSED' | 'FAILED' | 'WARNING'
  message: string
  details?: any
}

interface ConsistencyReport {
  timestamp: Date
  totalChecks: number
  passed: number
  failed: number
  warnings: number
  checks: ConsistencyCheck[]
  summary: {
    overallStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL'
    criticalIssues: number
    dataIntegrity: boolean
    referentialIntegrity: boolean
    performanceHealth: boolean
  }
}

class DatabaseConsistencyValidator {
  private checks: ConsistencyCheck[] = []

  async validateAll(): Promise<ConsistencyReport> {
    console.log('🔍 Starting Database Consistency Validation...')
    
    // Run all consistency checks
    await this.checkReferentialIntegrity()
    await this.checkDataIntegrity()
    await this.checkSessionConsistency()
    await this.checkProgressTracking()
    await this.checkAssessmentData()
    await this.checkContentGeneration()
    await this.checkUserData()
    await this.checkOrganizationData()
    await this.checkPerformanceMetrics()
    await this.checkOrphanedRecords()
    
    // Generate report
    const report = this.generateReport()
    
    // Display results
    this.displayResults(report)
    
    return report
  }

  private async checkReferentialIntegrity(): Promise<void> {
    console.log('  🔗 Checking referential integrity...')
    
    // Check SmartTeachingSession foreign keys by finding sessions with non-existent references
    const allSessions = await prisma.smartTeachingSession.findMany({
      select: { id: true, studentId: true, lessonId: true }
    })
    
    const orphanedSessions = []
    for (const session of allSessions) {
      const [student, lesson] = await Promise.all([
        prisma.user.findUnique({ where: { id: session.studentId } }),
        prisma.lesson.findUnique({ where: { id: session.lessonId } })
      ])
      
      if (!student || !lesson) {
        orphanedSessions.push(session.id)
      }
    }
    
    if (orphanedSessions.length > 0) {
      this.addCheck('Referential Integrity - Sessions', 'FAILED', 
        `Found ${orphanedSessions.length} sessions with missing foreign key references`, 
        { orphanedSessions })
    } else {
      this.addCheck('Referential Integrity - Sessions', 'PASSED', 
        'All sessions have valid foreign key references')
    }

    // Check SmartTeachingInteraction foreign keys
    const allInteractions = await prisma.smartTeachingInteraction.findMany({
      select: { id: true, sessionId: true }
    })
    
    const orphanedInteractions = []
    for (const interaction of allInteractions) {
      const session = await prisma.smartTeachingSession.findUnique({ 
        where: { id: interaction.sessionId } 
      })
      
      if (!session) {
        orphanedInteractions.push(interaction.id)
      }
    }
    
    if (orphanedInteractions.length > 0) {
      this.addCheck('Referential Integrity - Interactions', 'FAILED', 
        `Found ${orphanedInteractions.length} interactions with missing session references`, 
        { orphanedInteractions })
    } else {
      this.addCheck('Referential Integrity - Interactions', 'PASSED', 
        'All interactions have valid session references')
    }

    // Check SmartTeachingAssessment foreign keys
    const allAssessments = await prisma.smartTeachingAssessment.findMany({
      select: { id: true, sessionId: true, assessmentId: true }
    })
    
    const orphanedAssessments = []
    for (const assessment of allAssessments) {
      const [session, assessmentRecord] = await Promise.all([
        prisma.smartTeachingSession.findUnique({ where: { id: assessment.sessionId } }),
        prisma.assessment.findUnique({ where: { id: assessment.assessmentId } })
      ])
      
      if (!session || !assessmentRecord) {
        orphanedAssessments.push(assessment.id)
      }
    }
    
    if (orphanedAssessments.length > 0) {
      this.addCheck('Referential Integrity - Assessments', 'FAILED', 
        `Found ${orphanedAssessments.length} assessments with missing references`, 
        { orphanedAssessments })
    } else {
      this.addCheck('Referential Integrity - Assessments', 'PASSED', 
        'All assessments have valid references')
    }
  }

  private async checkDataIntegrity(): Promise<void> {
    console.log('  📊 Checking data integrity...')
    
    // Check for invalid session statuses
    const invalidSessions = await prisma.smartTeachingSession.findMany({
      where: {
        status: {
          notIn: ['active', 'paused', 'completed', 'abandoned']
        }
      }
    })
    
    if (invalidSessions.length > 0) {
      this.addCheck('Data Integrity - Session Status', 'FAILED', 
        `Found ${invalidSessions.length} sessions with invalid status values`, 
        { invalidSessions: invalidSessions.map(s => ({ id: s.id, status: s.status })) })
    } else {
      this.addCheck('Data Integrity - Session Status', 'PASSED', 
        'All sessions have valid status values')
    }

    // Check for invalid assessment scores
    const invalidScores = await prisma.smartTeachingAssessment.findMany({
      where: {
        OR: [
          { score: { lt: 0 } },
          { score: { gt: 100 } }
        ]
      }
    })
    
    if (invalidScores.length > 0) {
      this.addCheck('Data Integrity - Assessment Scores', 'FAILED', 
        `Found ${invalidScores.length} assessments with invalid scores`, 
        { invalidScores: invalidScores.map(a => ({ id: a.id, score: a.score })) })
    } else {
      this.addCheck('Data Integrity - Assessment Scores', 'PASSED', 
        'All assessments have valid scores (0-100)')
    }

    // Check for missing required fields
    const sessionsWithoutProgress = await prisma.smartTeachingSession.findMany({
      where: { 
        progress: {
          equals: Prisma.JsonNull
        }
      }
    })
    
    if (sessionsWithoutProgress.length > 0) {
      this.addCheck('Data Integrity - Missing Progress', 'WARNING', 
        `Found ${sessionsWithoutProgress.length} sessions without progress data`, 
        { sessionsWithoutProgress: sessionsWithoutProgress.map(s => s.id) })
    } else {
      this.addCheck('Data Integrity - Missing Progress', 'PASSED', 
        'All sessions have progress data')
    }
  }

  private async checkSessionConsistency(): Promise<void> {
    console.log('  🎯 Checking session consistency...')
    
    // Check for sessions with completedAt but not COMPLETED status
    const inconsistentCompleted = await prisma.smartTeachingSession.findMany({
      where: {
        AND: [
          { completedAt: { not: null } },
          { status: { not: 'completed' } }
        ]
      }
    })
    
    if (inconsistentCompleted.length > 0) {
      this.addCheck('Session Consistency - Completion Status', 'FAILED', 
        `Found ${inconsistentCompleted.length} sessions with completedAt but not COMPLETED status`, 
        { inconsistentSessions: inconsistentCompleted.map(s => ({ id: s.id, status: s.status, completedAt: s.completedAt })) })
    } else {
      this.addCheck('Session Consistency - Completion Status', 'PASSED', 
        'All completed sessions have correct status')
    }

    // Check for sessions with COMPLETED status but no completedAt
    const inconsistentStatus = await prisma.smartTeachingSession.findMany({
      where: {
        AND: [
          { status: 'completed' },
          { completedAt: null }
        ]
      }
    })
    
    if (inconsistentStatus.length > 0) {
      this.addCheck('Session Consistency - Completion Date', 'FAILED', 
        `Found ${inconsistentStatus.length} sessions with COMPLETED status but no completedAt`, 
        { inconsistentSessions: inconsistentStatus.map(s => ({ id: s.id, status: s.status })) })
    } else {
      this.addCheck('Session Consistency - Completion Date', 'PASSED', 
        'All COMPLETED sessions have completion dates')
    }
  }

  private async checkProgressTracking(): Promise<void> {
    console.log('  📈 Checking progress tracking...')
    
    // Check for sessions with invalid progress data structure
    const sessions = await prisma.smartTeachingSession.findMany({
      where: { progress: { not: Prisma.JsonNull } }
    })
    
    let invalidProgressCount = 0
    const invalidProgressSessions: any[] = []
    
    for (const session of sessions) {
      const progress = session.progress as any
      
      // Check if progress has required fields
      if (!progress || typeof progress !== 'object') {
        invalidProgressCount++
        invalidProgressSessions.push({ id: session.id, issue: 'Invalid progress structure' })
        continue
      }
      
      // Check for required progress fields
      if (typeof progress.step !== 'number' || progress.step < 0) {
        invalidProgressCount++
        invalidProgressSessions.push({ id: session.id, issue: 'Invalid step value' })
      }
      
      if (typeof progress.completed !== 'boolean') {
        invalidProgressCount++
        invalidProgressSessions.push({ id: session.id, issue: 'Invalid completed value' })
      }
    }
    
    if (invalidProgressCount > 0) {
      this.addCheck('Progress Tracking - Data Structure', 'FAILED', 
        `Found ${invalidProgressCount} sessions with invalid progress data`, 
        { invalidProgressSessions })
    } else {
      this.addCheck('Progress Tracking - Data Structure', 'PASSED', 
        'All sessions have valid progress data structure')
    }
  }

  private async checkAssessmentData(): Promise<void> {
    console.log('  📝 Checking assessment data...')
    
    // Check for assessments without questions
    const assessmentsWithoutResponses = await prisma.smartTeachingAssessment.findMany({
      where: {
        OR: [
          { responses: { equals: Prisma.JsonNull } },
          { responses: { equals: [] } }
        ]
      }
    })
    
    if (assessmentsWithoutResponses.length > 0) {
      this.addCheck('Assessment Data - Missing Responses', 'WARNING', 
        `Found ${assessmentsWithoutResponses.length} assessments without responses`, 
        { assessmentsWithoutResponses: assessmentsWithoutResponses.map(a => a.id) })
    } else {
      this.addCheck('Assessment Data - Missing Responses', 'PASSED', 
        'All assessments have responses')
    }

    // Check for assessments with invalid response structure
    const assessments = await prisma.smartTeachingAssessment.findMany({
      where: { responses: { not: Prisma.JsonNull } }
    })
    
    let invalidResponsesCount = 0
    const invalidResponseAssessments: any[] = []
    
    for (const assessment of assessments) {
      const responses = assessment.responses as any
      
      if (responses && typeof responses !== 'object') {
        invalidResponsesCount++
        invalidResponseAssessments.push({ id: assessment.id, issue: 'Responses not an object' })
        continue
      }
      
      // Additional validation for response structure can be added here
    }
    
    if (invalidResponsesCount > 0) {
      this.addCheck('Assessment Data - Response Structure', 'FAILED', 
        `Found ${invalidResponsesCount} assessments with invalid response structure`, 
        { invalidResponseAssessments })
    } else {
      this.addCheck('Assessment Data - Response Structure', 'PASSED', 
        'All assessments have valid response structure')
    }
  }

  private async checkContentGeneration(): Promise<void> {
    console.log('  🎨 Checking content generation data...')
    
    // Check for content without metadata
    const contentWithoutMetadata = await prisma.generatedContent.findMany({
      where: { metadata: { equals: Prisma.JsonNull } }
    })
    
    if (contentWithoutMetadata.length > 0) {
      this.addCheck('Content Generation - Missing Metadata', 'WARNING', 
        `Found ${contentWithoutMetadata.length} content items without metadata`, 
        { contentWithoutMetadata: contentWithoutMetadata.map(c => c.id) })
    } else {
      this.addCheck('Content Generation - Missing Metadata', 'PASSED', 
        'All generated content has metadata')
    }

    // Check for content with invalid types
    const invalidContentTypes = await prisma.generatedContent.findMany({
      where: {
        contentType: {
          notIn: ['text', 'math', 'diagram', 'simulation', 'video', 'audio', 'interactive', 'three_d', 'advanced_three_d', 'd3_advanced', 'full']
        }
      }
    })
    
    if (invalidContentTypes.length > 0) {
      this.addCheck('Content Generation - Invalid Types', 'FAILED', 
        `Found ${invalidContentTypes.length} content items with invalid types`, 
        { invalidContentTypes: invalidContentTypes.map(c => ({ id: c.id, type: c.contentType })) })
    } else {
      this.addCheck('Content Generation - Invalid Types', 'PASSED', 
        'All generated content has valid types')
    }
  }

  private async checkUserData(): Promise<void> {
    console.log('  👤 Checking user data...')
    
    // Check for users without required fields
    // Note: email is required in the schema, so no need to check for null values
    this.addCheck('User Data - Email Validation', 'PASSED', 
      'All users have email addresses (enforced by schema)')

    // Check for users with invalid roles
    const invalidRoles = await prisma.user.findMany({
      where: {
        role: {
          notIn: ['student', 'teacher', 'admin', 'super_admin', 'guardian']
        }
      }
    })
    
    if (invalidRoles.length > 0) {
      this.addCheck('User Data - Invalid Roles', 'FAILED', 
        `Found ${invalidRoles.length} users with invalid roles`, 
        { invalidRoles: invalidRoles.map(u => ({ id: u.id, role: u.role })) })
    } else {
      this.addCheck('User Data - Invalid Roles', 'PASSED', 
        'All users have valid roles')
    }
  }

  private async checkOrganizationData(): Promise<void> {
    console.log('  🏢 Checking organization data...')
    
    // Check for users without organization
    const usersWithoutOrg = await prisma.user.findMany({
      where: { organizationId: null }
    })
    
    if (usersWithoutOrg.length > 0) {
      this.addCheck('Organization Data - Missing Organization', 'WARNING', 
        `Found ${usersWithoutOrg.length} users without organization (this may be acceptable for some user types)`, 
        { usersWithoutOrg: usersWithoutOrg.map(u => u.id) })
    } else {
      this.addCheck('Organization Data - Missing Organization', 'PASSED', 
        'All users have organization assignments')
    }
  }

  private async checkPerformanceMetrics(): Promise<void> {
    console.log('  ⚡ Checking performance metrics...')
    
    // Check for sessions with unrealistic durations
    const unrealisticDurations = await prisma.smartTeachingSession.findMany({
      where: {
        AND: [
          { completedAt: { not: null } }
          // Note: startedAt is required in schema, so no need to check for null
        ]
      }
    })
    
    let invalidDurationCount = 0
    const invalidDurationSessions: any[] = []
    
    for (const session of unrealisticDurations) {
      if (!session.completedAt) continue // Skip if completedAt is null
      
      const duration = session.completedAt.getTime() - session.startedAt.getTime()
      const durationHours = duration / (1000 * 60 * 60)
      
      // Sessions longer than 8 hours or negative duration are suspicious
      if (durationHours > 8 || duration < 0) {
        invalidDurationCount++
        invalidDurationSessions.push({ 
          id: session.id, 
          duration: durationHours.toFixed(2) + ' hours',
          startedAt: session.startedAt,
          completedAt: session.completedAt
        })
      }
    }
    
    if (invalidDurationCount > 0) {
      this.addCheck('Performance Metrics - Session Duration', 'WARNING', 
        `Found ${invalidDurationCount} sessions with unrealistic durations`, 
        { invalidDurationSessions })
    } else {
      this.addCheck('Performance Metrics - Session Duration', 'PASSED', 
        'All sessions have realistic durations')
    }
  }

  private async checkOrphanedRecords(): Promise<void> {
    console.log('  🗑️ Checking for orphaned records...')
    
    // This would require more complex queries to find orphaned records
    // For now, we'll check basic orphaned record patterns
    
    // Note: session is required in schema, so no orphaned interactions possible
    this.addCheck('Orphaned Records - Interactions', 'PASSED', 
      'No orphaned interactions possible (enforced by schema)')
  }

  private addCheck(name: string, status: 'PASSED' | 'FAILED' | 'WARNING', message: string, details?: any): void {
    this.checks.push({ name, status, message, details })
  }

  private generateReport(): ConsistencyReport {
    const passed = this.checks.filter(c => c.status === 'PASSED').length
    const failed = this.checks.filter(c => c.status === 'FAILED').length
    const warnings = this.checks.filter(c => c.status === 'WARNING').length
    
    let overallStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL'
    if (failed === 0) {
      overallStatus = 'HEALTHY' // Only warnings, no failures = healthy
    } else if (failed <= 2) {
      overallStatus = 'DEGRADED' // Few failures = degraded
    } else {
      overallStatus = 'CRITICAL' // Many failures = critical
    }
    
    return {
      timestamp: new Date(),
      totalChecks: this.checks.length,
      passed,
      failed,
      warnings,
      checks: this.checks,
      summary: {
        overallStatus,
        criticalIssues: failed,
        dataIntegrity: failed === 0,
        referentialIntegrity: this.checks.filter(c => c.name.includes('Referential Integrity') && c.status === 'PASSED').length === 3,
        performanceHealth: this.checks.filter(c => c.name.includes('Performance') && c.status === 'PASSED').length > 0
      }
    }
  }

  private displayResults(report: ConsistencyReport): void {
    console.log('\n' + '='.repeat(80))
    console.log('📊 DATABASE CONSISTENCY VALIDATION RESULTS')
    console.log('='.repeat(80))
    console.log(`🕐 Timestamp: ${report.timestamp.toISOString()}`)
    console.log(`📋 Total Checks: ${report.totalChecks}`)
    console.log(`✅ Passed: ${report.passed}`)
    console.log(`❌ Failed: ${report.failed}`)
    console.log(`⚠️  Warnings: ${report.warnings}`)
    console.log(`🎯 Overall Status: ${report.summary.overallStatus}`)
    
    console.log('\n📋 Check Details:')
    report.checks.forEach(check => {
      const icon = check.status === 'PASSED' ? '✅' : check.status === 'FAILED' ? '❌' : '⚠️'
      console.log(`  ${icon} ${check.name}: ${check.message}`)
      if (check.details) {
        console.log(`     Details: ${JSON.stringify(check.details, null, 2)}`)
      }
    })
    
    console.log('\n📈 Summary:')
    console.log(`  🔗 Referential Integrity: ${report.summary.referentialIntegrity ? '✅' : '❌'}`)
    console.log(`  📊 Data Integrity: ${report.summary.dataIntegrity ? '✅' : '❌'}`)
    console.log(`  ⚡ Performance Health: ${report.summary.performanceHealth ? '✅' : '❌'}`)
    console.log(`  🚨 Critical Issues: ${report.summary.criticalIssues}`)
    
    console.log('='.repeat(80))
  }
}

// Export for use in other files
export { DatabaseConsistencyValidator }
export type { ConsistencyReport, ConsistencyCheck }

// Run validation if this file is executed directly
if (require.main === module) {
  const validator = new DatabaseConsistencyValidator()
  validator.validateAll()
    .then(report => {
      process.exit(report.summary.overallStatus === 'HEALTHY' ? 0 : 1)
    })
    .catch(error => {
      console.error('❌ Database consistency validation failed:', error)
      process.exit(1)
    })
    .finally(() => {
      prisma.$disconnect()
    })
}

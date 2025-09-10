import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import rateLimit from "express-rate-limit";

export interface SecurityConfig {
  enableRateLimiting: boolean;
  enableInputValidation: boolean;
  enableOutputSanitization: boolean;
  enableAuditLogging: boolean;
  enableEncryption: boolean;
  enableCSP: boolean;
  enableHSTS: boolean;
  maxRequestSize: number;
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
  };
}

export interface SecurityAudit {
  id: string;
  type: 'authentication' | 'authorization' | 'data_access' | 'api_call' | 'system_event';
  userId?: string;
  action: string;
  resource: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  details: any;
  timestamp: Date;
}

export interface SecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  suspiciousActivities: number;
  failedLogins: number;
  dataBreaches: number;
  systemUptime: number;
  averageResponseTime: number;
  errorRate: number;
}

export class ProductionHardeningEngine {
  private config: SecurityConfig;
  private auditLog: SecurityAudit[] = [];

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  /**
   * Validate and sanitize user input
   */
  validateInput(input: any, type: 'string' | 'number' | 'email' | 'json'): boolean {
    if (!this.config.enableInputValidation) return true;

    try {
      switch (type) {
        case 'string':
          return typeof input === 'string' && input.length > 0 && input.length <= 10000;
        case 'number':
          return typeof input === 'number' && !isNaN(input) && isFinite(input);
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return typeof input === 'string' && emailRegex.test(input);
        case 'json':
          return typeof input === 'object' && input !== null;
        default:
          return false;
      }
    } catch (error) {
      this.logSecurityEvent('system_event', 'validation_failed', {
        input: typeof input,
        type,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Sanitize output to prevent XSS attacks
   */
  sanitizeOutput(output: string): string {
    if (!this.config.enableOutputSanitization) return output;

    return output
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/&/g, '&amp;');
  }

  /**
   * Encrypt sensitive data
   */
  encryptData(data: string, key?: string): string {
    if (!this.config.enableEncryption) return data;

    const encryptionKey = key || process.env.ENCRYPTION_KEY || 'default-key';
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, encryptionKey);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedData: string, key?: string): string {
    if (!this.config.enableEncryption) return encryptedData;

    const encryptionKey = key || process.env.ENCRYPTION_KEY || 'default-key';
    const algorithm = 'aes-256-cbc';
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipher(algorithm, encryptionKey);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Validate password strength
   */
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const policy = this.config.passwordPolicy;

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policy.requireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Rate limiting middleware
   */
  createRateLimit(options: {
    windowMs: number;
    max: number;
    message?: string;
    skipSuccessfulRequests?: boolean;
  }) {
    if (!this.config.enableRateLimiting) {
      return (req: any, res: any, next: any) => next();
    }

    return rateLimit({
      windowMs: options.windowMs,
      max: options.max,
      message: options.message || 'Too many requests, please try again later.',
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        this.logSecurityEvent('api_call', 'request_blocked', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path
        });
        res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.round(options.windowMs / 1000)
        });
      }
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    type: SecurityAudit['type'],
    action: string,
    details: any,
    userId?: string
  ): Promise<void> {
    if (!this.config.enableAuditLogging) return;

    const audit: SecurityAudit = {
      id: crypto.randomUUID(),
      type,
      userId,
      action,
      resource: details.resource || 'unknown',
      ipAddress: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown',
      success: details.success !== false,
      details,
      timestamp: new Date()
    };

    this.auditLog.push(audit);

    // Store in database
    try {
      await (prisma as any).securityAudit.create({
        data: {
          id: audit.id,
          type: audit.type,
          userId: audit.userId,
          action: audit.action,
          resource: audit.resource,
          ipAddress: audit.ipAddress,
          userAgent: audit.userAgent,
          success: audit.success,
          details: audit.details,
          timestamp: audit.timestamp
        }
      });
    } catch (error) {
      console.warn('SecurityAudit model not available yet. Run migration to enable audit logging.');
    }
  }

  /**
   * Detect suspicious activities
   */
  async detectSuspiciousActivity(
    userId: string,
    activity: {
      type: string;
      data: any;
      ipAddress: string;
      userAgent: string;
    }
  ): Promise<{ suspicious: boolean; riskLevel: 'low' | 'medium' | 'high'; reasons: string[] }> {
    const reasons: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check for multiple failed login attempts
    let recentFailedLogins = 0;
    try {
      recentFailedLogins = await (prisma as any).securityAudit.count({
        where: {
          userId,
          type: 'authentication',
          success: false,
          timestamp: {
            gte: new Date(Date.now() - 15 * 60 * 1000) // Last 15 minutes
          }
        }
      });
    } catch (error) {
      console.warn('SecurityAudit model not available yet.');
    }

    if (recentFailedLogins >= 5) {
      reasons.push('Multiple failed login attempts');
      riskLevel = 'high';
    }

    // Check for unusual IP addresses
    let userIPs: any[] = [];
    try {
      userIPs = await (prisma as any).securityAudit.findMany({
        where: {
          userId,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        select: {
          ipAddress: true
        },
        distinct: ['ipAddress']
      });
    } catch (error) {
      console.warn('SecurityAudit model not available yet.');
    }

    if (userIPs.length > 3 && !userIPs.some(ip => ip.ipAddress === activity.ipAddress)) {
      reasons.push('Unusual IP address');
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    }

    // Check for rapid API calls
    let recentAPICalls = 0;
    try {
      recentAPICalls = await (prisma as any).securityAudit.count({
        where: {
          userId,
          type: 'api_call',
          timestamp: {
            gte: new Date(Date.now() - 60 * 1000) // Last minute
          }
        }
      });
    } catch (error) {
      console.warn('SecurityAudit model not available yet.');
    }

    if (recentAPICalls >= 100) {
      reasons.push('Rapid API calls');
      riskLevel = 'high';
    }

    return {
      suspicious: reasons.length > 0,
      riskLevel,
      reasons
    };
  }

  /**
   * Generate security headers
   */
  generateSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.config.enableCSP) {
      headers['Content-Security-Policy'] = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self'",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; ');
    }

    if (this.config.enableHSTS) {
      headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload';
    }

    headers['X-Content-Type-Options'] = 'nosniff';
    headers['X-Frame-Options'] = 'DENY';
    headers['X-XSS-Protection'] = '1; mode=block';
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';
    headers['Permissions-Policy'] = 'camera=(), microphone=(), geolocation=()';

    return headers;
  }

  /**
   * Get security metrics
   */
  async getSecurityMetrics(): Promise<SecurityMetrics> {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    let totalRequests = 0, blockedRequests = 0, suspiciousActivities = 0, failedLogins = 0, dataBreaches = 0;
    
    try {
      [
        totalRequests,
        blockedRequests,
        suspiciousActivities,
        failedLogins,
        dataBreaches
      ] = await Promise.all([
        (prisma as any).securityAudit.count({
          where: { timestamp: { gte: last24Hours } }
        }),
        (prisma as any).securityAudit.count({
          where: { 
            timestamp: { gte: last24Hours },
            action: 'request_blocked'
          }
        }),
        (prisma as any).securityAudit.count({
          where: { 
            timestamp: { gte: last24Hours },
            action: 'suspicious_activity'
          }
        }),
        (prisma as any).securityAudit.count({
          where: { 
            timestamp: { gte: last24Hours },
            type: 'authentication',
            success: false
          }
        }),
        (prisma as any).securityAudit.count({
          where: { 
            timestamp: { gte: last24Hours },
            action: 'data_breach'
          }
        })
      ]);
    } catch (error) {
      console.warn('SecurityAudit model not available yet.');
    }

    return {
      totalRequests,
      blockedRequests,
      suspiciousActivities,
      failedLogins,
      dataBreaches,
      systemUptime: 99.9, // Placeholder
      averageResponseTime: 150, // Placeholder
      errorRate: blockedRequests / totalRequests || 0
    };
  }

  /**
   * Perform security audit
   */
  async performSecurityAudit(): Promise<{
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Check password policies
    if (!this.config.passwordPolicy.requireUppercase) {
      issues.push('Password policy does not require uppercase letters');
      recommendations.push('Enable uppercase letter requirement in password policy');
      score -= 10;
    }

    // Check rate limiting
    if (!this.config.enableRateLimiting) {
      issues.push('Rate limiting is disabled');
      recommendations.push('Enable rate limiting to prevent abuse');
      score -= 15;
    }

    // Check input validation
    if (!this.config.enableInputValidation) {
      issues.push('Input validation is disabled');
      recommendations.push('Enable input validation to prevent injection attacks');
      score -= 20;
    }

    // Check audit logging
    if (!this.config.enableAuditLogging) {
      issues.push('Audit logging is disabled');
      recommendations.push('Enable audit logging for security monitoring');
      score -= 15;
    }

    // Check encryption
    if (!this.config.enableEncryption) {
      issues.push('Data encryption is disabled');
      recommendations.push('Enable encryption for sensitive data');
      score -= 25;
    }

    return {
      score: Math.max(0, score),
      issues,
      recommendations
    };
  }
}

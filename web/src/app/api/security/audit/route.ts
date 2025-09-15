import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ProductionHardeningEngine, SecurityConfig } from "@/lib/security/production-hardening";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    //const type = searchParams.get('type');
    //const limit = parseInt(searchParams.get('limit') || '50');

    const securityConfig: SecurityConfig = {
      enableRateLimiting: true,
      enableInputValidation: true,
      enableOutputSanitization: true,
      enableAuditLogging: true,
      enableEncryption: true,
      enableCSP: true,
      enableHSTS: true,
      maxRequestSize: 10 * 1024 * 1024, // 10MB
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: true
      }
    };

    const engine = new ProductionHardeningEngine(securityConfig);
    
    // Get security metrics
    const metrics = await engine.getSecurityMetrics();

    return NextResponse.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error("Error fetching security audit:", error);
    return NextResponse.json(
      { error: "Failed to fetch security audit" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const securityConfig: SecurityConfig = {
      enableRateLimiting: true,
      enableInputValidation: true,
      enableOutputSanitization: true,
      enableAuditLogging: true,
      enableEncryption: true,
      enableCSP: true,
      enableHSTS: true,
      maxRequestSize: 10 * 1024 * 1024,
      sessionTimeout: 30 * 60 * 1000,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: true
      }
    };

    const engine = new ProductionHardeningEngine(securityConfig);
    let result;

    switch (action) {
      case 'security_audit':
        result = await engine.performSecurityAudit();
        break;
      case 'validate_password':
        const { password } = body;
        result = engine.validatePassword(password);
        break;
      case 'encrypt_data':
        const { data, key } = body;
        result = { encrypted: engine.encryptData(data, key) };
        break;
      case 'decrypt_data':
        const { encryptedData, decryptKey } = body;
        result = { decrypted: engine.decryptData(encryptedData, decryptKey) };
        break;
      default:
        return NextResponse.json(
          { error: "Invalid security action" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error("Error performing security action:", error);
    return NextResponse.json(
      { error: "Failed to perform security action" },
      { status: 500 }
    );
  }
}

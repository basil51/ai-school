import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportContent {
  html: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType: string;
  }>;
}

export async function generateReportContent(
  report: any,
  analytics: any,
  format: 'pdf' | 'csv' | 'html'
): Promise<ReportContent> {
  const organization = analytics.organization;
  const usage = analytics.usage;
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  switch (format) {
    case 'pdf':
      return generatePDFReport(report, analytics, organization, usage, currentDate);
    case 'csv':
      return generateCSVReport(report, analytics, organization, usage, currentDate);
    case 'html':
      return generateHTMLReport(report, analytics, organization, usage, currentDate);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

async function generatePDFReport(
  report: any,
  analytics: any,
  organization: any,
  usage: any,
  currentDate: string
): Promise<ReportContent> {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text(`${organization.name} - Analytics Report`, 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Generated on ${currentDate}`, 20, 30);
  doc.text(`Report: ${report.name}`, 20, 40);
  
  // Organization Info
  doc.setFontSize(14);
  doc.text('Organization Information', 20, 55);
  
  doc.setFontSize(10);
  const orgInfo = [
    ['Name', organization.name],
    ['Tier', organization.tier],
    ['Status', organization.isActive ? 'Active' : 'Inactive'],
    ['Created', new Date(organization.createdAt).toLocaleDateString()],
  ];
  
  autoTable(doc, {
    startY: 60,
    head: [['Property', 'Value']],
    body: orgInfo,
    theme: 'grid',
  });

  // Usage Statistics
  doc.setFontSize(14);
  doc.text('Usage Statistics', 20, 120);
  
  const usageData = [
    ['Metric', 'Current', 'Limit', 'Usage %'],
    ['Users', usage.current.users.toString(), usage.limits?.maxUsers?.toString() || 'N/A', `${usage.percentages.users}%`],
    ['Documents', usage.current.documents.toString(), usage.limits?.maxDocuments?.toString() || 'N/A', `${usage.percentages.documents}%`],
    ['Questions', usage.current.questions.toString(), usage.limits?.maxQuestionsPerMonth?.toString() || 'N/A', `${usage.percentages.questions}%`],
    ['Storage', formatBytes(usage.current.storage), formatBytes(usage.limits?.maxStorageBytes || 0), `${usage.percentages.storage}%`],
  ];
  
  autoTable(doc, {
    startY: 125,
    head: [['Metric', 'Current', 'Limit', 'Usage %']],
    body: usageData.slice(1),
    theme: 'grid',
  });

  // User Distribution
  if (analytics.userStats) {
    doc.setFontSize(14);
    doc.text('User Distribution', 20, 200);
    
    const userStats = analytics.userStats.map((stat: any) => [
      stat.role.charAt(0).toUpperCase() + stat.role.slice(1),
      stat.count.toString(),
    ]);
    
    autoTable(doc, {
      startY: 205,
      head: [['Role', 'Count']],
      body: userStats,
      theme: 'grid',
    });
  }

  // Document Status
  if (analytics.documentStats) {
    doc.setFontSize(14);
    doc.text('Document Status', 20, 280);
    
    const docStats = analytics.documentStats.map((stat: any) => [
      stat.status.charAt(0).toUpperCase() + stat.status.slice(1),
      stat.count.toString(),
    ]);
    
    autoTable(doc, {
      startY: 285,
      head: [['Status', 'Count']],
      body: docStats,
      theme: 'grid',
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, 20, doc.internal.pageSize.height - 10);
  }

  const pdfBuffer = doc.output('arraybuffer');
  
  return {
    html: `<p>Please find the attached PDF report for ${organization.name}.</p>`,
    attachments: [{
      filename: `${organization.name}_analytics_report_${currentDate.replace(/\s/g, '_')}.pdf`,
      content: Buffer.from(pdfBuffer),
      contentType: 'application/pdf',
    }],
  };
}

async function generateCSVReport(
  report: any,
  analytics: any,
  organization: any,
  usage: any,
  currentDate: string
): Promise<ReportContent> {
  let csvContent = `Organization Analytics Report - ${organization.name}\n`;
  csvContent += `Generated on ${currentDate}\n`;
  csvContent += `Report: ${report.name}\n\n`;
  
  // Organization Info
  csvContent += 'Organization Information\n';
  csvContent += 'Name,Tier,Status,Created\n';
  csvContent += `${organization.name},${organization.tier},${organization.isActive ? 'Active' : 'Inactive'},${new Date(organization.createdAt).toLocaleDateString()}\n\n`;
  
  // Usage Statistics
  csvContent += 'Usage Statistics\n';
  csvContent += 'Metric,Current,Limit,Usage %\n';
  csvContent += `Users,${usage.current.users},${usage.limits?.maxUsers || 'N/A'},${usage.percentages.users}%\n`;
  csvContent += `Documents,${usage.current.documents},${usage.limits?.maxDocuments || 'N/A'},${usage.percentages.documents}%\n`;
  csvContent += `Questions,${usage.current.questions},${usage.limits?.maxQuestionsPerMonth || 'N/A'},${usage.percentages.questions}%\n`;
  csvContent += `Storage,${formatBytes(usage.current.storage)},${formatBytes(usage.limits?.maxStorageBytes || 0)},${usage.percentages.storage}%\n\n`;
  
  // User Distribution
  if (analytics.userStats) {
    csvContent += 'User Distribution\n';
    csvContent += 'Role,Count\n';
    analytics.userStats.forEach((stat: any) => {
      csvContent += `${stat.role.charAt(0).toUpperCase() + stat.role.slice(1)},${stat.count}\n`;
    });
    csvContent += '\n';
  }
  
  // Document Status
  if (analytics.documentStats) {
    csvContent += 'Document Status\n';
    csvContent += 'Status,Count\n';
    analytics.documentStats.forEach((stat: any) => {
      csvContent += `${stat.status.charAt(0).toUpperCase() + stat.status.slice(1)},${stat.count}\n`;
    });
    csvContent += '\n';
  }

  return {
    html: `<p>Please find the attached CSV report for ${organization.name}.</p>`,
    attachments: [{
      filename: `${organization.name}_analytics_report_${currentDate.replace(/\s/g, '_')}.csv`,
      content: csvContent,
      contentType: 'text/csv',
    }],
  };
}

async function generateHTMLReport(
  report: any,
  analytics: any,
  organization: any,
  usage: any,
  currentDate: string
): Promise<ReportContent> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${organization.name} - Analytics Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; border-bottom: 2px solid #e0e0e0; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { color: #333; margin: 0 0 10px 0; }
        .header p { color: #666; margin: 0; }
        .section { margin-bottom: 30px; }
        .section h2 { color: #444; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px; }
        .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8f9fa; padding: 20px; border-radius: 6px; border-left: 4px solid #007bff; }
        .metric-card h3 { margin: 0 0 10px 0; color: #333; font-size: 14px; }
        .metric-card .value { font-size: 24px; font-weight: bold; color: #007bff; margin: 0 0 5px 0; }
        .metric-card .label { color: #666; font-size: 12px; }
        .progress-bar { width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; margin-top: 10px; }
        .progress-fill { height: 100%; background: #007bff; transition: width 0.3s ease; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e0e0e0; }
        th { background: #f8f9fa; font-weight: 600; color: #333; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${organization.name}</h1>
          <p>Analytics Report - ${currentDate}</p>
          <p><strong>Report:</strong> ${report.name}</p>
        </div>

        <div class="section">
          <h2>Organization Information</h2>
          <table>
            <tr><th>Property</th><th>Value</th></tr>
            <tr><td>Name</td><td>${organization.name}</td></tr>
            <tr><td>Tier</td><td>${organization.tier}</td></tr>
            <tr><td>Status</td><td>${organization.isActive ? 'Active' : 'Inactive'}</td></tr>
            <tr><td>Created</td><td>${new Date(organization.createdAt).toLocaleDateString()}</td></tr>
          </table>
        </div>

        <div class="section">
          <h2>Usage Statistics</h2>
          <div class="metric-grid">
            <div class="metric-card">
              <h3>Users</h3>
              <div class="value">${usage.current.users}</div>
              <div class="label">of ${usage.limits?.maxUsers || '∞'}</div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(usage.percentages.users, 100)}%"></div>
              </div>
            </div>
            <div class="metric-card">
              <h3>Documents</h3>
              <div class="value">${usage.current.documents}</div>
              <div class="label">of ${usage.limits?.maxDocuments || '∞'}</div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(usage.percentages.documents, 100)}%"></div>
              </div>
            </div>
            <div class="metric-card">
              <h3>Questions</h3>
              <div class="value">${usage.current.questions}</div>
              <div class="label">of ${usage.limits?.maxQuestionsPerMonth || '∞'}</div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(usage.percentages.questions, 100)}%"></div>
              </div>
            </div>
            <div class="metric-card">
              <h3>Storage</h3>
              <div class="value">${formatBytes(usage.current.storage)}</div>
              <div class="label">of ${formatBytes(usage.limits?.maxStorageBytes || 0)}</div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(usage.percentages.storage, 100)}%"></div>
              </div>
            </div>
          </div>
        </div>

        ${analytics.userStats ? `
        <div class="section">
          <h2>User Distribution</h2>
          <table>
            <tr><th>Role</th><th>Count</th></tr>
            ${analytics.userStats.map((stat: any) => `
              <tr><td>${stat.role.charAt(0).toUpperCase() + stat.role.slice(1)}</td><td>${stat.count}</td></tr>
            `).join('')}
          </table>
        </div>
        ` : ''}

        ${analytics.documentStats ? `
        <div class="section">
          <h2>Document Status</h2>
          <table>
            <tr><th>Status</th><th>Count</th></tr>
            ${analytics.documentStats.map((stat: any) => `
              <tr><td>${stat.status.charAt(0).toUpperCase() + stat.status.slice(1)}</td><td>${stat.count}</td></tr>
            `).join('')}
          </table>
        </div>
        ` : ''}

        <div class="footer">
          <p>This report was automatically generated by the AI School Analytics System.</p>
          <p>Generated on ${currentDate}</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return { html };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

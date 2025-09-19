'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  BookOpen, 
  TestTube,
  Plus,
  Search,
  Eye,
  Edit,
  Download
} from 'lucide-react';

interface AccessibilityCompliance {
  id: string;
  auditDate: string;
  complianceLevel: 'A' | 'AA' | 'AAA';
  wcagLevel: 'A' | 'AA' | 'AAA';
  overallScore: number;
  status: 'pending' | 'in_progress' | 'compliant' | 'non_compliant' | 'needs_review';
  auditScope: string;
  remediationPlan?: string;
  nextAuditDate?: string;
  auditor: {
    id: string;
    name: string;
    email: string;
  };
  findings: AccessibilityFinding[];
  recommendations: AccessibilityRecommendation[];
  _count: {
    findings: number;
    recommendations: number;
  };
}

interface AccessibilityFinding {
  id: string;
  findingType: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'minor';
  wcagCriteria: string;
  description: string;
  location: string;
  impact: string;
  remediation?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'verified' | 'closed';
  assignedTo?: string;
  dueDate?: string;
  verifiedDate?: string;
  notes?: string;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
  };
}

interface AccessibilityRecommendation {
  id: string;
  recommendationType: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  implementation: string;
  estimatedEffort?: string;
  benefits: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  dueDate?: string;
  completedDate?: string;
  notes?: string;
  assignedUser?: {
    id: string;
    name: string;
    email: string;
  };
}

const severityColors = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'default',
  low: 'secondary',
  minor: 'outline',
} as const;

const statusColors = {
  pending: 'secondary',
  in_progress: 'default',
  compliant: 'default',
  non_compliant: 'destructive',
  needs_review: 'default',
  open: 'secondary',
  resolved: 'default',
  verified: 'default',
  closed: 'secondary',
  completed: 'default',
  cancelled: 'secondary',
} as const;

const priorityColors = {
  critical: 'destructive',
  high: 'destructive',
  medium: 'default',
  low: 'secondary',
} as const;

export default function AccessibilityComplianceDashboard() {
  const [compliance, setCompliance] = useState<AccessibilityCompliance[]>([]);
  const [findings, setFindings] = useState<AccessibilityFinding[]>([]);
  const [recommendations, setRecommendations] = useState<AccessibilityRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedCompliance, setSelectedCompliance] = useState<AccessibilityCompliance | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFindingDialogOpen, setIsFindingDialogOpen] = useState(false);
  const [isRecommendationDialogOpen, setIsRecommendationDialogOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    severity: 'all',
    priority: 'all',
    search: '',
  });

  useEffect(() => {
    fetchCompliance();
  }, []);

  const fetchCompliance = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/accessibility/compliance');
      if (response.ok) {
        const data = await response.json();
        setCompliance(data.compliance);
      }
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFindings = async (complianceId?: string) => {
    try {
      const url = complianceId 
        ? `/api/accessibility/findings?complianceId=${complianceId}`
        : '/api/accessibility/findings';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setFindings(data.findings);
      }
    } catch (error) {
      console.error('Error fetching findings:', error);
    }
  };

  const fetchRecommendations = async (complianceId?: string) => {
    try {
      const url = complianceId 
        ? `/api/accessibility/recommendations?complianceId=${complianceId}`
        : '/api/accessibility/recommendations';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  };

  const handleComplianceSelect = (compliance: AccessibilityCompliance) => {
    setSelectedCompliance(compliance);
    fetchFindings(compliance.id);
    fetchRecommendations(compliance.id);
  };

  const filteredFindings = findings.filter(finding => {
    if (filters.status !== 'all' && finding.status !== filters.status) return false;
    if (filters.severity !== 'all' && finding.severity !== filters.severity) return false;
    if (filters.search && !finding.description.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const filteredRecommendations = recommendations.filter(rec => {
    if (filters.status !== 'all' && rec.status !== filters.status) return false;
    if (filters.priority !== 'all' && rec.priority !== filters.priority) return false;
    if (filters.search && !rec.title.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const getComplianceStats = () => {
    const total = compliance.length;
    const compliant = compliance.filter(c => c.status === 'compliant').length;
    const inProgress = compliance.filter(c => c.status === 'in_progress').length;
    const nonCompliant = compliance.filter(c => c.status === 'non_compliant').length;
    const avgScore = total > 0 ? compliance.reduce((sum, c) => sum + c.overallScore, 0) / total : 0;

    return { total, compliant, inProgress, nonCompliant, avgScore };
  };

  const stats = getComplianceStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading accessibility compliance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accessibility Compliance</h1>
          <p className="text-muted-foreground">
            Manage WCAG 2.1 AA compliance, findings, and recommendations
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Audit
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Audits</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Accessibility audits conducted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.compliant}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.compliant / stats.total) * 100) : 0}% compliance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Audits currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.avgScore)}%</div>
            <p className="text-xs text-muted-foreground">
              Overall compliance score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliance List */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Audits</CardTitle>
                <CardDescription>
                  Latest accessibility compliance audits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {compliance.length === 0 ? (
                    <div className="text-center py-8">
                      <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Audits Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start by conducting your first accessibility compliance audit.
                      </p>
                      <Button onClick={() => setIsCreateDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Audit
                      </Button>
                    </div>
                  ) : (
                    compliance.map((audit) => (
                      <div
                        key={audit.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedCompliance?.id === audit.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => handleComplianceSelect(audit)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={statusColors[audit.status]}>
                              {audit.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline">
                              WCAG {audit.wcagLevel}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(audit.auditDate).toLocaleDateString()}
                          </div>
                        </div>
                        <h4 className="font-semibold mb-1">{audit.auditScope}</h4>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Score: {audit.overallScore}%</span>
                            <span>Findings: {audit._count.findings}</span>
                            <span>Recommendations: {audit._count.recommendations}</span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            by {audit.auditor.name}
                          </div>
                        </div>
                        <Progress value={audit.overallScore} className="mt-2" />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Selected Audit Details */}
            {selectedCompliance && (
              <Card>
                <CardHeader>
                  <CardTitle>Audit Details</CardTitle>
                  <CardDescription>
                    {selectedCompliance.auditScope}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Compliance Level</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedCompliance.complianceLevel}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">WCAG Level</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedCompliance.wcagLevel}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Overall Score</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedCompliance.overallScore}%
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Status</Label>
                      <Badge variant={statusColors[selectedCompliance.status]}>
                        {selectedCompliance.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>

                  {selectedCompliance.remediationPlan && (
                    <div>
                      <Label className="text-sm font-medium">Remediation Plan</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedCompliance.remediationPlan}
                      </p>
                    </div>
                  )}

                  {selectedCompliance.nextAuditDate && (
                    <div>
                      <Label className="text-sm font-medium">Next Audit</Label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedCompliance.nextAuditDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="findings" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search findings..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 w-64"
                />
              </div>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.severity}
                onValueChange={(value) => setFilters({ ...filters, severity: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setIsFindingDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Finding
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredFindings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Findings</h3>
                  <p className="text-muted-foreground mb-4">
                    {selectedCompliance 
                      ? 'No findings found for this audit.'
                      : 'Select an audit to view findings or create a new finding.'
                    }
                  </p>
                  <Button onClick={() => setIsFindingDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Finding
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredFindings.map((finding) => (
                <Card key={finding.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={severityColors[finding.severity]}>
                          {finding.severity}
                        </Badge>
                        <Badge variant="outline">
                          {finding.findingType.replace('_', ' ')}
                        </Badge>
                        <Badge variant={statusColors[finding.status]}>
                          {finding.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <h4 className="font-semibold mb-2">{finding.wcagCriteria}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{finding.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs font-medium">Location</Label>
                        <p className="text-muted-foreground">{finding.location}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Impact</Label>
                        <p className="text-muted-foreground">{finding.impact}</p>
                      </div>
                    </div>
                    {finding.assignedUser && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Assigned to:</span>
                          <span>{finding.assignedUser.name}</span>
                        </div>
                        {finding.dueDate && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Due:</span>
                            <span>{new Date(finding.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recommendations..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10 w-64"
                />
              </div>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.priority}
                onValueChange={(value) => setFilters({ ...filters, priority: value })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setIsRecommendationDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Recommendation
            </Button>
          </div>

          <div className="grid gap-4">
            {filteredRecommendations.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Recommendations</h3>
                  <p className="text-muted-foreground mb-4">
                    {selectedCompliance 
                      ? 'No recommendations found for this audit.'
                      : 'Select an audit to view recommendations or create a new recommendation.'
                    }
                  </p>
                  <Button onClick={() => setIsRecommendationDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recommendation
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredRecommendations.map((recommendation) => (
                <Card key={recommendation.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={priorityColors[recommendation.priority]}>
                          {recommendation.priority}
                        </Badge>
                        <Badge variant="outline">
                          {recommendation.recommendationType.replace('_', ' ')}
                        </Badge>
                        <Badge variant={statusColors[recommendation.status]}>
                          {recommendation.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <h4 className="font-semibold mb-2">{recommendation.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">{recommendation.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-xs font-medium">Implementation</Label>
                        <p className="text-muted-foreground">{recommendation.implementation}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Benefits</Label>
                        <p className="text-muted-foreground">{recommendation.benefits}</p>
                      </div>
                    </div>
                    {recommendation.assignedUser && (
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Assigned to:</span>
                          <span>{recommendation.assignedUser.name}</span>
                        </div>
                        {recommendation.dueDate && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Due:</span>
                            <span>{new Date(recommendation.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <Card>
            <CardContent className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Training Management</h3>
              <p className="text-muted-foreground mb-4">
                Manage accessibility training programs and track completion.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Training Program
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Compliance Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Accessibility Audit</DialogTitle>
            <DialogDescription>
              Create a new accessibility compliance audit
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="complianceLevel">Compliance Level</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="AA">AA</SelectItem>
                    <SelectItem value="AAA">AAA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="wcagLevel">WCAG Level</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="AA">AA</SelectItem>
                    <SelectItem value="AAA">AAA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="auditScope">Audit Scope</Label>
              <Input placeholder="Describe the scope of the audit" />
            </div>
            <div>
              <Label htmlFor="overallScore">Overall Score</Label>
              <Input type="number" min="0" max="100" placeholder="0-100" />
            </div>
            <div>
              <Label htmlFor="remediationPlan">Remediation Plan</Label>
              <Textarea placeholder="Describe the remediation plan" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button>Create Audit</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Finding Dialog */}
      <Dialog open={isFindingDialogOpen} onOpenChange={setIsFindingDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Accessibility Finding</DialogTitle>
            <DialogDescription>
              Create a new accessibility finding for the selected audit
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="findingType">Finding Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="color_contrast">Color Contrast</SelectItem>
                    <SelectItem value="keyboard_navigation">Keyboard Navigation</SelectItem>
                    <SelectItem value="screen_reader">Screen Reader</SelectItem>
                    <SelectItem value="focus_management">Focus Management</SelectItem>
                    <SelectItem value="alt_text">Alt Text</SelectItem>
                    <SelectItem value="semantic_markup">Semantic Markup</SelectItem>
                    <SelectItem value="form_labels">Form Labels</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="minor">Minor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="wcagCriteria">WCAG Criteria</Label>
              <Input placeholder="e.g., 1.4.3 Contrast (Minimum)" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea placeholder="Describe the accessibility finding" />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input placeholder="e.g., Home page, navigation menu" />
            </div>
            <div>
              <Label htmlFor="impact">Impact</Label>
              <Textarea placeholder="Describe the impact on users" />
            </div>
            <div>
              <Label htmlFor="remediation">Remediation</Label>
              <Textarea placeholder="Describe how to fix this issue" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsFindingDialogOpen(false)}>
                Cancel
              </Button>
              <Button>Add Finding</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Recommendation Dialog */}
      <Dialog open={isRecommendationDialogOpen} onOpenChange={setIsRecommendationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Accessibility Recommendation</DialogTitle>
            <DialogDescription>
              Create a new accessibility recommendation for the selected audit
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recommendationType">Recommendation Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="design_improvement">Design Improvement</SelectItem>
                    <SelectItem value="technical_enhancement">Technical Enhancement</SelectItem>
                    <SelectItem value="content_optimization">Content Optimization</SelectItem>
                    <SelectItem value="user_experience">User Experience</SelectItem>
                    <SelectItem value="testing_procedure">Testing Procedure</SelectItem>
                    <SelectItem value="training_recommendation">Training Recommendation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input placeholder="Enter recommendation title" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea placeholder="Describe the recommendation" />
            </div>
            <div>
              <Label htmlFor="implementation">Implementation</Label>
              <Textarea placeholder="Describe how to implement this recommendation" />
            </div>
            <div>
              <Label htmlFor="benefits">Benefits</Label>
              <Textarea placeholder="Describe the benefits of implementing this recommendation" />
            </div>
            <div>
              <Label htmlFor="estimatedEffort">Estimated Effort</Label>
              <Input placeholder="e.g., 2-4 hours, 1 day, 1 week" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsRecommendationDialogOpen(false)}>
                Cancel
              </Button>
              <Button>Add Recommendation</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

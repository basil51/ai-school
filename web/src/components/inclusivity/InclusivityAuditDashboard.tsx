'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
//import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Brain, 
  Globe, 
  Eye, 
  //Ear, 
  //Zap, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Plus,
  Filter,
  Search,
  //Calendar,
  Target,
  TrendingUp,
  FileText,
  //Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface InclusivityAudit {
  id: string;
  auditType: string;
  targetAudience: string[];
  auditDate: string;
  status: string;
  overallScore?: number;
  recommendations: string;
  actionPlan: string;
  followUpDate?: string;
  completedAt?: string;
  auditor: {
    id: string;
    name: string;
    email: string;
  };
  organization: {
    id: string;
    name: string;
  };
  findings: InclusivityFinding[];
  _count: {
    findings: number;
  };
}

interface InclusivityFinding {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string;
  currentState: string;
  recommendedAction: string;
  priority: string;
  estimatedEffort?: string;
  isImplemented: boolean;
  implementedAt?: string;
  implementedByUser?: {
    id: string;
    name: string;
    email: string;
  };
}

const auditTypeIcons = {
  adhd_accommodations: Brain,
  learning_disabilities: Users,
  cultural_sensitivity: Globe,
  language_barriers: FileText,
  cognitive_accessibility: Eye,
  comprehensive: Target,
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  needs_followup: 'bg-orange-100 text-orange-800',
  archived: 'bg-gray-100 text-gray-800',
};

const severityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

export function InclusivityAuditDashboard() {
  const [audits, setAudits] = useState<InclusivityAudit[]>([]);
  const [findings, setFindings] = useState<InclusivityFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    auditType: 'all',
    status: 'all',
    severity: 'all',
    search: '',
  });
  const [_selectedAudit, _setSelectedAudit] = useState<InclusivityAudit | null>(null);
  const [_isCreatingAudit, _setIsCreatingAudit] = useState(false);
  const [_isCreatingFinding, _setIsCreatingFinding] = useState(false);

  useEffect(() => {
    const fetchFindings = async () => {
      try {
        const params = new URLSearchParams();
        if (filters.severity !== 'all') params.append('severity', filters.severity);
  
        const response = await fetch(`/api/inclusivity/findings?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch findings');
        
        const data = await response.json();
        setFindings(data.findings || []);
      } catch (error) {
        console.error('Error fetching findings:', error);
        toast.error('Failed to load findings');
      }
    };
    const fetchAudits = async () => {
      try {
        const params = new URLSearchParams();
        if (filters.auditType !== 'all') params.append('auditType', filters.auditType);
        if (filters.status !== 'all') params.append('status', filters.status);
  
        const response = await fetch(`/api/inclusivity/audits?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch audits');
        
        const data = await response.json();
        setAudits(data.audits || []);
      } catch (error) {
        console.error('Error fetching audits:', error);
        toast.error('Failed to load audits');
      } finally {
        setLoading(false);
      }
    };

    fetchAudits();
    fetchFindings();
  }, [filters]);

  const handleStatusUpdate = async (auditId: string, status: string) => {
    try {
      const response = await fetch('/api/inclusivity/audits', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: auditId, status }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      setAudits(prev => prev.map(a => 
        a.id === auditId ? { ...a, status } : a
      ));
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleFindingImplementation = async (findingId: string, isImplemented: boolean) => {
    try {
      const response = await fetch('/api/inclusivity/findings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: findingId, isImplemented }),
      });

      if (!response.ok) throw new Error('Failed to update finding');

      setFindings(prev => prev.map(f => 
        f.id === findingId ? { ...f, isImplemented } : f
      ));
      toast.success('Finding updated successfully');
    } catch (error) {
      console.error('Error updating finding:', error);
      toast.error('Failed to update finding');
    }
  };

  const filteredAudits = audits.filter(audit => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        audit.auditType.toLowerCase().includes(searchLower) ||
        audit.recommendations.toLowerCase().includes(searchLower) ||
        audit.auditor.name.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const auditStats = {
    total: audits.length,
    pending: audits.filter(a => a.status === 'pending').length,
    inProgress: audits.filter(a => a.status === 'in_progress').length,
    completed: audits.filter(a => a.status === 'completed').length,
    criticalFindings: findings.filter(f => f.severity === 'critical').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Audits</p>
                <p className="text-2xl font-bold">{auditStats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{auditStats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{auditStats.inProgress}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{auditStats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600">{auditStats.criticalFindings}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search audits..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Audit Type</label>
              <Select
                value={filters.auditType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, auditType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="adhd_accommodations">ADHD Accommodations</SelectItem>
                  <SelectItem value="learning_disabilities">Learning Disabilities</SelectItem>
                  <SelectItem value="cultural_sensitivity">Cultural Sensitivity</SelectItem>
                  <SelectItem value="language_barriers">Language Barriers</SelectItem>
                  <SelectItem value="cognitive_accessibility">Cognitive Accessibility</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="needs_followup">Needs Follow-up</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Severity</label>
              <Select
                value={filters.severity}
                onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All severities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="audits" className="space-y-6">
        <TabsList>
          <TabsTrigger value="audits">Audits</TabsTrigger>
          <TabsTrigger value="findings">Findings</TabsTrigger>
        </TabsList>

        <TabsContent value="audits">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Inclusivity Audits ({filteredAudits.length})</CardTitle>
                <Button onClick={() => _setIsCreatingAudit(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Audit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredAudits.map((audit) => {
                  const IconComponent = auditTypeIcons[audit.auditType as keyof typeof auditTypeIcons] || FileText;
                  return (
                    <div
                      key={audit.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => _setSelectedAudit(audit)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <IconComponent className="h-4 w-4" />
                            <h3 className="font-medium">{audit.auditType.replace('_', ' ')}</h3>
                            <Badge className={statusColors[audit.status as keyof typeof statusColors]}>
                              {audit.status.replace('_', ' ')}
                            </Badge>
                            {audit.overallScore && (
                              <Badge variant="outline">
                                Score: {audit.overallScore}/100
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {audit.recommendations}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Target: {audit.targetAudience.join(', ')}</span>
                            <span>Findings: {audit._count.findings}</span>
                            <span>By: {audit.auditor.name}</span>
                            <span>{new Date(audit.auditDate).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Select
                            value={audit.status}
                            onValueChange={(value) => handleStatusUpdate(audit.id, value)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="needs_followup">Needs Follow-up</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="findings">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Findings ({findings.length})</CardTitle>
                <Button onClick={() => _setIsCreatingFinding(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Finding
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {findings.map((finding) => (
                  <div
                    key={finding.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{finding.title}</h3>
                          <Badge className={severityColors[finding.severity as keyof typeof severityColors]}>
                            {finding.severity}
                          </Badge>
                          <Badge className={priorityColors[finding.priority as keyof typeof priorityColors]}>
                            {finding.priority}
                          </Badge>
                          {finding.isImplemented && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Implemented
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {finding.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Category: {finding.category.replace('_', ' ')}</span>
                          {finding.estimatedEffort && (
                            <span>Effort: {finding.estimatedEffort}</span>
                          )}
                          {finding.implementedAt && (
                            <span>Fixed: {new Date(finding.implementedAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant={finding.isImplemented ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleFindingImplementation(finding.id, !finding.isImplemented)}
                        >
                          {finding.isImplemented ? 'Mark Pending' : 'Mark Implemented'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

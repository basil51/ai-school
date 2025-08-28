'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, X } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface AnalyticsFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  className?: string;
}

export interface FilterState {
  dateRange: DateRange | undefined;
  metrics: string[];
  userRoles: string[];
  activityTypes: string[];
  searchQuery: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const METRIC_OPTIONS = [
  { value: 'users', label: 'Users' },
  { value: 'documents', label: 'Documents' },
  { value: 'questions', label: 'Questions' },
  { value: 'storage', label: 'Storage' },
  { value: 'activity', label: 'Activity' },
  { value: 'growth', label: 'Growth Rate' },
];

const USER_ROLE_OPTIONS = [
  { value: 'student', label: 'Students' },
  { value: 'teacher', label: 'Teachers' },
  { value: 'admin', label: 'Admins' },
  { value: 'guardian', label: 'Guardians' },
];

const ACTIVITY_TYPE_OPTIONS = [
  { value: 'user_login', label: 'User Login' },
  { value: 'user_created', label: 'User Created' },
  { value: 'document_uploaded', label: 'Document Uploaded' },
  { value: 'document_processed', label: 'Document Processed' },
  { value: 'question_asked', label: 'Question Asked' },
  { value: 'settings_updated', label: 'Settings Updated' },
  { value: 'organization_updated', label: 'Organization Updated' },
];

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'user', label: 'User' },
  { value: 'action', label: 'Action' },
  { value: 'impact', label: 'Impact' },
];

export default function AnalyticsFilters({ onFiltersChange, className = '' }: AnalyticsFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: undefined,
    metrics: ['users', 'documents', 'questions', 'storage'],
    userRoles: ['student', 'teacher', 'admin', 'guardian'],
    activityTypes: ['user_login', 'document_uploaded', 'question_asked', 'settings_updated'],
    searchQuery: '',
    sortBy: 'date',
    sortOrder: 'desc',
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    const defaultFilters: FilterState = {
      dateRange: undefined,
      metrics: ['users', 'documents', 'questions', 'storage'],
      userRoles: ['student', 'teacher', 'admin', 'guardian'],
      activityTypes: ['user_login', 'document_uploaded', 'question_asked', 'settings_updated'],
      searchQuery: '',
      sortBy: 'date',
      sortOrder: 'desc',
    };
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const toggleMetric = (metric: string) => {
    const newMetrics = filters.metrics.includes(metric)
      ? filters.metrics.filter(m => m !== metric)
      : [...filters.metrics, metric];
    updateFilters({ metrics: newMetrics });
  };

  const toggleUserRole = (role: string) => {
    const newRoles = filters.userRoles.includes(role)
      ? filters.userRoles.filter(r => r !== role)
      : [...filters.userRoles, role];
    updateFilters({ userRoles: newRoles });
  };

  const toggleActivityType = (type: string) => {
    const newTypes = filters.activityTypes.includes(type)
      ? filters.activityTypes.filter(t => t !== type)
      : [...filters.activityTypes, type];
    updateFilters({ activityTypes: newTypes });
  };

  const activeFiltersCount = [
    filters.dateRange ? 1 : 0,
    filters.searchQuery ? 1 : 0,
    filters.metrics.length !== METRIC_OPTIONS.length ? 1 : 0,
    filters.userRoles.length !== USER_ROLE_OPTIONS.length ? 1 : 0,
    filters.activityTypes.length !== ACTIVITY_TYPE_OPTIONS.length ? 1 : 0,
  ].reduce((sum, count) => sum + count, 0);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Analytics Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearFilters}
              disabled={activeFiltersCount === 0}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Filters - Always Visible */}
        <div className="flex flex-wrap gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Calendar className="h-3 w-3 mr-1" />
                {filters.dateRange?.from ? (
                  filters.dateRange.to ? (
                    <>
                      {format(filters.dateRange.from, 'MMM dd')} - {format(filters.dateRange.to, 'MMM dd')}
                    </>
                  ) : (
                    format(filters.dateRange.from, 'MMM dd')
                  )
                ) : (
                  'Date Range'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={filters.dateRange?.from}
                selected={filters.dateRange}
                onSelect={(range) => updateFilters({ dateRange: range })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Input
            placeholder="Search activities..."
            value={filters.searchQuery}
            onChange={(e) => updateFilters({ searchQuery: e.target.value })}
            className="h-8 w-48"
          />

          <Select value={filters.sortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
            <SelectTrigger className="h-8 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
            onClick={() => updateFilters({ sortOrder: filters.sortOrder === 'desc' ? 'asc' : 'desc' })}
            className="h-8"
          >
            {filters.sortOrder === 'desc' ? '↓' : '↑'}
          </Button>
        </div>

        {/* Advanced Filters - Expandable */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Metrics Selection */}
            <div>
              <Label className="text-sm font-medium">Metrics</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {METRIC_OPTIONS.map((metric) => (
                  <div key={metric.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={metric.value}
                      checked={filters.metrics.includes(metric.value)}
                      onCheckedChange={() => toggleMetric(metric.value)}
                    />
                    <Label htmlFor={metric.value} className="text-sm">
                      {metric.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* User Roles */}
            <div>
              <Label className="text-sm font-medium">User Roles</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {USER_ROLE_OPTIONS.map((role) => (
                  <div key={role.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={role.value}
                      checked={filters.userRoles.includes(role.value)}
                      onCheckedChange={() => toggleUserRole(role.value)}
                    />
                    <Label htmlFor={role.value} className="text-sm">
                      {role.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Types */}
            <div>
              <Label className="text-sm font-medium">Activity Types</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ACTIVITY_TYPE_OPTIONS.map((type) => (
                  <div key={type.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.value}
                      checked={filters.activityTypes.includes(type.value)}
                      onCheckedChange={() => toggleActivityType(type.value)}
                    />
                    <Label htmlFor={type.value} className="text-sm">
                      {type.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateFilters({ 
                  dateRange: { 
                    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 
                    to: new Date() 
                  } 
                })}
              >
                Last 7 Days
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateFilters({ 
                  dateRange: { 
                    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
                    to: new Date() 
                  } 
                })}
              >
                Last 30 Days
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateFilters({ 
                  dateRange: { 
                    from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), 
                    to: new Date() 
                  } 
                })}
              >
                Last 90 Days
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

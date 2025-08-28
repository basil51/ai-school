'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw, Users, FileText, MessageSquare, Settings } from 'lucide-react';
import { useTranslations } from '@/lib/useTranslations';

interface ActivityItem {
  id: string;
  action: string;
  details: any;
  createdAt: string;
  user: {
    name?: string;
    email: string;
    role: string;
  };
  organizationId: string;
}

interface RealTimeActivityFeedProps {
  organizationId: string;
  className?: string;
  filters?: {
    dateRange?: { from?: Date; to?: Date };
    searchQuery?: string;
    userRoles?: string[];
    activityTypes?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  };
}

const getActionIcon = (action: string) => {
  switch (action.toLowerCase()) {
    case 'user_login':
    case 'user_created':
      return <Users className="h-4 w-4" />;
    case 'document_uploaded':
    case 'document_processed':
      return <FileText className="h-4 w-4" />;
    case 'question_asked':
    case 'chat_message':
      return <MessageSquare className="h-4 w-4" />;
    case 'settings_updated':
    case 'organization_updated':
      return <Settings className="h-4 w-4" />;
    default:
      return <Activity className="h-4 w-4" />;
  }
};

const getActionColor = (action: string) => {
  switch (action.toLowerCase()) {
    case 'user_login':
    case 'user_created':
      return 'bg-blue-100 text-blue-800';
    case 'document_uploaded':
    case 'document_processed':
      return 'bg-green-100 text-green-800';
    case 'question_asked':
    case 'chat_message':
      return 'bg-purple-100 text-purple-800';
    case 'settings_updated':
    case 'organization_updated':
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function RealTimeActivityFeed({ organizationId, className = '', filters }: RealTimeActivityFeedProps) {
  const { dict } = useTranslations();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchActivities = useCallback(async () => {
    try {
      // Build query parameters from filters
      const params = new URLSearchParams();
      if (filters?.dateRange?.from) {
        params.append('from', filters.dateRange.from.toISOString());
      }
      if (filters?.dateRange?.to) {
        params.append('to', filters.dateRange.to.toISOString());
      }
      if (filters?.searchQuery) {
        params.append('search', filters.searchQuery);
      }
      if (filters?.userRoles?.length) {
        params.append('roles', filters.userRoles.join(','));
      }
      if (filters?.activityTypes?.length) {
        params.append('types', filters.activityTypes.join(','));
      }
      if (filters?.sortBy) {
        params.append('sortBy', filters.sortBy);
      }
      if (filters?.sortOrder) {
        params.append('sortOrder', filters.sortOrder);
      }

      const response = await fetch(`/api/super-admin/organizations/${organizationId}/activity?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities || []);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [organizationId, filters]);

  useEffect(() => {
    fetchActivities();
    
    if (isLive) {
      const interval = setInterval(fetchActivities, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    }
  }, [organizationId, isLive, fetchActivities, filters]);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return dict?.activityFeed?.justNow || 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}${dict?.activityFeed?.minutesAgo || 'm ago'}`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}${dict?.activityFeed?.hoursAgo || 'h ago'}`;
    return `${Math.floor(diffInSeconds / 86400)}${dict?.activityFeed?.daysAgo || 'd ago'}`;
  };

  const formatAction = (action: string) => {
    const actionMap: { [key: string]: string } = {
      'user_login': dict?.activityFeed?.actions?.userLogin || 'User Login',
      'user_created': dict?.activityFeed?.actions?.userCreated || 'User Created',
      'document_uploaded': dict?.activityFeed?.actions?.documentUploaded || 'Document Uploaded',
      'document_processed': dict?.activityFeed?.actions?.documentProcessed || 'Document Processed',
      'question_asked': dict?.activityFeed?.actions?.questionAsked || 'Question Asked',
      'chat_message': dict?.activityFeed?.actions?.chatMessage || 'Chat Message',
      'settings_updated': dict?.activityFeed?.actions?.settingsUpdated || 'Settings Updated',
      'organization_updated': dict?.activityFeed?.actions?.organizationUpdated || 'Organization Updated',
    };
    
    return actionMap[action.toLowerCase()] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4" />
          {dict?.activityFeed?.title || "Real-time Activity Feed"}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant={isLive ? 'default' : 'secondary'} className="text-xs">
            {isLive ? (dict?.activityFeed?.live || 'Live') : (dict?.activityFeed?.paused || 'Paused')}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsLive(!isLive)}
            className="h-6 px-2"
          >
            {isLive ? (dict?.activityFeed?.pause || 'Pause') : (dict?.activityFeed?.resume || 'Resume')}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchActivities}
            className="h-6 px-2"
            disabled={loading}
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground mb-4">
          {dict?.activityFeed?.lastUpdated || "Last updated:"} {lastUpdate.toLocaleTimeString()}
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{dict?.activityFeed?.loadingActivities || "Loading activities..."}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{dict?.activityFeed?.noRecentActivity || "No recent activity"}</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
              >
                <div className={`p-2 rounded-full ${getActionColor(activity.action)}`}>
                  {getActionIcon(activity.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">
                      {formatAction(activity.action)}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {dict?.activityFeed?.by || "by"} {activity.user.name || activity.user.email}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {activity.user.role}
                      </Badge>
                    </div>
                    {activity.details && (
                      <span className="text-xs text-muted-foreground truncate max-w-32">
                        {JSON.stringify(activity.details)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

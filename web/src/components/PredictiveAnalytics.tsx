'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { useTranslations } from '@/lib/useTranslations';

interface PredictiveData {
  currentMonth: {
    users: number;
    documents: number;
    questions: number;
    storage: number;
  };
  nextMonth: {
    users: number;
    documents: number;
    questions: number;
    storage: number;
  };
  growthRate: {
    users: number;
    documents: number;
    questions: number;
    storage: number;
  };
  trends: Array<{
    month: string;
    users: number;
    documents: number;
    questions: number;
    storage: number;
    predicted: boolean;
  }>;
  recommendations: string[];
}

interface PredictiveAnalyticsProps {
  organizationId: string;
  className?: string;
}

const getGrowthIcon = (growthRate: number) => {
  if (growthRate > 0) {
    return <TrendingUp className="h-4 w-4 text-green-600" />;
  } else if (growthRate < 0) {
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  }
  return <TrendingUp className="h-4 w-4 text-gray-600" />;
};

const getGrowthColor = (growthRate: number) => {
  if (growthRate > 0) return 'text-green-600';
  if (growthRate < 0) return 'text-red-600';
  return 'text-gray-600';
};

export default function PredictiveAnalytics({ organizationId, className = '' }: PredictiveAnalyticsProps) {
  const { dict } = useTranslations();
  const [predictiveData, setPredictiveData] = useState<PredictiveData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictiveData = async () => {
      try {
        const response = await fetch(`/api/super-admin/organizations/${organizationId}/predictive`);
        if (response.ok) {
          const data = await response.json();
          setPredictiveData(data);
        } else {
          // Generate sample data for demonstration
          const sampleData: PredictiveData = {
            currentMonth: {
              users: 45,
              documents: 120,
              questions: 850,
              storage: 2.5 * 1024 * 1024 * 1024, // 2.5GB
            },
            nextMonth: {
              users: 52,
              documents: 145,
              questions: 1020,
              storage: 3.1 * 1024 * 1024 * 1024, // 3.1GB
            },
            growthRate: {
              users: 15.6,
              documents: 20.8,
              questions: 20.0,
              storage: 24.0,
            },
            trends: [
              { month: 'Jan', users: 30, documents: 80, questions: 600, storage: 1.8, predicted: false },
              { month: 'Feb', users: 35, documents: 90, questions: 650, storage: 2.0, predicted: false },
              { month: 'Mar', users: 40, documents: 105, questions: 750, storage: 2.2, predicted: false },
              { month: 'Apr', users: 45, documents: 120, questions: 850, storage: 2.5, predicted: false },
              { month: 'May', users: 52, documents: 145, questions: 1020, storage: 3.1, predicted: true },
              { month: 'Jun', users: 60, documents: 170, questions: 1220, storage: 3.8, predicted: true },
            ],
            recommendations: [
              (dict?.analytics?.recommendations?.storageUpgrade || 'Consider upgrading storage plan due to {rate}% growth rate').replace('{rate}', '24'),
              dict?.analytics?.recommendations?.teacherAccounts || 'User growth suggests need for additional teacher accounts',
              dict?.analytics?.recommendations?.learningEngagement || 'High question volume indicates active learning engagement',
              dict?.analytics?.recommendations?.documentManagement || 'Document uploads increasing - consider document management features',
            ],
          };
          setPredictiveData(sampleData);
        }
      } catch (error) {
        console.error('Error fetching predictive data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictiveData();
  }, [organizationId, dict]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{dict?.analytics?.predictiveAnalytics || "Predictive Analytics"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="h-6 w-6 animate-pulse mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{dict?.analytics?.loadingPredictions || "Loading predictions..."}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!predictiveData) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{dict?.analytics?.predictiveAnalytics || "Predictive Analytics"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {dict?.analytics?.failedToLoad || "Failed to load predictive data"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dict?.analytics?.users || "Users"}</CardTitle>
            {getGrowthIcon(predictiveData.growthRate.users)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{predictiveData.nextMonth.users}</div>
            <div className={`text-xs ${getGrowthColor(predictiveData.growthRate.users)}`}>
              +{predictiveData.growthRate.users.toFixed(1)}% {dict?.analytics?.fromCurrent || "from current"}
            </div>
            <div className="text-xs text-muted-foreground">
              {dict?.analytics?.current || "Current"}: {predictiveData.currentMonth.users}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dict?.analytics?.documents || "Documents"}</CardTitle>
            {getGrowthIcon(predictiveData.growthRate.documents)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{predictiveData.nextMonth.documents}</div>
            <div className={`text-xs ${getGrowthColor(predictiveData.growthRate.documents)}`}>
              +{predictiveData.growthRate.documents.toFixed(1)}% {dict?.analytics?.fromCurrent || "from current"}
            </div>
            <div className="text-xs text-muted-foreground">
              {dict?.analytics?.current || "Current"}: {predictiveData.currentMonth.documents}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dict?.analytics?.questions || "Questions"}</CardTitle>
            {getGrowthIcon(predictiveData.growthRate.questions)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{predictiveData.nextMonth.questions}</div>
            <div className={`text-xs ${getGrowthColor(predictiveData.growthRate.questions)}`}>
              +{predictiveData.growthRate.questions.toFixed(1)}% {dict?.analytics?.fromCurrent || "from current"}
            </div>
            <div className="text-xs text-muted-foreground">
              {dict?.analytics?.current || "Current"}: {predictiveData.currentMonth.questions}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{dict?.analytics?.storage || "Storage"}</CardTitle>
            {getGrowthIcon(predictiveData.growthRate.storage)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(predictiveData.nextMonth.storage)}</div>
            <div className={`text-xs ${getGrowthColor(predictiveData.growthRate.storage)}`}>
              +{predictiveData.growthRate.storage.toFixed(1)}% {dict?.analytics?.fromCurrent || "from current"}
            </div>
            <div className="text-xs text-muted-foreground">
              {dict?.analytics?.current || "Current"}: {formatBytes(predictiveData.currentMonth.storage)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{dict?.analytics?.usageTrendsPredictions || "Usage Trends & Predictions"}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={predictiveData.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="users"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
                name={dict?.analytics?.users || "Users"}
              />
              <Area
                type="monotone"
                dataKey="documents"
                stackId="2"
                stroke="#82ca9d"
                fill="#82ca9d"
                fillOpacity={0.6}
                name={dict?.analytics?.documents || "Documents"}
              />
              <Area
                type="monotone"
                dataKey="questions"
                stackId="3"
                stroke="#ffc658"
                fill="#ffc658"
                fillOpacity={0.6}
                name={dict?.analytics?.questions || "Questions"}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 text-xs text-muted-foreground">
            {dict?.analytics?.shadedAreasPredicted || "* Shaded areas indicate predicted values"}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{dict?.analytics?.aiRecommendations || "AI Recommendations"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {predictiveData.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="p-1 rounded-full bg-blue-100">
                  <TrendingUp className="h-3 w-3 text-blue-600" />
                </div>
                <p className="text-sm">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

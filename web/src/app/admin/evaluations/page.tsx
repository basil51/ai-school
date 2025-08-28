"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, CheckCircle, XCircle } from "lucide-react";

interface EvaluationResult {
  timestamp: string;
  faithfulness: number;
  answer_relevancy: number;
  context_precision: number;
  context_recall: number;
  status: "passing" | "failing" | "unknown";
}

interface MetricThresholds {
  faithfulness: number;
  answer_relevancy: number;
  context_precision: number;
  context_recall: number;
}

const THRESHOLDS: MetricThresholds = {
  faithfulness: 0.80,
  answer_relevancy: 0.75,
  context_precision: 0.60,
  context_recall: 0.60,
};

export default function EvaluationsPage() {
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const fetchResults = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from your API
      // For now, we'll simulate with mock data
      const mockResults: EvaluationResult[] = [
        {
          timestamp: "2025-01-27T02:00:00Z",
          faithfulness: 0.85,
          answer_relevancy: 0.78,
          context_precision: 0.65,
          context_recall: 0.62,
          status: "passing",
        },
        {
          timestamp: "2025-01-26T02:00:00Z",
          faithfulness: 0.82,
          answer_relevancy: 0.76,
          context_precision: 0.63,
          context_recall: 0.61,
          status: "passing",
        },
        {
          timestamp: "2025-01-25T02:00:00Z",
          faithfulness: 0.78,
          answer_relevancy: 0.74,
          context_precision: 0.58,
          context_recall: 0.59,
          status: "failing",
        },
      ];
      
      setResults(mockResults);
      setLastRun(mockResults[0]?.timestamp || null);
    } catch (err) {
      setError("Failed to fetch evaluation results");
      console.error("Failed to fetch evaluation results", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const getMetricColor = (metric: keyof MetricThresholds, value: number) => {
    const threshold = THRESHOLDS[metric];
    if (value >= threshold) return "text-green-600";
    if (value >= threshold * 0.9) return "text-yellow-600";
    return "text-red-600";
  };

  const getMetricIcon = (metric: keyof MetricThresholds, value: number) => {
    const threshold = THRESHOLDS[metric];
    if (value >= threshold) return <CheckCircle className="w-4 h-4 text-green-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passing":
        return <Badge className="bg-green-100 text-green-800">Passing</Badge>;
      case "failing":
        return <Badge className="bg-red-100 text-red-800">Failing</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading evaluation results...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">RAGAS Evaluations</h1>
          <p className="text-gray-600">Quality metrics for the RAG system</p>
        </div>
        <Button onClick={fetchResults} disabled={loading}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {lastRun && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Last Evaluation Run</CardTitle>
            <CardDescription>
              {formatDate(lastRun)}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-6">
        {results.map((result, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Evaluation Run
                    {getStatusBadge(result.status)}
                  </CardTitle>
                  <CardDescription>
                    {formatDate(result.timestamp)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(THRESHOLDS).map(([metric, threshold]) => {
                  const value = result[metric as keyof MetricThresholds];
                  const percentage = Math.round(value * 100);
                  
                  return (
                    <div key={metric} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {metric.replace('_', ' ')}
                        </span>
                        {getMetricIcon(metric as keyof MetricThresholds, value)}
                      </div>
                      <Progress value={percentage} className="h-2" />
                      <div className="flex justify-between text-xs">
                        <span className={getMetricColor(metric as keyof MetricThresholds, value)}>
                          {percentage}%
                        </span>
                        <span className="text-gray-500">
                          Target: {Math.round(threshold * 100)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {results.length === 0 && !loading && (
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-gray-500">No evaluation results found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

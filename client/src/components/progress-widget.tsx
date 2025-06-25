import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, Clock, Trophy } from "lucide-react";

interface ProgressWidgetProps {
  stats?: {
    totalTasks: number;
    completedTasks: number;
    totalMinutes: number;
    completionRate: number;
    categoryStats: Record<string, { total: number; completed: number }>;
  };
}

export default function ProgressWidget({ stats }: ProgressWidgetProps) {
  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            <span>Your Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded"></div>
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { totalTasks, completedTasks, totalMinutes, completionRate, categoryStats } = stats;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary-600" />
          <span>Your Progress</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Overall Completion</span>
            <span className="text-sm text-slate-600">{completionRate}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-primary-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Target className="h-4 w-4 text-primary-600 mr-1" />
            </div>
            <div className="text-xl font-bold text-primary-600">{completedTasks}</div>
            <div className="text-xs text-slate-600">Completed</div>
          </div>
          
          <div className="text-center p-3 bg-success-50 rounded-lg">
            <div className="flex items-center justify-center mb-1">
              <Clock className="h-4 w-4 text-success-600 mr-1" />
            </div>
            <div className="text-xl font-bold text-success-600">{Math.round(totalMinutes / 60)}h</div>
            <div className="text-xs text-slate-600">Study Time</div>
          </div>
        </div>

        {/* Category Breakdown */}
        {Object.keys(categoryStats).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-3">Category Progress</h4>
            <div className="space-y-2">
              {Object.entries(categoryStats).map(([category, stats]) => {
                const percentage = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                return (
                  <div key={category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="capitalize text-slate-600">{category}</span>
                      <Badge variant="outline" className="text-xs px-1 py-0">
                        {stats.completed}/{stats.total}
                      </Badge>
                    </div>
                    <span className="text-slate-500">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Achievement Badge */}
        {completionRate >= 50 && (
          <div className="text-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
            <Trophy className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
            <div className="text-sm font-medium text-yellow-800">Great Progress!</div>
            <div className="text-xs text-yellow-700">Keep up the momentum</div>
          </div>
        )}

        {/* Learning Streak */}
        <div className="text-center text-xs text-slate-500">
          {totalTasks > 0 ? (
            `${totalTasks} total tasks • ${Math.round(totalMinutes / totalTasks || 0)} avg minutes per task`
          ) : (
            "Start your learning journey today!"
          )}
        </div>
      </CardContent>
    </Card>
  );
}

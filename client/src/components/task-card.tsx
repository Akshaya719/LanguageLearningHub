import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CheckCircle2, 
  Clock, 
  Edit3, 
  Trash2, 
  Calendar,
  Target,
  MoreHorizontal
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Task } from "@shared/schema";

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const { toast } = useToast();

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (updates: Partial<Task>) => {
      const response = await apiRequest("PATCH", `/api/tasks/${task.id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update task. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/tasks/${task.id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Task deleted successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized", 
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete task. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCompleteToggle = (completed: boolean) => {
    updateTaskMutation.mutate({ completed });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate();
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700";
      case "medium": return "bg-yellow-100 text-yellow-700";
      case "low": return "bg-green-100 text-green-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "vocabulary": return "bg-blue-100 text-blue-700";
      case "grammar": return "bg-purple-100 text-purple-700";
      case "conversation": return "bg-green-100 text-green-700";
      case "listening": return "bg-orange-100 text-orange-700";
      case "reading": return "bg-indigo-100 text-indigo-700";
      case "writing": return "bg-pink-100 text-pink-700";
      case "culture": return "bg-teal-100 text-teal-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${task.completed ? 'opacity-75' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          {/* Completion Checkbox */}
          <div className="pt-1">
            <Checkbox
              checked={task.completed}
              onCheckedChange={handleCompleteToggle}
              disabled={updateTaskMutation.isPending}
              className="data-[state=checked]:bg-success-600"
            />
          </div>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className={`text-lg font-semibold ${task.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                {task.title}
              </h3>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-destructive"
                    disabled={deleteTaskMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {task.description && (
              <p className={`text-sm mb-3 ${task.completed ? 'text-slate-400' : 'text-slate-600'}`}>
                {task.description}
              </p>
            )}

            {/* Task Metadata */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="outline" className={getCategoryColor(task.category)}>
                {task.category}
              </Badge>
              
              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                {task.priority} priority
              </Badge>

              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <Clock className="h-3 w-3" />
                <span>{task.estimatedMinutes}min</span>
              </div>

              {task.topic && (
                <div className="flex items-center space-x-1 text-xs text-slate-500">
                  <Target className="h-3 w-3" />
                  <span>{task.topic}</span>
                </div>
              )}
            </div>

            {/* Completion Status */}
            {task.completed && task.completedAt && (
              <div className="flex items-center space-x-2 text-xs text-success-600">
                <CheckCircle2 className="h-3 w-3" />
                <span>
                  Completed on {new Date(task.completedAt).toLocaleDateString()}
                  {task.actualMinutes && ` • ${task.actualMinutes}min spent`}
                </span>
              </div>
            )}

            {/* Due Date */}
            {task.dueDate && !task.completed && (
              <div className="flex items-center space-x-2 text-xs text-slate-500 mt-2">
                <Calendar className="h-3 w-3" />
                <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

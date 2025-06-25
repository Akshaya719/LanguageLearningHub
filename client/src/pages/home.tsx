import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Plus, 
  Target, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Flame,
  TrendingUp,
  Calendar,
  Filter,
  Trash2,
  Edit,
  MoreVertical
} from "lucide-react";
import type { Task, InsertTask } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Local state
  const [generateTopic, setGenerateTopic] = useState("");
  const [taskFilter, setTaskFilter] = useState<"all" | "pending" | "completed">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showTaskForm, setShowTaskForm] = useState(false);

  // Fetch tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/tasks'],
    retry: false,
  });

  // Fetch suggestions
  const { data: suggestions } = useQuery({
    queryKey: ['/api/suggestions'],
    retry: false,
  });

  // Generate tasks mutation
  const generateTasksMutation = useMutation({
    mutationFn: async (topic: string) => {
      return await apiRequest(`/api/generate-tasks`, {
        method: "POST",
        body: JSON.stringify({ topic }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: (generatedTasks) => {
      toast({
        title: "Tasks Generated!",
        description: `Generated ${generatedTasks.length} tasks for "${generateTopic}". You can now save them individually.`,
      });
      setGeneratedTasks(generatedTasks);
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
        description: "Failed to generate tasks. Please try again.",
        variant: "destructive",
      });
    },
  });

  const [generatedTasks, setGeneratedTasks] = useState<any[]>([]);

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: InsertTask) => {
      return await apiRequest(`/api/tasks`, {
        method: "POST",
        body: JSON.stringify(taskData),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        description: "Task created successfully!",
      });
      setShowTaskForm(false);
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
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return await apiRequest(`/api/tasks/${taskId}/complete`, {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        description: "Task marked as completed!",
      });
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
        description: "Failed to complete task. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      return await apiRequest(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({
        title: "Success",
        description: "Task deleted successfully!",
      });
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

  // Filter tasks
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    return tasks.filter((task: Task) => {
      if (taskFilter === "pending" && task.completed) return false;
      if (taskFilter === "completed" && !task.completed) return false;
      if (categoryFilter !== "all" && task.category !== categoryFilter) return false;
      if (priorityFilter !== "all" && task.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, taskFilter, categoryFilter, priorityFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    if (!tasks) return null;
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task: Task) => task.completed).length;
    const totalMinutes = tasks.reduce((sum: number, task: Task) => sum + (task.estimatedMinutes || 0), 0);
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    const categoryStats: Record<string, { total: number; completed: number }> = {};
    tasks.forEach((task: Task) => {
      if (!categoryStats[task.category]) {
        categoryStats[task.category] = { total: 0, completed: 0 };
      }
      categoryStats[task.category].total++;
      if (task.completed) {
        categoryStats[task.category].completed++;
      }
    });

    return {
      totalTasks,
      completedTasks,
      totalMinutes,
      completionRate,
      categoryStats,
    };
  }, [tasks]);

  const handleGenerateTasks = (e: React.FormEvent) => {
    e.preventDefault();
    if (generateTopic.trim()) {
      generateTasksMutation.mutate(generateTopic.trim());
    }
  };

  const handleSaveGeneratedTask = (generatedTask: any) => {
    createTaskMutation.mutate({
      title: generatedTask.title,
      description: generatedTask.description,
      category: generatedTask.category,
      priority: generatedTask.priority,
      estimatedMinutes: generatedTask.estimatedMinutes,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "learning": return "bg-blue-100 text-blue-800";
      case "work": return "bg-purple-100 text-purple-800";
      case "personal": return "bg-pink-100 text-pink-800";
      case "health": return "bg-emerald-100 text-emerald-800";
      case "finance": return "bg-amber-100 text-amber-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Welcome back, {user?.firstName || "User"}!
            </h1>
            <p className="text-slate-600 mt-2">
              Manage your tasks and boost productivity with AI assistance
            </p>
          </div>
          <Button 
            onClick={() => window.location.href = "/api/logout"}
            variant="outline"
          >
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Tasks</p>
                    <div className="text-2xl font-bold text-slate-900">{stats.totalTasks}</div>
                  </div>
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Completed</p>
                    <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Completion Rate</p>
                    <div className="text-2xl font-bold text-purple-600">{Math.round(stats.completionRate)}%</div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
                <Progress value={stats.completionRate} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Time</p>
                    <div className="text-2xl font-bold text-orange-600">{Math.round(stats.totalMinutes / 60)}h</div>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Task Generation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  <span>Generate Tasks with AI</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleGenerateTasks} className="space-y-4">
                  <div>
                    <Label htmlFor="topic">What do you want to learn or work on?</Label>
                    <Input
                      id="topic"
                      placeholder="e.g., Learn Python, Improve fitness, Start a blog..."
                      value={generateTopic}
                      onChange={(e) => setGenerateTopic(e.target.value)}
                      disabled={generateTasksMutation.isPending}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={!generateTopic.trim() || generateTasksMutation.isPending}
                  >
                    {generateTasksMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate 5 Tasks
                      </>
                    )}
                  </Button>
                </form>

                {/* Generated Tasks Preview */}
                {generatedTasks.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-medium text-slate-900">Generated Tasks:</h4>
                    {generatedTasks.map((task, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <h5 className="font-medium text-slate-900">{task.title}</h5>
                          <p className="text-sm text-slate-600">{task.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className={getCategoryColor(task.category)}>
                              {task.category}
                            </Badge>
                            <Badge className={getPriorityColor(task.priority)}>
                              {task.priority}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              ~{task.estimatedMinutes} min
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleSaveGeneratedTask(task)}
                          disabled={createTaskMutation.isPending}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {suggestions?.suggestions && suggestions.suggestions.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-slate-600 mb-2">Suggested topics based on your progress:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.suggestions.map((suggestion: string, index: number) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => setGenerateTopic(suggestion)}
                          className="text-xs"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tasks Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span>Your Tasks</span>
                  </CardTitle>
                  <Button onClick={() => setShowTaskForm(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Filters:</span>
                  </div>
                  
                  <Tabs value={taskFilter} onValueChange={(value) => setTaskFilter(value as any)}>
                    <TabsList className="grid w-full grid-cols-3 max-w-sm">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="pending">Pending</TabsTrigger>
                      <TabsTrigger value="completed">Completed</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="learning">Learning</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tasks List */}
                {tasksLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-slate-200 h-24 rounded-lg"></div>
                    ))}
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No tasks found</h3>
                    <p className="text-slate-600 mb-4">
                      {tasks.length === 0 
                        ? "Start by generating some AI-powered tasks above!"
                        : "Try adjusting your filters or create a new task."
                      }
                    </p>
                    {tasks.length === 0 && (
                      <Button onClick={() => setGenerateTopic("Learn something new")} variant="outline">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Sample Tasks
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTasks.map((task: Task) => (
                      <div key={task.id} className={`p-4 border rounded-lg transition-all ${
                        task.completed ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Button
                                size="sm"
                                variant={task.completed ? "default" : "outline"}
                                onClick={() => completeTaskMutation.mutate(task.id)}
                                disabled={completeTaskMutation.isPending || task.completed}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <h4 className={`font-medium ${task.completed ? 'text-green-700 line-through' : 'text-slate-900'}`}>
                                {task.title}
                              </h4>
                            </div>
                            
                            {task.description && (
                              <p className="text-sm text-slate-600 mb-3">{task.description}</p>
                            )}
                            
                            <div className="flex items-center gap-2">
                              <Badge className={getCategoryColor(task.category)}>
                                {task.category}
                              </Badge>
                              <Badge className={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                ~{task.estimatedMinutes} min
                              </span>
                              {task.completedAt && (
                                <span className="text-xs text-green-600">
                                  Completed {new Date(task.completedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteTaskMutation.mutate(task.id)}
                            disabled={deleteTaskMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Progress Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Completion Rate</span>
                      <span className="font-medium">{Math.round(stats.completionRate)}%</span>
                    </div>
                    <Progress value={stats.completionRate} />
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-900">By Category</h4>
                      {Object.entries(stats.categoryStats).map(([category, stat]) => (
                        <div key={category} className="flex justify-between items-center text-sm">
                          <span className="text-slate-600 capitalize">{category}</span>
                          <span className="font-medium">{stat.completed}/{stat.total}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Focus */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today's Focus</CardTitle>
              </CardHeader>
              <CardContent>
                {tasks
                  .filter((task: Task) => !task.completed)
                  .slice(0, 3)
                  .map((task: Task) => (
                    <div key={task.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getCategoryColor(task.category)} variant="outline">
                            {task.category}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            ~{task.estimatedMinutes}m
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                
                {tasks.filter((task: Task) => !task.completed).length === 0 && (
                  <p className="text-sm text-slate-600 text-center py-4">
                    All caught up! 🎉
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Simple Task Form Modal */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add New Task</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createTaskMutation.mutate({
                  title: formData.get('title') as string,
                  description: formData.get('description') as string,
                  category: formData.get('category') as any,
                  priority: formData.get('priority') as any,
                  estimatedMinutes: parseInt(formData.get('estimatedMinutes') as string) || 30,
                });
              }} className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required />
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" defaultValue="general">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="work">Work</SelectItem>
                        <SelectItem value="learning">Learning</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                        <SelectItem value="health">Health</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select name="priority" defaultValue="medium">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="estimatedMinutes">Estimated Minutes</Label>
                  <Input 
                    id="estimatedMinutes" 
                    name="estimatedMinutes" 
                    type="number" 
                    defaultValue="30"
                    min="5"
                    max="480"
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowTaskForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTaskMutation.isPending}>
                    {createTaskMutation.isPending ? "Creating..." : "Create Task"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
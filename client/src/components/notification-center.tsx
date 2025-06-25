import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, X, Clock, CheckCircle, AlertCircle } from "lucide-react";
import type { Task } from "@shared/schema";

interface Notification {
  id: string;
  type: "reminder" | "achievement" | "suggestion";
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  createdAt: Date;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Fetch tasks to generate notifications
  const { data: tasks = [] } = useQuery({
    queryKey: ["/api/tasks"],
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Generate notifications based on tasks
  useEffect(() => {
    if (!tasks.length) return;

    const newNotifications: Notification[] = [];
    const now = new Date();

    // Check for overdue tasks
    const overdueTasks = tasks.filter((task: Task) => {
      if (task.completed || !task.dueDate) return false;
      return new Date(task.dueDate) < now;
    });

    if (overdueTasks.length > 0) {
      newNotifications.push({
        id: `overdue-${Date.now()}`,
        type: "reminder",
        title: "Overdue Tasks",
        message: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`,
        actionText: "View Tasks",
        createdAt: new Date(),
      });
    }

    // Check for tasks due today
    const tasksToday = tasks.filter((task: Task) => {
      if (task.completed || !task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      const today = new Date();
      return (
        taskDate.getDate() === today.getDate() &&
        taskDate.getMonth() === today.getMonth() &&
        taskDate.getFullYear() === today.getFullYear()
      );
    });

    if (tasksToday.length > 0) {
      newNotifications.push({
        id: `today-${Date.now()}`,
        type: "reminder",
        title: "Tasks Due Today",
        message: `${tasksToday.length} task${tasksToday.length > 1 ? 's' : ''} due today`,
        actionText: "Start Learning",
        createdAt: new Date(),
      });
    }

    // Check for achievements
    const completedTasks = tasks.filter((task: Task) => task.completed);
    if (completedTasks.length > 0 && completedTasks.length % 5 === 0) {
      newNotifications.push({
        id: `achievement-${completedTasks.length}`,
        type: "achievement",
        title: "Milestone Reached!",
        message: `Congratulations! You've completed ${completedTasks.length} tasks`,
        createdAt: new Date(),
      });
    }

    // Update notifications if there are new ones
    if (newNotifications.length > 0) {
      setNotifications(prev => {
        // Remove duplicates based on type and avoid spam
        const filtered = newNotifications.filter(newNotif => 
          !prev.some(existingNotif => 
            existingNotif.type === newNotif.type && 
            existingNotif.title === newNotif.title
          )
        );
        return [...prev, ...filtered].slice(-3); // Keep only last 3
      });
      setIsVisible(true);
    }
  }, [tasks]);

  // Auto-hide notifications after 10 seconds
  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    if (notifications.length <= 1) {
      setIsVisible(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "reminder":
        return <Bell className="h-4 w-4 text-primary-600" />;
      case "achievement":
        return <CheckCircle className="h-4 w-4 text-success-600" />;
      case "suggestion":
        return <AlertCircle className="h-4 w-4 text-warning-600" />;
      default:
        return <Bell className="h-4 w-4 text-slate-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "reminder":
        return "border-primary-200 bg-primary-50";
      case "achievement":
        return "border-success-200 bg-success-50";
      case "suggestion":
        return "border-warning-200 bg-warning-50";
      default:
        return "border-slate-200 bg-white";
    }
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`p-4 shadow-lg transition-all duration-300 ease-out animate-in slide-in-from-right-full ${getNotificationColor(notification.type)}`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              {getNotificationIcon(notification.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-medium text-slate-900">
                    {notification.title}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    {notification.message}
                  </p>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => dismissNotification(notification.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              {notification.actionText && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs h-7"
                  onClick={() => {
                    // Handle action click
                    dismissNotification(notification.id);
                  }}
                >
                  {notification.actionText}
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Clock, 
  Calendar,
  Users,
  DollarSign,
  BookOpen,
  User
} from "lucide-react";
import type { LanguageClass, ClassSession } from "@shared/schema";

interface ClassCardProps {
  classItem: LanguageClass & { 
    nextSession?: ClassSession; 
    availableSpots?: number;
  };
}

export default function ClassCard({ classItem }: ClassCardProps) {
  const { toast } = useToast();

  // Book class mutation
  const bookClassMutation = useMutation({
    mutationFn: async () => {
      if (!classItem.nextSession) {
        throw new Error("No available sessions");
      }
      
      const response = await apiRequest("POST", "/api/bookings", {
        sessionId: classItem.nextSession.id,
        status: "booked"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Class booked successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
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
        description: "Failed to book class. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case "beginner": return "bg-green-100 text-green-700";
      case "intermediate": return "bg-yellow-100 text-yellow-700";
      case "advanced": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "class": return "bg-blue-100 text-blue-700";
      case "workshop": return "bg-purple-100 text-purple-700";
      case "conversation": return "bg-green-100 text-green-700";
      case "tutoring": return "bg-orange-100 text-orange-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const isAvailable = classItem.nextSession && (classItem.availableSpots || 0) > 0;

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {classItem.title}
              </h3>
              <p className="text-sm text-slate-600 mb-2">
                {classItem.description}
              </p>
            </div>
            {classItem.price && (
              <div className="text-right">
                <div className="text-lg font-bold text-slate-900">
                  {formatPrice(classItem.price)}
                </div>
                <div className="text-xs text-slate-500">per session</div>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-primary-100 text-primary-700">
              {classItem.language}
            </Badge>
            <Badge variant="outline" className={getLevelColor(classItem.level)}>
              {classItem.level}
            </Badge>
            <Badge variant="outline" className={getTypeColor(classItem.type)}>
              {classItem.type}
            </Badge>
          </div>

          {/* Details */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <MapPin className="h-4 w-4" />
              <span>{classItem.location}</span>
            </div>
            
            {classItem.instructorName && (
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <User className="h-4 w-4" />
                <span>Instructor: {classItem.instructorName}</span>
              </div>
            )}

            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <Clock className="h-4 w-4" />
              <span>{classItem.duration} minutes</span>
            </div>

            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <Users className="h-4 w-4" />
              <span>Max {classItem.maxStudents} students</span>
            </div>
          </div>

          {/* Next Session Info */}
          {classItem.nextSession && (
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Next Session</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isAvailable 
                    ? 'bg-success-100 text-success-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {isAvailable 
                    ? `${classItem.availableSpots} spots left` 
                    : 'Full'
                  }
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-slate-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDateTime(classItem.nextSession.startTime).date}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDateTime(classItem.nextSession.startTime).time}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            {classItem.nextSession ? (
              <Button
                onClick={() => bookClassMutation.mutate()}
                disabled={!isAvailable || bookClassMutation.isPending}
                className="w-full"
                variant={isAvailable ? "default" : "secondary"}
              >
                {bookClassMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Booking...
                  </>
                ) : isAvailable ? (
                  <>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Book Now
                  </>
                ) : (
                  "Class Full"
                )}
              </Button>
            ) : (
              <Button variant="outline" className="w-full" disabled>
                No Upcoming Sessions
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
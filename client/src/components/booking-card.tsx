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
  X,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import type { UserBooking, ClassSession, LanguageClass } from "@shared/schema";

interface BookingCardProps {
  booking: UserBooking & { 
    session: ClassSession & { 
      class: LanguageClass 
    } 
  };
}

export default function BookingCard({ booking }: BookingCardProps) {
  const { toast } = useToast();

  // Cancel booking mutation
  const cancelBookingMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/bookings/${booking.id}/cancel`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Booking cancelled successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
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
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "booked": return "bg-blue-100 text-blue-700";
      case "attended": return "bg-green-100 text-green-700";
      case "cancelled": return "bg-red-100 text-red-700";
      case "no_show": return "bg-orange-100 text-orange-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "attended": return <CheckCircle2 className="h-4 w-4" />;
      case "cancelled": return <X className="h-4 w-4" />;
      case "no_show": return <AlertCircle className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const isUpcoming = new Date(booking.session.startTime) > new Date();
  const canCancel = booking.status === "booked" && isUpcoming;

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {booking.session.class.title}
              </h3>
              <p className="text-sm text-slate-600">
                {booking.session.class.language} • {booking.session.class.level}
              </p>
            </div>
            <Badge variant="outline" className={getStatusColor(booking.status)}>
              <div className="flex items-center space-x-1">
                {getStatusIcon(booking.status)}
                <span className="capitalize">{booking.status}</span>
              </div>
            </Badge>
          </div>

          {/* Session Details */}
          <div className="bg-slate-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">
                {isUpcoming ? "Upcoming Session" : "Past Session"}
              </span>
              <span className="text-xs text-slate-500">
                Duration: {booking.session.class.duration} min
              </span>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-slate-600">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDateTime(booking.session.startTime).date}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>
                  {formatDateTime(booking.session.startTime).time} - {formatDateTime(booking.session.endTime).time}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <MapPin className="h-3 w-3" />
              <span>{booking.session.class.location}</span>
            </div>

            {booking.session.class.instructorName && (
              <div className="text-sm text-slate-600">
                <span className="font-medium">Instructor:</span> {booking.session.class.instructorName}
              </div>
            )}
          </div>

          {/* Booking Info */}
          <div className="text-xs text-slate-500">
            Booked on {new Date(booking.bookedAt).toLocaleDateString()}
          </div>

          {/* Notes */}
          {booking.notes && (
            <div className="text-sm text-slate-600">
              <span className="font-medium">Notes:</span> {booking.notes}
            </div>
          )}

          {/* Actions */}
          {canCancel && (
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Are you sure you want to cancel this booking?")) {
                    cancelBookingMutation.mutate();
                  }
                }}
                disabled={cancelBookingMutation.isPending}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {cancelBookingMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600 mr-2"></div>
                    Cancelling...
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3 mr-2" />
                    Cancel Booking
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Contact Info */}
          {(booking.session.class.contactEmail || booking.session.class.contactPhone) && (
            <div className="text-xs text-slate-500 space-y-1">
              {booking.session.class.contactEmail && (
                <div>Email: {booking.session.class.contactEmail}</div>
              )}
              {booking.session.class.contactPhone && (
                <div>Phone: {booking.session.class.contactPhone}</div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
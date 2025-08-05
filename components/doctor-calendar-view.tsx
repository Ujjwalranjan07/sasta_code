"use client"

import { useState, useMemo, useCallback } from "react"
import { Calendar, momentLocalizer } from "react-big-calendar"
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop"
import moment from "moment"
import { format, parseISO, setHours, setMinutes, setSeconds, setMilliseconds, addMinutes } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Edit, Trash2, Phone, Mail, User, CheckCircle, XCircle, Repeat } from "lucide-react"
import "@/app/styles/calendar.css"
// Import the CSS for react-big-calendar and drag and drop
import "react-big-calendar/lib/css/react-big-calendar.css"
import "react-big-calendar/lib/addons/dragAndDrop/styles.css"
// Import our custom calendar styles


import { patientsAPI, type Appointment, type Patient } from "@/lib/api"

const localizer = momentLocalizer(moment)
const DnDCalendar = withDragAndDrop(Calendar)

interface DoctorCalendarViewProps {
  appointments: Appointment[]
  onReschedule: (appointmentId: string, newDate: string, newTime: string) => Promise<void>
  onUpdateStatus: (appointmentId: string, status: Appointment["status"]) => Promise<void>
}

export default function DoctorCalendarView({ appointments, onReschedule, onUpdateStatus }: DoctorCalendarViewProps) {
  const { toast } = useToast()
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [rescheduleDate, setRescheduleDate] = useState("")
  const [rescheduleTime, setRescheduleTime] = useState("")
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null)

  // State for patient details popup
  const [selectedPatientDetails, setSelectedPatientDetails] = useState<Patient | null>(null)
  const [isPatientDetailsDialogOpen, setIsPatientDetailsDialogOpen] = useState(false)
  // New state to store the full appointment object for the details dialog
  const [currentDetailsAppointment, setCurrentDetailsAppointment] = useState<Appointment | null>(null)

  // State to control the current date of the calendar view for navigation
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date())

  const events = useMemo(() => {
    const events = appointments.map((apt) => {
      const [hours, minutes] = apt.time.split(":").map(Number)
      const startDate = setMilliseconds(setSeconds(setMinutes(setHours(parseISO(apt.date), hours), minutes), 0), 0)
      const endDate = addMinutes(startDate, 30) // Assuming 30-minute duration

      return {
        id: apt.id,
        title: apt.patientName,
        start: startDate,
        end: endDate,
        allDay: false,
        resource: apt, // Store the full appointment object
      }
    })
    console.log("Calendar Events (transformed from appointments):", events)
    return events
  }, [appointments])

  const handleEventDrop = useCallback(
    async ({ event, start, end }: { event: any; start: Date; end: Date }) => {
      const newDate = format(start, "yyyy-MM-dd")
      const newTime = format(start, "HH:mm")
      const appointmentId = event.id

      console.log("Attempting to reschedule via drag-and-drop:")
      console.log("Appointment ID:", appointmentId)
      console.log("New Date:", newDate)
      console.log("New Time:", newTime)

      try {
        await onReschedule(appointmentId, newDate, newTime)
        toast({
          title: "Success",
          description: `Appointment for ${event.title} rescheduled to ${newDate} at ${newTime}. Status set to Pending.`,
        })
      } catch (error) {
        console.error("Error during drag-and-drop reschedule:", error)
        toast({
          title: "Error",
          description: "Failed to reschedule appointment via drag and drop. Check console for details.",
          variant: "destructive",
        })
      }
    },
    [onReschedule, toast],
  )

  const handleRescheduleFromDialog = async () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleTime) return
    setIsRescheduling(true)
    console.log("Attempting to reschedule via dialog:")
    console.log("Appointment ID:", selectedAppointment.id)
    console.log("New Date:", rescheduleDate)
    console.log("New Time:", rescheduleTime)
    try {
      await onReschedule(selectedAppointment.id, rescheduleDate, rescheduleTime)
      toast({
        title: "Success",
        description: "Appointment rescheduled successfully! Status set to Pending.",
      })
      setSelectedAppointment(null)
      setRescheduleDate("")
      setRescheduleTime("")
      setIsPatientDetailsDialogOpen(false) // Close patient details dialog after reschedule
    } catch (error) {
      console.error("Error during dialog reschedule:", error)
      toast({
        title: "Error",
        description: "Failed to reschedule appointment. Check console for details.",
        variant: "destructive",
      })
    } finally {
      setIsRescheduling(false)
    }
  }

  const handleCancelAppointment = async () => {
    if (!appointmentToCancel) return
    console.log("Attempting to cancel appointment:", appointmentToCancel.id)
    try {
      await onUpdateStatus(appointmentToCancel.id, "cancelled")
      toast({
        title: "Success",
        description: `Appointment for ${appointmentToCancel.patientName} cancelled.`,
      })
      setIsCancelConfirmOpen(false)
      setAppointmentToCancel(null)
    } catch (error) {
      console.error("Error during cancellation:", error)
      toast({
        title: "Error",
        description: "Failed to cancel appointment. Check console.",
        variant: "destructive",
      })
    }
  }

  // Function to handle event click and open patient details dialog
  const handleSelectEvent = useCallback(
    async (event: any) => {
      const appointment: Appointment = event.resource
      console.log("Event clicked:", appointment)
      setCurrentDetailsAppointment(appointment) // Store the full appointment object
      try {
        const patient = await patientsAPI.getById(appointment.patientId)
        setSelectedPatientDetails(patient)
        setIsPatientDetailsDialogOpen(true)
      } catch (error) {
        console.error("Failed to fetch patient details:", error)
        toast({
          title: "Error",
          description: "Failed to load patient details. Check console.",
          variant: "destructive",
        })
      }
    },
    [toast],
  )

  // New handlers for actions from patient details dialog
  const handleCompleteFromDetails = async () => {
    if (!currentDetailsAppointment) return
    try {
      await onUpdateStatus(currentDetailsAppointment.id, "completed")
      toast({
        title: "Success",
        description: `Appointment for ${currentDetailsAppointment.patientName} marked as completed.`,
      })
      setIsPatientDetailsDialogOpen(false) // Close dialog
    } catch (error) {
      console.error("Error completing appointment from details dialog:", error)
      toast({
        title: "Error",
        description: "Failed to mark appointment as complete. Check console.",
        variant: "destructive",
      })
    }
  }

  const handleCancelFromDetails = async () => {
    if (!currentDetailsAppointment) return
    try {
      await onUpdateStatus(currentDetailsAppointment.id, "cancelled")
      toast({
        title: "Success",
        description: `Appointment for ${currentDetailsAppointment.patientName} cancelled.`,
      })
      setIsPatientDetailsDialogOpen(false) // Close dialog
    } catch (error) {
      console.error("Error cancelling appointment from details dialog:", error)
      toast({
        title: "Error",
        description: "Failed to cancel appointment. Check console.",
        variant: "destructive",
      })
    }
  }

  const handleApproveFromDetails = async () => {
    if (!currentDetailsAppointment) return
    try {
      await onUpdateStatus(currentDetailsAppointment.id, "approved") // Change status to 'approved' (pink)
      toast({
        title: "Success",
        description: `Appointment for ${currentDetailsAppointment.patientName} approved.`,
      })
      setIsPatientDetailsDialogOpen(false) // Close dialog
    } catch (error) {
      console.error("Error approving appointment from details dialog:", error)
      toast({
        title: "Error",
        description: "Failed to approve appointment. Check console.",
        variant: "destructive",
      })
    }
  }

  // This function will now open the reschedule dialog
  const handleRebookClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setRescheduleDate(appointment.date) // Pre-fill with current date
    setRescheduleTime(appointment.time) // Pre-fill with current time
    setIsPatientDetailsDialogOpen(false) // Close patient details dialog
    // The DialogTrigger for reschedule dialog will handle opening it
  }

  const EventComponent = useCallback(
    ({ event }: { event: any }) => {
      const appointment: Appointment = event.resource
      return (
        <div className="relative h-full w-full p-1 text-white overflow-hidden group">
          <div className="font-bold text-xl truncate">{event.title}</div> {/* Even larger patient name */}
          <div className="text-base truncate">
            {format(event.start, "hh:mm a")} - {format(event.end, "hh:mm a")}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-red-400"
              onClick={(e) => {
                e.stopPropagation() // Prevent calendar click from opening details dialog
                setAppointmentToCancel(appointment)
                setIsCancelConfirmOpen(true)
              }}
            >
              <Trash2 className="w-6 h-6" />
              <span className="sr-only">Cancel</span>
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:text-blue-400"
                  onClick={(e) => {
                    e.stopPropagation() // Prevent calendar click from opening details dialog
                    setSelectedAppointment(appointment)
                    setRescheduleDate(appointment.date)
                    setRescheduleTime(appointment.time)
                  }}
                >
                  <Edit className="w-6 h-6" />
                  <span className="sr-only">Reschedule</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white border-gray-200">
                <DialogHeader>
                  <DialogTitle className="text-gray-800">Reschedule Appointment</DialogTitle>
                  <DialogDescription className="text-gray-600">
                    Change the date and time for {appointment.patientName}'s appointment
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="date" className="text-gray-700">
                      New Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      className="bg-white border-gray-300 text-gray-800"
                    />
                  </div>
                  <div>
                    <Label htmlFor="time" className="text-gray-700">
                      New Time
                    </Label>
                    <Select value={rescheduleTime} onValueChange={setRescheduleTime}>
                      <SelectTrigger className="bg-white border-gray-300 text-gray-800">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-gray-300">
                        {Array.from({ length: 16 }, (_, i) => {
                          // 7 AM to 10 PM (15 hours * 2 slots/hour)
                          const hour = Math.floor(i / 2) + 7 // Start from 7 AM
                          const minute = (i % 2) * 30
                          const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
                          return (
                            <SelectItem key={timeString} value={timeString}>
                              {format(setMinutes(setHours(new Date(), hour), minute), "hh:mm a")}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleRescheduleFromDialog}
                      disabled={isRescheduling || !rescheduleDate || !rescheduleTime}
                      className="flex-1 bg-teal-500 hover:bg-teal-600"
                    >
                      {isRescheduling ? "Rescheduling..." : "Reschedule"}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-gray-300 text-gray-700 bg-transparent"
                      onClick={() => setSelectedAppointment(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      )
    },
    [rescheduleDate, rescheduleTime, isRescheduling, onReschedule, onUpdateStatus, toast],
  )

  const minTime = useMemo(() => setMinutes(setHours(new Date(), 7), 0), []) // 7 AM
  const maxTime = useMemo(() => setMinutes(setHours(new Date(), 22), 0), []) // 10 PM

  // Handler for calendar navigation: updates the currentCalendarDate state
  const handleNavigate = useCallback((newDate: Date) => {
    setCurrentCalendarDate(newDate)
  }, [])

  return (
    <div className="h-[80vh] min-h-[600px] bg-white rounded-lg p-4 shadow-xl border border-gray-200">
      <DnDCalendar
        key={currentCalendarDate.toISOString()}
        localizer={localizer}
        events={events}
        onEventDrop={handleEventDrop}
        onSelectEvent={handleSelectEvent}
        resizable={false}
        defaultView="week"
        views={["week"]}
        step={30}
        timeslots={2}
        min={minTime}
        max={maxTime}
        date={currentCalendarDate}
        onNavigate={handleNavigate}
        components={{
          event: EventComponent,
        }}
        className="text-white"
        eventPropGetter={(event) => {
          const appointment = event.resource as Appointment
          let backgroundColor = "#3B82F6" // Default blue, will be overridden
          switch (appointment.status) {
            case "confirmed":
              backgroundColor = "#10B981" // Green for initial confirmed appointments
              break
            case "pending":
              backgroundColor = "#F59E0B" // Yellow for rescheduled (pending) appointments
              break
            case "cancelled":
              backgroundColor = "#EF4444" // Red for cancelled appointments
              break
            case "completed":
              backgroundColor = "#3B82F6" // Blue for completed appointments
              break
            case "approved":
              backgroundColor = "#FF69B4" // Pink for approved appointments
              break
          }
          return { style: { backgroundColor, borderRadius: "8px", border: "none" } }
        }}
        toolbar={true}
      />

      {/* Confirmation Dialog for Cancellation */}
      <Dialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Confirm Cancellation</DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to cancel the appointment for {appointmentToCancel?.patientName} on{" "}
              {appointmentToCancel?.date} at {appointmentToCancel?.time}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-gray-300 text-gray-700 bg-transparent"
              onClick={() => setIsCancelConfirmOpen(false)}
            >
              No, Keep It
            </Button>
            <Button variant="destructive" onClick={handleCancelAppointment}>
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Patient Details Dialog */}
      <Dialog open={isPatientDetailsDialogOpen} onOpenChange={setIsPatientDetailsDialogOpen}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Patient Details</DialogTitle>
            <DialogDescription className="text-gray-600">
              Information for {selectedPatientDetails?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedPatientDetails && currentDetailsAppointment ? (
            <div className="space-y-4 text-gray-700">
              <div className="flex items-center">
                <User className="w-5 h-5 mr-2 text-teal-400" />
                <span className="font-semibold">Name:</span> {selectedPatientDetails.name}
              </div>
              <div className="flex items-center">
                <Mail className="w-5 h-5 mr-2 text-blue-400" />
                <span className="font-semibold">Email:</span> {selectedPatientDetails.email}
              </div>
              <div className="flex items-center">
                <Phone className="w-5 h-5 mr-2 text-green-400" />
                <span className="font-semibold">Phone:</span> {selectedPatientDetails.phone}
              </div>
              <div className="flex items-center">
                <Repeat className="w-5 h-5 mr-2 text-purple-400" />
                <span className="font-semibold">Total Time:</span> 30 minutes {/* Assuming 30 min duration */}
              </div>
              {/* You can add more patient details here if available in your Patient interface */}
            </div>
          ) : (
            <div className="text-gray-500">Loading patient details...</div>
          )}
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
            {/* Buttons for PENDING appointments */}
            {currentDetailsAppointment?.status === "pending" && (
              <>
                <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={handleApproveFromDetails}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-600 text-slate-300 bg-transparent"
                  onClick={() => setIsPatientDetailsDialogOpen(false)}
                >
                  Close
                </Button>
              </>
            )}

            {/* Buttons for CONFIRMED appointments (green) */}
            {currentDetailsAppointment?.status === "confirmed" && (
              <>
                <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={handleApproveFromDetails}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/50 bg-transparent"
                  onClick={handleCancelFromDetails}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Appointment
                </Button>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleCompleteFromDetails}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </Button>
              </>
            )}

            {/* Buttons for APPROVED appointments (pink) */}
            {currentDetailsAppointment?.status === "approved" && (
              <>
                <Button
                  variant="outline"
                  className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/50 bg-transparent"
                  onClick={handleCancelFromDetails}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Appointment
                </Button>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleCompleteFromDetails}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Complete
                </Button>
              </>
            )}

            {/* Buttons for COMPLETED or CANCELLED appointments */}
            {(currentDetailsAppointment?.status === "completed" ||
              currentDetailsAppointment?.status === "cancelled") && (
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/50 bg-transparent"
                  onClick={() => currentDetailsAppointment && handleRebookClick(currentDetailsAppointment)}
                >
                  <Repeat className="w-4 h-4 mr-2" />
                  Rebook
                </Button>
              </DialogTrigger>
            )}
            {/* The Close button is now conditionally rendered for 'pending', 'completed', and 'cancelled' statuses */}
            {(currentDetailsAppointment?.status === "pending" ||
              currentDetailsAppointment?.status === "completed" ||
              currentDetailsAppointment?.status === "cancelled") && (
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 bg-transparent"
                onClick={() => setIsPatientDetailsDialogOpen(false)}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog (This dialog is triggered by the Rebook button) */}
      <Dialog
        open={selectedAppointment !== null && !isPatientDetailsDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAppointment(null)
            setRescheduleDate("")
            setRescheduleTime("")
          }
        }}
      >
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Reschedule Appointment</DialogTitle>
            <DialogDescription className="text-gray-600">
              Change the date and time for {selectedAppointment?.patientName}'s appointment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="date" className="text-gray-700">
                New Date
              </Label>
              <Input
                id="date"
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="bg-white border-gray-300 text-gray-800"
              />
            </div>
            <div>
              <Label htmlFor="time" className="text-gray-700">
                New Time
              </Label>
              <Select value={rescheduleTime} onValueChange={setRescheduleTime}>
                <SelectTrigger className="bg-white border-gray-300 text-gray-800">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  {Array.from({ length: 16 }, (_, i) => {
                    const hour = Math.floor(i / 2) + 7
                    const minute = (i % 2) * 30
                    const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
                    return (
                      <SelectItem key={timeString} value={timeString}>
                        {format(setMinutes(setHours(new Date(), hour), minute), "hh:mm a")}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleRescheduleFromDialog}
                disabled={isRescheduling || !rescheduleDate || !rescheduleTime}
                className="flex-1 bg-teal-500 hover:bg-teal-600"
              >
                {isRescheduling ? "Rescheduling..." : "Reschedule"}
              </Button>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 bg-transparent"
                onClick={() => setSelectedAppointment(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

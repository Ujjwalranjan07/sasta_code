"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { ModernNavbar } from "@/components/ModernNavbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { appointmentsAPI, doctorsAPI, type Appointment } from "@/lib/api"
import { prescriptionsAPI, Prescription } from "@/lib/prescriptions"
import { Listbox, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/20/solid";
import {
  Calendar,
  Clock,
  Stethoscope,
  Video,
  Phone,
  Building,
  RotateCcw,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  Pill,
  Download,
  User,
  UserRound,
  ClipboardList
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { PatientPrescriptions } from "@/components/PatientPrescriptions"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

export default function AppointmentsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("upcoming")
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showPrescriptionDialog, setShowPrescriptionDialog] = useState(false)
  const [appointmentPrescriptions, setAppointmentPrescriptions] = useState<Prescription[]>([])
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [showPrescriptionDetails, setShowPrescriptionDetails] = useState(false)
  const prescriptionRef = useRef<HTMLDivElement>(null)

  // Reschedule form states
  const [newDate, setNewDate] = useState("")
  const [newTime, setNewTime] = useState("")
  const [availableDates, setAvailableDates] = useState<any[]>([])
  const [availableTimes, setAvailableTimes] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      loadAppointments()
    }
  }, [user])

  const loadAppointments = async () => {
    if (!user) return
    try {
      const appointmentsData = await appointmentsAPI.getByPatientId(user.id)
      setAppointments(appointmentsData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadAvailableDates = async (doctorId: string) => {
    try {
      const doctor = await doctorsAPI.getById(doctorId)
      const dates = []
      const today = new Date()

      for (let i = 1; i < 15; i++) {
        // Start from tomorrow
        const date = new Date(today)
        date.setDate(today.getDate() + i)

        // Skip weekends if doctor doesn't work on weekends
        const dayOfWeek = date.getDay()
        if ((dayOfWeek === 0 || dayOfWeek === 6) && !doctor.workWeekends) {
          continue
        }

        const formattedDate = date.toISOString().split('T')[0]
        dates.push({
          id: formattedDate,
          name: format(date, "EEEE, MMMM d, yyyy"),
          value: formattedDate,
        })
      }

      setAvailableDates(dates)
      if (dates.length > 0) {
        setNewDate(dates[0].id)
        loadAvailableTimes(doctorId, dates[0].id)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load available dates",
        variant: "destructive",
      })
    }
  }

  const loadAvailableTimes = async (doctorId: string, date: string) => {
    try {
      // Simulate API call to get available times
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Generate time slots from 9 AM to 5 PM
      const times = []
      for (let hour = 9; hour <= 17; hour++) {
        const formattedHour = hour % 12 === 0 ? 12 : hour % 12
        const amPm = hour < 12 ? "AM" : "PM"
        times.push(`${formattedHour}:00 ${amPm}`)
        if (hour < 17) {
          times.push(`${formattedHour}:30 ${amPm}`)
        }
      }

      setAvailableTimes(times)
      if (times.length > 0) {
        setNewTime(times[0])
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load available times",
        variant: "destructive",
      })
    }
  }

  const filterAppointments = (status: string) => {
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (status === "upcoming") {
        return appointmentDate >= today && appointment.status !== "cancelled" && appointment.status !== "completed"
      } else if (status === "completed") {
        return appointment.status === "completed"
      } else if (status === "cancelled") {
        return appointment.status === "cancelled"
      } else if (status === "rescheduled") {
        return appointment.status === "rescheduled"
      }
      return false
    })
  }

  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    loadAvailableDates(appointment.doctorId)
    setShowRescheduleDialog(true)
  }

  const handleRescheduleConfirm = async () => {
    if (!selectedAppointment || !newDate || !newTime) {
      toast({
        title: "Error",
        description: "Please select both date and time",
        variant: "destructive",
      })
      return
    }

    setIsRescheduling(true)
    try {
      // Simulate API call to reschedule
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update appointment with new date and time
      const updatedAppointments = appointments.map((apt) =>
        apt.id === selectedAppointment.id
          ? {
              ...apt,
              date: `${newDate}T${newTime.split(' ')[0]}`,
              status: "rescheduled",
            }
          : apt
      )

      setAppointments(updatedAppointments)
      setShowRescheduleDialog(false)
      setSelectedAppointment(null)

      toast({
        title: "Success",
        description: "Appointment rescheduled successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reschedule appointment",
        variant: "destructive",
      })
    } finally {
      setIsRescheduling(false)
    }
  }

  const handleCancel = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setShowCancelDialog(true)
  }

  const handleCancelConfirm = async () => {
    if (!selectedAppointment) return

    setIsCancelling(true)
    try {
      // Simulate API call to cancel
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Update appointment status to cancelled
      const updatedAppointments = appointments.map((apt) =>
        apt.id === selectedAppointment.id
          ? {
              ...apt,
              status: "cancelled",
            }
          : apt
      )

      setAppointments(updatedAppointments)
      setShowCancelDialog(false)
      setSelectedAppointment(null)

      toast({
        title: "Success",
        description: "Appointment cancelled successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const handleViewPrescriptions = async (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setLoadingPrescriptions(true)

    try {
      // Fetch prescriptions for this appointment
      const prescriptions = await prescriptionsAPI.getByAppointmentId(appointment.id)
      setAppointmentPrescriptions(prescriptions)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load prescriptions",
        variant: "destructive",
      })
      setAppointmentPrescriptions([])
    } finally {
      setLoadingPrescriptions(false)
      setShowPrescriptionDialog(true)
    }
  }

  const handleCreatePrescription = () => {
    if (!selectedAppointment) return
    
    // Redirect to a new prescription form with appointment details
    router.push(`/doctor/prescriptions/new?appointmentId=${selectedAppointment.id}`)
  }

  const tabOptions = [
    { id: "upcoming", label: "Upcoming", count: filterAppointments("upcoming").length, color: "text-blue-600" },
    { id: "completed", label: "Completed", count: filterAppointments("completed").length, color: "text-green-600" },
    { id: "cancelled", label: "Cancelled", count: filterAppointments("cancelled").length, color: "text-red-600" },
    { id: "rescheduled", label: "Rescheduled", count: filterAppointments("rescheduled").length, color: "text-purple-600" }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <ModernNavbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <motion.div
              className="text-center py-20"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <motion.div
                  className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-400"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
              </div>
              <motion.p
                className="mt-6 text-lg text-gray-600"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Loading your appointments...
              </motion.p>
            </motion.div>
          ) : (
            <>
              <motion.div
                className="text-center mb-8 sm:mb-12"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
                  My Appointments
                </h1>
                <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
                  Manage your healthcare appointments with ease
                </p>
              </motion.div>

              <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="sm:hidden w-full mb-4 z-10">
                    <Listbox value={activeTab} onChange={setActiveTab}>
                      <div className="relative">
                        {/* Dropdown Button */}
                        <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-white py-3 pl-4 pr-10 text-left border border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300">
                          <span
                            className={`block truncate font-semibold ${tabOptions.find((opt) => opt.id === activeTab)?.color || "text-gray-900"
                              }`}
                          >
                            {tabOptions.find((opt) => opt.id === activeTab)?.label} (
                            {tabOptions.find((opt) => opt.id === activeTab)?.count})
                          </span>
                          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                            <ChevronUpDownIcon className="h-5 w-5 text-gray-400 transition-transform duration-300 group-open:rotate-180" />
                          </span>
                        </Listbox.Button>

                        {/* Dropdown Options */}
                        <Transition
                          as={Fragment}
                          leave="transition ease-in duration-100"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <Listbox.Options className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                            {tabOptions.map((option) => (
                              <Listbox.Option
                                key={option.id}
                                className={({ active }) =>
                                  `relative cursor-pointer select-none py-3 pl-10 pr-4 ${active ? "bg-blue-50" : "text-gray-900"
                                  }`
                                }
                                value={option.id}
                              >
                                {({ selected }) => (
                                  <>
                                    <span
                                      className={`block truncate ${selected ? "font-semibold" : "font-normal"
                                        } ${option.color}`}
                                    >
                                      {option.label} ({option.count})
                                    </span>
                                    {selected ? (
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                                        <CheckIcon className="h-5 w-5" aria-hidden="true" />
                                      </span>
                                    ) : null}
                                  </>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </Transition>
                      </div>
                    </Listbox>
                  </div>

                  <div className="hidden sm:block">
                    <TabsList className="grid grid-cols-4 w-full max-w-3xl mx-auto bg-blue-50/50 p-1 rounded-xl">
                      {tabOptions.map((tab) => (
                        <TabsTrigger
                          key={tab.id}
                          value={tab.id}
                          className={`flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-300 rounded-lg py-3 ${tab.id === activeTab ? tab.color : "text-gray-600"}`}
                        >
                          <span>{tab.label}</span>
                          <Badge
                            className={`${tab.id === "upcoming" ? "bg-blue-100 text-blue-700 border-blue-200" :
                              tab.id === "completed" ? "bg-green-100 text-green-700 border-green-200" :
                                tab.id === "cancelled" ? "bg-red-100 text-red-700 border-red-200" :
                                  "bg-purple-100 text-purple-700 border-purple-200"
                              } rounded-full px-2 py-0.5 text-xs font-medium`}
                          >
                            {tab.count}
                          </Badge>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  <AnimatePresence mode="wait">
                    {tabOptions.map((tab) => (
                      <TabsContent key={tab.id} value={tab.id} className="mt-6">
                        <motion.div
                          variants={containerVariants}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0, y: -10 }}
                          className="grid grid-cols-1 gap-6"
                        >
                          {filterAppointments(tab.id).length === 0 ? (
                            <motion.div
                              className="col-span-full text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.5 }}
                            >
                              <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-gray-100 mb-4">
                                {tab.id === "upcoming" ? (
                                  <Calendar className="w-12 h-12 text-blue-500 opacity-70" />
                                ) : tab.id === "completed" ? (
                                  <CheckCircle className="w-12 h-12 text-green-500 opacity-70" />
                                ) : tab.id === "cancelled" ? (
                                  <X className="w-12 h-12 text-red-500 opacity-70" />
                                ) : (
                                  <RotateCcw className="w-12 h-12 text-purple-500 opacity-70" />
                                )}
                              </div>
                              <h3 className="text-xl font-medium text-gray-900 mb-2">
                                No {tab.label.toLowerCase()} appointments
                              </h3>
                              <p className="text-gray-500 max-w-md mx-auto">
                                {tab.id === "upcoming"
                                  ? "You don't have any upcoming appointments scheduled. Book a new appointment to get started."
                                  : tab.id === "completed"
                                    ? "You don't have any completed appointments yet. Once you complete an appointment, it will appear here."
                                    : tab.id === "cancelled"
                                      ? "You don't have any cancelled appointments. Cancelled appointments will be shown here."
                                      : "You don't have any rescheduled appointments. When you reschedule an appointment, it will appear here."}
                              </p>
                            </motion.div>
                          ) : (
                            filterAppointments(tab.id).map((appointment) => (
                              <motion.div key={appointment.id} variants={cardVariants}>
                                <Card className="overflow-hidden border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                                  <CardHeader className="pb-4">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                                          <Stethoscope className="w-5 h-5 text-blue-600" />
                                          Dr. {appointment.doctorName}
                                        </CardTitle>
                                        <CardDescription className="text-gray-600 mt-1">
                                          {appointment.specialization} • {appointment.hospitalName}
                                        </CardDescription>
                                      </div>
                                      <Badge
                                        className={`${appointment.status === "confirmed" || appointment.status === "upcoming"
                                          ? "bg-blue-100 text-blue-800 border-blue-200"
                                          : appointment.status === "completed"
                                            ? "bg-green-100 text-green-800 border-green-200"
                                            : appointment.status === "cancelled"
                                              ? "bg-red-100 text-red-800 border-red-200"
                                              : "bg-purple-100 text-purple-800 border-purple-200"
                                          } px-2.5 py-0.5 capitalize`}
                                      >
                                        {appointment.status}
                                      </Badge>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="pb-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                      <div className="flex items-start gap-3">
                                        <div className="bg-blue-50 p-2 rounded-lg">
                                          <Calendar className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-gray-500">Date</p>
                                          <p className="text-gray-900">
                                            {(() => {
                                              try {
                                                return format(new Date(appointment.date), "MMMM d, yyyy")
                                              } catch (error) {
                                                return appointment.date || "Date not available"
                                              }
                                            })()}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-start gap-3">
                                        <div className="bg-blue-50 p-2 rounded-lg">
                                          <Clock className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-gray-500">Time</p>
                                          <p className="text-gray-900">
                                            {(() => {
                                              try {
                                                const date = new Date(appointment.date)
                                                return format(date, "h:mm a")
                                              } catch (error) {
                                                return "Time not available"
                                              }
                                            })()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                                      <div className="flex items-start gap-3">
                                        <div className="bg-blue-50 p-2 rounded-lg">
                                          {appointment.type === "video" ? (
                                            <Video className="w-5 h-5 text-blue-600" />
                                          ) : appointment.type === "phone" ? (
                                            <Phone className="w-5 h-5 text-blue-600" />
                                          ) : (
                                            <Building className="w-5 h-5 text-blue-600" />
                                          )}
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-gray-500">Type</p>
                                          <p className="text-gray-900 capitalize">{appointment.type} Consultation</p>
                                        </div>
                                      </div>
                                      <div className="flex items-start gap-3 sm:col-span-2">
                                        <div className="bg-blue-50 p-2 rounded-lg">
                                          <FileText className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                          <p className="text-sm font-medium text-gray-500">Reason</p>
                                          <p className="text-gray-900">{appointment.reason || "Not specified"}</p>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3 mt-4">
                                      {(appointment.status === "confirmed" || appointment.status === "upcoming") && (
                                        <>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                                            onClick={() => handleReschedule(appointment)}
                                          >
                                            <RotateCcw className="w-4 h-4 mr-2" />
                                            Reschedule
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800"
                                            onClick={() => handleCancel(appointment)}
                                          >
                                            <X className="w-4 h-4 mr-2" />
                                            Cancel
                                          </Button>
                                        </>
                                      )}
                                      {appointment.status === "completed" && (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                                          onClick={() => handleViewPrescriptions(appointment)}
                                        >
                                          <FileText className="w-4 h-4 mr-2" />
                                          View Prescriptions
                                        </Button>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))
                          )}
                        </motion.div>
                      </TabsContent>
                    ))}
                  </AnimatePresence>
                </Tabs>
              </motion.div>

              {/* Reschedule Dialog */}
              <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <RotateCcw className="w-5 h-5 text-blue-600" />
                      Reschedule Appointment
                    </DialogTitle>
                    <DialogDescription>
                      Select a new date and time for your appointment with Dr. {selectedAppointment?.doctorName}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">New Date</Label>
                      <Select value={newDate} onValueChange={setNewDate}>
                        <SelectTrigger id="date">
                          <SelectValue placeholder="Select a date" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDates.map((date) => (
                            <SelectItem key={date.id} value={date.id}>
                              {date.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="time">New Time</Label>
                      <Select value={newTime} onValueChange={setNewTime}>
                        <SelectTrigger id="time">
                          <SelectValue placeholder="Select a time" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTimes.map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowRescheduleDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRescheduleConfirm}
                      disabled={isRescheduling}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isRescheduling ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Rescheduling...
                        </>
                      ) : (
                        "Confirm Reschedule"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Cancel Dialog */}
              <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      Cancel Appointment
                    </DialogTitle>
                    <DialogDescription>
                      Are you sure you want to cancel your appointment with Dr. {selectedAppointment?.doctorName}?
                    </DialogDescription>
                  </DialogHeader>

                  <div className="py-4">
                    <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-800">
                      <div className="flex items-start">
                        <AlertCircle className="mr-2 h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <h3 className="font-medium">Cancellation Policy</h3>
                          <p className="mt-1">
                            Appointments cancelled less than 24 hours before the scheduled time may incur a cancellation fee.
                            Please refer to our cancellation policy for more details.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowCancelDialog(false)}
                    >
                      Go Back
                    </Button>
                    <Button
                      onClick={handleCancelConfirm}
                      disabled={isCancelling}
                      variant="destructive"
                    >
                      {isCancelling ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Cancelling...
                        </>
                      ) : (
                        "Confirm Cancellation"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Prescriptions Dialog */}
              <Dialog open={showPrescriptionDialog} onOpenChange={setShowPrescriptionDialog}>
                <DialogContent className="sm:max-w-3xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Prescriptions
                    </DialogTitle>
                    <DialogDescription>
                      Prescriptions from your appointment with Dr. {selectedAppointment?.doctorName} on{" "}
                      {selectedAppointment
                        ? (() => {
                          try {
                            return format(new Date(selectedAppointment.date), "MMMM d, yyyy")
                          } catch (error) {
                            return selectedAppointment.date || "Date not available"
                          }
                        })()
                        : ""}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="py-4">
                    {loadingPrescriptions ? (
                      <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                      </div>
                    ) : appointmentPrescriptions.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-gray-100 mb-4">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions found</h3>
                        <p className="text-gray-500 max-w-md mx-auto">
                          There are no prescriptions associated with this appointment.
                        </p>
                      </div>
                    ) : (
                      <PatientPrescriptions
                        prescriptions={appointmentPrescriptions}
                        onViewDetails={(prescription) => {
                          setSelectedPrescription(prescription)
                          setShowPrescriptionDetails(true)
                          setShowPrescriptionDialog(false)
                        }}
                      />
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {/* Prescription Details Dialog */}
              <Dialog open={showPrescriptionDetails} onOpenChange={setShowPrescriptionDetails}>
                <DialogContent className="bg-white border border-gray-200 text-gray-800 max-w-3xl p-0 overflow-hidden">
                  <div className="relative">
                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                      <div className="text-[200px] font-bold text-gray-500 rotate-45">Rx</div>
                    </div>
                    
                    <div className="p-6">
                      <DialogHeader className="mb-4">
                        <div className="flex justify-between items-center">
                          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-blue-600" />
                            Medical Prescription
                          </DialogTitle>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowPrescriptionDetails(false)}
                            className="rounded-full h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <DialogDescription className="text-gray-600">
                          Official medical prescription document
                        </DialogDescription>
                      </DialogHeader>

                      {selectedPrescription && (
                        <>
                          <div className="space-y-6 bg-white rounded-lg border border-gray-200 p-6 shadow-sm" ref={prescriptionRef}>
                            {/* Prescription Header with Logo */}
                            <div className="flex items-center justify-between border-b-2 border-blue-600 pb-4">
                              <div className="flex items-center">
                                <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-3 rounded-lg mr-3 shadow-md">
                                  <Pill className="w-6 h-6" />
                                </div>
                                <div>
                                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">MediCare</h2>
                                  <p className="text-sm text-gray-500">Advanced Healthcare Services</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium text-gray-500">Prescription ID</div>
                                <div className="text-gray-800 font-mono bg-blue-50 px-2 py-1 rounded border border-blue-100">{selectedPrescription.id}</div>
                              </div>
                            </div>
                            
                            {/* Date and Doctor Info */}
                            <div className="flex flex-col sm:flex-row justify-between gap-4 pb-4 border-b border-gray-200">
                              <div className="bg-gradient-to-r from-blue-50 to-white p-3 rounded-lg border border-blue-100 flex-1">
                                <h3 className="text-lg font-medium text-gray-800 mb-1 flex items-center">
                                  <User className="w-4 h-4 mr-2 text-blue-600" />
                                  Dr. {selectedPrescription.doctorName}
                                </h3>
                                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <Calendar className="w-4 h-4 mr-1 text-blue-600" />
                                    {(() => {
                                      try {
                                        return format(new Date(selectedPrescription.date), "MMM d, yyyy")
                                      } catch (error) {
                                        return selectedPrescription.date || "Date not available"
                                      }
                                    })()}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-end">
                                <Badge className="bg-blue-100 text-blue-800 border-blue-200 h-fit px-3 py-1 text-sm shadow-sm">
                                  <FileText className="w-3 h-3 mr-1" />
                                  {selectedPrescription.medicines.length} Medicines
                                </Badge>
                              </div>
                            </div>

                            {/* Patient Information */}
                            <div className="pb-4 border-b border-gray-200">
                              <h4 className="text-md font-medium text-gray-800 mb-2 flex items-center">
                                <UserRound className="w-4 h-4 mr-2 text-blue-600" />
                                Patient Information
                              </h4>
                              <div className="bg-gradient-to-r from-blue-50 to-white rounded-lg p-4 border border-blue-100 shadow-sm">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <p className="text-gray-700 flex items-center">
                                    <span className="font-medium mr-2 text-gray-800">Name:</span>
                                    <span className="bg-white px-2 py-1 rounded border border-gray-100 flex-1">{selectedPrescription.patientName}</span>
                                  </p>
                                  <p className="text-gray-700 flex items-center">
                                    <span className="font-medium mr-2 text-gray-800">Date:</span>
                                    <span className="bg-white px-2 py-1 rounded border border-gray-100 flex-1">
                                      {(() => {
                                        try {
                                          return format(new Date(selectedPrescription.date), "MMMM d, yyyy")
                                        } catch (error) {
                                          return selectedPrescription.date || "Date not available"
                                        }
                                      })()}
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Rx Symbol */}
                            <div className="flex items-center mb-2">
                              <div className="text-3xl font-serif italic text-blue-700 mr-2 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 shadow-sm">Rx</div>
                              <div className="flex-1 h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
                            </div>

                            {/* Prescribed Medicines */}
                            <div>
                              <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                                <Pill className="w-4 h-4 mr-2 text-blue-600" />
                                Prescribed Medicines
                              </h4>
                              <ScrollArea className="h-[200px] pr-4">
                                <div className="space-y-3">
                                  {selectedPrescription.medicines.map((medicine, index) => (
                                    <div
                                      key={index}
                                      className="bg-gradient-to-r from-white to-blue-50 rounded-lg p-4 border-l-4 border-blue-500 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
                                    >
                                      <h5 className="text-gray-800 font-medium mb-2 flex items-center">
                                        <span className="mr-2 bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">{index + 1}</span>
                                        {medicine.name}
                                      </h5>
                                      <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div className="flex items-center text-gray-600">
                                          <span className="font-medium mr-2 text-gray-700">Dosage:</span>
                                          <Badge variant="outline" className="font-normal bg-white">{medicine.dosage}</Badge>
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                          <span className="font-medium mr-2 text-gray-700">Duration:</span>
                                          <Badge variant="outline" className="font-normal bg-white">{medicine.duration}</Badge>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>

                            {/* Notes & Instructions */}
                            {selectedPrescription.notes && (
                              <div className="pt-2 border-t border-gray-200">
                                <h4 className="text-md font-medium text-gray-800 mb-2 flex items-center">
                                  <ClipboardList className="w-4 h-4 mr-2 text-blue-600" />
                                  Notes & Instructions
                                </h4>
                                <div className="bg-gradient-to-r from-yellow-50 to-white rounded-lg p-4 border border-yellow-100 shadow-sm">
                                  <p className="text-gray-700 whitespace-pre-wrap italic">{selectedPrescription.notes}</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Digital Signature */}
                            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-end">
                              <div className="text-xs text-gray-500">
                                <p>This is a digital prescription</p>
                                <p>Generated on {new Date().toLocaleDateString()}</p>
                                <p className="mt-1 text-blue-600">MediCare Healthcare Services</p>
                              </div>
                              <div className="text-right">
                                <div className="font-serif italic text-blue-700 text-lg border-b-2 border-blue-700 inline-block pb-1">Dr. {selectedPrescription.doctorName}</div>
                                <div className="text-xs text-gray-500">Digital Signature</div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Download Button */}
                          <div className="flex justify-center mt-6">
                            <Button 
                              onClick={async () => {
                                if (!selectedPrescription || !prescriptionRef.current) return;

                                try {
                                  toast({
                                    title: "Preparing PDF",
                                    description: "Please wait while we generate your prescription...",
                                  });

                                  const prescriptionElement = prescriptionRef.current;
                                  const canvas = await html2canvas(prescriptionElement, {
                                    scale: 2,
                                    logging: false,
                                    backgroundColor: "#ffffff", // White background
                                  });

                                  const imgData = canvas.toDataURL('image/png');
                                  const pdf = new jsPDF({
                                    orientation: 'portrait',
                                    unit: 'mm',
                                    format: 'a4',
                                  });

                                  const imgWidth = 210; // A4 width in mm
                                  const imgHeight = (canvas.height * imgWidth) / canvas.width;

                                  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                                  pdf.save(`Prescription_${selectedPrescription.id}.pdf`);

                                  toast({
                                    title: "Success",
                                    description: "Prescription downloaded successfully!",
                                  });
                                } catch (error) {
                                  console.error("Error generating PDF:", error);
                                  toast({
                                    title: "Error",
                                    description: "Failed to download prescription. Please try again.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white px-8 py-3 rounded-full shadow-md transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto"
                              size="lg"
                            >
                              <Download className="w-5 h-5" />
                              Download Prescription
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

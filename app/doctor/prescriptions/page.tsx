"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  Search,
  Plus,
  FileText,
  Calendar,
  User,
  Edit,
  Trash2,
  ArrowLeft,
  Filter,
  X,
  Clock,
  CheckCircle,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { appointmentsAPI, type Appointment } from "@/lib/api"
import { prescriptionsAPI, type Prescription, type Medicine } from "@/lib/prescriptions"
import { medicineCategories, type CommonMedicine, type MedicineCategory } from "@/lib/medicines"

export default function PrescriptionsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const appointmentId = searchParams.get("appointmentId")

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState(appointmentId || "")
  const [filterBy, setFilterBy] = useState("all")

  // New prescription form state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<string>("") 
  const [medicines, setMedicines] = useState<Medicine[]>([{ name: "", dosage: "", duration: "" }])
  const [notes, setNotes] = useState("")
  
  // Edit prescription state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentPrescription, setCurrentPrescription] = useState<Prescription | null>(null)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])
  
  // Set search term when appointmentId changes
  useEffect(() => {
    if (appointmentId) {
      setSearchTerm(appointmentId)
    }
  }, [appointmentId])

  useEffect(() => {
    filterPrescriptions()
  }, [prescriptions, searchTerm, filterBy])

  const loadData = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      // Load appointments for the doctor
      const appointmentsData = await appointmentsAPI.getByDoctorId(user.id)
      setAppointments(appointmentsData)
      
      // Load prescriptions for the doctor
      const prescriptionsData = await prescriptionsAPI.getByDoctorId(user.id)
      setPrescriptions(prescriptionsData)
    } catch (error) {
      console.error("Failed to load data:", error)
      toast({
        title: "Error",
        description: "Failed to load prescriptions and appointments",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterPrescriptions = () => {
    let filtered = prescriptions
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(
        (prescription) =>
          prescription.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prescription.appointmentId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Apply category filter
    if (filterBy !== "all") {
      const today = new Date().toISOString().split("T")[0]
      
      if (filterBy === "today") {
        filtered = filtered.filter((prescription) => prescription.date === today)
      } else if (filterBy === "thisWeek") {
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        const oneWeekAgoStr = oneWeekAgo.toISOString().split("T")[0]
        
        filtered = filtered.filter(
          (prescription) => prescription.date >= oneWeekAgoStr && prescription.date <= today
        )
      }
    }
    
    setFilteredPrescriptions(filtered)
  }

  const handleCreatePrescription = async () => {
    if (!selectedAppointment || medicines.some(med => !med.name || !med.dosage || !med.duration)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      // Find the selected appointment details
      const appointment = appointments.find(apt => apt.id === selectedAppointment)
      if (!appointment) {
        throw new Error("Selected appointment not found")
      }

      const newPrescription: Omit<Prescription, "id"> = {
        doctorId: user?.id || "",
        doctorName: user?.name || "",
        patientId: appointment.patientId,
        patientName: appointment.patientName,
        appointmentId: appointment.id,
        date: new Date().toISOString().split("T")[0],
        medicines: medicines,
        notes: notes,
      }

      const createdPrescription = await prescriptionsAPI.create(newPrescription)
      setPrescriptions([...prescriptions, createdPrescription])
      
      // Reset form
      setSelectedAppointment("")
      setMedicines([{ name: "", dosage: "", duration: "" }])
      setNotes("")
      setIsCreateDialogOpen(false)
      
      toast({
        title: "Success",
        description: "Prescription created successfully",
      })
    } catch (error) {
      console.error("Failed to create prescription:", error)
      toast({
        title: "Error",
        description: "Failed to create prescription",
        variant: "destructive",
      })
    }
  }

  const handleEditPrescription = async () => {
    if (!currentPrescription || currentPrescription.medicines.some(med => !med.name || !med.dosage || !med.duration)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    try {
      const updatedPrescription = await prescriptionsAPI.update(currentPrescription.id, currentPrescription)
      
      // Update local state
      setPrescriptions(prescriptions.map(p => p.id === updatedPrescription.id ? updatedPrescription : p))
      setIsEditDialogOpen(false)
      
      toast({
        title: "Success",
        description: "Prescription updated successfully",
      })
    } catch (error) {
      console.error("Failed to update prescription:", error)
      toast({
        title: "Error",
        description: "Failed to update prescription",
        variant: "destructive",
      })
    }
  }

  const handleDeletePrescription = async (id: string) => {
    try {
      await prescriptionsAPI.delete(id)
      
      // Update local state
      setPrescriptions(prescriptions.filter(p => p.id !== id))
      
      toast({
        title: "Success",
        description: "Prescription deleted successfully",
      })
    } catch (error) {
      console.error("Failed to delete prescription:", error)
      toast({
        title: "Error",
        description: "Failed to delete prescription",
        variant: "destructive",
      })
    }
  }

  const addMedicine = () => {
    setMedicines([...medicines, { name: "", dosage: "", duration: "" }])
  }

  const removeMedicine = (index: number) => {
    const updatedMedicines = [...medicines]
    updatedMedicines.splice(index, 1)
    setMedicines(updatedMedicines)
  }

  const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
    const updatedMedicines = [...medicines]
    updatedMedicines[index] = { ...updatedMedicines[index], [field]: value }
    setMedicines(updatedMedicines)
  }

  const updateCurrentPrescriptionMedicine = (index: number, field: keyof Medicine, value: string) => {
    if (!currentPrescription) return
    
    const updatedMedicines = [...currentPrescription.medicines]
    updatedMedicines[index] = { ...updatedMedicines[index], [field]: value }
    
    setCurrentPrescription({
      ...currentPrescription,
      medicines: updatedMedicines
    })
  }

  const addMedicineToCurrentPrescription = () => {
    if (!currentPrescription) return
    
    setCurrentPrescription({
      ...currentPrescription,
      medicines: [...currentPrescription.medicines, { name: "", dosage: "", duration: "" }]
    })
  }

  const removeMedicineFromCurrentPrescription = (index: number) => {
    if (!currentPrescription) return
    
    const updatedMedicines = [...currentPrescription.medicines]
    updatedMedicines.splice(index, 1)
    
    setCurrentPrescription({
      ...currentPrescription,
      medicines: updatedMedicines
    })
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const getCompletedAppointments = () => {
    return appointments.filter(apt => apt.status === "completed")
  }

  return (
    <ProtectedRoute allowedRoles={["doctor"]}>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="mr-4 border-slate-600 text-slate-300 hover:bg-slate-700/50 bg-transparent"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Prescriptions
                </h1>
                <p className="text-slate-400 text-lg mt-2">Manage patient prescriptions</p>
              </div>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-teal-500 hover:bg-teal-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  New Prescription
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl text-white">Create New Prescription</DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Fill in the prescription details for your patient
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="appointment" className="text-white">Select Appointment</Label>
                    <Select value={selectedAppointment} onValueChange={setSelectedAppointment}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                        <SelectValue placeholder="Select an appointment" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        {getCompletedAppointments().length > 0 ? (
                          getCompletedAppointments().map((apt) => (
                            <SelectItem key={apt.id} value={apt.id}>
                              {apt.patientName} - {new Date(apt.date).toLocaleDateString()} {apt.time}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>
                            No completed appointments found
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-white">Medicines</Label>
                      <div className="flex items-center space-x-2">
                        <Select
                          onValueChange={(value) => {
                            const medicine = medicineCategories
                              .flatMap(c => c.medicines)
                              .find(m => m.name === value);
                            
                            if (medicine) {
                              addMedicine();
                              const lastIndex = medicines.length;
                              updateMedicine(lastIndex, "name", medicine.name);
                              if (medicine.commonDosages.length > 0) {
                                updateMedicine(lastIndex, "dosage", medicine.commonDosages[0]);
                              }
                              if (medicine.commonDurations.length > 0) {
                                updateMedicine(lastIndex, "duration", medicine.commonDurations[0]);
                              }
                            }
                          }}
                        >
                          <SelectTrigger className="bg-slate-800 border-slate-700 text-white w-[180px]">
                            <SelectValue placeholder="Quick add..." />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700 text-white max-h-[300px]">
                            {medicineCategories.map((category) => (
                              <div key={category.category}>
                                <div className="px-2 py-1.5 text-xs font-semibold text-slate-400">
                                  {category.category}
                                </div>
                                {category.medicines.map((med) => (
                                  <SelectItem key={med.name} value={med.name}>
                                    {med.name}
                                  </SelectItem>
                                ))}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={addMedicine}
                          className="border-teal-500 text-teal-400 hover:bg-teal-500/10"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add Medicine
                        </Button>
                      </div>
                    </div>
                    
                    {medicines.map((medicine, index) => (
                      <div key={index} className="space-y-3 p-3 bg-slate-800/50 rounded-md relative">
                        {medicines.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-slate-400 hover:text-red-400 h-6 w-6"
                            onClick={() => removeMedicine(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <Label htmlFor={`medicine-name-${index}`} className="text-white">Medicine Name</Label>
                            <Select
                              value={medicine.name || ""}
                              onValueChange={(value) => updateMedicine(index, "name", value)}
                            >
                              <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                                <SelectValue placeholder="Select a medicine" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700 text-white max-h-[300px]">
                                {medicineCategories.map((category) => (
                                  <div key={category.category}>
                                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-400">
                                      {category.category}
                                    </div>
                                    {category.medicines.map((med) => (
                                      <SelectItem key={med.name} value={med.name}>
                                        {med.name}
                                      </SelectItem>
                                    ))}
                                  </div>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="mt-2">
                              <Input
                                value={medicine.name}
                                onChange={(e) => updateMedicine(index, "name", e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                                placeholder="Or type medicine name"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor={`medicine-dosage-${index}`} className="text-white">Dosage</Label>
                              <Select
                                value={medicine.dosage || ""}
                                onValueChange={(value) => updateMedicine(index, "dosage", value)}
                              >
                                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                                  <SelectValue placeholder="Select dosage" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                  {medicine.name && medicineCategories
                                    .flatMap(c => c.medicines)
                                    .find(m => m.name === medicine.name)?.commonDosages
                                    .map((dosage) => (
                                      <SelectItem key={dosage} value={dosage}>
                                        {dosage}
                                      </SelectItem>
                                    ))}
                                  {!medicine.name && (
                                      <SelectItem key="no-medicine" value="" disabled>
                                        Select a medicine first
                                      </SelectItem>
                                    )}
                                </SelectContent>
                              </Select>
                              <div className="mt-2">
                                <Input
                                  id={`medicine-dosage-${index}`}
                                  value={medicine.dosage}
                                  onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
                                  className="bg-slate-800 border-slate-700 text-white"
                                  placeholder="Or type custom dosage"
                                />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor={`medicine-duration-${index}`} className="text-white">Duration</Label>
                              <Select
                                value={medicine.duration || ""}
                                onValueChange={(value) => updateMedicine(index, "duration", value)}
                              >
                                <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                                  <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                  {medicine.name && medicineCategories
                                    .flatMap(c => c.medicines)
                                    .find(m => m.name === medicine.name)?.commonDurations
                                    .map((duration) => (
                                      <SelectItem key={duration} value={duration}>
                                        {duration}
                                      </SelectItem>
                                    )) || (
                                      <SelectItem key="no-medicine" value="" disabled>
                                        Select a medicine first
                                      </SelectItem>
                                    )}
                                </SelectContent>
                              </Select>
                              <div className="mt-2">
                                <Input
                                  id={`medicine-duration-${index}`}
                                  value={medicine.duration}
                                  onChange={(e) => updateMedicine(index, "duration", e.target.value)}
                                  className="bg-slate-800 border-slate-700 text-white"
                                  placeholder="Or type custom duration"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-white">Notes/Instructions</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                      placeholder="Additional instructions or notes for the patient"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-slate-600 text-slate-300 hover:bg-slate-700/50 bg-transparent">
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleCreatePrescription} className="bg-teal-500 hover:bg-teal-600 text-white">
                    Create Prescription
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search prescriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-600/50 text-white placeholder-slate-400 focus:border-teal-500/50"
              />
            </div>
            <div className="w-full sm:w-64">
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="all">All Prescriptions</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="thisWeek">This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <Card className="border-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-16 h-16 text-slate-500 mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Prescriptions Found</h3>
                <p className="text-slate-400 text-center max-w-md">
                  {searchTerm || filterBy !== "all"
                    ? "No prescriptions match your search criteria. Try adjusting your filters."
                    : "You haven't created any prescriptions yet. Click 'New Prescription' to get started."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrescriptions.map((prescription, index) => (
                <Card
                  key={prescription.id}
                  className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="relative">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center text-white group-hover:text-teal-300 transition-colors">
                        <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mr-3 shadow-lg">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        {prescription.patientName}
                      </CardTitle>
                      <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 transition-all duration-300 group-hover:scale-105">
                        Prescription
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center text-slate-400 ml-15">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(prescription.date)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="space-y-4">
                      {/* Medicines */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-slate-300">Medicines</h4>
                        <div className="space-y-2">
                          {prescription.medicines.map((medicine, idx) => (
                            <div key={idx} className="p-2 bg-slate-800/30 rounded-md">
                              <div className="font-medium text-white">{medicine.name}</div>
                              <div className="text-sm text-slate-400 flex justify-between">
                                <span>Dosage: {medicine.dosage}</span>
                                <span>Duration: {medicine.duration}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      {prescription.notes && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-slate-300">Instructions</h4>
                          <div className="p-2 bg-slate-800/30 rounded-md">
                            <p className="text-sm text-slate-400">{prescription.notes}</p>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div>
                          <Button
                            variant="outline"
                            className="border-slate-600 text-slate-300 hover:bg-slate-700/50 bg-transparent"
                            onClick={() => {
                              setCurrentPrescription(prescription)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          className="border-red-500/30 text-red-300 hover:bg-red-500/10 hover:border-red-500/50 bg-transparent"
                          onClick={() => handleDeletePrescription(prescription.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Edit Prescription Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl text-white">Edit Prescription</DialogTitle>
              <DialogDescription className="text-slate-400">
                Update the prescription details for {currentPrescription?.patientName}
              </DialogDescription>
            </DialogHeader>
            {currentPrescription && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Medicines</Label>
                    <div className="flex items-center space-x-2">
                      <Select
                        onValueChange={(value) => {
                          const medicine = medicineCategories
                            .flatMap(c => c.medicines)
                            .find(m => m.name === value);
                          
                          if (medicine) {
                            addMedicineToCurrentPrescription();
                            const lastIndex = currentPrescription.medicines.length - 1;
                            updateCurrentPrescriptionMedicine(lastIndex, "name", medicine.name);
                            if (medicine.commonDosages.length > 0) {
                              updateCurrentPrescriptionMedicine(lastIndex, "dosage", medicine.commonDosages[0]);
                            }
                            if (medicine.commonDurations.length > 0) {
                              updateCurrentPrescriptionMedicine(lastIndex, "duration", medicine.commonDurations[0]);
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white w-[180px]">
                          <SelectValue placeholder="Quick add..." />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-white max-h-[300px]">
                          {medicineCategories.map((category) => (
                            <div key={category.category}>
                              <div className="px-2 py-1.5 text-xs font-semibold text-slate-400">
                                {category.category}
                              </div>
                              {category.medicines.map((med) => (
                                <SelectItem key={med.name} value={med.name}>
                                  {med.name}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={addMedicineToCurrentPrescription}
                        className="border-teal-500 text-teal-400 hover:bg-teal-500/10"
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add Medicine
                      </Button>
                    </div>
                  </div>
                  
                  {currentPrescription.medicines.map((medicine, index) => (
                    <div key={index} className="space-y-3 p-3 bg-slate-800/50 rounded-md relative">
                      {currentPrescription.medicines.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 text-slate-400 hover:text-red-400 h-6 w-6"
                          onClick={() => removeMedicineFromCurrentPrescription(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <Label htmlFor={`edit-medicine-name-${index}`} className="text-white">Medicine Name</Label>
                          <Select
                            value={medicine.name || ""}
                            onValueChange={(value) => updateCurrentPrescriptionMedicine(index, "name", value)}
                          >
                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                              <SelectValue placeholder="Select a medicine" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white max-h-[300px]">
                              {medicineCategories.map((category) => (
                                <div key={category.category}>
                                  <div className="px-2 py-1.5 text-xs font-semibold text-slate-400">
                                    {category.category}
                                  </div>
                                  {category.medicines.map((med) => (
                                    <SelectItem key={med.name} value={med.name}>
                                      {med.name}
                                    </SelectItem>
                                  ))}
                                </div>
                              ))}
                              
                            </SelectContent>
                          </Select>
                          <div className="mt-2">
                            <Input
                              id={`edit-medicine-name-${index}`}
                              value={medicine.name}
                              onChange={(e) => updateCurrentPrescriptionMedicine(index, "name", e.target.value)}
                              className="bg-slate-800 border-slate-700 text-white"
                              placeholder="Or type medicine name"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`edit-medicine-dosage-${index}`} className="text-white">Dosage</Label>
                            <Select
                              value={medicine.dosage || ""}
                              onValueChange={(value) => updateCurrentPrescriptionMedicine(index, "dosage", value)}
                            >
                              <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                                <SelectValue placeholder="Select dosage" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                {medicine.name && medicineCategories
                                  .flatMap(c => c.medicines)
                                  .find(m => m.name === medicine.name)?.commonDosages
                                  .map((dosage) => (
                                    <SelectItem key={dosage} value={dosage}>
                                      {dosage}
                                    </SelectItem>
                                  ))} {/* Fixed missing closing brace */}
                                {!medicine.name && (
                                    <SelectItem key="no-medicine" value="no-medicine-selected" disabled>
                                      Select a medicine first
                                    </SelectItem>
                                  )}
                              </SelectContent>
                            </Select>
                            <div className="mt-2">
                              <Input
                                id={`edit-medicine-dosage-${index}`}
                                value={medicine.dosage}
                                onChange={(e) => updateCurrentPrescriptionMedicine(index, "dosage", e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                                placeholder="Or type custom dosage"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor={`edit-medicine-duration-${index}`} className="text-white">Duration</Label>
                            <Select
                              value={medicine.duration || ""}
                              onValueChange={(value) => updateCurrentPrescriptionMedicine(index, "duration", value)}
                            >
                              <SelectTrigger className="bg-slate-800 border-slate-700 text-white mt-1">
                                <SelectValue placeholder="Select duration" />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                {medicine.name && medicineCategories
                                  .flatMap(c => c.medicines)
                                  .find(m => m.name === medicine.name)?.commonDurations
                                  .map((duration) => (
                                    <SelectItem key={duration} value={duration}>
                                      {duration}
                                    </SelectItem>
                                  )) || (
                                    <SelectItem key="no-medicine" value="no-medicine-selected" disabled>
                                      Select a medicine first
                                    </SelectItem>
                                  )}
                              </SelectContent>
                            </Select>
                            <div className="mt-2">
                              <Input
                                id={`edit-medicine-duration-${index}`}
                                value={medicine.duration}
                                onChange={(e) => updateCurrentPrescriptionMedicine(index, "duration", e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                                placeholder="Or type custom duration"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-notes" className="text-white">Notes/Instructions</Label>
                  <Textarea
                    id="edit-notes"
                    value={currentPrescription.notes}
                    onChange={(e) => setCurrentPrescription({...currentPrescription, notes: e.target.value})}
                    className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                    placeholder="Additional instructions or notes for the patient"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                className="border-slate-600 text-slate-300 hover:bg-slate-700/50 bg-transparent"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleEditPrescription}
                className="bg-teal-500 hover:bg-teal-600 text-white"
              >
                Update Prescription
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}
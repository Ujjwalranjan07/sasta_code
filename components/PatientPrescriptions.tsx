"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { prescriptionsAPI, Prescription } from "@/lib/prescriptions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pill, Calendar, Clock, FileText, AlertCircle, Plus, Download } from "lucide-react"
import { motion } from "framer-motion"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

export function PatientPrescriptions() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const prescriptionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (user?.id) {
        try {
          setLoading(true)
          const data = await prescriptionsAPI.getByPatientId(user.id)
          setPrescriptions(data)
        } catch (error) {
          console.error("Error fetching prescriptions:", error)
        } finally {
          setLoading(false)
        }
      }
    }

    fetchPrescriptions()
  }, [user?.id])

  const handleViewDetails = (prescription: Prescription) => {
    setSelectedPrescription(prescription)
    setIsDetailsOpen(true)
  }

  const handleNewPrescription = () => {
    // Redirect to the doctor's new prescription page
    try {
      router.push('/doctor/prescriptions/new')
    } catch (error) {
      console.error("Error navigating to new prescription page:", error)
      toast({
        title: "Navigation Error",
        description: "Could not navigate to the new prescription page. Please try again.",
        variant: "destructive"
      })
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy")
    } catch (e) {
      return dateString
    }
  }

  const handleDownloadPrescription = async () => {
    if (!selectedPrescription || !prescriptionRef.current) return

    try {
      toast({
        title: "Preparing PDF",
        description: "Please wait while we generate your prescription...",
      })

      const prescriptionElement = prescriptionRef.current
      const canvas = await html2canvas(prescriptionElement, {
        scale: 2,
        logging: false,
        backgroundColor: "#0f172a", // Match the background color
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`Prescription_${selectedPrescription.id}.pdf`)

      toast({
        title: "Success",
        description: "Prescription downloaded successfully!",
      })
    } catch (error) {
      console.error("Error generating PDF:", error)
      toast({
        title: "Error",
        description: "Failed to download prescription. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="border-0 bg-gradient-to-br from-slate-900/80 to-slate-800/80 backdrop-blur-sm shadow-2xl overflow-hidden">
      <CardHeader className="border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-white flex items-center">
              <Pill className="w-5 h-5 mr-2 text-blue-400" />
              My Prescriptions
            </CardTitle>
            <CardDescription className="text-slate-400">
              View and manage your medical prescriptions
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
              {prescriptions.length} Total
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10 bg-transparent backdrop-blur-sm shadow-lg"
              onClick={handleNewPrescription}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Prescription
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-slate-300 mb-1">No Prescriptions Found</h3>
            <p className="text-slate-400 max-w-md mx-auto">
              You don't have any prescriptions yet. They will appear here after your doctor creates them.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <motion.div
                key={prescription.id}
                className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-blue-500/30 transition-all duration-300"
                whileHover={{ scale: 1.01 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-white font-medium mb-1 flex items-center">
                      <span className="mr-2">Dr. {prescription.doctorName}</span>
                      <Badge className="bg-green-500/20 text-green-300 border-green-500/30">
                        {prescription.medicines.length} Medicines
                      </Badge>
                    </h3>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1 text-blue-400" />
                        {formatDate(prescription.date)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700/50 bg-transparent backdrop-blur-sm shadow-lg"
                    onClick={() => handleViewDetails(prescription)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Prescription Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="bg-slate-900 border border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                Prescription Details
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Detailed information about your prescription
              </DialogDescription>
            </DialogHeader>

            {selectedPrescription && (
              <>
                <div className="space-y-6 py-4" ref={prescriptionRef}>
                  {/* Prescription Header */}
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-1">Medical Prescription</h2>
                    <div className="flex justify-center items-center gap-2 text-slate-400">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span>{formatDate(selectedPrescription.date)}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row justify-between gap-4 pb-4 border-b border-slate-700">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-1">
                        Dr. {selectedPrescription.doctorName}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm text-slate-400">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-blue-400" />
                          {formatDate(selectedPrescription.date)}
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-green-500/20 text-green-300 border-green-500/30 h-fit">
                      {selectedPrescription.medicines.length} Medicines
                    </Badge>
                  </div>

                  {/* Patient Information */}
                  <div className="pb-4 border-b border-slate-700">
                    <h4 className="text-md font-medium text-white mb-2">Patient Information</h4>
                    <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                      <p className="text-slate-300">Name: {selectedPrescription.patientName}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-white mb-3">Prescribed Medicines</h4>
                    <ScrollArea className="h-[200px] pr-4">
                      <div className="space-y-3">
                        {selectedPrescription.medicines.map((medicine, index) => (
                          <div
                            key={index}
                            className="bg-slate-800 rounded-lg p-3 border border-slate-700"
                          >
                            <h5 className="text-white font-medium mb-2">{medicine.name}</h5>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="flex items-center text-slate-400">
                                <span className="font-medium mr-2 text-slate-300">Dosage:</span>
                                {medicine.dosage}
                              </div>
                              <div className="flex items-center text-slate-400">
                                <span className="font-medium mr-2 text-slate-300">Duration:</span>
                                {medicine.duration}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {selectedPrescription.notes && (
                    <div className="pt-2 border-t border-slate-700">
                      <h4 className="text-md font-medium text-white mb-2">Notes & Instructions</h4>
                      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
                        <p className="text-slate-300 whitespace-pre-wrap">{selectedPrescription.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Download Button */}
                <div className="flex justify-end mt-4">
                  <Button 
                    onClick={handleDownloadPrescription}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
// Use the same API URL as the main API
const BASE_URL = "https://doctor-api-u6mn.onrender.com"

export interface Medicine {
  name: string
  dosage: string
  duration: string
}

export interface Prescription {
  id: string
  doctorId: string
  doctorName: string
  patientId: string
  patientName: string
  appointmentId: string
  date: string
  medicines: Medicine[]
  notes: string
}

// Prescription API functions
export const prescriptionsAPI = {
  // Get all prescriptions
  getAll: async (): Promise<Prescription[]> => {
    try {
      const response = await fetch(`${BASE_URL}/prescriptions`)
      if (!response.ok) {
        throw new Error(`Failed to fetch prescriptions: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error("Error fetching prescriptions:", error)
      throw error
    }
  },

  // Get prescription by ID
  getById: async (id: string): Promise<Prescription> => {
    try {
      const response = await fetch(`${BASE_URL}/prescriptions/${id}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch prescription: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error(`Error fetching prescription with ID ${id}:`, error)
      throw error
    }
  },

  // Get prescriptions by doctor ID
  getByDoctorId: async (doctorId: string): Promise<Prescription[]> => {
    try {
      const response = await fetch(`${BASE_URL}/prescriptions?doctorId=${doctorId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch prescriptions for doctor: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error(`Error fetching prescriptions for doctor ${doctorId}:`, error)
      throw error
    }
  },

  // Get prescriptions by patient ID
  getByPatientId: async (patientId: string): Promise<Prescription[]> => {
    try {
      const response = await fetch(`${BASE_URL}/prescriptions?patientId=${patientId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch prescriptions for patient: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error(`Error fetching prescriptions for patient ${patientId}:`, error)
      throw error
    }
  },

  // Get prescriptions by appointment ID
  getByAppointmentId: async (appointmentId: string): Promise<Prescription[]> => {
    try {
      const response = await fetch(`${BASE_URL}/prescriptions?appointmentId=${appointmentId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch prescriptions for appointment: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error(`Error fetching prescriptions for appointment ${appointmentId}:`, error)
      throw error
    }
  },

  // Create a new prescription
  create: async (prescription: Omit<Prescription, "id">): Promise<Prescription> => {
    try {
      const response = await fetch(`${BASE_URL}/prescriptions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prescription),
      })
      if (!response.ok) {
        throw new Error(`Failed to create prescription: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error("Error creating prescription:", error)
      throw error
    }
  },

  // Update an existing prescription
  update: async (id: string, prescription: Prescription): Promise<Prescription> => {
    try {
      const response = await fetch(`${BASE_URL}/prescriptions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(prescription),
      })
      if (!response.ok) {
        throw new Error(`Failed to update prescription: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error(`Error updating prescription with ID ${id}:`, error)
      throw error
    }
  },

  // Delete a prescription
  delete: async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${BASE_URL}/prescriptions/${id}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        throw new Error(`Failed to delete prescription: ${response.status}`)
      }
    } catch (error) {
      console.error(`Error deleting prescription with ID ${id}:`, error)
      throw error
    }
  },
}
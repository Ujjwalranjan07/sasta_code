// Common medicines list for prescriptions

export interface MedicineCategory {
  category: string;
  medicines: CommonMedicine[];
}

export interface CommonMedicine {
  name: string;
  commonDosages: string[];
  commonDurations: string[];
}

export const medicineCategories: MedicineCategory[] = [
  {
    category: "Antibiotics",
    medicines: [
      {
        name: "Amoxicillin",
        commonDosages: ["250mg three times daily", "500mg twice daily", "875mg twice daily"],
        commonDurations: ["5 days", "7 days", "10 days", "14 days"]
      },
      {
        name: "Azithromycin",
        commonDosages: ["500mg once daily", "250mg once daily"],
        commonDurations: ["3 days", "5 days"]
      },
      {
        name: "Ciprofloxacin",
        commonDosages: ["250mg twice daily", "500mg twice daily"],
        commonDurations: ["5 days", "7 days", "10 days"]
      },
      {
        name: "Doxycycline",
        commonDosages: ["100mg twice daily", "100mg once daily"],
        commonDurations: ["7 days", "10 days", "14 days"]
      }
    ]
  },
  {
    category: "Pain Relievers",
    medicines: [
      {
        name: "Acetaminophen (Paracetamol)",
        commonDosages: ["500mg every 6 hours", "650mg every 6 hours", "1000mg every 8 hours"],
        commonDurations: ["3 days", "5 days", "7 days", "as needed"]
      },
      {
        name: "Ibuprofen",
        commonDosages: ["200mg every 6 hours", "400mg every 6 hours", "600mg every 8 hours"],
        commonDurations: ["3 days", "5 days", "7 days", "as needed"]
      },
      {
        name: "Naproxen",
        commonDosages: ["250mg twice daily", "500mg twice daily"],
        commonDurations: ["5 days", "7 days", "10 days", "as needed"]
      }
    ]
  },
  {
    category: "Cardiovascular",
    medicines: [
      {
        name: "Atorvastatin",
        commonDosages: ["10mg once daily", "20mg once daily", "40mg once daily"],
        commonDurations: ["30 days", "90 days", "ongoing"]
      },
      {
        name: "Lisinopril",
        commonDosages: ["5mg once daily", "10mg once daily", "20mg once daily"],
        commonDurations: ["30 days", "90 days", "ongoing"]
      },
      {
        name: "Metoprolol",
        commonDosages: ["25mg twice daily", "50mg twice daily", "100mg once daily"],
        commonDurations: ["30 days", "90 days", "ongoing"]
      },
      {
        name: "Aspirin (Low Dose)",
        commonDosages: ["81mg once daily", "75mg once daily"],
        commonDurations: ["30 days", "90 days", "ongoing"]
      }
    ]
  },
  {
    category: "Respiratory",
    medicines: [
      {
        name: "Albuterol",
        commonDosages: ["2 puffs every 4-6 hours as needed", "1-2 puffs before exercise"],
        commonDurations: ["as needed", "30 days"]
      },
      {
        name: "Fluticasone",
        commonDosages: ["1 spray in each nostril once daily", "2 sprays in each nostril once daily"],
        commonDurations: ["14 days", "30 days", "ongoing"]
      },
      {
        name: "Montelukast",
        commonDosages: ["10mg once daily at bedtime"],
        commonDurations: ["30 days", "90 days", "ongoing"]
      }
    ]
  },
  {
    category: "Gastrointestinal",
    medicines: [
      {
        name: "Omeprazole",
        commonDosages: ["20mg once daily", "40mg once daily"],
        commonDurations: ["14 days", "30 days", "90 days"]
      },
      {
        name: "Ondansetron",
        commonDosages: ["4mg every 8 hours as needed", "8mg every 12 hours as needed"],
        commonDurations: ["3 days", "5 days", "as needed"]
      },
      {
        name: "Loperamide",
        commonDosages: ["2mg after each loose stool (max 8mg/day)"],
        commonDurations: ["2 days", "as needed"]
      }
    ]
  },
  {
    category: "Allergy",
    medicines: [
      {
        name: "Cetirizine",
        commonDosages: ["10mg once daily"],
        commonDurations: ["14 days", "30 days", "as needed"]
      },
      {
        name: "Loratadine",
        commonDosages: ["10mg once daily"],
        commonDurations: ["14 days", "30 days", "as needed"]
      },
      {
        name: "Diphenhydramine",
        commonDosages: ["25mg every 6 hours as needed", "50mg at bedtime"],
        commonDurations: ["7 days", "14 days", "as needed"]
      }
    ]
  }
];

// Helper function to get all medicines as a flat list
export const getAllMedicines = (): CommonMedicine[] => {
  return medicineCategories.flatMap(category => category.medicines);
};

// Helper function to get medicine by name
export const getMedicineByName = (name: string): CommonMedicine | undefined => {
  return getAllMedicines().find(medicine => medicine.name === name);
};
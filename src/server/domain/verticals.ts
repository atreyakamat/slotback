/** Business types and their suggested starting services. Pure data, safe for client components. */

export const VERTICAL_OPTIONS = [
  { value: "salon", label: "Salon or spa" },
  { value: "skin", label: "Skin or aesthetic clinic" },
  { value: "physio", label: "Physiotherapy" },
  { value: "dental", label: "Dental clinic" },
  { value: "nails", label: "Nail or lash studio" },
  { value: "other", label: "Something else" },
] as const;
export type Vertical = (typeof VERTICAL_OPTIONS)[number]["value"];

/** Suggested starting services per business type, offered in onboarding. Prices are editable placeholders in rupees. */
export const SUGGESTED_SERVICES: Record<Vertical, { name: string; durationMinutes: number; priceRupees: number }[]> = {
  salon: [
    { name: "Haircut", durationMinutes: 45, priceRupees: 800 },
    { name: "Hair spa", durationMinutes: 60, priceRupees: 1500 },
    { name: "Facial", durationMinutes: 60, priceRupees: 1800 },
    { name: "Hair colour", durationMinutes: 120, priceRupees: 3500 },
  ],
  skin: [
    { name: "Consultation", durationMinutes: 30, priceRupees: 1000 },
    { name: "Chemical peel", durationMinutes: 45, priceRupees: 3500 },
    { name: "Hydrafacial", durationMinutes: 60, priceRupees: 4500 },
    { name: "Laser session", durationMinutes: 45, priceRupees: 5000 },
  ],
  physio: [
    { name: "Assessment", durationMinutes: 45, priceRupees: 1000 },
    { name: "Follow-up session", durationMinutes: 45, priceRupees: 800 },
    { name: "Sports massage", durationMinutes: 60, priceRupees: 1500 },
  ],
  dental: [
    { name: "Check-up", durationMinutes: 30, priceRupees: 500 },
    { name: "Cleaning", durationMinutes: 45, priceRupees: 1500 },
    { name: "Filling", durationMinutes: 45, priceRupees: 2000 },
  ],
  nails: [
    { name: "Gel manicure", durationMinutes: 60, priceRupees: 1200 },
    { name: "Pedicure", durationMinutes: 60, priceRupees: 1000 },
    { name: "Lash extensions", durationMinutes: 90, priceRupees: 2500 },
  ],
  other: [{ name: "Appointment", durationMinutes: 60, priceRupees: 1000 }],
};

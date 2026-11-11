import type { AppointmentSource, AppointmentStatus } from "@/generated/prisma/enums";

export type ScheduleAppointment = {
  id: string;
  date: string;
  startMin: number;
  endMin: number;
  timeLabel: string;
  status: AppointmentStatus;
  source: AppointmentSource;
  resourceId: string;
  customerName: string;
  serviceName: string;
};

export type ScheduleResource = { id: string; name: string; serviceIds: string[] };
export type ScheduleService = { id: string; name: string; durationMinutes: number; pricePaise: number };
export type ScheduleCustomer = { id: string; name: string; phone: string | null };
export type BookingPrefill = { date: string; time: string; resourceId?: string };

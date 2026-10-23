import type { AppointmentStatus } from "@/generated/prisma/enums";
import { Badge } from "@/components/ui/badge";

const MAP: Record<AppointmentStatus, { label: string; tone: "neutral" | "accent" | "success" | "warning" | "danger" }> = {
  BOOKED: { label: "Booked", tone: "accent" },
  COMPLETED: { label: "Completed", tone: "success" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
  NO_SHOW: { label: "No-show", tone: "warning" },
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  const { label, tone } = MAP[status];
  return <Badge tone={tone}>{label}</Badge>;
}

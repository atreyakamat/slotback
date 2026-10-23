import type { ActorType, Prisma } from "@/generated/prisma/client";
import type { Db } from "./types";

type AuditInput = {
  organizationId: string;
  actorType: ActorType;
  actorId?: string | null;
  entityType: string;
  entityId: string;
  action: string;
  /** Keep minimal: ids, statuses, counts. Never message bodies, tokens or contact details. */
  metadata?: Prisma.InputJsonValue;
};

export function recordAudit(db: Db, input: AuditInput) {
  return db.auditEvent.create({
    data: {
      organizationId: input.organizationId,
      actorType: input.actorType,
      actorId: input.actorId ?? null,
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      metadata: input.metadata ?? {},
    },
  });
}

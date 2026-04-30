import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  hasBeenNotified,
  sendPushNotification,
} from "@/modules/notifications/notifications.service";

export interface NearBarrioPayload {
  truckId: number;
  barrioId: number;
  barrioName: string;
}

/**
 * Handles the NEAR_BARRIO event (truck within ~500 m):
 * Same logic as ENTRY but uses type 'NEAR'.
 */
export async function handleNearBarrio(
  payload: NearBarrioPayload
): Promise<void> {
  logger.info("NEAR_BARRIO event", payload as unknown as Record<string, unknown>);

  const users = await prisma.user.findMany({
    where: {
      barrioId: payload.barrioId,
      fcmToken: { not: null },
    },
    select: { id: true, fcmToken: true },
  });

  for (const user of users) {
    // Skip if already sent ENTRY (no point in sending NEAR after ENTRY)
    const entryNotified = await hasBeenNotified(
      user.id,
      payload.truckId,
      payload.barrioId,
      "ENTRY"
    );
    if (entryNotified) continue;

    const nearNotified = await hasBeenNotified(
      user.id,
      payload.truckId,
      payload.barrioId,
      "NEAR"
    );
    if (nearNotified) continue;

    await sendPushNotification({
      userId: user.id,
      truckId: payload.truckId,
      barrioId: payload.barrioId,
      barrioName: payload.barrioName,
      fcmToken: user.fcmToken!,
      type: "NEAR",
    });
  }
}

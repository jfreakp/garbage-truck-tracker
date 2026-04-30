import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  hasBeenNotified,
  sendPushNotification,
} from "@/modules/notifications/notifications.service";

export interface EnteredBarrioPayload {
  truckId: number;
  barrioId: number;
  barrioName: string;
}

/**
 * Handles the ENTERED_BARRIO event:
 *  1. Fetch all users in the barrio that have an fcmToken
 *  2. Skip users already notified (anti-spam)
 *  3. Send push notification and log it
 */
export async function handleEnteredBarrio(
  payload: EnteredBarrioPayload
): Promise<void> {
  logger.info("ENTERED_BARRIO event", payload as unknown as Record<string, unknown>);

  const users = await prisma.user.findMany({
    where: {
      barrioId: payload.barrioId,
      fcmToken: { not: null },
    },
    select: { id: true, fcmToken: true },
  });

  for (const user of users) {
    const alreadyNotified = await hasBeenNotified(
      user.id,
      payload.truckId,
      payload.barrioId,
      "ENTRY"
    );

    if (alreadyNotified) {
      logger.debug("Skipping already-notified user", {
        userId: user.id,
        truckId: payload.truckId,
      });
      continue;
    }

    await sendPushNotification({
      userId: user.id,
      truckId: payload.truckId,
      barrioId: payload.barrioId,
      barrioName: payload.barrioName,
      fcmToken: user.fcmToken!,
      type: "ENTRY",
    });
  }
}

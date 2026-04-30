import { getMessaging } from "@/lib/firebase";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { NotificationType } from "../../app/generated/prisma/enums";

interface SendPayload {
  userId: number;
  truckId: number;
  barrioId: number;
  barrioName: string;
  fcmToken: string;
  type: NotificationType;
}

/**
 * Checks whether this user already received a notification of this type
 * for this truck/barrio combination (anti-spam).
 */
export async function hasBeenNotified(
  userId: number,
  truckId: number,
  barrioId: number,
  type: NotificationType
): Promise<boolean> {
  const log = await prisma.notificationLog.findFirst({
    where: { userId, truckId, barrioId, type },
    select: { id: true },
  });
  return log !== null;
}

/**
 * Sends a push notification via Firebase and logs it.
 */
export async function sendPushNotification(payload: SendPayload) {
  const messaging = getMessaging();

  const title =
    payload.type === "ENTRY"
      ? "🚛 ¡El recolector llega a tu barrio!"
      : "🚛 El recolector está cerca de tu barrio";

  const body =
    payload.type === "ENTRY"
      ? `El camión de basura acaba de entrar al barrio ${payload.barrioName}.`
      : `El camión de basura está a menos de 500 m del barrio ${payload.barrioName}.`;

  try {
    await messaging.send({
      token: payload.fcmToken,
      notification: { title, body },
      data: {
        truckId: String(payload.truckId),
        barrioId: String(payload.barrioId),
        type: payload.type,
      },
    });

    logger.info("Push notification sent", {
      userId: payload.userId,
      truckId: payload.truckId,
      barrioId: payload.barrioId,
      type: payload.type,
    });
  } catch (err) {
    logger.error("Failed to send push notification", {
      userId: payload.userId,
      error: String(err),
    });
    // We still log it below so the user is not re-notified on next ping
  }

  await prisma.notificationLog.create({
    data: {
      userId: payload.userId,
      truckId: payload.truckId,
      barrioId: payload.barrioId,
      type: payload.type,
    },
  });
}

/**
 * Registers all event handlers on the event bus.
 * Call this once at app startup (e.g. from instrumentation.ts).
 */
import { eventBus } from "./event-bus";
import { handleEnteredBarrio } from "./handlers/entered-barrio.handler";
import { handleNearBarrio } from "./handlers/near-barrio.handler";

let registered = false;

export function registerEventHandlers() {
  if (registered) return;
  registered = true;

  eventBus.on("ENTERED_BARRIO", handleEnteredBarrio);
  eventBus.on("NEAR_BARRIO", handleNearBarrio);
}

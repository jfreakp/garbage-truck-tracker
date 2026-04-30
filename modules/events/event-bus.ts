type Handler<T> = (payload: T) => Promise<void>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const registry = new Map<string, Handler<any>[]>();

export const eventBus = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on<T = any>(event: string, handler: Handler<T>) {
    const handlers = registry.get(event) ?? [];
    handlers.push(handler);
    registry.set(event, handlers);
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async emit<T = any>(event: string, payload: T) {
    const handlers = registry.get(event) ?? [];
    await Promise.all(handlers.map((h) => h(payload)));
  },
};

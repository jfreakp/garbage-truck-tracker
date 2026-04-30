export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerEventHandlers } = await import(
      "./modules/events/register-handlers"
    );
    registerEventHandlers();
  }
}

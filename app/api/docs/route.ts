import { ApiReference } from "@scalar/nextjs-api-reference";
import { openApiSpec } from "@/lib/openapi";

/**
 * GET /api/docs
 * Interfaz Scalar con toda la documentación de la API.
 * Acceder en: http://localhost:3000/api/docs
 */
export const GET = ApiReference({
  content:   JSON.stringify(openApiSpec),
  pageTitle: "EcoTrack API",
  theme:     "default",
  defaultHttpClient: {
    targetKey: "node",
    clientKey: "fetch",
  },
  customCss: `
    :root {
      --scalar-color-1: #0f5238;
      --scalar-color-2: #2d6a4f;
      --scalar-button-1: #0f5238;
      --scalar-button-1-hover: #1a6b46;
    }
  `,
});

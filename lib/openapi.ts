export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title:       "EcoTrack – Garbage Truck Tracker",
    version:     "1.0.0",
    description: "API para rastreo de camiones recolectores de basura.\n\n## Autenticación\n\nDos modos:\n\n- **JWT (admin/usuario):** `Authorization: Bearer <token>` — obtenido en `/api/auth/login`\n- **Device token (celular GPS):** `X-Device-Token: <token>` — generado en `/api/devices`",
  },
  servers: [
    { url: "http://localhost:3000", description: "Desarrollo local" },
  ],
  tags: [
    { name: "Auth",    description: "Registro, login y perfil" },
    { name: "Devices", description: "Equipos (celulares) vinculados a camiones" },
    { name: "Trucks",  description: "Flota de camiones recolectores" },
    { name: "Location",description: "Envío de coordenadas GPS desde el dispositivo" },
    { name: "Routes",  description: "Rutas de recolección planificadas" },
    { name: "Barrios", description: "Barrios y polígonos PostGIS" },
    { name: "Users",   description: "Perfil de vecinos / administradores" },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type:         "http",
        scheme:       "bearer",
        bearerFormat: "JWT",
        description:  "Token JWT obtenido en POST /api/auth/login",
      },
      DeviceToken: {
        type:        "apiKey",
        in:          "header",
        name:        "X-Device-Token",
        description: "Token de 64 caracteres generado al registrar un equipo en POST /api/devices",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error:   { type: "string",  example: "Mensaje de error" },
        },
      },
      Truck: {
        type: "object",
        properties: {
          id:            { type: "integer" },
          name:          { type: "string" },
          lat:           { type: "number", nullable: true },
          lng:           { type: "number", nullable: true },
          lastUpdate:    { type: "string", format: "date-time" },
          currentBarrio: {
            nullable: true,
            type: "object",
            properties: {
              id:   { type: "integer" },
              name: { type: "string" },
            },
          },
        },
      },
      Device: {
        type: "object",
        properties: {
          id:        { type: "integer" },
          name:      { type: "string" },
          token:     { type: "string", description: "Token de 64 caracteres hex" },
          active:    { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          truck: {
            type: "object",
            properties: {
              id:   { type: "integer" },
              name: { type: "string" },
            },
          },
        },
      },
      Route: {
        type: "object",
        properties: {
          id:        { type: "integer" },
          name:      { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          truck: {
            type: "object",
            properties: {
              id:   { type: "integer" },
              name: { type: "string" },
            },
          },
        },
      },
      Barrio: {
        type: "object",
        properties: {
          id:        { type: "integer" },
          name:      { type: "string" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      User: {
        type: "object",
        properties: {
          id:              { type: "integer" },
          name:            { type: "string" },
          email:           { type: "string", format: "email" },
          lat:             { type: "number", nullable: true },
          lng:             { type: "number", nullable: true },
          fcmToken:        { type: "string", nullable: true },
          alertProximity:  { type: "boolean" },
          alertDelayed:    { type: "boolean" },
          alertReminder:   { type: "boolean" },
          alertEntry:      { type: "boolean" },
          barrio: {
            nullable: true,
            type: "object",
            properties: {
              id:   { type: "integer" },
              name: { type: "string" },
            },
          },
        },
      },
    },
  },
  paths: {

    // ── AUTH ────────────────────────────────────────────────────────────────

    "/api/auth/register": {
      post: {
        tags:    ["Auth"],
        summary: "Registrar usuario",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name:     { type: "string",  example: "Juan Pérez" },
                  email:    { type: "string",  format: "email", example: "juan@example.com" },
                  password: { type: "string",  example: "secret123" },
                  lat:      { type: "number",  example: -4.015 },
                  lng:      { type: "number",  example: -79.204 },
                  barrioId: { type: "integer", example: 1 },
                  fcmToken: { type: "string",  example: "firebase-token" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Usuario creado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        user:  { $ref: "#/components/schemas/User" },
                        token: { type: "string", description: "JWT para usar en Authorization header" },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": { description: "Validación fallida", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "409": { description: "Email ya registrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    "/api/auth/login": {
      post: {
        tags:    ["Auth"],
        summary: "Iniciar sesión",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email:    { type: "string", format: "email", example: "admin@loja.gob.ec" },
                  password: { type: "string", example: "password123" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Login exitoso",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        user:  { $ref: "#/components/schemas/User" },
                        token: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Credenciales inválidas", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    "/api/auth/me": {
      get: {
        tags:     ["Auth"],
        summary:  "Obtener usuario autenticado",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/User" } } } } },
          },
          "401": { description: "No autorizado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    // ── DEVICES ─────────────────────────────────────────────────────────────

    "/api/devices": {
      get: {
        tags:     ["Devices"],
        summary:  "Listar equipos registrados",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "Lista de equipos",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data:    { type: "array", items: { $ref: "#/components/schemas/Device" } },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags:     ["Devices"],
        summary:  "Registrar nuevo equipo",
        description: "Crea un equipo y genera automáticamente un token de 64 caracteres. El token se usa con el header `X-Device-Token` para enviar coordenadas GPS.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "truckId"],
                properties: {
                  name:    { type: "string",  example: "Samsung A53 – Camión Norte" },
                  truckId: { type: "integer", example: 5 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Equipo creado con su token",
            content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Device" } } } } },
          },
          "409": { description: "El camión ya tiene un equipo asignado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    "/api/devices/{id}": {
      get: {
        tags:     ["Devices"],
        summary:  "Obtener equipo por ID",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Device" } } } } } },
          "404": { description: "No encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      patch: {
        tags:     ["Devices"],
        summary:  "Actualizar equipo",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name:    { type: "string" },
                  active:  { type: "boolean", description: "false = equipo bloqueado, no puede enviar ubicación" },
                  truckId: { type: "integer" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Actualizado", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Device" } } } } } },
          "409": { description: "Camión ya asignado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      delete: {
        tags:     ["Devices"],
        summary:  "Eliminar equipo",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Eliminado", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" } } } } } },
          "404": { description: "No encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    "/api/devices/{id}/token": {
      post: {
        tags:        ["Devices"],
        summary:     "Regenerar token del equipo",
        description: "Invalida el token anterior y genera uno nuevo. Usar si el dispositivo fue robado o extraviado.",
        security:    [{ BearerAuth: [] }],
        parameters:  [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": {
            description: "Nuevo token generado",
            content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Device" } } } } },
          },
          "404": { description: "No encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    // ── LOCATION (núcleo del dispositivo GPS) ────────────────────────────────

    "/api/trucks/location": {
      post: {
        tags:    ["Location"],
        summary: "Enviar coordenadas GPS",
        description: "**Modo dispositivo (celular):** incluir `X-Device-Token` en el header. El `truckId` se resuelve automáticamente desde el equipo registrado.\n\n**Modo admin/simulador:** usar JWT y pasar `truckId` en el body.\n\nEste endpoint dispara detección PostGIS y notificaciones Firebase.",
        security: [{ DeviceToken: [] }, { BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["lat", "lng"],
                properties: {
                  lat:     { type: "number", minimum: -90,  maximum: 90,  example: -4.022326 },
                  lng:     { type: "number", minimum: -180, maximum: 180, example: -79.203478 },
                  truckId: { type: "integer", description: "Solo requerido con auth JWT (modo admin)", example: 5 },
                },
              },
              examples: {
                "Modo dispositivo": {
                  summary: "Desde el celular con X-Device-Token",
                  value: { lat: -4.022326, lng: -79.203478 },
                },
                "Modo admin": {
                  summary: "Desde el simulador con JWT",
                  value: { truckId: 5, lat: -4.022326, lng: -79.203478 },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Ubicación actualizada",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        truckId:      { type: "integer" },
                        lat:          { type: "number" },
                        lng:          { type: "number" },
                        insideBarrio: { nullable: true, type: "object", properties: { id: { type: "integer" }, name: { type: "string" } } },
                        nearBarrios:  { type: "array", items: { type: "object", properties: { id: { type: "integer" }, name: { type: "string" } } } },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": { description: "Token inválido o inactivo", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    // ── TRUCKS ───────────────────────────────────────────────────────────────

    "/api/trucks": {
      get: {
        tags:     ["Trucks"],
        summary:  "Listar flota",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "OK",
            content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/Truck" } } } } } },
          },
        },
      },
      post: {
        tags:     ["Trucks"],
        summary:  "Crear camión",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string", example: "Camión 04 – Ruta Este" } } } } },
        },
        responses: {
          "201": { description: "Creado", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Truck" } } } } } },
        },
      },
    },

    "/api/trucks/{id}": {
      get: {
        tags:     ["Trucks"],
        summary:  "Obtener camión",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Truck" } } } } } },
          "404": { description: "No encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      patch: {
        tags:     ["Trucks"],
        summary:  "Actualizar nombre del camión",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string" } } } } },
        },
        responses: {
          "200": { description: "Actualizado", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Truck" } } } } } },
        },
      },
      delete: {
        tags:     ["Trucks"],
        summary:  "Eliminar camión",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Eliminado" },
          "404": { description: "No encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    "/api/trucks/{id}/history": {
      get: {
        tags:     ["Trucks"],
        summary:  "Historial GPS del camión",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "id",    in: "path",  required: true, schema: { type: "integer" } },
          { name: "limit", in: "query", required: false, schema: { type: "integer", default: 100 }, description: "Máximo de puntos a retornar" },
        ],
        responses: {
          "200": {
            description: "Array de coordenadas con timestamp",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          lat:        { type: "number" },
                          lng:        { type: "number" },
                          recordedAt: { type: "string", format: "date-time" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/trucks/stream": {
      get: {
        tags:     ["Trucks"],
        summary:  "Stream en tiempo real (SSE)",
        description: "Server-Sent Events. El servidor emite la lista completa de camiones cada vez que hay un cambio de ubicación.\n\nUsar con `EventSource` en el cliente:\n```js\nconst es = new EventSource('/api/trucks/stream?token=<jwt>');\nes.onmessage = (e) => console.log(JSON.parse(e.data));\n```",
        parameters: [
          { name: "token", in: "query", required: true, schema: { type: "string" }, description: "JWT (no se acepta en header para SSE)" },
        ],
        responses: {
          "200": {
            description: "Stream SSE. Cada evento contiene el array de camiones como JSON.",
            content: { "text/event-stream": { schema: { type: "string", example: "data: [{\"id\":1,\"lat\":-4.02,\"lng\":-79.20,...}]\n\n" } } },
          },
        },
      },
    },

    // ── ROUTES ───────────────────────────────────────────────────────────────

    "/api/routes": {
      get: {
        tags:     ["Routes"],
        summary:  "Listar rutas",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/Route" } } } } } } },
        },
      },
      post: {
        tags:     ["Routes"],
        summary:  "Crear ruta",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "truckId", "points"],
                properties: {
                  name:    { type: "string", example: "Ruta Centro – Lunes" },
                  truckId: { type: "integer", example: 5 },
                  points: {
                    type: "array",
                    minItems: 2,
                    items: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
                    example: [[-4.012, -79.204], [-4.022, -79.203], [-4.032, -79.202]],
                    description: "Array de [lat, lng]",
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Creada", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Route" } } } } } },
        },
      },
    },

    "/api/routes/geodata": {
      get: {
        tags:     ["Routes"],
        summary:  "Rutas con geometría GeoJSON",
        description: "Retorna las rutas con su geometría PostGIS como GeoJSON LineString. Usado por el mapa.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id:        { type: "integer" },
                          name:      { type: "string" },
                          truckId:   { type: "integer", nullable: true },
                          truckName: { type: "string",  nullable: true },
                          geojson:   { type: "object",  description: "GeoJSON LineString" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/routes/{id}": {
      patch: {
        tags:     ["Routes"],
        summary:  "Reasignar camión a ruta",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["truckId"], properties: { truckId: { type: "integer" } } } } },
        },
        responses: {
          "200": { description: "Actualizada", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Route" } } } } } },
        },
      },
      delete: {
        tags:     ["Routes"],
        summary:  "Eliminar ruta",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "Eliminada" },
          "404": { description: "No encontrada", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    // ── BARRIOS ──────────────────────────────────────────────────────────────

    "/api/barrios": {
      get: {
        tags:     ["Barrios"],
        summary:  "Listar barrios",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "array", items: { $ref: "#/components/schemas/Barrio" } } } } } } },
        },
      },
      post: {
        tags:     ["Barrios"],
        summary:  "Crear barrio",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "points"],
                properties: {
                  name:   { type: "string", example: "Nuevo Barrio" },
                  points: {
                    type: "array",
                    description: "Polígono como array de [lat, lng] — se cierra automáticamente",
                    items: { type: "array", items: { type: "number" }, minItems: 2, maxItems: 2 },
                    example: [[-4.010, -79.210], [-4.010, -79.200], [-4.020, -79.200], [-4.020, -79.210]],
                  },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Creado", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Barrio" } } } } } },
        },
      },
    },

    "/api/barrios/geodata": {
      get: {
        tags:     ["Barrios"],
        summary:  "Barrios con polígono GeoJSON",
        description: "Retorna los barrios con su geometría PostGIS como GeoJSON Polygon. Usado por el mapa.",
        security: [{ BearerAuth: [] }],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id:      { type: "integer" },
                          name:    { type: "string" },
                          geojson: { type: "object", description: "GeoJSON Polygon" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    "/api/barrios/{id}": {
      get: {
        tags:     ["Barrios"],
        summary:  "Obtener barrio por ID",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/Barrio" } } } } } },
          "404": { description: "No encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },

    // ── USERS ────────────────────────────────────────────────────────────────

    "/api/users/{id}": {
      get: {
        tags:     ["Users"],
        summary:  "Obtener perfil de usuario",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/User" } } } } } },
          "404": { description: "No encontrado", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
      patch: {
        tags:     ["Users"],
        summary:  "Actualizar perfil",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name:           { type: "string" },
                  lat:            { type: "number" },
                  lng:            { type: "number" },
                  barrioId:       { type: "integer" },
                  fcmToken:       { type: "string" },
                  alertProximity: { type: "boolean" },
                  alertDelayed:   { type: "boolean" },
                  alertReminder:  { type: "boolean" },
                  alertEntry:     { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Actualizado", content: { "application/json": { schema: { type: "object", properties: { success: { type: "boolean" }, data: { $ref: "#/components/schemas/User" } } } } } },
        },
      },
    },
  },
} as const;

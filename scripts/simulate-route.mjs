#!/usr/bin/env node
/**
 * simulate-route.mjs
 *
 * Simulates a garbage-truck GPS route that starts from a nearby location
 * and gradually enters a target barrio, triggering NEAR and ENTRY notifications.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 \
 *   ADMIN_EMAIL=admin@example.com \
 *   ADMIN_PASSWORD=secret \
 *   node scripts/simulate-route.mjs
 *
 * Optional env vars:
 *   BARRIO_NAME      – substring to match (default: "zamora huayco")
 *   TRUCK_ID         – specific truck id to use (default: first truck found)
 *   STEPS            – number of GPS pings along the route (default: 25)
 *   STEP_DELAY_MS    – milliseconds between pings (default: 2000)
 *   START_OFFSET_KM  – how far north to start the route, in km (default: 2)
 */

const BASE_URL       = process.env.BASE_URL          ?? "http://localhost:3000";
const EMAIL          = process.env.ADMIN_EMAIL        ?? "";
const PASSWORD       = process.env.ADMIN_PASSWORD     ?? "";
const TRUCK_ID       = process.env.TRUCK_ID           ? Number(process.env.TRUCK_ID) : null;
const BARRIO_NAME    = process.env.BARRIO_NAME        ?? "zamora huayco";
const STEPS          = Number(process.env.STEPS       ?? "25");
const STEP_DELAY_MS  = Number(process.env.STEP_DELAY_MS ?? "2000");
const START_OFFSET_KM = Number(process.env.START_OFFSET_KM ?? "2");

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function apiPost(path, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`POST ${path} → ${res.status}: ${JSON.stringify(json)}`);
  return json.data;
}

async function apiGet(path, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${JSON.stringify(json)}`);
  return json.data;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Geo helpers ───────────────────────────────────────────────────────────────

/** Returns the centroid of a GeoJSON Polygon or MultiPolygon as { lat, lng }. */
function polygonCentroid(geojson) {
  let ring;
  if (geojson.type === "Polygon") {
    ring = geojson.coordinates[0];
  } else if (geojson.type === "MultiPolygon") {
    ring = geojson.coordinates[0][0];
  } else {
    throw new Error("Unsupported geometry type: " + geojson.type);
  }

  let sumLng = 0, sumLat = 0;
  for (const [lng, lat] of ring) {
    sumLng += lng;
    sumLat += lat;
  }
  return { lat: sumLat / ring.length, lng: sumLng / ring.length };
}

/**
 * Generates N+1 evenly-spaced points interpolating from `start` to `end`.
 * 1 degree of latitude ≈ 111 km.
 */
function interpolateRoute(start, end, steps) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return {
      lat: start.lat + (end.lat - start.lat) * t,
      lng: start.lng + (end.lng - start.lng) * t,
    };
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  if (!EMAIL || !PASSWORD) {
    console.error(
      "\n❌  Missing credentials.\n" +
      "    Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.\n" +
      "\n    Example:\n" +
      "      ADMIN_EMAIL=admin@test.com ADMIN_PASSWORD=secret node scripts/simulate-route.mjs\n"
    );
    process.exit(1);
  }

  // ── 1. Authenticate ────────────────────────────────────────────────────────
  console.log(`\n🔑  Logging in as ${EMAIL} …`);
  const { token } = await apiPost("/api/auth/login", { email: EMAIL, password: PASSWORD });
  console.log("    ✓ JWT obtained");

  // ── 2. Find target barrio ──────────────────────────────────────────────────
  console.log(`\n🗺️   Fetching barrios geodata …`);
  const barrios = await apiGet("/api/barrios/geodata", token);

  const target = barrios.find((b) =>
    b.name.toLowerCase().includes(BARRIO_NAME.toLowerCase())
  );

  if (!target) {
    console.error(`\n❌  No barrio matching "${BARRIO_NAME}" found.`);
    console.error("    Available barrios:", barrios.map((b) => b.name).join(", ") || "(none)");
    process.exit(1);
  }

  const center = polygonCentroid(target.geojson);
  console.log(`    ✓ Target barrio : "${target.name}" (id=${target.id})`);
  console.log(`    Centroid        : lat=${center.lat.toFixed(6)}, lng=${center.lng.toFixed(6)}`);

  // ── 3. Pick truck ──────────────────────────────────────────────────────────
  console.log(`\n🚛  Fetching trucks …`);
  const trucks = await apiGet("/api/trucks", token);

  if (!trucks.length) {
    console.error("\n❌  No trucks found in the database.");
    process.exit(1);
  }

  let truck;
  if (TRUCK_ID !== null) {
    truck = trucks.find((t) => t.id === TRUCK_ID);
    if (!truck) {
      console.error(`\n❌  Truck id=${TRUCK_ID} not found. Available ids: ${trucks.map((t) => t.id).join(", ")}`);
      process.exit(1);
    }
  } else {
    truck = trucks[0];
  }

  console.log(`    ✓ Using truck: "${truck.name}" (id=${truck.id})`);

  // ── 4. Build the simulated route ───────────────────────────────────────────
  // 1 degree ≈ 111 km → offset in degrees
  const latOffsetDeg = START_OFFSET_KM / 111;

  // Start north of the barrio, slight east offset for a diagonal approach
  const start = {
    lat: center.lat + latOffsetDeg,
    lng: center.lng + (latOffsetDeg * 0.3),
  };

  const route = interpolateRoute(start, center, STEPS);
  const totalDistKm = (START_OFFSET_KM).toFixed(1);

  console.log(`\n📍  Simulated route (${route.length} pings, ${STEP_DELAY_MS} ms apart)`);
  console.log(`    Origin  → lat=${start.lat.toFixed(6)}, lng=${start.lng.toFixed(6)}  (~${totalDistKm} km away)`);
  console.log(`    Dest    → lat=${center.lat.toFixed(6)}, lng=${center.lng.toFixed(6)}  (inside "${target.name}")`);
  console.log(`    Total   ~ ${(route.length * STEP_DELAY_MS / 1000).toFixed(0)} seconds at current speed\n`);
  console.log("─".repeat(90));

  let nearFired  = false;
  let entryFired = false;

  // ── 5. Send location pings ─────────────────────────────────────────────────
  for (let i = 0; i < route.length; i++) {
    const { lat, lng } = route[i];
    const step = `[${String(i + 1).padStart(2, "0")}/${route.length}]`;

    try {
      const result = await apiPost(
        "/api/trucks/location",
        { truckId: truck.id, lat, lng },
        token
      );

      const insideName = result.insideBarrio?.name ?? null;
      const nearNames  = result.nearBarrios?.map((b) => b.name) ?? [];

      // Track first occurrences for the summary banner
      if (!nearFired  && nearNames.length)  { nearFired  = true; }
      if (!entryFired && insideName)         { entryFired = true; }

      const insideTag = insideName
        ? `\x1b[32minside="${insideName}"\x1b[0m`
        : `inside="—"`;

      const nearTag = nearNames.length
        ? `\x1b[33mnear=[${nearNames.join(", ")}]\x1b[0m`
        : `near=[]`;

      console.log(`  ${step}  lat=${lat.toFixed(6)}, lng=${lng.toFixed(6)}  |  ${insideTag}  ${nearTag}`);
    } catch (err) {
      console.error(`  ${step}  \x1b[31mERROR: ${err.message}\x1b[0m`);
    }

    if (i < route.length - 1) await sleep(STEP_DELAY_MS);
  }

  // ── 6. Summary ─────────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(90));
  console.log("\n✅  Simulation complete.\n");
  console.log(`   NEAR  notification triggered : ${nearFired  ? "\x1b[32m✓ YES\x1b[0m" : "\x1b[31m✗ NO (check 500m radius or barrio polygon)\x1b[0m"}`);
  console.log(`   ENTRY notification triggered : ${entryFired ? "\x1b[32m✓ YES\x1b[0m" : "\x1b[31m✗ NO (check barrio polygon)\x1b[0m"}`);
  console.log();
})();

/**
 * Seed – Municipio de Loja, Ecuador
 *
 * Barrios urbanos de la ciudad de Loja con polígonos aproximados.
 * Fuente de referencia: parroquias urbanas oficiales + barrios reconocidos.
 *
 * Centro de la ciudad: -3.9985, -79.2045
 * La ruta de prueba va de -4.012342,-79.204543 → -4.032308,-79.202414
 * y pasa por: Jipiro → El Valle → Las Palmas
 *
 * Correr con: pnpm prisma db seed
 */
import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";

const pool    = new Pool({ connectionString: process.env.DATABASE_URL ?? process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });

// WKT: POLYGON((lng lat, ...))  — PostGIS usa (lng lat)
const BARRIOS = [
  // ── NORTE ──────────────────────────────────────────────────────────────────
  {
    name: "Amable María",
    desc: "Parroquia Carigán – extremo norte",
    wkt:  "POLYGON((-79.221 -3.958, -79.199 -3.958, -79.199 -3.970, -79.221 -3.970, -79.221 -3.958))",
  },
  {
    name: "Carigán",
    desc: "Parroquia urbana norte",
    wkt:  "POLYGON((-79.220 -3.968, -79.198 -3.968, -79.198 -3.984, -79.220 -3.984, -79.220 -3.968))",
  },
  {
    name: "Motupe",
    desc: "Barrio noreste – Parroquia Carigán",
    wkt:  "POLYGON((-79.200 -3.962, -79.183 -3.962, -79.183 -3.978, -79.200 -3.978, -79.200 -3.962))",
  },

  // ── NOROESTE ───────────────────────────────────────────────────────────────
  {
    name: "La Argelia",
    desc: "Barrio noroeste – Parroquia Punzara",
    wkt:  "POLYGON((-79.228 -3.978, -79.210 -3.978, -79.210 -3.993, -79.228 -3.993, -79.228 -3.978))",
  },
  {
    name: "Punzara",
    desc: "Parroquia urbana noroeste",
    wkt:  "POLYGON((-79.232 -3.990, -79.215 -3.990, -79.215 -4.006, -79.232 -4.006, -79.232 -3.990))",
  },
  {
    name: "Héroes del Cenepa",
    desc: "Barrio oeste – Parroquia Punzara",
    wkt:  "POLYGON((-79.230 -4.003, -79.216 -4.003, -79.216 -4.015, -79.230 -4.015, -79.230 -4.003))",
  },

  // ── NORESTE ────────────────────────────────────────────────────────────────
  {
    name: "San Sebastián",
    desc: "Parroquia urbana noreste",
    wkt:  "POLYGON((-79.202 -3.975, -79.184 -3.975, -79.184 -3.993, -79.202 -3.993, -79.202 -3.975))",
  },
  {
    name: "Zamora Huayco",
    desc: "Barrio este – Parroquia San Sebastián",
    wkt:  "POLYGON((-79.202 -3.991, -79.183 -3.991, -79.183 -4.010, -79.202 -4.010, -79.202 -3.991))",
  },

  // ── CENTRO ─────────────────────────────────────────────────────────────────
  {
    name: "El Sagrario",
    desc: "Parroquia urbana central – casco histórico",
    wkt:  "POLYGON((-79.216 -3.988, -79.200 -3.988, -79.200 -4.003, -79.216 -4.003, -79.216 -3.988))",
  },
  {
    name: "Centro Histórico",
    desc: "Núcleo fundacional de Loja",
    wkt:  "POLYGON((-79.212 -3.994, -79.200 -3.994, -79.200 -4.005, -79.212 -4.005, -79.212 -3.994))",
  },
  {
    name: "Pucacruz",
    desc: "Barrio centro-oeste – Parroquia El Sagrario",
    wkt:  "POLYGON((-79.224 -3.998, -79.212 -3.998, -79.212 -4.012, -79.224 -4.012, -79.224 -3.998))",
  },

  // ── CENTRO SUR ─────────────────────────────────────────────────────────────
  {
    name: "Sucre",
    desc: "Parroquia urbana centro-sur",
    wkt:  "POLYGON((-79.215 -4.001, -79.199 -4.001, -79.199 -4.014, -79.215 -4.014, -79.215 -4.001))",
  },
  {
    name: "Jipiro",
    // La ruta de prueba EMPIEZA aquí (-4.012, -79.204)
    desc: "Barrio centro-sur – Parroquia El Valle",
    wkt:  "POLYGON((-79.213 -4.009, -79.197 -4.009, -79.197 -4.022, -79.213 -4.022, -79.213 -4.009))",
  },
  {
    name: "Tierras Coloradas",
    desc: "Barrio sur-este – Parroquia Sucre",
    wkt:  "POLYGON((-79.200 -4.007, -79.184 -4.007, -79.184 -4.024, -79.200 -4.024, -79.200 -4.007))",
  },

  // ── SUR ────────────────────────────────────────────────────────────────────
  {
    name: "El Valle",
    // La ruta de prueba pasa por AQUÍ (-4.022, -79.203)
    desc: "Parroquia urbana sur",
    wkt:  "POLYGON((-79.214 -4.020, -79.197 -4.020, -79.197 -4.032, -79.214 -4.032, -79.214 -4.020))",
  },
  {
    name: "Las Palmas",
    // La ruta de prueba TERMINA aquí (-4.032, -79.202)
    desc: "Barrio sur – Parroquia El Valle",
    wkt:  "POLYGON((-79.211 -4.030, -79.193 -4.030, -79.193 -4.042, -79.211 -4.042, -79.211 -4.030))",
  },
  {
    name: "Daniel Álvarez",
    desc: "Barrio suroeste – Parroquia Punzara",
    wkt:  "POLYGON((-79.224 -4.026, -79.210 -4.026, -79.210 -4.042, -79.224 -4.042, -79.224 -4.026))",
  },
  {
    name: "La Tebaida",
    desc: "Barrio sur – Parroquia Punzara",
    wkt:  "POLYGON((-79.228 -4.018, -79.214 -4.018, -79.214 -4.030, -79.228 -4.030, -79.228 -4.018))",
  },
  {
    name: "Chontacruz",
    desc: "Barrio extremo sur – Parroquia El Valle",
    wkt:  "POLYGON((-79.215 -4.040, -79.197 -4.040, -79.197 -4.053, -79.215 -4.053, -79.215 -4.040))",
  },
];

async function main() {
  console.log("🌱 Seeding – Municipio de Loja, Ecuador\n");

  // ── Barrios ──────────────────────────────────────────────────────────────
  const createdBarrios: Record<string, number> = {};

  for (const b of BARRIOS) {
    const rows = await prisma.$queryRaw<{ id: number; name: string }[]>`
      INSERT INTO "Barrio" (name, polygon, "createdAt")
      VALUES (${b.name}, ST_GeomFromText(${b.wkt}, 4326), NOW())
      ON CONFLICT (name) DO UPDATE
        SET polygon = ST_GeomFromText(${b.wkt}, 4326)
      RETURNING id, name
    `;
    createdBarrios[rows[0].name] = rows[0].id;
    console.log(`  ✔ ${rows[0].name} (id=${rows[0].id})`);
  }

  // ── Trucks ────────────────────────────────────────────────────────────────
  console.log("\n  Camiones:");
  const truckDefs = [
    { name: "Camión 01 – Ruta Norte (Carigán / La Argelia)" },
    { name: "Camión 02 – Ruta Sur (El Valle / Las Palmas)"  },
    { name: "Camión 03 – Ruta Centro (El Sagrario / Sucre)" },
  ];

  const createdTrucks: { name: string; id: number }[] = [];
  for (const t of truckDefs) {
    const existing = await prisma.truck.findFirst({ where: { name: t.name } });
    const truck = existing
      ? existing
      : await prisma.truck.create({ data: { name: t.name } });
    createdTrucks.push(truck);
    console.log(`  ✔ ${truck.name} (id=${truck.id})`);
  }

  // ── Users ─────────────────────────────────────────────────────────────────
  console.log("\n  Usuarios:");
  const password = await bcrypt.hash("password123", 12);

  const users = [
    {
      email:    "admin@loja.gob.ec",
      name:     "Administrador Municipal",
      barrioId: createdBarrios["Centro Histórico"],
      lat:      -3.999,
      lng:      -79.204,
    },
    {
      email:    "vecino@jipiro.ec",
      name:     "Vecino de Jipiro",
      barrioId: createdBarrios["Jipiro"],
      lat:      -4.015,
      lng:      -79.205,
    },
    {
      email:    "vecino@elvalle.ec",
      name:     "Vecino de El Valle",
      barrioId: createdBarrios["El Valle"],
      lat:      -4.024,
      lng:      -79.204,
    },
    {
      email:    "vecino@laspalmas.ec",
      name:     "Vecino de Las Palmas",
      barrioId: createdBarrios["Las Palmas"],
      lat:      -4.035,
      lng:      -79.202,
    },
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where:  { email: u.email },
      update: {},
      create: {
        name:     u.name,
        email:    u.email,
        password,
        barrioId: u.barrioId,
        lat:      u.lat,
        lng:      u.lng,
      },
    });
    console.log(`  ✔ ${user.email}`);
  }

  // ── Routes ───────────────────────────────────────────────────────────────
  // WKT usa orden (lng lat). Rutas para los primeros dos camiones.
  console.log("\n  Rutas:");
  const truck1Id = createdTrucks[0].id;
  const truck2Id = createdTrucks[1].id;
  const ROUTES = [
    {
      name:    "Ruta Norte – Amable María → Punzara",
      truckId: truck1Id,
      // Amable María → Carigán → La Argelia → Punzara → Héroes del Cenepa
      wkt: "LINESTRING(" + [
        "-79.2050 -3.9600",
        "-79.2080 -3.9650",
        "-79.2120 -3.9700",
        "-79.2150 -3.9760",
        "-79.2190 -3.9820",
        "-79.2220 -3.9880",
        "-79.2250 -3.9930",
        "-79.2260 -4.0000",
        "-79.2280 -4.0060",
      ].join(", ") + ")",
    },
    {
      name:    "Ruta Sur – Jipiro → El Valle → Las Palmas",
      truckId: truck2Id,
      // Coincide con la ruta de simulación del mapa
      wkt: "LINESTRING(" + [
        "-79.204543 -4.012342",
        "-79.204454 -4.013174",
        "-79.204365 -4.014006",
        "-79.204277 -4.014838",
        "-79.204188 -4.015670",
        "-79.204099 -4.016502",
        "-79.204010 -4.017334",
        "-79.203922 -4.018166",
        "-79.203833 -4.018998",
        "-79.203744 -4.019830",
        "-79.203655 -4.020662",
        "-79.203566 -4.021494",
        "-79.203478 -4.022326",
        "-79.203389 -4.023158",
        "-79.203300 -4.023990",
        "-79.203211 -4.024822",
        "-79.203122 -4.025654",
        "-79.203034 -4.026486",
        "-79.202945 -4.027318",
        "-79.202856 -4.028150",
        "-79.202767 -4.028982",
        "-79.202678 -4.029814",
        "-79.202590 -4.030646",
        "-79.202501 -4.031478",
        "-79.202414 -4.032308",
      ].join(", ") + ")",
    },
  ];

  for (const r of ROUTES) {
    await prisma.$queryRaw`DELETE FROM "Route" WHERE name = ${r.name}`;
    await prisma.$queryRaw`
      INSERT INTO "Route" (name, "truckId", path, "createdAt")
      VALUES (
        ${r.name},
        ${r.truckId},
        ST_GeomFromText(${r.wkt}, 4326),
        NOW()
      )
    `;
    console.log(`  ✔ ${r.name} → camión id=${r.truckId}`);
  }

  console.log(`
✅ Seed completo
   ${BARRIOS.length} barrios · ${createdTrucks.length} camiones · ${users.length} usuarios · ${ROUTES.length} rutas

   Credenciales de prueba (contraseña: password123):
   · admin@loja.gob.ec       → Centro Histórico
   · vecino@jipiro.ec        → Jipiro (inicio de ruta)
   · vecino@elvalle.ec       → El Valle (mitad de ruta)
   · vecino@laspalmas.ec     → Las Palmas (fin de ruta)
  `);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

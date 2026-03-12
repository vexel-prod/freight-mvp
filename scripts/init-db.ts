const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const dbPath = url.replace(/^file:/, "");
const { Database } = await import("bun:sqlite");
const db = new Database(dbPath, { create: true });

db.exec("PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS "Truck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "code" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "availableFrom" DATETIME NOT NULL,
    "bodyType" TEXT NOT NULL,
    "capacityTons" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'FREE',
    "driverName" TEXT,
    "note" TEXT
  );

  CREATE UNIQUE INDEX IF NOT EXISTS "Truck_code_key" ON "Truck"("code");

  CREATE TABLE IF NOT EXISTS "CargoOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "atiId" TEXT NOT NULL,
    "sourceSystem" TEXT NOT NULL DEFAULT 'ATI.SU',
    "sourceCity" TEXT NOT NULL,
    "destinationCity" TEXT NOT NULL,
    "loadDate" DATETIME NOT NULL,
    "bodyType" TEXT NOT NULL,
    "weightTons" REAL NOT NULL,
    "rateRub" REAL NOT NULL,
    "distanceKm" REAL NOT NULL,
    "extraEmptyRunKm" REAL NOT NULL DEFAULT 0,
    "fuelSurchargeRub" REAL NOT NULL DEFAULT 0,
    "comment" TEXT
  );

  CREATE UNIQUE INDEX IF NOT EXISTS "CargoOffer_atiId_key" ON "CargoOffer"("atiId");

  CREATE TABLE IF NOT EXISTS "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "fuelPriceRub" REAL NOT NULL,
    "fuelConsumptionLiters" REAL NOT NULL,
    "platonRubPerKm" REAL NOT NULL,
    "driverRubPerKm" REAL NOT NULL,
    "variableRubPerKm" REAL NOT NULL,
    "fixedTripCostsRub" REAL NOT NULL,
    "targetMarginRub" REAL NOT NULL,
    "negotiateMarginRub" REAL NOT NULL,
    "takeScoreThreshold" REAL NOT NULL,
    "negotiateScoreThreshold" REAL NOT NULL,
    "minTakeRubPerKm" REAL NOT NULL,
    "minNegotiateRubPerKm" REAL NOT NULL,
    "telegramChatId" TEXT,
    "updatedAt" DATETIME NOT NULL
  );

  CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL
  );
`);

db.close();

console.log(`Initialized SQLite schema at ${dbPath}`);

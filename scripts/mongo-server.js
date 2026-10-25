// Local MongoDB for development.
// Prisma needs a replica set for transactions and nested writes, so this runs a
// single-node replica set on 127.0.0.1:27017 with its data in .data/mongo.

const path = require("path");
const fs = require("fs");
const { MongoMemoryReplSet } = require("mongodb-memory-server");

const PORT = Number(process.env.MONGO_PORT || 27017);
const dbPath = path.join(process.cwd(), ".data", "mongo");

fs.mkdirSync(dbPath, { recursive: true });

(async () => {
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
    instanceOpts: [{ port: PORT, ip: "127.0.0.1", dbPath }],
  });

  console.log(`MongoDB replica set ready at ${replSet.getUri()}`);

  const shutdown = async () => {
    await replSet.stop({ doCleanup: false, force: false });
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
})().catch((error) => {
  console.error("Could not start local MongoDB:", error);
  process.exit(1);
});

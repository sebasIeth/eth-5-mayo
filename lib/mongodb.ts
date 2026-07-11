import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "sello_turismo";

if (!uri) {
  throw new Error(
    "Falta la variable de entorno MONGODB_URI (defínela en .env.local).",
  );
}

// En desarrollo, Next.js recarga los módulos con HMR y crearía una nueva
// conexión en cada recarga. Cacheamos el cliente en el objeto global para
// reutilizar una sola conexión. En producción se crea una vez por instancia.
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = new MongoClient(uri).connect();
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

export default clientPromise;

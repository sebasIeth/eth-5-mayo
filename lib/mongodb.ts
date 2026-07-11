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

function connect(): Promise<MongoClient> {
  // Si la conexión falla (p.ej. IP no permitida), NO cacheamos la promesa
  // rechazada: la limpiamos para reintentar en la siguiente petición sin
  // tener que reiniciar el servidor.
  return new MongoClient(uri!).connect().catch((err) => {
    global._mongoClientPromise = undefined;
    throw err;
  });
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = connect();
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

export default clientPromise;

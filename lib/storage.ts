import { MongoClient, Db } from 'mongodb';
import { promises as fs } from 'fs';
import path from 'path';

const isVercel = process.env.VERCEL === '1';

// MongoDB connection
let client: MongoClient | null = null;
let db: Db | null = null;

async function getDb(): Promise<Db> {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db('meal-planner');
  return db;
}

// Generic storage functions that work with both MongoDB and JSON files

export async function getData<T>(key: string, defaultValue: T): Promise<T> {
  if (isVercel) {
    try {
      const database = await getDb();
      const collection = database.collection('data');
      const doc = await collection.findOne({ _key: key });
      return doc ? (doc.value as T) : defaultValue;
    } catch (error) {
      console.error(`MongoDB get error for ${key}:`, error);
      return defaultValue;
    }
  } else {
    // Local development - use JSON files
    const filePath = path.join(process.cwd(), 'data', `${key}.json`);
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return defaultValue;
    }
  }
}

export async function setData<T>(key: string, data: T): Promise<void> {
  if (isVercel) {
    try {
      const database = await getDb();
      const collection = database.collection('data');
      await collection.updateOne(
        { _key: key },
        { $set: { _key: key, value: data, updatedAt: new Date() } },
        { upsert: true }
      );
    } catch (error) {
      console.error(`MongoDB set error for ${key}:`, error);
      throw error;
    }
  } else {
    // Local development - use JSON files
    const filePath = path.join(process.cwd(), 'data', `${key}.json`);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  }
}

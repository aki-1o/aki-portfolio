import { MongoClient } from 'mongodb'

let entries = null

export const changelog = () => entries

export async function connectDb() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')

  const client = new MongoClient(uri)
  await client.connect()
  const col = client.db(process.env.MONGODB_DB || 'portfolio').collection('changelog')
  await col.createIndex({ version: 1 }, { unique: true })

  // First run: seed one entry so the page isn't empty.
  if ((await col.countDocuments()) === 0) {
    await col.insertOne({
      version: '1.0.0',
      title: 'Site launched',
      description: 'First public version of the portfolio: featured work, project archive, light and dark themes.',
      date: '2026-10-13',
      type: 'feature',
      link: '',
      createdAt: new Date(),
    })
  }

  entries = col
  console.log('MongoDB connected')
}

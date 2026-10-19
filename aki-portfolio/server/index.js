import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import contactRouter from './routes/contact.js'
import changelogRouter from './routes/changelog.js'
import { connectDb, changelog } from './db.js'

const app = express()
const PORT = process.env.PORT || 4000

app.set('trust proxy', 1) // correct client IPs behind Render/Railway proxies
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',').map((s) => s.trim()) : true,
  })
)
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', db: Boolean(changelog()) })
})

app.use('/api/contact', contactRouter)
app.use('/api/changelog', changelogRouter)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Something went wrong' })
})

// Listen first so /api/health works even if the DB is slow or misconfigured.
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
connectDb().catch((err) => console.error('MongoDB connection failed:', err.message))

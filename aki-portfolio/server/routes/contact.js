import { Router } from 'express'

const router = Router()

// POST /api/contact — currently just validates + logs.
// Wire this up to an email service (Resend, Nodemailer, etc.) or a DB
// once the site actually needs a working contact form.
router.post('/', (req, res) => {
  const { name, email, message } = req.body || {}

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email, and message are all required.' })
  }

  console.log('New contact form submission:', { name, email, message })
  res.status(200).json({ ok: true })
})

export default router

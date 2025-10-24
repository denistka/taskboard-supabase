import dotenv from 'dotenv'

dotenv.config()

export const config = {
  port: process.env.PORT || 3001,
  supabase: {
    url: process.env.DB_URL,
    serviceKey: process.env.DB_SERVICE_KEY
  },
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
}

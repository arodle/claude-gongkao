import express from 'express'
import cors from 'cors'
import backupRouter from './routes/backup.js'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// 备份路由
app.use('/api/backup', backupRouter)

app.listen(PORT, () => {
  console.log(`备份服务器已启动: http://localhost:${PORT}`)
  console.log(`健康检查: http://localhost:${PORT}/api/backup/health`)
})

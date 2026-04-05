import { Router, type Response } from 'express'
import User from '../models/User.js'
import { authenticate, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/doctors', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const doctors = await User.find({ role: 'doctor' }).select('-password')
    res.json({ success: true, data: doctors })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' })
  }
})

export default router

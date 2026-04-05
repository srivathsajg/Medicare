import { Router, type Response } from 'express'
import Record from '../models/Record.js'
import { authenticate, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter = req.user?.role === 'patient' 
      ? { patientId: req.user.id } 
      : req.user?.role === 'doctor' 
        ? { doctorId: req.user.id } 
        : {}

    const records = await Record.find(filter)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialization')
    
    res.json({ success: true, data: records })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' })
  }
})

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { patientId, title, description, fileUrl, verified } = req.body

    const newRecord = await Record.create({
      patientId,
      doctorId: req.user?.id,
      title,
      description,
      fileUrl,
      verified: verified || false,
    })

    res.status(201).json({ success: true, data: newRecord })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' })
  }
})

export default router

import { Router, type Response } from 'express'
import Appointment from '../models/Appointment.js'
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

    const appointments = await Appointment.find(filter)
      .populate('patientId', 'name email')
      .populate('doctorId', 'name specialization')
    
    res.json({ success: true, data: appointments })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' })
  }
})

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { doctorId, date, notes } = req.body

    const newAppointment = await Appointment.create({
      patientId: req.user?.id,
      doctorId,
      date,
      notes,
    })

    res.status(201).json({ success: true, data: newAppointment })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' })
  }
})

router.patch('/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status } = req.body
    
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )

    if (!appointment) {
      res.status(404).json({ success: false, error: 'Appointment not found' })
      return
    }

    res.json({ success: true, data: appointment })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' })
  }
})

export default router

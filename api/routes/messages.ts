import { Router, type Response } from 'express'
import Message from '../models/Message.js'
import User from '../models/User.js'
import { authenticate, AuthRequest } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

// Get users you can chat with (Doctors for patients, Patients for doctors)
router.get('/contacts', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roleToFind = req.user?.role === 'patient' ? 'doctor' : 'patient'
    const contacts = await User.find({ role: roleToFind }).select('_id name role specialization')
    res.json({ success: true, data: contacts })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' })
  }
})

// Get chat history with a specific user
router.get('/:contactId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { contactId } = req.params
    const userId = req.user?.id

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: contactId },
        { senderId: contactId, receiverId: userId }
      ]
    }).sort('createdAt')

    res.json({ success: true, data: messages })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' })
  }
})

export default router

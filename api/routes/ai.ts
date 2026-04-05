import { Router, type Request, type Response } from 'express'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body
    
    const reply = `AI Assistant: You said "${message}". Please consult a doctor for a professional opinion.`

    res.json({ success: true, data: reply })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' })
  }
})

router.post('/diet', async (req: Request, res: Response): Promise<void> => {
  try {
    const { preferences } = req.body
    
    const plan = `Here is your mock diet plan based on ${preferences}: 
    - Breakfast: Oatmeal with fruits
    - Lunch: Grilled chicken salad
    - Dinner: Baked salmon with vegetables`

    res.json({ success: true, data: plan })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' })
  }
})

export default router

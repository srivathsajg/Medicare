import { Router, type Request, type Response } from 'express'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

router.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body
    
    // Simulate real-time processing delay (1.5 seconds)
    await new Promise(resolve => setTimeout(resolve, 1500))

    const lowerMsg = message.toLowerCase()
    let reply = ''

    if (lowerMsg.includes('headache')) {
      reply = 'For a mild headache, resting in a quiet, dark room and staying hydrated can help. Over-the-counter pain relievers might also be useful. However, if it persists or is severe, please consult a doctor.'
    } else if (lowerMsg.includes('fever')) {
      reply = 'If you have a fever, ensure you get plenty of rest and drink lots of fluids. You can take fever-reducing medication if needed. Please see a doctor if your fever is high or lasts more than a few days.'
    } else if (lowerMsg.includes('diet')) {
      reply = 'A balanced diet rich in vegetables, fruits, whole grains, and lean proteins is essential for good health. Consider consulting a nutritionist or your doctor for a personalized diet plan.'
    } else if (lowerMsg.includes('pain')) {
      reply = 'Pain can have many causes. For mild muscle pain, rest and a warm compress might help. If the pain is sharp, persistent, or unusual, I strongly recommend scheduling an appointment to see a doctor.'
    } else if (lowerMsg.includes('appointment')) {
      reply = 'You can easily book an appointment with one of our specialists through your Patient Dashboard. Just click on "Book Appointment" to choose a suitable doctor and time.'
    } else {
      reply = `I understand you're asking about "${message}". As an AI, I can provide general health information, but I highly recommend consulting a real doctor for a proper medical evaluation.`
    }

    res.json({ success: true, data: reply })
  } catch (_error) {
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
  } catch (_error) {
    res.status(500).json({ success: false, error: 'Server Error' })
  }
})

export default router

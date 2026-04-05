import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key'

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, specialization } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      res.status(400).json({ success: false, error: 'User already exists' })
      return
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'patient',
      specialization,
    })

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: '30d',
    })

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid credentials' })
      return
    }

    const isMatch = await bcrypt.compare(password, user.password!)
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid credentials' })
      return
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: '30d',
    })

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        specialization: user.specialization,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' })
  }
})

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  res.json({ success: true, message: 'Logged out successfully' })
})

export default router

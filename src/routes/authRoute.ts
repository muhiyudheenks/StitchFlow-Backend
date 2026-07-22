import { Router } from 'express';
import { register, login, verifyOtp, resendOtp, resetPassword, forgotPassword } from '../controllers/authController';
import protect from '../Middlewares/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', protect, resendOtp);

router.post('/reset-password', resetPassword)
router.post('/forgot-password', forgotPassword)
export default router;
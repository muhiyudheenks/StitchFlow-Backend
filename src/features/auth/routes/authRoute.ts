import { Router } from 'express';
import { login, logout, verifyOtp, resendOtp, resetPassword, forgotPassword, verifySetupToken, setupPassword, googleLogin } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post("/google-login", googleLogin);
router.post('/logout', logout);
router.post('/verify-otp', verifyOtp);
router.post('/verify-reset-otp', verifyOtp);
router.post('/resend-otp', resendOtp);

router.post('/reset-password', resetPassword);
router.post('/forgot-password', forgotPassword);

router.get('/verify-setup-token/:token', verifySetupToken);
router.post('/setup-password', setupPassword);


export default router;

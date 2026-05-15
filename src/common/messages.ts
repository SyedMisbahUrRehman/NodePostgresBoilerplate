import { ErrorCode, SuccessCode } from './codes.js';

export const SuccessMessage: Record<(typeof SuccessCode)[keyof typeof SuccessCode], string> = {
  [SuccessCode.SIGNUP_SUCCESSFUL]: 'Account created successfully.',
  [SuccessCode.LOGIN_SUCCESSFUL]: 'Login successful.',
  [SuccessCode.LOGOUT_SUCCESSFUL]: 'Logged out successfully.',
  [SuccessCode.TOKEN_REFRESHED]: 'Tokens refreshed successfully.',
  [SuccessCode.PROFILE_RETRIEVED]: 'Profile retrieved successfully.',
  [SuccessCode.PASSWORD_RESET_EMAIL_SENT]:
    'If an account exists for this email, password reset instructions have been sent.',
  [SuccessCode.PASSWORD_RESET_SUCCESSFUL]: 'Password has been reset successfully.',
  [SuccessCode.EMAIL_VERIFICATION_SENT]: 'Verification email sent.',
  [SuccessCode.EMAIL_VERIFIED]: 'Email verified successfully.',
};

export const ErrorMessage: Record<(typeof ErrorCode)[keyof typeof ErrorCode], string> = {
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed.',
  [ErrorCode.INVALID_EMAIL]: 'Invalid email address.',
  [ErrorCode.INVALID_PASSWORD]: 'Invalid password.',
  [ErrorCode.EMAIL_ALREADY_REGISTERED]: 'An account with this email already exists.',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password.',
  [ErrorCode.UNAUTHORIZED]: 'Authentication required.',
  [ErrorCode.TOKEN_EXPIRED]: 'Token has expired.',
  [ErrorCode.INVALID_TOKEN]: 'Invalid or malformed token.',
  [ErrorCode.INVALID_REFRESH_TOKEN]: 'Invalid or expired refresh token.',
  [ErrorCode.USER_NOT_FOUND]: 'User not found.',
  [ErrorCode.PASSWORD_RESET_TOKEN_INVALID]: 'Invalid or expired password reset link.',
  [ErrorCode.EMAIL_VERIFICATION_TOKEN_INVALID]: 'Invalid or expired verification link.',
  [ErrorCode.EMAIL_ALREADY_VERIFIED]: 'Email is already verified.',
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'An unexpected error occurred.',
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
  [ErrorCode.NOT_FOUND]: 'Resource not found.',
};

"""
Email service for sending OTP and password reset emails via SMTP.
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from src.config import get_settings
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via SMTP."""

    @staticmethod
    def send_otp_email(email: str, otp_code: str, user_name: str = "User") -> bool:
        """
        Send OTP email to user.
        
        Args:
            email: Recipient email address
            otp_code: OTP code to send
            user_name: User's name for personalization
            
        Returns:
            True if email sent successfully, False otherwise
        """
        logger.info(f"EmailService.send_otp_email called with email: {email}, otp_code: {otp_code}, user_name: {user_name}")
        
        try:
            settings = get_settings()
            
            # Build email content
            subject = "Password Reset OTP - TeaBlendAI"
            body = f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #2c3e50;">Password Reset Request</h2>
        <p>Hi {user_name},</p>
        <p>You requested a password reset for your TeaBlendAI account (<strong>{email}</strong>). Use the OTP below to proceed:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h1 style="color: #27ae60; letter-spacing: 5px; margin: 0;">{otp_code}</h1>
        </div>
        
        <p><strong>Important Security Information:</strong></p>
        <ul>
            <li>This OTP is valid for 5 minutes only</li>
            <li>You can enter the OTP up to 3 times</li>
            <li>Never share this OTP with anyone</li>
            <li>If you didn't request this reset, please ignore this email</li>
        </ul>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This is an automated email sent to {email}. Please do not reply to this email.
        </p>
    </div>
</body>
</html>
            """
            
            logger.info(f"Calling EmailService._send_email with to_email: {email}")
            return EmailService._send_email(email, subject, body)
        except Exception as e:
            logger.error(f"Failed to send OTP email to {email}: {str(e)}")
            return False

    @staticmethod
    def send_password_reset_confirmation_email(
        email: str, 
        user_name: str = "User"
    ) -> bool:
        """
        Send password reset confirmation email to user.
        
        Args:
            email: Recipient email address
            user_name: User's name for personalization
            
        Returns:
            True if email sent successfully, False otherwise
        """
        try:
            subject = "Password Successfully Reset - TeaBlendAI"
            body = f"""
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2 style="color: #2c3e50;">Password Reset Successful</h2>
        <p>Hi {user_name},</p>
        <p>Your password has been successfully reset. You can now log in with your new password.</p>
        
        <p style="margin-top: 30px;">
            <a href="http://localhost:3000/auth/login" style="background-color: #27ae60; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Login to Your Account
            </a>
        </p>
        
        <p style="margin-top: 20px; color: #e74c3c;">
            <strong>Security Alert:</strong> If you did not make this change, please contact support immediately.
        </p>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This is an automated email. Please do not reply to this email.
        </p>
    </div>
</body>
</html>
            """
            
            return EmailService._send_email(email, subject, body)
        except Exception as e:
            logger.error(f"Failed to send confirmation email to {email}: {str(e)}")
            return False

    @staticmethod
    def _send_email(to_email: str, subject: str, body: str) -> bool:
        """
        Internal method to send email via SMTP.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Email body (HTML)
            
        Returns:
            True if sent successfully, False otherwise
        """
        logger.info(f"EmailService._send_email called with to_email: {to_email}, subject: {subject}")
        
        try:
            settings = get_settings()
            
            # Get SMTP settings from environment
            smtp_host = getattr(settings, 'SMTP_HOST', None)
            smtp_port = getattr(settings, 'SMTP_PORT', 587)
            smtp_user = getattr(settings, 'SMTP_USER', None)
            smtp_password = getattr(settings, 'SMTP_PASSWORD', None)
            from_email = getattr(settings, 'SMTP_FROM_EMAIL', smtp_user)
            
            logger.info(f"SMTP config - host: {smtp_host}, port: {smtp_port}, user: {smtp_user}, from_email: {from_email}")
            
            if not all([smtp_host, smtp_user, smtp_password]):
                logger.warning("SMTP credentials not configured. Email not sent.")
                return False
            
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = from_email
            message["To"] = to_email
            
            logger.info(f"Email message - From: {from_email}, To: {to_email}, Subject: {subject}")
            
            # Attach HTML body
            html_part = MIMEText(body, "html")
            message.attach(html_part)
            
            # Send email
            logger.info(f"Connecting to SMTP server {smtp_host}:{smtp_port}")
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                logger.info(f"Logging in with user: {smtp_user}")
                server.login(smtp_user, smtp_password)
                logger.info(f"Sending email from {from_email} to {to_email}")
                server.sendmail(from_email, [to_email], message.as_string())
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

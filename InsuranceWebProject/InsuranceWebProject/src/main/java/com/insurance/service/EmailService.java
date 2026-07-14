package com.insurance.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Service responsible for sending transactional emails.
 * <p>
 * If no SMTP server is configured, email content is logged to the console instead
 * of being transmitted, so the application remains fully functional in development.
 *
 * @author Santhosh
 * @since 1.0
 */
@Slf4j
@Service
public class EmailService {

    private final JavaMailSender mailSender;
    private final boolean mailEnabled;

    @Value("${spring.mail.from:noreply@insurancepro.com}")
    private String fromAddress;

    public EmailService(
            @Value("${spring.mail.enabled:false}") boolean mailEnabled,
            JavaMailSender mailSender) {
        this.mailEnabled = mailEnabled;
        this.mailSender = mailSender;
    }

    // ─────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────

    /**
     * Sends a password-reset email with a tokenised link.
     *
     * @param toEmail   recipient email address
     * @param resetLink full URL including the one-time token
     */
    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        String subject = "InsurancePro — Password Reset Request";
        String body = String.format("""
                Hello,

                An administrator has initiated a password reset for your account.

                Click the link below to set a new password (valid for 15 minutes):
                %s

                If you did not request this, please contact support immediately.

                Regards,
                InsurancePro Support Team
                """, resetLink);
        send(toEmail, subject, body);
    }

    /**
     * Sends a KYC decision notification email to the user.
     *
     * @param toEmail  recipient email address
     * @param approved true if KYC was verified; false if rejected
     * @param reason   optional rejection reason (used only when approved=false)
     */
    public void sendKycDecisionEmail(String toEmail, boolean approved, String reason) {
        String subject = approved
                ? "InsurancePro — KYC Verification Approved ✓"
                : "InsurancePro — KYC Verification Rejected";
        String body = approved
                ? """
                  Congratulations!

                  Your KYC documents have been reviewed and verified successfully.
                  You now have full access to all InsurancePro features.

                  Regards,
                  InsurancePro Team
                  """
                : String.format("""
                  We regret to inform you that your KYC verification was not successful.

                  Reason: %s

                  Please upload the correct documents and re-submit for review.

                  Regards,
                  InsurancePro Team
                  """, reason != null ? reason : "Documents did not meet our requirements.");
        send(toEmail, subject, body);
    }

    /**
     * Notifies a user that their account status has been changed by an administrator.
     *
     * @param toEmail the recipient's email address
     * @param status  the new account status string (ACTIVE / SUSPENDED / DEACTIVATED)
     */
    public void sendAccountStatusEmail(String toEmail, String status) {
        String subject = "InsurancePro — Account Status Update";
        String body = String.format("""
                Hello,

                Your InsurancePro account status has been updated to: %s.

                If you have any questions, please contact our support team.

                Regards,
                InsurancePro Team
                """, status);
        send(toEmail, subject, body);
    }

    /**
     * Sends a welcome email when a user registers.
     *
     * @param toEmail recipient email address
     * @param name    recipient's first name
     */
    public void sendWelcomeEmail(String toEmail, String name) {
        String subject = "Welcome to InsurancePro!";
        String body = String.format("""
                Hello %s,

                Welcome to InsurancePro! We are thrilled to have you on board.
                
                You can now log in to your account to view custom policy plans, manage your claims, and get AI-powered assistance for all your insurance needs.

                Regards,
                InsurancePro Team
                """, name);
        send(toEmail, subject, body);
    }

    /**
     * Sends a login notification email when a user or admin logs in.
     *
     * @param toEmail recipient email address
     * @param name    recipient's first name
     */
    public void sendLoginNotificationEmail(String toEmail, String name) {
        String subject = "InsurancePro — Successful Login Notification";
        String body = String.format("""
                Hello %s,

                We detected a successful login to your InsurancePro account on %s.

                If this was you, you can safely ignore this email.
                If you did not log in, please secure your account immediately or contact support.

                Regards,
                InsurancePro Security Team
                """, name, java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        send(toEmail, subject, body);
    }

    /**
     * Sends a notification email when a user applies for a policy.
     *
     * @param toEmail recipient email address
     * @param name recipient's first name
     * @param policyName name of the policy
     * @param policyNumber generated policy number
     * @param premiumAmount annual premium amount
     */
    public void sendPolicyAppliedEmail(String toEmail, String name, String policyName, String policyNumber, java.math.BigDecimal premiumAmount) {
        String subject = "InsurancePro — Policy Application Submitted Successfully";
        String body = String.format("""
                Hello %s,

                Your application for the insurance policy "%s" has been submitted successfully!

                Here are your policy details:
                - Policy Number: %s
                - Annual Premium: ₹%s
                - Status: PENDING_PAYMENT

                Please complete the premium payment to activate your policy coverage.

                Regards,
                InsurancePro Team
                """, name, policyName, policyNumber, premiumAmount.toString());
        send(toEmail, subject, body);
    }

    // ─────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────

    private void send(String to, String subject, String body) {
        if (!mailEnabled) {
            log.info("=== [EMAIL – dev mode] To: {} | Subject: {} ===\n{}", to, subject, body);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromAddress);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.info("Email sent to {} with subject '{}'", to, subject);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage(), e);
        }
    }
}

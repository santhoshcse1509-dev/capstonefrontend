package com.insurance.service;

import com.insurance.entity.*;
import com.insurance.repository.CustomerPolicyRepository;
import com.insurance.repository.PremiumRateConfigRepository;
import com.insurance.repository.PolicyStatusHistoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Scheduled job executing daily to transition active policies into GRACE_PERIOD
 * and overdue grace policies into LAPSED. Also dispatches automated notifications.
 *
 * @author Santhosh
 * @since 2.0
 */
@Service
public class PolicyLifecycleScheduler {

    private static final Logger logger = LoggerFactory.getLogger(PolicyLifecycleScheduler.class);

    private final CustomerPolicyRepository customerPolicyRepository;
    private final PremiumRateConfigRepository rateConfigRepository;
    private final PolicyStatusHistoryRepository historyRepository;
    private final NotificationService notificationService;
    private final com.insurance.repository.UserRepository userRepository;

    public PolicyLifecycleScheduler(CustomerPolicyRepository customerPolicyRepository,
                                    PremiumRateConfigRepository rateConfigRepository,
                                    PolicyStatusHistoryRepository historyRepository,
                                    NotificationService notificationService,
                                    com.insurance.repository.UserRepository userRepository) {
        this.customerPolicyRepository = customerPolicyRepository;
        this.rateConfigRepository = rateConfigRepository;
        this.historyRepository = historyRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    /**
     * Runs daily at midnight.
     * Checks policies for due premium and transitions state automatically.
     */
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void processPolicyLifecycles() {
        logger.info("Executing daily Policy Lifecycle Grace & Lapse Scheduler...");
        LocalDate today = LocalDate.now();

        // 1. Scan ACTIVE policies for past due date
        List<CustomerPolicy> activePolicies = customerPolicyRepository.findByStatus(PolicyStatus.ACTIVE);
        for (CustomerPolicy cp : activePolicies) {
            if (cp.getPremiumDueDate() != null && cp.getPremiumDueDate().isBefore(today)) {
                logger.info("Policy {} is past premium due date. Entering GRACE_PERIOD.", cp.getPolicyNumber());
                
                PolicyStatus oldStatus = cp.getStatus();
                cp.setStatus(PolicyStatus.GRACE_PERIOD);
                customerPolicyRepository.save(cp);

                logTransition(cp, oldStatus, PolicyStatus.GRACE_PERIOD, "SYSTEM", 
                        "Premium due date " + cp.getPremiumDueDate() + " passed. Transitioned to grace period.");

                notificationService.createNotification(
                        cp.getUser().getId(),
                        "Premium Overdue: Grace Period Entered",
                        "Premium for policy " + cp.getPolicyNumber() + " is overdue. You have entered the grace period.",
                        NotificationType.WARNING,
                        NotificationCategory.PAYMENT
                );
            }
        }

        // 2. Scan GRACE_PERIOD policies for expiration
        List<CustomerPolicy> gracePolicies = customerPolicyRepository.findByStatus(PolicyStatus.GRACE_PERIOD);
        for (CustomerPolicy cp : gracePolicies) {
            if (cp.getPremiumDueDate() != null) {
                long daysSinceDue = ChronoUnit.DAYS.between(cp.getPremiumDueDate(), today);
                int graceWindow = getGraceWindowDays(cp.getPolicy().getPolicyType().getName());

                // Mid-point reminder alert
                int midPoint = graceWindow / 2;
                if (daysSinceDue == midPoint) {
                    logger.info("Policy {} at mid-point of grace period. Sending reminder.", cp.getPolicyNumber());
                    notificationService.createNotification(
                            cp.getUser().getId(),
                            "Grace Period Warning",
                            "Your policy " + cp.getPolicyNumber() + " grace period expires in " + (graceWindow - midPoint) + " days. Please pay immediately.",
                            NotificationType.WARNING,
                            NotificationCategory.PAYMENT
                    );
                }

                // Expiry and Lapsation
                if (daysSinceDue >= graceWindow) {
                    logger.info("Policy {} grace period expired. Transitioning to LAPSED.", cp.getPolicyNumber());
                    
                    PolicyStatus oldStatus = cp.getStatus();
                    cp.setStatus(PolicyStatus.LAPSED);
                    customerPolicyRepository.save(cp);

                    logTransition(cp, oldStatus, PolicyStatus.LAPSED, "SYSTEM", 
                            "Grace period of " + graceWindow + " days expired. Policy lapsed.");

                    notificationService.createNotification(
                            cp.getUser().getId(),
                            "Policy Lapsed due to Non-Payment",
                            "Your policy " + cp.getPolicyNumber() + " has lapsed. You can request reinstatement within 90 days.",
                            NotificationType.WARNING,
                            NotificationCategory.POLICY_EXPIRY
                    );
                }
            }
        }
        
        // 3. Scan VERIFIED KYC users for expiry (>12 months)
        List<User> verifiedUsers = userRepository.findByKycStatus(KycStatus.VERIFIED);
        for (User u : verifiedUsers) {
            if (u.getKycVerifiedAt() != null) {
                long daysSinceVerification = ChronoUnit.DAYS.between(u.getKycVerifiedAt(), LocalDateTime.now());
                if (daysSinceVerification >= 365) {
                    logger.info("User {} KYC has expired after 12 months.", u.getEmail());
                    u.setKycStatus(KycStatus.EXPIRED);
                    userRepository.save(u);

                    notificationService.createNotification(
                            u.getId(),
                            "KYC Expiry Alert",
                            "Your KYC verification has expired after 12 months. Please re-upload documents to purchase policies or process claim payouts.",
                            NotificationType.WARNING,
                            NotificationCategory.ACCOUNT
                    );
                }
            }
        }
    }

    private int getGraceWindowDays(String policyTypeName) {
        return rateConfigRepository.findByPolicyTypeNameAndFactorKey(policyTypeName, "GRACE_WINDOW_DAYS")
                .map(r -> r.getFactorValue().intValue())
                .orElseGet(() -> {
                    if ("LIFE".equalsIgnoreCase(policyTypeName) || "HEALTH".equalsIgnoreCase(policyTypeName)) {
                        return 30; // 30 days default for Life/Health
                    }
                    return 15; // 15 days default for Motor/Home
                });
    }

    private void logTransition(CustomerPolicy cp, PolicyStatus oldStatus, PolicyStatus newStatus, String triggeredBy, String reason) {
        PolicyStatusHistory entry = PolicyStatusHistory.builder()
                .customerPolicy(cp)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .triggeredBy(triggeredBy)
                .reason(reason)
                .build();
        historyRepository.save(entry);
    }
}

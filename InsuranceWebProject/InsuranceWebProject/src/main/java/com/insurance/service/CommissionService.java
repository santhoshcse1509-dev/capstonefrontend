package com.insurance.service;

import com.insurance.entity.*;
import com.insurance.repository.CommissionLedgerRepository;
import com.insurance.repository.CommissionRateRepository;
import com.insurance.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommissionService {

    private final CommissionLedgerRepository ledgerRepository;
    private final CommissionRateRepository rateRepository;
    private final UserRepository userRepository;
    private final com.insurance.repository.BankDetailsRepository bankDetailsRepository;

    @Transactional
    public void calculateSaleCommission(CustomerPolicy policy) {
        User agent = policy.getAgent();
        if (agent == null) {
            return;
        }

        String idempotencyKey = "SALE_" + policy.getId();
        if (ledgerRepository.findByIdempotencyKey(idempotencyKey).isPresent()) {
            // Already processed
            return;
        }

        BigDecimal premium = policy.getPremiumPaid();
        if (premium == null || premium.compareTo(BigDecimal.ZERO) <= 0) {
            premium = policy.getQuotedPremium();
        }
        if (premium == null || premium.compareTo(BigDecimal.ZERO) <= 0) {
            return;
        }

        AgentTier tier = agent.getAgentTier() != null ? agent.getAgentTier() : AgentTier.AGENT;
        String categoryName = policy.getPolicy().getPolicyType().getName();

        // 1. Fetch commission rate
        BigDecimal baseRate = new BigDecimal("0.10"); // Default 10%
        BigDecimal bonusRate = BigDecimal.ZERO;

        Optional<CommissionRate> rateOpt = rateRepository.findByProductCategoryNameIgnoreCaseAndAgentTier(categoryName, tier);
        if (rateOpt.isPresent()) {
            baseRate = rateOpt.get().getBaseRate().divide(new BigDecimal("100"), 4, java.math.RoundingMode.HALF_UP);
            bonusRate = rateOpt.get().getTierBonusRate().divide(new BigDecimal("100"), 4, java.math.RoundingMode.HALF_UP);
        }

        BigDecimal baseComm = premium.multiply(baseRate).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal bonusComm = premium.multiply(bonusRate).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal totalComm = baseComm.add(bonusComm);

        // 2. Create Ledger entry for direct sale
        CommissionLedger directLedger = CommissionLedger.builder()
                .agent(agent)
                .customerPolicy(policy)
                .calculatedAmount(totalComm)
                .baseCommission(baseComm)
                .overrideCommission(BigDecimal.ZERO)
                .transactionType("SALE")
                .idempotencyKey(idempotencyKey)
                .processedAt(LocalDateTime.now())
                .build();

        ledgerRepository.save(directLedger);

        // Update agent's lifetime commission
        agent.setLifetimeCommission(agent.getLifetimeCommission().add(totalComm));
        userRepository.save(agent);

        // 3. Cascade Override Commissions up hierarchy
        cascadeOverrides(agent.getParentAgent(), policy, premium);
    }

    private void cascadeOverrides(User parent, CustomerPolicy policy, BigDecimal premium) {
        if (parent == null) {
            return;
        }

        AgentTier parentTier = parent.getAgentTier() != null ? parent.getAgentTier() : AgentTier.AGENT;
        String idempotencyKey = "OVERRIDE_" + parent.getId() + "_" + policy.getId();

        if (ledgerRepository.findByIdempotencyKey(idempotencyKey).isPresent()) {
            return;
        }

        // Senior Agent gets 3% override, Agency Manager gets 5% override
        BigDecimal overrideRate = BigDecimal.ZERO;
        if (parentTier == AgentTier.SENIOR_AGENT) {
            overrideRate = new BigDecimal("0.03");
        } else if (parentTier == AgentTier.AGENCY_MANAGER) {
            overrideRate = new BigDecimal("0.05");
        }

        if (overrideRate.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal overrideAmount = premium.multiply(overrideRate).setScale(2, java.math.RoundingMode.HALF_UP);

            CommissionLedger overrideLedger = CommissionLedger.builder()
                    .agent(parent)
                    .customerPolicy(policy)
                    .calculatedAmount(overrideAmount)
                    .baseCommission(BigDecimal.ZERO)
                    .overrideCommission(overrideAmount)
                    .transactionType("OVERRIDE")
                    .idempotencyKey(idempotencyKey)
                    .processedAt(LocalDateTime.now())
                    .build();

            ledgerRepository.save(overrideLedger);

            parent.setLifetimeCommission(parent.getLifetimeCommission().add(overrideAmount));
            userRepository.save(parent);
        }

        // Continue cascade up hierarchy
        cascadeOverrides(parent.getParentAgent(), policy, premium);
    }

    @Transactional
    public void processClawback(CustomerPolicy policy) {
        List<CommissionLedger> activeLedgers = ledgerRepository.findByCustomerPolicyId(policy.getId());

        for (CommissionLedger ledger : activeLedgers) {
            if ("CLAWBACK".equals(ledger.getTransactionType())) {
                continue; // Already clawed back
            }

            String clawbackKey = "CLAWBACK_" + ledger.getId();
            if (ledgerRepository.findByIdempotencyKey(clawbackKey).isPresent()) {
                continue;
            }

            BigDecimal negativeAmount = ledger.getCalculatedAmount().negate();

            CommissionLedger clawback = CommissionLedger.builder()
                    .agent(ledger.getAgent())
                    .customerPolicy(policy)
                    .calculatedAmount(negativeAmount)
                    .baseCommission(ledger.getBaseCommission().negate())
                    .overrideCommission(ledger.getOverrideCommission().negate())
                    .transactionType("CLAWBACK")
                    .idempotencyKey(clawbackKey)
                    .processedAt(LocalDateTime.now())
                    .build();

            ledgerRepository.save(clawback);

            User agent = ledger.getAgent();
            agent.setLifetimeCommission(agent.getLifetimeCommission().add(negativeAmount));
            userRepository.save(agent);
        }
    }

    @Transactional
    public void markCommissionAsPaid(UUID ledgerId, UUID bankDetailsId) {
        CommissionLedger ledger = ledgerRepository.findById(ledgerId)
                .orElseThrow(() -> new IllegalArgumentException("Ledger entry not found"));

        BankDetails bank = bankDetailsRepository.findById(bankDetailsId)
                .orElseThrow(() -> new IllegalArgumentException("Bank details not found"));

        if (!bank.getOwnerId().equals(ledger.getAgent().getId())) {
            throw new IllegalArgumentException("Bank account does not belong to the target agent.");
        }

        if (!bank.isVerified()) {
            throw new IllegalArgumentException("Payout failed: target bank account is not verified.");
        }

        ledger.setStatus("PAID");
        ledger.setPayoutBankDetails(bank);
        ledgerRepository.save(ledger);
    }
}

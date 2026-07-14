package com.insurance.service;

import com.insurance.entity.CustomerPolicy;
import com.insurance.entity.PolicyStatus;
import com.insurance.entity.PolicyStatusHistory;
import com.insurance.repository.PolicyStatusHistoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class PolicyStatusHistoryService {

    private final PolicyStatusHistoryRepository historyRepository;

    public PolicyStatusHistoryService(PolicyStatusHistoryRepository historyRepository) {
        this.historyRepository = historyRepository;
    }

    @Transactional
    public void recordTransition(CustomerPolicy customerPolicy, PolicyStatus oldStatus, PolicyStatus newStatus,
                                 String triggeredBy, String reason) {
        PolicyStatusHistory entry = PolicyStatusHistory.builder()
                .customerPolicy(customerPolicy)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .triggeredBy(triggeredBy)
                .reason(reason)
                .build();
        historyRepository.save(entry);
    }

    public List<PolicyStatusHistory> getHistoryForPolicy(UUID customerPolicyId) {
        return historyRepository.findByCustomerPolicyIdOrderByCreatedAtDesc(customerPolicyId);
    }
}

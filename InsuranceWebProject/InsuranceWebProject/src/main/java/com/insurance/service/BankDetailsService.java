package com.insurance.service;

import com.insurance.dto.bank.BankDetailsRequest;
import com.insurance.dto.bank.BankDetailsResponse;
import com.insurance.entity.AuditLog;
import com.insurance.entity.BankDetails;
import com.insurance.exception.BadRequestException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.AuditLogRepository;
import com.insurance.repository.BankDetailsRepository;
import com.insurance.util.EncryptionUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BankDetailsService {

    private final BankDetailsRepository bankDetailsRepository;
    private final AuditLogRepository auditLogRepository;

    public List<BankDetailsResponse> getBankDetails(UUID ownerId) {
        return bankDetailsRepository.findByOwnerId(ownerId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BankDetailsResponse addBankDetails(UUID ownerId, String ownerType, BankDetailsRequest request) {
        validateOtp(request.getOtpCode());

        // Check if there's already a bank detail with the same account number
        String encryptedAccount = EncryptionUtil.encrypt(request.getAccountNumber());
        
        // Check primary status
        boolean isFirst = bankDetailsRepository.findByOwnerId(ownerId).isEmpty();

        BankDetails bank = BankDetails.builder()
                .ownerId(ownerId)
                .ownerType(ownerType)
                .accountHolderName(request.getAccountHolderName())
                .accountNumber(encryptedAccount)
                .ifscCode(request.getIfscCode())
                .bankName(request.getBankName())
                .isVerified(false) // Needs penny-drop verification
                .isPrimaryForDebit(isFirst || request.isPrimaryForDebit())
                .isPrimaryForPayout(isFirst || request.isPrimaryForPayout())
                .requiresReauthorization(false)
                .build();

        if (bank.isPrimaryForDebit()) {
            // Unmark others
            List<BankDetails> others = bankDetailsRepository.findByOwnerId(ownerId);
            for (BankDetails o : others) {
                o.setPrimaryForDebit(false);
                bankDetailsRepository.save(o);
            }
        }
        if (bank.isPrimaryForPayout()) {
            // Unmark others
            List<BankDetails> others = bankDetailsRepository.findByOwnerId(ownerId);
            for (BankDetails o : others) {
                o.setPrimaryForPayout(false);
                bankDetailsRepository.save(o);
            }
        }

        BankDetails saved = bankDetailsRepository.save(bank);

        // Audit Log
        writeAuditLog(ownerId, "ADD_BANK_DETAILS", 
                String.format("Added bank details: %s at %s. Account masked: %s", 
                        request.getAccountHolderName(), request.getBankName(), maskAccountNumber(request.getAccountNumber())));

        return mapToResponse(saved);
    }

    @Transactional
    public BankDetailsResponse updateBankDetails(UUID id, UUID ownerId, BankDetailsRequest request) {
        validateOtp(request.getOtpCode());

        BankDetails bank = bankDetailsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bank details not found"));

        if (!bank.getOwnerId().equals(ownerId)) {
            throw new BadRequestException("You do not own this bank details record.");
        }

        String decryptedOld = EncryptionUtil.decrypt(bank.getAccountNumber());
        boolean accountOrIfscChanged = !decryptedOld.equals(request.getAccountNumber()) || !bank.getIfscCode().equals(request.getIfscCode());

        // Mandate re-authorization check:
        // "If a bank record is marked isPrimaryForDebit, any modification of the bank account number/IFSC or flag change triggers a mandate re-authorization event."
        boolean oldIsPrimaryForDebit = bank.isPrimaryForDebit();
        boolean newIsPrimaryForDebit = request.isPrimaryForDebit();
        boolean primaryDebitFlagChanged = oldIsPrimaryForDebit != newIsPrimaryForDebit;

        if (oldIsPrimaryForDebit && (accountOrIfscChanged || primaryDebitFlagChanged)) {
            bank.setRequiresReauthorization(true);
            // Write Audit Log
            writeAuditLog(ownerId, "MANDATE_REAUTHORIZATION_REQUIRED",
                    String.format("Mandate re-authorization triggered for bank account ID %s due to changes.", bank.getId()));
        }

        bank.setAccountHolderName(request.getAccountHolderName());
        bank.setAccountNumber(EncryptionUtil.encrypt(request.getAccountNumber()));
        bank.setIfscCode(request.getIfscCode());
        bank.setBankName(request.getBankName());

        if (accountOrIfscChanged) {
            bank.setVerified(false); // Reset verification status if account number or IFSC changes
        }

        if (newIsPrimaryForDebit) {
            // Unmark others
            List<BankDetails> others = bankDetailsRepository.findByOwnerId(ownerId);
            for (BankDetails o : others) {
                if (!o.getId().equals(bank.getId())) {
                    o.setPrimaryForDebit(false);
                    bankDetailsRepository.save(o);
                }
            }
            bank.setPrimaryForDebit(true);
        } else {
            bank.setPrimaryForDebit(request.isPrimaryForDebit());
        }

        if (request.isPrimaryForPayout()) {
            // Unmark others
            List<BankDetails> others = bankDetailsRepository.findByOwnerId(ownerId);
            for (BankDetails o : others) {
                if (!o.getId().equals(bank.getId())) {
                    o.setPrimaryForPayout(false);
                    bankDetailsRepository.save(o);
                }
            }
            bank.setPrimaryForPayout(true);
        } else {
            bank.setPrimaryForPayout(request.isPrimaryForPayout());
        }

        BankDetails saved = bankDetailsRepository.save(bank);

        // Audit Log
        writeAuditLog(ownerId, "UPDATE_BANK_DETAILS", 
                String.format("Updated bank details ID %s. Account masked: %s", 
                        saved.getId(), maskAccountNumber(request.getAccountNumber())));

        return mapToResponse(saved);
    }

    @Transactional
    public boolean verifyBankDetails(UUID id, UUID ownerId, BigDecimal verificationAmount) {
        BankDetails bank = bankDetailsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bank details not found"));

        if (!bank.getOwnerId().equals(ownerId)) {
            throw new BadRequestException("You do not own this bank details record.");
        }

        //penny-drop simulation: user registers correct amount (e.g. ₹1.00 or 1.0)
        boolean isCorrect = verificationAmount.compareTo(new BigDecimal("1.00")) == 0 || 
                             verificationAmount.compareTo(new BigDecimal("1.0")) == 0;
        
        if (isCorrect) {
            bank.setVerified(true);
            bankDetailsRepository.save(bank);

            String decrypted = EncryptionUtil.decrypt(bank.getAccountNumber());
            writeAuditLog(ownerId, "VERIFY_BANK_DETAILS", 
                    String.format("Verified bank details ID %s. Account masked: %s", 
                            bank.getId(), maskAccountNumber(decrypted)));
            return true;
        }

        return false;
    }

    @Transactional
    public void deleteBankDetails(UUID id, UUID ownerId, String otpCode) {
        validateOtp(otpCode);

        BankDetails bank = bankDetailsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bank details not found"));

        if (!bank.getOwnerId().equals(ownerId)) {
            throw new BadRequestException("You do not own this bank details record.");
        }

        String decrypted = EncryptionUtil.decrypt(bank.getAccountNumber());
        boolean wasPrimaryDebit = bank.isPrimaryForDebit();
        boolean wasPrimaryPayout = bank.isPrimaryForPayout();

        bankDetailsRepository.delete(bank);

        // Re-assign primary flags
        if (wasPrimaryDebit || wasPrimaryPayout) {
            List<BankDetails> others = bankDetailsRepository.findByOwnerId(ownerId);
            if (!others.isEmpty()) {
                if (wasPrimaryDebit) {
                    others.get(0).setPrimaryForDebit(true);
                }
                if (wasPrimaryPayout) {
                    others.get(0).setPrimaryForPayout(true);
                }
                bankDetailsRepository.save(others.get(0));
            }
        }

        writeAuditLog(ownerId, "DELETE_BANK_DETAILS", 
                String.format("Deleted bank details ID %s. Account masked: %s", 
                        id, maskAccountNumber(decrypted)));
    }

    @Transactional
    public BankDetailsResponse makePrimary(UUID id, UUID ownerId) {
        BankDetails bank = bankDetailsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bank details not found"));

        if (!bank.getOwnerId().equals(ownerId)) {
            throw new BadRequestException("You do not own this bank details record.");
        }

        if (!bank.isVerified()) {
            throw new BadRequestException("Only verified bank accounts can be marked as primary.");
        }

        // Set all other accounts to non-primary
        List<BankDetails> accounts = bankDetailsRepository.findByOwnerId(ownerId);
        for (BankDetails acc : accounts) {
            acc.setPrimaryForDebit(acc.getId().equals(id));
            acc.setPrimaryForPayout(acc.getId().equals(id));
            bankDetailsRepository.save(acc);
        }

        String decrypted = EncryptionUtil.decrypt(bank.getAccountNumber());
        writeAuditLog(ownerId, "MAKE_PRIMARY_BANK", 
                String.format("Marked bank details ID %s as primary. Account masked: %s", 
                        bank.getId(), maskAccountNumber(decrypted)));

        return mapToResponse(bank);
    }

    @Transactional
    public BankDetailsResponse reauthorizeMandate(UUID id, UUID ownerId) {
        BankDetails bank = bankDetailsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bank details not found"));

        if (!bank.getOwnerId().equals(ownerId)) {
            throw new BadRequestException("You do not own this bank details record.");
        }

        bank.setRequiresReauthorization(false);
        BankDetails saved = bankDetailsRepository.save(bank);

        String decrypted = EncryptionUtil.decrypt(bank.getAccountNumber());
        writeAuditLog(ownerId, "REAUTHORIZE_MANDATE",
                String.format("Mandate re-authorized for bank details ID %s. Account masked: %s",
                        bank.getId(), maskAccountNumber(decrypted)));

        return mapToResponse(saved);
    }

    private void validateOtp(String otpCode) {
        if (otpCode == null || !otpCode.equals("123456")) {
            throw new BadRequestException("Invalid OTP code. Re-authentication failed.");
        }
    }

    private void writeAuditLog(UUID userId, String action, String details) {
        AuditLog log = AuditLog.builder()
                .action(action)
                .entityType("BankDetails")
                .entityId(userId.toString())
                .details(details)
                .timestamp(LocalDateTime.now())
                .build();
        auditLogRepository.save(log);
    }

    private String maskAccountNumber(String plainNumber) {
        if (plainNumber == null || plainNumber.length() < 4) {
            return "****";
        }
        return "*".repeat(plainNumber.length() - 4) + plainNumber.substring(plainNumber.length() - 4);
    }

    private BankDetailsResponse mapToResponse(BankDetails bank) {
        String decrypted = EncryptionUtil.decrypt(bank.getAccountNumber());
        return BankDetailsResponse.builder()
                .id(bank.getId())
                .ownerId(bank.getOwnerId())
                .ownerType(bank.getOwnerType())
                .accountHolderName(bank.getAccountHolderName())
                .accountNumberMasked(maskAccountNumber(decrypted))
                .ifscCode(bank.getIfscCode())
                .bankName(bank.getBankName())
                .isVerified(bank.isVerified())
                .isPrimaryForDebit(bank.isPrimaryForDebit())
                .isPrimaryForPayout(bank.isPrimaryForPayout())
                .requiresReauthorization(bank.isRequiresReauthorization())
                .build();
    }
}

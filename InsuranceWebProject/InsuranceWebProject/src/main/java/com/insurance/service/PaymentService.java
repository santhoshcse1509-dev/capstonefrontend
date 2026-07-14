package com.insurance.service;

import com.insurance.dto.payment.PaymentRequest;
import com.insurance.dto.payment.PaymentResponse;
import com.insurance.dto.payment.RazorpayOrderResponse;
import com.insurance.dto.payment.RazorpayVerifyRequest;
import com.insurance.entity.*;
import com.insurance.exception.BadRequestException;
import com.insurance.exception.ResourceNotFoundException;
import com.insurance.repository.CustomerPolicyRepository;
import com.insurance.repository.PaymentRepository;
import com.insurance.repository.UserRepository;
import com.insurance.repository.PolicyStatusHistoryRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final CustomerPolicyRepository customerPolicyRepository;
    private final UserRepository userRepository;
    private final PolicyStatusHistoryRepository policyStatusHistoryRepository;
    private final CommissionService commissionService;

    @Value("${razorpay.key-id:rzp_test_dummykey123}")
    private String razorpayKeyId;

    @Value("${razorpay.key-secret:dummysecret123}")
    private String razorpayKeySecret;

    public PaymentService(PaymentRepository paymentRepository, CustomerPolicyRepository customerPolicyRepository,
                          UserRepository userRepository, PolicyStatusHistoryRepository policyStatusHistoryRepository,
                          CommissionService commissionService) {
        this.paymentRepository = paymentRepository;
        this.customerPolicyRepository = customerPolicyRepository;
        this.userRepository = userRepository;
        this.policyStatusHistoryRepository = policyStatusHistoryRepository;
        this.commissionService = commissionService;
    }

    @Transactional
    public PaymentResponse makePayment(UUID userId, PaymentRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        CustomerPolicy customerPolicy = customerPolicyRepository.findById(request.getCustomerPolicyId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer policy not found"));

        if (!customerPolicy.getUser().getId().equals(userId)) {
            throw new BadRequestException("You do not own this policy.");
        }

        // Simulate payment provider gateway logic
        String transactionId = "TXN-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase();
        String paymentMethod = request.getPaymentMethod() != null ? request.getPaymentMethod() : "STRIPE";

        return processPaymentSuccess(user, customerPolicy, request.getAmount(), paymentMethod, transactionId);
    }

    @Transactional
    public RazorpayOrderResponse createRazorpayOrder(UUID userId, UUID customerPolicyId, BigDecimal amount) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        CustomerPolicy customerPolicy = customerPolicyRepository.findById(customerPolicyId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer policy not found"));

        if (!customerPolicy.getUser().getId().equals(userId)) {
            throw new BadRequestException("You do not own this policy.");
        }

        // Amount in paise
        int amountInPaise = amount.multiply(new BigDecimal(100)).intValue();
        String orderId;
        boolean isMock = false;

        // Check if keyId is dummy/mock, or if we should run in simulation mode
        if (razorpayKeyId.startsWith("rzp_test_dummy") || razorpayKeyId.startsWith("rzp_test_mock")) {
            orderId = "order_sim_" + UUID.randomUUID().toString().substring(0, 14).replace("-", "");
            isMock = true;
        } else {
            try {
                com.razorpay.RazorpayClient client = new com.razorpay.RazorpayClient(razorpayKeyId, razorpayKeySecret);
                org.json.JSONObject orderRequest = new org.json.JSONObject();
                orderRequest.put("amount", amountInPaise);
                orderRequest.put("currency", "INR");
                orderRequest.put("receipt", customerPolicyId.toString());
                
                com.razorpay.Order order = client.orders.create(orderRequest);
                orderId = order.get("id");
            } catch (Exception e) {
                // If live API fails, fall back to simulation mode so development flows are not blocked
                org.slf4j.LoggerFactory.getLogger(PaymentService.class).warn("Razorpay API call failed: {}. Falling back to simulation mode.", e.getMessage());
                orderId = "order_sim_" + UUID.randomUUID().toString().substring(0, 14).replace("-", "");
                isMock = true;
            }
        }

        return RazorpayOrderResponse.builder()
                .keyId(razorpayKeyId)
                .orderId(orderId)
                .amount(amount)
                .amountInPaise(amountInPaise)
                .currency("INR")
                .policyNumber(customerPolicy.getPolicyNumber())
                .customerEmail(user.getEmail())
                .customerPhone(user.getPhone() != null ? user.getPhone() : "")
                .customerName(user.getFirstName() + " " + user.getLastName())
                .isMock(isMock)
                .build();
    }

    @Transactional
    public PaymentResponse verifyRazorpayPayment(UUID userId, RazorpayVerifyRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        CustomerPolicy customerPolicy = customerPolicyRepository.findById(request.getCustomerPolicyId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer policy not found"));

        if (!customerPolicy.getUser().getId().equals(userId)) {
            throw new BadRequestException("You do not own this policy.");
        }

        boolean isValid = false;
        
        // If simulation order ID or keys are mock/dummy, signature verification is simulated
        if (request.getRazorpayOrderId().startsWith("order_sim_") || razorpayKeyId.startsWith("rzp_test_dummy") || razorpayKeyId.startsWith("rzp_test_mock")) {
            isValid = true;
        } else {
            try {
                org.json.JSONObject attributes = new org.json.JSONObject();
                attributes.put("razorpay_order_id", request.getRazorpayOrderId());
                attributes.put("razorpay_payment_id", request.getRazorpayPaymentId());
                attributes.put("razorpay_signature", request.getRazorpaySignature());
                
                isValid = com.razorpay.Utils.verifyPaymentSignature(attributes, razorpayKeySecret);
            } catch (Exception e) {
                throw new BadRequestException("Razorpay signature verification failed: " + e.getMessage());
            }
        }

        if (!isValid) {
            throw new BadRequestException("Invalid payment signature.");
        }

        return processPaymentSuccess(user, customerPolicy, request.getAmount(), "RAZORPAY", request.getRazorpayPaymentId());
    }

    private PaymentResponse processPaymentSuccess(User user, CustomerPolicy customerPolicy, BigDecimal amount, String paymentMethod, String transactionId) {
        Payment payment = Payment.builder()
                .user(user)
                .customerPolicy(customerPolicy)
                .amount(amount)
                .paymentMethod(paymentMethod)
                .transactionId(transactionId)
                .status(PaymentStatus.SUCCESS)
                .paymentDate(LocalDateTime.now())
                .invoiceUrl("https://insurance-invoice-s3.s3.amazonaws.com/invoices/" + transactionId + ".pdf")
                .build();

        Payment saved = paymentRepository.save(payment);

        // Update premium paid and activate policy on the customer policy
        customerPolicy.setPremiumPaid(customerPolicy.getPremiumPaid().add(amount));
        customerPolicy.setLastPaymentDate(LocalDate.now());

        // Advance premium due date based on premium frequency
        if (customerPolicy.getPremiumDueDate() != null) {
            if ("MONTHLY".equalsIgnoreCase(customerPolicy.getPremiumFrequency())) {
                customerPolicy.setPremiumDueDate(customerPolicy.getPremiumDueDate().plusMonths(1));
            } else if ("QUARTERLY".equalsIgnoreCase(customerPolicy.getPremiumFrequency())) {
                customerPolicy.setPremiumDueDate(customerPolicy.getPremiumDueDate().plusMonths(3));
            } else {
                customerPolicy.setPremiumDueDate(customerPolicy.getPremiumDueDate().plusYears(1));
            }
        } else {
            customerPolicy.setPremiumDueDate(LocalDate.now().plusYears(1));
        }

        // Handle transition from PENDING_PAYMENT, PENDING_UNDERWRITING or GRACE_PERIOD to ACTIVE
        PolicyStatus oldStatus = customerPolicy.getStatus();
        if (oldStatus == PolicyStatus.PENDING || oldStatus == PolicyStatus.PENDING_PAYMENT
                || oldStatus == PolicyStatus.GRACE_PERIOD || oldStatus == PolicyStatus.PENDING_UNDERWRITING) {
            customerPolicy.setStatus(PolicyStatus.ACTIVE);
            
            // Log status history transition
            PolicyStatusHistory transitionLog = PolicyStatusHistory.builder()
                    .customerPolicy(customerPolicy)
                    .oldStatus(oldStatus)
                    .newStatus(PolicyStatus.ACTIVE)
                    .triggeredBy("SYSTEM")
                    .reason("Payment received. Policy marked in force.")
                    .build();
            policyStatusHistoryRepository.save(transitionLog);
        }

        customerPolicyRepository.save(customerPolicy);

        if (customerPolicy.getStatus() == PolicyStatus.ACTIVE && customerPolicy.getAgent() != null) {
            commissionService.calculateSaleCommission(customerPolicy);
        }

        return mapToPaymentResponse(saved);
    }

    public List<PaymentResponse> getMyPaymentHistory(UUID userId) {
        return paymentRepository.findByUserId(userId).stream()
                .map(this::mapToPaymentResponse)
                .collect(Collectors.toList());
    }

    public List<PaymentResponse> getAllPayments() {
        return paymentRepository.findAll().stream()
                .map(this::mapToPaymentResponse)
                .collect(Collectors.toList());
    }

    private PaymentResponse mapToPaymentResponse(Payment p) {
        return PaymentResponse.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .customerPolicyId(p.getCustomerPolicy().getId())
                .policyNumber(p.getCustomerPolicy().getPolicyNumber())
                .amount(p.getAmount())
                .paymentMethod(p.getPaymentMethod())
                .transactionId(p.getTransactionId())
                .status(p.getStatus().name())
                .paymentDate(p.getPaymentDate())
                .invoiceUrl(p.getInvoiceUrl())
                .build();
    }
}

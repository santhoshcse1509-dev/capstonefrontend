package com.insurance.service;

import com.insurance.dto.ai.ChatRequest;
import com.insurance.dto.ai.ChatResponse;
import com.insurance.entity.AIConversation;
import com.insurance.entity.AIMessage;
import com.insurance.entity.User;
import com.insurance.repository.AIConversationRepository;
import com.insurance.repository.UserRepository;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

@Service
public class AIChatService {

    private final AIConversationRepository conversationRepository;
    private final UserRepository userRepository;
    
    @Autowired(required = false)
    private ChatModel chatModel;

    public AIChatService(AIConversationRepository conversationRepository, UserRepository userRepository) {
        this.conversationRepository = conversationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ChatResponse chat(UUID userId, ChatRequest request) {
        String sessionId = request.getSessionId();
        if (sessionId == null || sessionId.trim().isEmpty()) {
            sessionId = UUID.randomUUID().toString();
        }

        User user = userRepository.findById(userId).orElse(null);
        AIConversation conversation = conversationRepository.findBySessionId(sessionId)
                .orElseGet(() -> {
                    AIConversation conv = new AIConversation();
                    conv.setUser(user);
                    conv.setSessionId(request.getSessionId());
                    conv.setMessages(new ArrayList<>());
                    return conversationRepository.save(conv);
                });

        // Save User Message
        AIMessage userMsg = new AIMessage();
        userMsg.setConversation(conversation);
        userMsg.setRole("user");
        userMsg.setContent(request.getMessage());
        userMsg.setTimestamp(LocalDateTime.now());
        conversation.getMessages().add(userMsg);

        // Generate AI response
        String aiResponseText = generateAIResponse(request.getMessage());

        // Save AI Message
        AIMessage aiMsg = new AIMessage();
        aiMsg.setConversation(conversation);
        aiMsg.setRole("assistant");
        aiMsg.setContent(aiResponseText);
        aiMsg.setTimestamp(LocalDateTime.now());
        conversation.getMessages().add(aiMsg);

        conversationRepository.save(conversation);

        return ChatResponse.builder()
                .response(aiResponseText)
                .sessionId(sessionId)
                .build();
    }

    private String generateAIResponse(String prompt) {
        if (chatModel != null) {
            try {
                return chatModel.call(prompt);
            } catch (Exception e) {
                // Fallback to rules-based simulation if OpenAI service is unavailable
                return getMockResponse(prompt);
            }
        }
        return getMockResponse(prompt);
    }

    private String getMockResponse(String prompt) {
        String lower = prompt.toLowerCase();
        if (lower.contains("explain") && lower.contains("policy")) {
            return "Sure! Insurance policies consist of coverages, premiums, deductibles, exclusions, and waiting periods. Premium is the amount you pay, coverage is the max benefit limit, and exclusions are conditions not covered by the policy.";
        } else if (lower.contains("compare")) {
            return "Comparing SecureHealth Plus and Family Shield Health:\n" +
                    "- SecureHealth Plus: Coverage 5 Lakhs, Premium 12k/year, Ideal for individuals.\n" +
                    "- Family Shield Health: Coverage 10 Lakhs, Premium 25k/year, Ideal for a family of up to 6.";
        } else if (lower.contains("best") && lower.contains("for me")) {
            return "For active individuals, we recommend our SecureHealth Plus. For families, the Family Shield Health is the most cost-effective. Tell me more about your family size and age to get a refined suggestion!";
        } else if (lower.contains("claim")) {
            return "To file a claim:\n" +
                    "1. Go to the Claims page in the dashboard.\n" +
                    "2. Click 'Submit New Claim' and select your active policy.\n" +
                    "3. Enter the claim amount, description, and upload invoices/medical reports.\n" +
                    "4. Our Claims Officer will verify your claim.";
        }
        return "Hello! I am your AI Insurance Assistant. You can ask me to explain policies, compare benefits, guide you through the claim submission process, or recommend the best plan for your needs.";
    }
}

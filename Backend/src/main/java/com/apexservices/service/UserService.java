package com.apexservices.service;

import com.apexservices.model.User;
import com.apexservices.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public Optional<User> findByIdentifier(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return Optional.empty();
        }
        return userRepository.findByIdentifier(identifier.trim());
    }

    public Optional<User> findByEmail(String email) {
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }
        return userRepository.findByEmail(email.trim().toLowerCase());
    }

    public User getByIdentifierOrThrow(String identifier) {
        return findByIdentifier(identifier)
                .orElseThrow(() -> new IllegalArgumentException("User not found for identifier: " + identifier));
    }

    public User getByEmailOrThrow(String email) {
        return findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found for email: " + email));
    }

    @Transactional
    public void updateUserEmail(String currentIdentifier, String newEmail) {
        User user = userRepository.findByEmail(currentIdentifier)
                .or(() -> userRepository.findByIdentifier(currentIdentifier))
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found."));

        user.setEmail(newEmail.trim().toLowerCase());
        userRepository.save(user);
        log.info("[USER AUDIT] User [id={}] successfully updated email address", user.getId());
    }
}

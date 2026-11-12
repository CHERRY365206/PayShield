package com.payshield.common;

import com.payshield.auth.entity.User;
import com.payshield.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        createUserIfNotExists("admin", "admin@payshield.com", "Admin@123", "PayShield Administrator", User.Role.ADMIN);
        createUserIfNotExists("customer1", "customer@payshield.com", "Customer@123", "Test Customer", User.Role.CUSTOMER);
    }

    private void createUserIfNotExists(String username, String email, String password, String fullName, User.Role role) {
        if (!userRepository.existsByEmail(email)) {
            User user = User.builder()
                .username(username)
                .email(email)
                .passwordHash(passwordEncoder.encode(password))
                .fullName(fullName)
                .role(role)
                .isActive(true)
                .build();
            userRepository.save(user);
            log.info("Initialized {} user: {}", role, email);
        }
    }
}


package com.apexservices.config;

import com.apexservices.model.AuthProvider;
import com.apexservices.model.Category;
import com.apexservices.model.Role;
import com.apexservices.model.User;
import com.apexservices.repository.CategoryRepository;
import com.apexservices.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
@Transactional
public class SecurityDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${security.seed.admin-password:admin123}")
    private String adminDefaultPassword;

    @Value("${security.seed.partner-password:partner123}")
    private String partnerDefaultPassword;

    @Value("${security.seed.customer-password:customer123}")
    private String customerDefaultPassword;

    @Override
    public void run(String... args) {
        initAdminUser();
        initPartnerUser();
        initCustomerUser();
        initDeactivatedUser();
        initMultipleCustomersAndPartners();
    }

    private void initAdminUser() {
        String adminEmail = "admin@apexservices.com";
        User admin = userRepository.findByEmail(adminEmail).orElse(null);

        if (admin == null) {
            admin = User.builder()
                    .fullName("Apex Super Administrator")
                    .email(adminEmail)
                    .mobileNumber("9999999999")
                    .password(passwordEncoder.encode(adminDefaultPassword))
                    .provider(AuthProvider.LOCAL)
                    .role(Role.ROLE_ADMIN)
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            userRepository.save(admin);
            log.info("[SECURITY AUDIT] Seeded default administrator account: {}", adminEmail);
        } else {
            // Ensure admin role and fresh active credentials
            admin.setRole(Role.ROLE_ADMIN);
            admin.setActive(true);
            admin.setPassword(passwordEncoder.encode(adminDefaultPassword));
            admin.setUpdatedAt(LocalDateTime.now());
            userRepository.save(admin);
            log.info("[SECURITY AUDIT] Verified and updated administrator account: {}", adminEmail);
        }
    }

    private void initPartnerUser() {
        String partnerEmail = "partner@apexservices.com";
        User partner = userRepository.findByEmail(partnerEmail).orElse(null);

        if (partner == null) {
            partner = User.builder()
                    .fullName("Apex Certified Partner")
                    .email(partnerEmail)
                    .mobileNumber("9123456780")
                    .password(passwordEncoder.encode(partnerDefaultPassword))
                    .provider(AuthProvider.LOCAL)
                    .role(Role.ROLE_PARTNER)
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            userRepository.save(partner);
            log.info("[SECURITY AUDIT] Seeded default trade partner account: {}", partnerEmail);
        } else {
            partner.setRole(Role.ROLE_PARTNER);
            partner.setActive(true);
            partner.setPassword(passwordEncoder.encode(partnerDefaultPassword));
            partner.setUpdatedAt(LocalDateTime.now());
            userRepository.save(partner);
            log.info("[SECURITY AUDIT] Verified and updated trade partner account: {}", partnerEmail);
        }
    }

    private void initCustomerUser() {
        String customerEmail = "customer@apexservices.com";
        User customer = userRepository.findByEmail(customerEmail).orElse(null);

        if (customer == null) {
            customer = User.builder()
                    .fullName("Apex Valued Customer")
                    .email(customerEmail)
                    .mobileNumber("9876543211")
                    .password(passwordEncoder.encode(customerDefaultPassword))
                    .provider(AuthProvider.LOCAL)
                    .role(Role.ROLE_CUSTOMER)
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            userRepository.save(customer);
            log.info("[SECURITY AUDIT] Seeded default customer account: {}", customerEmail);
        } else {
            customer.setRole(Role.ROLE_CUSTOMER);
            customer.setActive(true);
            customer.setPassword(passwordEncoder.encode(customerDefaultPassword));
            customer.setUpdatedAt(LocalDateTime.now());
            userRepository.save(customer);
            log.info("[SECURITY AUDIT] Verified and updated customer account: {}", customerEmail);
        }
    }

    private void initDeactivatedUser() {
        String deactEmail = "deactivated@apexservices.com";
        User deactUser = userRepository.findByEmail(deactEmail).orElse(null);

        if (deactUser == null) {
            deactUser = User.builder()
                    .fullName("Deactivated Account")
                    .email(deactEmail)
                    .mobileNumber("9000000000")
                    .password(passwordEncoder.encode("password123"))
                    .provider(AuthProvider.LOCAL)
                    .role(Role.ROLE_CUSTOMER)
                    .active(false)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            userRepository.save(deactUser);
            log.info("[SECURITY AUDIT] Seeded deactivated test account: {}", deactEmail);
        } else {
            deactUser.setActive(false);
            deactUser.setPassword(passwordEncoder.encode("password123"));
            deactUser.setUpdatedAt(LocalDateTime.now());
            userRepository.save(deactUser);
            log.info("[SECURITY AUDIT] Verified and updated deactivated test account: {}", deactEmail);
        }
    }

    private void initMultipleCustomersAndPartners() {
        // Ensure default partner has Custom Carpentry
        Category carpentry = categoryRepository.findByNameIgnoreCase("Custom Carpentry").orElse(null);
        Category plumbing = categoryRepository.findByNameIgnoreCase("Emergency Plumbing").orElse(null);
        Category electrical = categoryRepository.findByNameIgnoreCase("Electrical Maintenance").orElse(null);
        Category painting = categoryRepository.findByNameIgnoreCase("Painting & Decor").orElse(null);

        User defaultPartner = userRepository.findByEmail("partner@apexservices.com").orElse(null);
        if (defaultPartner != null && carpentry != null && (defaultPartner.getServiceCategories() == null || defaultPartner.getServiceCategories().isEmpty())) {
            defaultPartner.getServiceCategories().add(carpentry);
            userRepository.save(defaultPartner);
            log.info("[DISPATCH SEED] Assigned 'Custom Carpentry' to default partner {}", defaultPartner.getEmail());
        }

        // Additional Real Customers
        seedCustomer("Ananya Sharma", "ananya@apexservices.com", "9811122233");
        seedCustomer("Rohan Verma", "rohan@apexservices.com", "9822233344");
        seedCustomer("Pooja Mehta", "pooja@apexservices.com", "9833344455");

        // Specific Trade Partners
        seedPartnerWithCategory("Rajesh Sharma", "rajesh.carpenter@apexservices.com", "9823411200", carpentry);
        seedPartnerWithCategory("Vikram Patel", "vikram.plumber@apexservices.com", "9823411201", plumbing);
        seedPartnerWithCategory("Amit Verma", "amit.electrician@apexservices.com", "9823411202", electrical);
        seedPartnerWithCategory("Sunita Rao", "sunita.painting@apexservices.com", "9823411203", painting);
    }

    private void seedCustomer(String name, String email, String phone) {
        if (userRepository.findByEmail(email).isEmpty()) {
            User c = User.builder()
                    .fullName(name)
                    .email(email)
                    .mobileNumber(phone)
                    .password(passwordEncoder.encode(customerDefaultPassword))
                    .provider(AuthProvider.LOCAL)
                    .role(Role.ROLE_CUSTOMER)
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            userRepository.save(c);
            log.info("[DISPATCH SEED] Created customer account: {}", email);
        }
    }

    private void seedPartnerWithCategory(String name, String email, String phone, Category category) {
        User p = userRepository.findByEmail(email).orElse(null);
        if (p == null) {
            p = User.builder()
                    .fullName(name)
                    .email(email)
                    .mobileNumber(phone)
                    .password(passwordEncoder.encode(partnerDefaultPassword))
                    .provider(AuthProvider.LOCAL)
                    .role(Role.ROLE_PARTNER)
                    .active(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            if (category != null) {
                p.getServiceCategories().add(category);
            }
            userRepository.save(p);
            log.info("[DISPATCH SEED] Created partner account {} with category: {}", email, category != null ? category.getName() : "None");
        } else if (category != null && (p.getServiceCategories() == null || p.getServiceCategories().isEmpty())) {
            p.getServiceCategories().add(category);
            userRepository.save(p);
        }
    }
}

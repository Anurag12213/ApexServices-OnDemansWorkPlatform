package com.apexservices.config;

import com.apexservices.security.CustomUserDetailsService;
import com.apexservices.security.DelegatedAccessDeniedHandler;
import com.apexservices.security.DelegatedAuthenticationEntryPoint;
import com.apexservices.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;
    private final DelegatedAuthenticationEntryPoint authEntryPoint;
    private final DelegatedAccessDeniedHandler accessDeniedHandler;

    @Value("${cors.allowed-origins:http://localhost:5173,http://localhost:5174,http://localhost:5175,https://apexservices.com,https://www.apexservices.com}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .headers(headers -> headers
                .httpStrictTransportSecurity(hsts -> hsts
                    .includeSubDomains(true)
                    .maxAgeInSeconds(31536000)
                    .preload(true)
                )
                .frameOptions(frame -> frame.sameOrigin())
                .contentTypeOptions(Customizer.withDefaults())
            )
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(authEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            )
            .authorizeHttpRequests(auth -> auth
                // 1. CORS Preflight
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // 2. Specific authenticated endpoint inside auth
                .requestMatchers("/api/auth/me").authenticated()

                // 3. Public Authentication Endpoints & Error Controller
                .requestMatchers("/api/auth/**", "/error").permitAll()

                // WebSocket Handshake & Fallback
                .requestMatchers("/ws/**").permitAll()

                // Partner Dispatch & Verification Operations
                .requestMatchers(HttpMethod.GET, "/api/work-requests/partner-feed").hasAnyRole("PARTNER", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/work-requests/*/claim").hasAnyRole("PARTNER", "ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/work-requests/*/reject").hasAnyRole("PARTNER", "ADMIN")
                .requestMatchers("/api/partners/**").hasAnyRole("PARTNER", "ADMIN")

                // Public Read Operations (Catalog, Slides, Reviews, Branding, Avatars, Presentation Data, Completion OTP)
                .requestMatchers(HttpMethod.GET, "/api/data", "/api/settings").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/public/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/categories/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/icons/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/slides/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/reviews/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/work-requests/**").permitAll()

                // Public Work Request Submission, Cancellation, Stage Sync, Completion, Settlement & Review
                .requestMatchers(HttpMethod.POST, "/api/work-requests").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/work-requests/*/cancel").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/work-requests/*/advance-stage").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/work-requests/*/verify-completion").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/work-requests/*/pay").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/work-requests/*/review").permitAll()

                // Actuator Security (Only health and info are public; metrics/env require ADMIN)
                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                .requestMatchers("/actuator/**").hasRole("ADMIN")

                // 8. Strict Admin-Exclusive Endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/categories/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/categories/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/categories/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/categories/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/icons/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/slides/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/slides/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/slides/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/ai-owner/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/announcement/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/reviews/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/reviews/**").hasRole("ADMIN")

                // 9. All remaining requests require valid authentication
                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Support configurable HTTPS live domains and explicit local development ports
        List<String> origins = java.util.Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(java.util.stream.Collectors.toList());

        for (String origin : origins) {
            configuration.addAllowedOrigin(origin);
        }

        // Strict domain patterns for production subdomains
        configuration.setAllowedOriginPatterns(List.of(
            "https://*.apexservices.com",
            "https://apexservices.com"
        ));

        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of(
            "Authorization", 
            "Content-Type", 
            "Accept", 
            "X-Requested-With", 
            "Origin", 
            "Access-Control-Request-Method", 
            "Access-Control-Request-Headers"
        ));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}

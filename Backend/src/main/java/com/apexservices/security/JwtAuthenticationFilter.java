package com.apexservices.security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final TokenBlacklistService tokenBlacklistService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // Allow requests without Bearer token to continue to the filter chain (for public endpoints)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7).trim();

        if (jwt.isEmpty() || jwt.equalsIgnoreCase("undefined") || jwt.equalsIgnoreCase("null")) {
            filterChain.doFilter(request, response);
            return;
        }

        if (tokenBlacklistService.isRevoked(jwt)) {
            log.warn("[SECURITY AUDIT] Blocked request with revoked JWT token from IP: {} on URI: {}",
                    request.getRemoteAddr(), request.getRequestURI());
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String userIdentifier = jwtService.extractUsername(jwt);

            // Avoid overwriting an existing authentication context
            if (userIdentifier != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userIdentifier);

                if (jwtService.isTokenValid(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } else {
                    log.warn("[SECURITY AUDIT] Token invalid or account disabled for user identifier: {}", userIdentifier);
                }
            }
        } catch (ExpiredJwtException e) {
            log.warn("[SECURITY AUDIT] Expired JWT token presented on URI: {} from IP: {}", request.getRequestURI(), request.getRemoteAddr());
        } catch (MalformedJwtException | SignatureException e) {
            log.warn("[SECURITY AUDIT] Malformed or tampered JWT token presented on URI: {} from IP: {}", request.getRequestURI(), request.getRemoteAddr());
        } catch (Exception e) {
            log.warn("[SECURITY AUDIT] Authentication filter failed to process token: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}

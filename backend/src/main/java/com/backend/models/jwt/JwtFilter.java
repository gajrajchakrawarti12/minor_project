package com.backend.models.jwt;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.backend.models.users.UserService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JWTService jwtService;

    @Autowired
    private UserService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        Cookie[] authCookie = request.getCookies();
        if (authCookie != null) {
            for (Cookie cookie : authCookie) {
                if ("token".equals(cookie.getName())) {
                    String token = cookie.getValue();
                    if (jwtService.validateToken(token)) {
                        String username = jwtService.extractUsername(token);
                        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                        request.setAttribute("userDetails", userDetails);
                        if (SecurityContextHolder.getContext().getAuthentication() == null) {
                            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                    userDetails, null, userDetails.getAuthorities());
                            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        }
                    } else {
                        // Optionally clear invalid token cookie
                        Cookie clearCookie = new Cookie("token", null);
                        clearCookie.setHttpOnly(true);
                        clearCookie.setSecure(true); // set false only for local HTTP dev
                        clearCookie.setPath("/login");
                        clearCookie.setMaxAge(0);
                        response.addCookie(clearCookie);
                        SecurityContextHolder.clearContext();
                    }
                } else {
                    // No token cookie found, optionally clear any existing auth context
                    SecurityContextHolder.clearContext();
                }
            }
        } else {
            // No cookies at all, clear any existing auth context
            SecurityContextHolder.clearContext();
        }
        filterChain.doFilter(request, response);
    }
}

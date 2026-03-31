package com.backend.models.users;

import org.springframework.beans.factory.annotation.Autowired;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import org.springframework.stereotype.Service;

import com.backend.exceptions.InvalidCredentialException;
import com.backend.exceptions.UserAlreadyExistsException;
import com.backend.models.jwt.JWTService;

@Service
public class UserService implements UserDetailsService{
    
    @Autowired
    UserRepository userRepository;

    @Autowired
    JWTService jwtService;

    // Method to load user details by username for authentication
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UserEntity userEntity = userRepository.findByUsername(username);
        if (userEntity == null) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }
        
        return new UserRequestModel(userEntity.getUsername(), userEntity.getPassword());
    }

    // Method to save a new user
    public UserResponseModel saveUser(UserRequestModel user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new UserAlreadyExistsException("Username already exists");   
        }
        UserEntity userEntity = new UserEntity();
        userEntity.setUsername(user.getUsername());
        userEntity.setPassword(user.getPassword());
        try {
            userRepository.save(userEntity);
        } catch (Exception e) {
            throw new UserAlreadyExistsException("Error saving user: " + e.getMessage());
        }
        return new UserResponseModel(userEntity.getUsername());
    }

    // Method to verify user credentials and generate JWT token
    public String verifyUser(UserRequestModel user, AuthenticationManager authenticationManager) {
        Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(user.getUsername(), user.getPassword()));
        if (authentication.isAuthenticated()) {
            return jwtService.generateToken(user.getUsername());
        } else {
            throw new InvalidCredentialException("Invalid username or password");
        }
    }

}

package com.technonexus.app.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.technonexus.app.data.remote.SupabaseManager
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.user.UserInfo
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class AuthViewModel : ViewModel() {
    private val _currentUser = MutableStateFlow<UserInfo?>(null)
    val currentUser: StateFlow<UserInfo?> = _currentUser

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    init {
        _currentUser.value = SupabaseManager.client.auth.currentUserOrNull()
    }

    fun login(emailString: String, passwordString: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                SupabaseManager.client.auth.signInWith(Email) {
                    email = emailString
                    password = passwordString
                }
                _currentUser.value = SupabaseManager.client.auth.currentUserOrNull()
            } catch (e: Exception) {
                _error.value = e.message ?: "Login failed"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun signUp(emailString: String, passwordString: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                SupabaseManager.client.auth.signUpWith(Email) {
                    email = emailString
                    password = passwordString
                }
                _error.value = "Check your email for confirmation"
            } catch (e: Exception) {
                _error.value = e.message ?: "Signup failed"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            SupabaseManager.client.auth.signOut()
            _currentUser.value = null
        }
    }
}

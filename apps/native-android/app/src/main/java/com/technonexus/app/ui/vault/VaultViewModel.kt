package com.technonexus.app.ui.vault

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.technonexus.app.data.model.UserGame
import com.technonexus.app.data.remote.SupabaseManager
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class VaultViewModel : ViewModel() {
    private val _savedGames = MutableStateFlow<List<UserGame>>(emptyList())
    val savedGames: StateFlow<List<UserGame>> = _savedGames

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    fun fetchVault() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val games = SupabaseManager.client.postgrest.from("user_games")
                    .select()
                    .decodeList<UserGame>()
                println("NEXUS_DEBUG: Fetched ${games.size} games from Vault")
                _savedGames.value = games.sortedByDescending { it.created_at }
            } catch (e: Exception) {
                println("NEXUS_DEBUG: Error fetching vault: ${e.message}")
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun deleteGame(gameId: Long) {
        viewModelScope.launch {
            try {
                SupabaseManager.client.postgrest.from("user_games")
                    .delete {
                        filter {
                            eq("id", gameId)
                        }
                    }
                fetchVault()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }
}

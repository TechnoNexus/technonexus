package com.technonexus.app.ui.forge

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.technonexus.app.data.model.CustomGame
import com.technonexus.app.data.model.UserGame
import com.technonexus.app.data.remote.NexusApiService
import com.technonexus.app.data.remote.SupabaseManager
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class ForgeViewModel : ViewModel() {
    private val _generatedGame = MutableStateFlow<CustomGame?>(null)
    val generatedGame: StateFlow<CustomGame?> = _generatedGame

    private val _isGenerating = MutableStateFlow(false)
    val isGenerating: StateFlow<Boolean> = _isGenerating

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    fun generateGame(prompt: String, language: String) {
        viewModelScope.launch {
            _isGenerating.value = true
            _error.value = null
            try {
                val game = NexusApiService.generateGame(prompt, language)
                if (game != null) {
                    _generatedGame.value = game
                    saveToVault(game)
                } else {
                    _error.value = "AI failed to forge mission."
                }
            } catch (e: Exception) {
                _error.value = e.message
            } finally {
                _isGenerating.value = false
            }
        }
    }

    private suspend fun saveToVault(game: CustomGame) {
        val user = SupabaseManager.client.auth.currentUserOrNull()
        if (user != null) {
            val userGame = UserGame(
                user_id = user.id,
                game_title = game.gameTitle,
                config_json = game
            )
            try {
                println("NEXUS_DEBUG: Attempting to save game '${game.gameTitle}' to Vault for user ${user.id}")
                SupabaseManager.client.postgrest.from("user_games").insert(userGame)
                println("NEXUS_DEBUG: Save successful")
            } catch (e: Exception) {
                println("NEXUS_DEBUG: Save FAILED: ${e.message}")
                e.printStackTrace()
            }
        } else {
            println("NEXUS_DEBUG: Save skipped - no user logged in")
        }
    }
}

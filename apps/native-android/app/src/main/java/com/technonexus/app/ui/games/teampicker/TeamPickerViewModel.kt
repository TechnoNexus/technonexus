package com.technonexus.app.ui.games.teampicker

import androidx.lifecycle.ViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

data class Team(val id: Int, val name: String, val members: List<String>)

class TeamPickerViewModel : ViewModel() {
    private val _players = MutableStateFlow<List<String>>(emptyList())
    val players: StateFlow<List<String>> = _players

    private val _teams = MutableStateFlow<List<Team>>(emptyList())
    val teams: StateFlow<List<Team>> = _teams

    fun addPlayer(name: String) {
        if (name.isBlank()) return
        _players.value = _players.value + name
    }

    fun removePlayer(name: String) {
        _players.value = _players.value - name
    }

    fun generateTeams(count: Int) {
        val shuffled = _players.value.shuffled()
        val result = mutableListOf<Team>()
        
        for (i in 0 until count) {
            result.add(Team(i + 1, "TEAM ${i + 1}", mutableListOf()))
        }

        shuffled.forEachIndexed { index, player ->
            val teamIndex = index % count
            val team = result[teamIndex]
            result[teamIndex] = team.copy(members = team.members + player)
        }

        _teams.value = result
    }

    fun reset() {
        _teams.value = emptyList()
    }
}

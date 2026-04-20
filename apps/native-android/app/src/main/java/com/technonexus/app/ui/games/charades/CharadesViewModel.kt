package com.technonexus.app.ui.games.charades

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class CharadesViewModel : ViewModel() {
    private val movies = listOf(
        "Inception", "Interstellar", "The Dark Knight", "The Godfather", 
        "Pulp Fiction", "The Matrix", "Fight Club", "Forrest Gump"
    )

    private val _currentMovie = MutableStateFlow(movies.random())
    val currentMovie: StateFlow<String> = _currentMovie

    private val _timer = MutableStateFlow(60)
    val timer: StateFlow<Int> = _timer

    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying

    private var timerJob: Job? = null

    fun nextMovie() {
        _currentMovie.value = movies.random()
        resetTimer()
    }

    fun startTimer() {
        if (_isPlaying.value) return
        _isPlaying.value = true
        timerJob = viewModelScope.launch {
            while (_timer.value > 0) {
                delay(1000)
                _timer.value -= 1
            }
            _isPlaying.value = false
        }
    }

    fun resetTimer() {
        timerJob?.cancel()
        _timer.value = 60
        _isPlaying.value = false
    }
}

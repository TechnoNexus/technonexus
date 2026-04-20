package com.technonexus.app.data.model

import kotlinx.serialization.Serializable

@Serializable
data class CustomGame(
    val gameTitle: String,
    val instructions: String,
    val gameType: String,
    val timeLimitSeconds: Int,
    val gameContent: List<String>? = null,
    val inputType: String? = "text",
    val language: String? = "English"
)

@Serializable
data class UserGame(
    val id: Long? = null,
    val user_id: String,
    val game_title: String,
    val config_json: CustomGame,
    val created_at: String? = null
)

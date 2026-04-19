package com.technonexus.app.data.remote

import io.ktor.client.*
import io.ktor.client.engine.android.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json
import com.technonexus.app.data.model.CustomGame

object NexusApiService {
    private const val BASE_URL = "https://technonexus.ca"
    
    private val client = HttpClient(Android) {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                prettyPrint = true
                isLenient = true
            })
        }
    }

    suspend fun generateGame(prompt: String, language: String): CustomGame? {
        return try {
            val response = client.post("$BASE_URL/api/generate-game") {
                contentType(ContentType.Application.Json)
                setBody(mapOf("prompt" to prompt, "language" to language))
            }
            if (response.status == HttpStatusCode.OK) {
                Json.decodeFromString<CustomGame>(response.bodyAsText())
            } else {
                null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }
}

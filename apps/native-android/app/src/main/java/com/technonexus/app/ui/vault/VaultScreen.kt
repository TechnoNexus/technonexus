package com.technonexus.app.ui.vault

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.technonexus.app.ui.theme.*
import com.technonexus.app.ui.components.NexusCard

@Composable
fun VaultScreen(viewModel: VaultViewModel, onBack: () -> Unit) {
    val games by viewModel.savedGames.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.fetchVault()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBg)
            .padding(24.dp)
            .padding(top = 48.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextButton(onClick = onBack) {
                Text("← BACK", color = NeonCyan, style = MaterialTheme.typography.labelSmall)
            }
            Text("NEXUS VAULT", style = MaterialTheme.typography.labelSmall, color = ElectricViolet)
        }

        Spacer(modifier = Modifier.height(24.dp))

        if (isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = NeonCyan)
            }
        } else if (games.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("NO MISSIONS SAVED", color = SlateGray, style = MaterialTheme.typography.bodyMedium)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                items(games) { game ->
                    NexusCard(borderColor = ElectricViolet.copy(alpha = 0.2f)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(game.game_title, style = MaterialTheme.typography.titleMedium, color = Color.White)
                                Text(game.config_json.gameType, style = MaterialTheme.typography.labelSmall, color = ElectricViolet, fontSize = 8.sp)
                            }
                            
                            IconButton(onClick = { game.id?.let { viewModel.deleteGame(it) } }) {
                                Text("🗑️", fontSize = 16.sp) // Simple delete icon
                            }
                        }
                    }
                }
            }
        }
    }
}

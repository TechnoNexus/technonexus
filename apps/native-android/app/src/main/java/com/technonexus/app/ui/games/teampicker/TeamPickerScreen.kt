package com.technonexus.app.ui.games.teampicker

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.technonexus.app.ui.theme.*
import com.technonexus.app.ui.components.NexusCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TeamPickerScreen(viewModel: TeamPickerViewModel, onBack: () -> Unit) {
    var playerName by remember { mutableStateOf("") }
    val players by viewModel.players.collectAsState()
    val teams by viewModel.teams.collectAsState()

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
                Text("← EXIT", color = Color.White.copy(alpha = 0.5f), style = MaterialTheme.typography.labelSmall)
            }
            Text("TEAM PICKER", style = MaterialTheme.typography.labelSmall, color = ElectricViolet)
        }

        Spacer(modifier = Modifier.height(24.dp))

        if (teams.isEmpty()) {
            // Setup Mode
            OutlinedTextField(
                value = playerName,
                onValueChange = { playerName = it },
                label = { Text("Enter Player Name", color = SlateGray) },
                modifier = Modifier.fillMaxWidth(),
                colors = TextFieldDefaults.outlinedTextFieldColors(
                    focusedBorderColor = ElectricViolet,
                    unfocusedBorderColor = GlassWhite
                ),
                shape = RoundedCornerShape(16.dp)
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Button(
                onClick = { 
                    viewModel.addPlayer(playerName)
                    playerName = ""
                },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                colors = ButtonDefaults.buttonColors(containerColor = ElectricViolet),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text("ADD TO SQUAD", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Black)
            }

            Spacer(modifier = Modifier.height(32.dp))

            Text("CURRENT SQUAD (${players.size})", style = MaterialTheme.typography.labelSmall, color = SlateGray)
            
            LazyColumn(modifier = Modifier.weight(1f).padding(vertical = 16.dp)) {
                items(players) { player ->
                    NexusCard(borderColor = ElectricViolet.copy(alpha = 0.1f), modifier = Modifier.padding(bottom = 8.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(player, color = Color.White)
                            IconButton(onClick = { viewModel.removePlayer(player) }, modifier = Modifier.size(24.dp)) {
                                Text("✕", color = Color.Red, fontSize = 12.sp)
                            }
                        }
                    }
                }
            }

            Button(
                onClick = { viewModel.generateTeams(2) },
                modifier = Modifier.fillMaxWidth().height(64.dp),
                colors = ButtonDefaults.buttonColors(containerColor = NeonCyan),
                shape = RoundedCornerShape(16.dp),
                enabled = players.size >= 2
            ) {
                Text("GENERATE 2 TEAMS", style = MaterialTheme.typography.labelSmall, color = DeepBlack, fontWeight = FontWeight.Black)
            }
        } else {
            // Results Mode
            Text("TEAMS ASSIGNED", style = MaterialTheme.typography.displayLarge, color = Color.White, fontSize = 32.sp)
            
            Spacer(modifier = Modifier.height(24.dp))

            LazyColumn(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                items(teams) { team ->
                    NexusCard(borderColor = if (team.id == 1) NeonCyan else ElectricViolet) {
                        Column {
                            Text(team.name, style = MaterialTheme.typography.titleMedium, color = if (team.id == 1) NeonCyan else ElectricViolet)
                            Spacer(modifier = Modifier.height(8.dp))
                            team.members.forEach { member ->
                                Text("• $member", color = Color.White, style = MaterialTheme.typography.bodyMedium)
                            }
                        }
                    }
                }
            }

            Button(
                onClick = { viewModel.reset() },
                modifier = Modifier.fillMaxWidth().height(64.dp),
                colors = ButtonDefaults.buttonColors(containerColor = GlassWhite),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text("START OVER", style = MaterialTheme.typography.labelSmall, color = Color.White)
            }
        }
    }
}

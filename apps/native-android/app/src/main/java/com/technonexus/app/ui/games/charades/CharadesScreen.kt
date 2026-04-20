package com.technonexus.app.ui.games.charades

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.technonexus.app.ui.theme.*
import com.technonexus.app.ui.components.NexusCard

@Composable
fun CharadesScreen(viewModel: CharadesViewModel, onBack: () -> Unit) {
    val currentMovie by viewModel.currentMovie.collectAsState()
    val timer by viewModel.timer.collectAsState()
    val isPlaying by viewModel.isPlaying.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBg)
            .padding(24.dp)
            .padding(top = 48.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            TextButton(onClick = onBack) {
                Text("← QUIT", color = Color.Red.copy(alpha = 0.5f), style = MaterialTheme.typography.labelSmall)
            }
            Text("DUMB CHARADES", style = MaterialTheme.typography.labelSmall, color = NeonCyan)
        }

        Spacer(modifier = Modifier.height(48.dp))

        Text(
            text = String.format("%02d", timer),
            style = MaterialTheme.typography.displayLarge,
            color = if (timer < 10) Color.Red else Color.White,
            fontSize = 80.sp
        )

        Spacer(modifier = Modifier.height(48.dp))

        NexusCard(borderColor = NeonCyan.copy(alpha = 0.3f), modifier = Modifier.fillMaxWidth()) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "ACT THIS MOVIE",
                    style = MaterialTheme.typography.labelSmall,
                    color = SlateGray
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = currentMovie.uppercase(),
                    style = MaterialTheme.typography.displayLarge,
                    color = NeonCyan,
                    fontSize = 32.sp,
                    textAlign = TextAlign.Center
                )
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            Button(
                onClick = { viewModel.nextMovie() },
                modifier = Modifier.weight(1f).height(64.dp),
                colors = ButtonDefaults.buttonColors(containerColor = GlassWhite),
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color.White.copy(alpha = 0.1f))
            ) {
                Text("SKIP", color = Color.White, style = MaterialTheme.typography.labelSmall)
            }

            Button(
                onClick = { if (isPlaying) viewModel.resetTimer() else viewModel.startTimer() },
                modifier = Modifier.weight(1f).height(64.dp),
                colors = ButtonDefaults.buttonColors(containerColor = if (isPlaying) Color.Red.copy(alpha = 0.2f) else NeonCyan),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text(
                    text = if (isPlaying) "STOP" else "START TIMER",
                    color = if (isPlaying) Color.Red else DeepBlack,
                    style = MaterialTheme.typography.labelSmall,
                    fontWeight = FontWeight.Black
                )
            }
        }
        
        Spacer(modifier = Modifier.height(32.dp))
    }
}

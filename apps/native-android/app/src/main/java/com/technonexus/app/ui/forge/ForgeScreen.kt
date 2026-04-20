package com.technonexus.app.ui.forge

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ForgeScreen(viewModel: ForgeViewModel, onBack: () -> Unit) {
    var prompt by remember { mutableStateOf("") }
    var language by remember { mutableStateOf("English") }
    
    val isGenerating by viewModel.isGenerating.collectAsState()
    val generatedGame by viewModel.generatedGame.collectAsState()
    val error by viewModel.error.collectAsState()

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
                Text("← CANCEL", color = Color.White.copy(alpha = 0.5f), style = MaterialTheme.typography.labelSmall)
            }
            Text("AI FORGE", style = MaterialTheme.typography.labelSmall, color = NeonCyan)
        }

        Spacer(modifier = Modifier.height(24.dp))

        Text(
            text = "FORGE CUSTOM MISSION",
            style = MaterialTheme.typography.displayLarge,
            color = Color.White,
            fontSize = 32.sp
        )

        Spacer(modifier = Modifier.height(32.dp))

        OutlinedTextField(
            value = prompt,
            onValueChange = { prompt = it },
            label = { Text("What should the game be about?", color = SlateGray) },
            modifier = Modifier.fillMaxWidth().height(120.dp),
            colors = TextFieldDefaults.outlinedTextFieldColors(
                focusedBorderColor = NeonCyan,
                unfocusedBorderColor = Color.White.opacity(0.1f)
            ),
            shape = RoundedCornerShape(16.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text("Select Language", style = MaterialTheme.typography.labelSmall, color = SlateGray)
        Row(modifier = Modifier.padding(vertical = 8.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            listOf("English", "Hindi", "Hinglish").forEach { lang ->
                FilterChip(
                    selected = language == lang,
                    onClick = { language = lang },
                    label = { Text(lang, style = MaterialTheme.typography.labelSmall) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = NeonCyan,
                        selectedLabelColor = DeepBlack
                    )
                )
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        if (error != null) {
            Text(text = error!!, color = Color.Red, fontSize = 12.sp)
        }

        if (generatedGame != null) {
            Text(text = "MISSION FORGED: ${generatedGame!!.gameTitle}", color = NeonCyan, fontWeight = FontWeight.Black)
            Text(text = "Saved to your Nexus Vault.", color = SlateGray, fontSize = 12.sp)
        }

        Spacer(modifier = Modifier.weight(1f))

        Button(
            onClick = { viewModel.generateGame(prompt, language) },
            modifier = Modifier.fillMaxWidth().height(72.dp),
            colors = ButtonDefaults.buttonColors(containerColor = NeonCyan),
            shape = RoundedCornerShape(24.dp),
            enabled = !isGenerating && prompt.isNotEmpty()
        ) {
            if (isGenerating) {
                CircularProgressIndicator(color = DeepBlack, modifier = Modifier.size(24.dp))
            } else {
                Text("START GENERATION", style = MaterialTheme.typography.labelSmall, color = DeepBlack, fontWeight = FontWeight.Black)
            }
        }
    }
}

private val Color.Companion.White: Color get() = Color(0xFFFFFFFF)
private fun Color.opacity(alpha: Float): Color = this.copy(alpha = alpha)

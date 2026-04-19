package com.technonexus.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.technonexus.app.ui.theme.*
import com.technonexus.app.ui.components.NexusCard
import com.technonexus.app.ui.auth.AuthViewModel
import com.technonexus.app.ui.auth.LoginScreen
import com.technonexus.app.ui.vault.VaultViewModel
import com.technonexus.app.ui.vault.VaultScreen
import com.technonexus.app.ui.forge.ForgeViewModel
import com.technonexus.app.ui.forge.ForgeScreen
import com.technonexus.app.ui.games.charades.CharadesViewModel
import com.technonexus.app.ui.games.charades.CharadesScreen
import com.technonexus.app.ui.games.teampicker.TeamPickerViewModel
import com.technonexus.app.ui.games.teampicker.TeamPickerScreen
import io.github.jan.supabase.auth.user.UserInfo

class MainActivity : ComponentActivity() {
    private val authViewModel: AuthViewModel by viewModels()
    private val vaultViewModel: VaultViewModel by viewModels()
    private val forgeViewModel: ForgeViewModel by viewModels()
    private val charadesViewModel: CharadesViewModel by viewModels()
    private val teamPickerViewModel: TeamPickerViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            NexusTheme {
                val userState = authViewModel.currentUser.collectAsStateWithLifecycle()
                val user: UserInfo? = userState.value
                var currentScreen by remember { mutableStateOf("dashboard") }
                
                if (user == null) {
                    LoginScreen(authViewModel)
                } else {
                    when (currentScreen) {
                        "dashboard" -> DashboardScreen(
                            authViewModel = authViewModel,
                            onOpenVault = { currentScreen = "vault" },
                            onOpenForge = { currentScreen = "forge" },
                            onOpenCharades = { currentScreen = "charades" },
                            onOpenTeamPicker = { currentScreen = "teampicker" }
                        )
                        "vault" -> VaultScreen(
                            viewModel = vaultViewModel,
                            onBack = { currentScreen = "dashboard" }
                        )
                        "forge" -> ForgeScreen(
                            viewModel = forgeViewModel,
                            onBack = { currentScreen = "dashboard" }
                        )
                        "charades" -> CharadesScreen(
                            viewModel = charadesViewModel,
                            onBack = { currentScreen = "dashboard" }
                        )
                        "teampicker" -> TeamPickerScreen(
                            viewModel = teamPickerViewModel,
                            onBack = { currentScreen = "dashboard" }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun DashboardScreen(
    authViewModel: AuthViewModel, 
    onOpenVault: () -> Unit, 
    onOpenForge: () -> Unit,
    onOpenCharades: () -> Unit,
    onOpenTeamPicker: () -> Unit
) {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBg)
            .verticalScroll(scrollState)
            .padding(24.dp)
            .padding(top = 48.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "NEXUS DASHBOARD",
                style = MaterialTheme.typography.labelSmall,
                color = NeonCyan
            )
            
            TextButton(onClick = { authViewModel.logout() }) {
                Text("LOGOUT", style = MaterialTheme.typography.labelSmall, color = Color.Red.copy(alpha = 0.6f))
            }
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "TECHNO",
                style = MaterialTheme.typography.displayLarge,
                color = Color.White
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "NEXUS",
                style = MaterialTheme.typography.displayLarge,
                color = NeonCyan
            )
        }

        Spacer(modifier = Modifier.height(48.dp))

        NexusModule(
            title = "NEXUS AI FORGE",
            description = "Generate custom missions using Gemini 2.5 Flash.",
            accentColor = NeonCyan,
            status = "NEW",
            onClick = onOpenForge
        )

        Spacer(modifier = Modifier.height(24.dp))

        NexusModule(
            title = "NEXUS VAULT",
            description = "Your collection of saved missions and scripts.",
            accentColor = ElectricViolet,
            status = "SYNCED",
            onClick = onOpenVault
        )

        Spacer(modifier = Modifier.height(24.dp))

        Text("NEXUS ARCADE", style = MaterialTheme.typography.labelSmall, color = SlateGray)
        Spacer(modifier = Modifier.height(16.dp))

        NexusModule(
            title = "DUMB CHARADES",
            description = "Classic movie acting game with a native timer.",
            accentColor = Color(0xFFFACC15),
            status = "LIVE",
            onClick = onOpenCharades
        )

        Spacer(modifier = Modifier.height(16.dp))

        NexusModule(
            title = "TEAM PICKER",
            description = "Quickly split players into balanced squads.",
            accentColor = Color(0xFFF87171),
            status = "TOOL",
            onClick = onOpenTeamPicker
        )
        
        Spacer(modifier = Modifier.height(100.dp))
    }
}

@Composable
fun NexusModule(
    title: String,
    description: String,
    accentColor: Color,
    status: String,
    onClick: () -> Unit = {}
) {
    NexusCard(borderColor = accentColor.copy(alpha = 0.3f)) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    color = Color.White
                )
                Surface(
                    color = accentColor.copy(alpha = 0.1f),
                    shape = RoundedCornerShape(8.dp),
                    border = androidx.compose.foundation.BorderStroke(1.dp, accentColor.copy(alpha = 0.2f))
                ) {
                    Text(
                        text = status,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = accentColor,
                        fontSize = 8.sp
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium,
                color = SlateGray
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Button(
                onClick = onClick,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = accentColor.copy(alpha = 0.1f)),
                border = androidx.compose.foundation.BorderStroke(1.dp, accentColor.copy(alpha = 0.3f)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text(
                    text = "ENTER MODULE",
                    style = MaterialTheme.typography.labelSmall,
                    color = accentColor
                )
            }
        }
    }
}

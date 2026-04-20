package com.technonexus.app.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.technonexus.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(viewModel: AuthViewModel) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var isSignUp by remember { mutableStateOf(false) }

    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBg)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = if (isSignUp) "NEXUS REGISTRATION" else "NEXUS AUTH",
            style = MaterialTheme.typography.labelSmall,
            color = NeonCyan
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "TECHNO",
            style = MaterialTheme.typography.displayLarge,
            color = Color.White,
            fontSize = 48.sp
        )
        Text(
            text = "NEXUS",
            style = MaterialTheme.typography.displayLarge,
            color = NeonCyan,
            fontSize = 48.sp
        )

        Spacer(modifier = Modifier.height(48.dp))

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Email Address", color = SlateGray) },
            modifier = Modifier.fillMaxWidth(),
            colors = TextFieldDefaults.outlinedTextFieldColors(
                focusedBorderColor = NeonCyan,
                unfocusedBorderColor = Color.White.opacity(0.1f),
                cursorColor = NeonCyan
            ),
            shape = RoundedCornerShape(16.dp)
        )

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Password", color = SlateGray) },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(),
            colors = TextFieldDefaults.outlinedTextFieldColors(
                focusedBorderColor = NeonCyan,
                unfocusedBorderColor = Color.White.opacity(0.1f),
                cursorColor = NeonCyan
            ),
            shape = RoundedCornerShape(16.dp)
        )

        Spacer(modifier = Modifier.height(24.dp))

        if (error != null) {
            Text(text = error!!, color = Color.Red, fontSize = 12.sp, modifier = Modifier.padding(bottom = 16.dp))
        }

        Button(
            onClick = {
                if (isSignUp) viewModel.signUp(email, password)
                else viewModel.login(email, password)
            },
            modifier = Modifier.fillMaxWidth().height(64.dp),
            colors = ButtonDefaults.buttonColors(containerColor = NeonCyan),
            shape = RoundedCornerShape(16.dp),
            enabled = !isLoading
        ) {
            if (isLoading) {
                CircularProgressIndicator(color = DeepBlack, modifier = Modifier.size(24.dp))
            } else {
                Text(
                    text = if (isSignUp) "CREATE ACCOUNT" else "ACCESS NEXUS",
                    style = MaterialTheme.typography.labelSmall,
                    color = DeepBlack,
                    fontWeight = FontWeight.Black
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        TextButton(onClick = { isSignUp = !isSignUp }) {
            Text(
                text = if (isSignUp) "ALREADY HAVE AN ACCOUNT? LOGIN" else "NEW TO THE ECOSYSTEM? SIGN UP",
                style = MaterialTheme.typography.labelSmall,
                color = SlateGray
            )
        }
    }
}

// Extension to help with opacity
// Removed redundant Color extensions as per code review.
// Compose standard Color.White and .copy(alpha = ...) are sufficient.

import React, { useRef, useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import SpatialBackground from '../components/SpatialBackground';
import GlassPanel from '../components/GlassPanel';
import NexusRoomBridge from '../networking/NexusRoomBridge';
import UnifiedGameLobby from '../components/UnifiedGameLobby';
import { Colors } from '../theme/Colors';
import * as Haptics from 'expo-haptics';
import { getApiUrl } from '../lib/api';

const QUESTION_TIME = 15;
const OPTION_KEYS = ['A', 'B', 'C', 'D'];

export default function NexusBlitz({ navigation }) {
  const bridgeRef = useRef(null);
  
  // Replaced useGameStore with local state for Mobile
  const [roomId, setRoomId] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [players, setPlayers] = useState([]);
  const [customGame, setCustomGame] = useState(null);
  const [roomStatus, setRoomStatus] = useState('idle');

  const [status, setStatus] = useState('Disconnected');

  // Game State
  const [phase, setPhase] = useState('setup'); // setup | loading | playing | result
  const [topic, setTopic] = useState('');
  const [language, setLanguage] = useState('English');
  const [questionCount, setQuestionCount] = useState(8);
  const [quiz, setQuiz] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [scores, setScores] = useState([]);
  const [roomResults, setRoomResults] = useState([]);

  const handleMessage = (action, data) => {
    if (action === 'open') setStatus('Ready');
    else if (action === 'connectedToHost' || action === 'connection') setStatus('Player Connected');
    else if (action === 'close' || action === 'disconnectedFromHost') setStatus('Ready');
    else if (action === 'error') setStatus('Error');
    else if (action === 'data') {
      const payload = data.payload;
      if (payload.type === 'start-game' && payload.customGame?.gameType === 'blitz') {
        setQuiz(payload.customGame.quiz);
        setPhase('playing');
        setCurrentIndex(0);
        setScores([]);
        setSelected(null);
        setRevealed(false);
        setTimeLeft(QUESTION_TIME);
      }
      if (payload.type === 'game-action' && payload.actionData && payload.actionData.gameType === 'blitz') {
        const state = payload.actionData;
        if (state.blitzResult) {
          setRoomResults(prev => {
            const exists = prev.find(r => r.name === state.blitzResult.name);
            if (exists) return prev;
            return [...prev, state.blitzResult].sort((a,b) => b.score - a.score);
          });
        }
      }
    }
  };

  const generateQuiz = async () => {
    if (!topic.trim()) return alert('Choose a topic first!');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase('loading');
    
    try {
      const res = await fetch(getApiUrl('/api/generate-trivia'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), count: questionCount, language })
      });
      
      const data = await res.json();
      if (!data || !data.questions) throw new Error('Invalid quiz generated');
      
      setQuiz(data);
      setCurrentIndex(0);
      setScores([]);
      setSelected(null);
      setRevealed(false);
      setTimeLeft(QUESTION_TIME);
      setRoomResults([]);
      setPhase('playing');
      
      if (roomId && bridgeRef.current) {
        bridgeRef.current.startGame({
          gameType: 'blitz',
          quiz: data,
          topic: topic.trim(),
          language,
          questionCount,
          roundId: Date.now()
        }, 'individual');
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      alert('Failed to generate quiz. Try another topic.');
      setPhase('setup');
    }
  };

  useEffect(() => {
    if (phase !== 'playing' || revealed) return;
    if (timeLeft <= 0) {
      handleReveal(null);
      return;
    }
    const tick = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 5 && t > 1) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [phase, timeLeft, revealed]);

  const handleReveal = (chosenKey) => {
    if (revealed) return;
    setSelected(chosenKey);
    setRevealed(true);
    Haptics.impactAsync(chosenKey ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Rigid);
  };

  useEffect(() => {
    if (!revealed || phase !== 'playing') return;
    const q = quiz.questions[currentIndex];
    const isCorrect = selected === q.correctOption;
    const pointsEarned = isCorrect ? Math.max(10, Math.round((timeLeft / QUESTION_TIME) * 100)) : 0;
    
    setScores(prev => [...prev, { correct: isCorrect, time: QUESTION_TIME - timeLeft, points: pointsEarned }]);

    const delay = setTimeout(() => {
      if (currentIndex < quiz.questions.length - 1) {
        setCurrentIndex(i => i + 1);
        setSelected(null);
        setRevealed(false);
        setTimeLeft(QUESTION_TIME);
      } else {
        setPhase('result');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 1800);
    return () => clearTimeout(delay);
  }, [revealed]);

  useEffect(() => {
    if (phase === 'result' && quiz) {
      const totalPoints = scores.reduce((sum, s) => sum + s.points, 0);
      const correctCount = scores.filter(s => s.correct).length;
      const accuracy = Math.round((correctCount / quiz.questions.length) * 100);
      
      const myResult = { name: playerName || 'Anonymous', score: totalPoints, correct: correctCount, accuracy };
      
      setRoomResults(prev => {
        if (prev.find(r => r.name === myResult.name)) return prev;
        return [...prev, myResult].sort((a,b) => b.score - a.score);
      });

      if (roomId && bridgeRef.current) {
        bridgeRef.current.broadcastAction({
          gameType: 'blitz',
          blitzResult: myResult
        }, 'finished');
      }
    }
  }, [phase]);

  const handleStartMission = () => {
      generateQuiz();
  };

  const renderPlaying = () => {
    if (!quiz) return null;
    const q = quiz.questions[currentIndex];
    return (
      <View style={{ flex: 1 }}>
        <GlassPanel style={[styles.panel, { marginBottom: 24, borderColor: '#FACC1540' }]} intensity={50}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={styles.label}>Q {currentIndex + 1} / {quiz.questions.length}</Text>
            <Text style={[styles.label, { color: '#FACC15' }]}>{scores.reduce((sum, s) => sum + s.points, 0)} PTS</Text>
          </View>
          <Text style={{ color: timeLeft <= 5 ? '#EF4444' : '#FACC15', fontSize: 48, fontWeight: '900', textAlign: 'center', marginBottom: 16 }}>
            {revealed ? '' : `${timeLeft}s`}
          </Text>
          <Text style={{ color: Colors.white, fontSize: 18, fontWeight: 'bold', textAlign: 'center', lineHeight: 24 }}>{q.question}</Text>
        </GlassPanel>

        <View style={{ gap: 12 }}>
          {OPTION_KEYS.map((key) => {
            const isCorrect = key === q.correctOption;
            const isSelected = key === selected;
            
            let bg = 'rgba(255,255,255,0.05)';
            let borderColor = 'rgba(255,255,255,0.1)';
            let textColor = Colors.slateGray;
            let optionOpacity = 1;

            if (revealed) {
              if (isCorrect) { bg = 'rgba(34,197,94,0.2)'; borderColor = 'rgba(34,197,94,0.6)'; textColor = '#86EFAC'; }
              else if (isSelected && !isCorrect) { bg = 'rgba(239,68,68,0.2)'; borderColor = 'rgba(239,68,68,0.6)'; textColor = '#FCA5A5'; }
              else { optionOpacity = 0.5; }
            }

            return (
              <Pressable 
                key={key} 
                onPress={() => handleReveal(key)} 
                disabled={revealed}
                style={[styles.optionButton, { backgroundColor: bg, borderColor, opacity: optionOpacity }]}
              >
                <Text style={{ color: textColor, fontWeight: 'bold', fontSize: 14 }}>{key}: {q.options[key]}</Text>
              </Pressable>
            );
          })}
        </View>

        {revealed && q.funFact && (
          <GlassPanel style={[styles.panel, { marginTop: 24, padding: 16, borderColor: '#FACC1540' }]} intensity={30}>
            <Text style={[styles.label, { color: '#FACC15' }]}>FUN FACT</Text>
            <Text style={{ color: Colors.white, fontStyle: 'italic', fontSize: 12 }}>{q.funFact}</Text>
          </GlassPanel>
        )}
      </View>
    );
  };

  const renderResult = () => {
    if (!quiz) return null;
    const totalPoints = scores.reduce((sum, s) => sum + s.points, 0);
    const correctCount = scores.filter(s => s.correct).length;
    const accuracy = Math.round((correctCount / quiz.questions.length) * 100);
    const grade = accuracy >= 90 ? 'S' : accuracy >= 70 ? 'A' : accuracy >= 50 ? 'B' : accuracy >= 30 ? 'C' : 'D';

    return (
      <View style={{ flex: 1, gap: 24 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 80, fontWeight: '900', color: '#FACC15' }}>{grade}</Text>
          <Text style={{ color: Colors.white, fontSize: 24, fontWeight: '900' }}>{quiz.quizTitle.toUpperCase()}</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <GlassPanel style={{ flex: 1, padding: 16, alignItems: 'center' }} intensity={40}>
            <Text style={{ color: '#FACC15', fontSize: 24, fontWeight: '900' }}>{totalPoints}</Text>
            <Text style={styles.label}>POINTS</Text>
          </GlassPanel>
          <GlassPanel style={{ flex: 1, padding: 16, alignItems: 'center' }} intensity={40}>
            <Text style={{ color: '#4ADE80', fontSize: 24, fontWeight: '900' }}>{correctCount}/{quiz.questions.length}</Text>
            <Text style={styles.label}>CORRECT</Text>
          </GlassPanel>
          <GlassPanel style={{ flex: 1, padding: 16, alignItems: 'center' }} intensity={40}>
            <Text style={{ color: Colors.neonCyan, fontSize: 24, fontWeight: '900' }}>{accuracy}%</Text>
            <Text style={styles.label}>ACCURACY</Text>
          </GlassPanel>
        </View>

        {roomId && roomResults.length > 0 && (
          <GlassPanel style={styles.panel} intensity={40}>
            <Text style={[styles.label, { color: '#FACC15', marginBottom: 16 }]}>ROOM RESULTS</Text>
            {roomResults.map((r, i) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' }}>
                <Text style={{ color: Colors.white, fontWeight: 'bold' }}>{i+1}. {r.name.toUpperCase()}</Text>
                <Text style={{ color: '#FACC15', fontWeight: '900' }}>{r.score}</Text>
              </View>
            ))}
          </GlassPanel>
        )}

        <Pressable onPress={() => { setPhase('setup'); setRoomStatus('idle'); Haptics.impactAsync(); }} style={[styles.primaryButton, { backgroundColor: 'transparent' }]}>
          <Text style={styles.primaryButtonText}>EXIT TO LOBBY</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SpatialBackground />
      <NexusRoomBridge ref={bridgeRef} onMessage={handleMessage} onRoomIdCreated={setRoomId} />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.headerIcon}>{'<'}</Text>
          </Pressable>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.headerTitle, { color: Colors.electricViolet }]}>AI TRIVIA ENGINE</Text>
            <Text style={[styles.headerTitle, { fontSize: 20 }]}>NEXUS BLITZ</Text>
          </View>
        </View>

        {(phase === 'setup' || !roomId) ? (
              <UnifiedGameLobby
              gameTitle="Nexus Blitz"
              onStart={handleStartMission}
              isHost={isHost}
              setIsHost={setIsHost}
              playerName={playerName}
              setPlayerName={setPlayerName}
              players={players}
              roomStatus={roomStatus}
              roomId={roomId}
              setRoomId={setRoomId}
              status={status}
              bridgeRef={bridgeRef}
              customSettingsUI={
                <View style={{ gap: 16 }}>
                    <Text style={styles.label}>QUIZ TOPIC</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="e.g. Space, Movies..." 
                        placeholderTextColor={Colors.slateGray} 
                        value={topic} 
                        onChangeText={setTopic} 
                    />
                </View>
              }
            />
        ) : (
          <>
            {phase === 'loading' && (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 100 }}>
                <ActivityIndicator size="large" color="#FACC15" />
                <Text style={{ color: Colors.slateGray, marginTop: 24, fontWeight: 'bold', letterSpacing: 2 }}>GENERATING QUIZ...</Text>
              </View>
            )}
            {phase === 'playing' && renderPlaying()}
            {phase === 'result' && renderResult()}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkBg },
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 },
  backButton: { padding: 8 },
  headerIcon: { color: Colors.neonCyan, fontSize: 24, fontWeight: 'bold' },
  headerTitle: { color: Colors.white, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  panel: { padding: 24 },
  label: { color: Colors.slateGray, fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  primaryButton: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  primaryButtonText: { color: Colors.white, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  disabled: { opacity: 0.5 },
  statusText: { color: Colors.slateGray, fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  optionButton: { padding: 16, borderWidth: 1, borderRadius: 16 },
});

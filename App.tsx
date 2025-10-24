import React, {useState} from 'react';
import {Alert, Button, PermissionsAndroid, Platform, SafeAreaView, StyleSheet, Text, View} from 'react-native';
import {ElevenLabsProvider, useConversation} from '@elevenlabs/react-native';

const AGENT_ID = process.env.EXPO_PUBLIC_AGENT_ID;

function ConversationScreen() {
  const [connecting, setConnecting] = useState(false);
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: m => console.log('Message:', m),
    onError: e => console.error('Error:', e)
  });

  const ensureMicPermission = async () => {
    if (Platform.OS !== 'android') return true;
    const ok = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    if (ok) return true;
    const status = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    return status === PermissionsAndroid.RESULTS.GRANTED;
  };

  const start = async () => {
    if (connecting) return;
    if (!AGENT_ID) {
      Alert.alert('Missing Agent ID', 'Set EXPO_PUBLIC_AGENT_ID in .env then restart.');
      return;
    }
    const mic = await ensureMicPermission();
    if (!mic) {
      Alert.alert('Microphone needed', 'Please allow microphone access.');
      return;
    }
    setConnecting(true);
    try {
      await conversation.startSession({
        agentId: AGENT_ID,
        dynamicVariables: {platform: Platform.OS}
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Start failed', String(e));
    } finally {
      setConnecting(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.h1}>ElevenLabs + Expo</Text>
      <Text style={styles.sub}>Agent: {AGENT_ID ?? '⚠️ not set'}</Text>
      <Button title={connecting ? 'Starting…' : 'Start'} onPress={start} disabled={connecting} />
      <Button title='Stop' onPress={() => conversation.endSession()} />
      <Button title='Say hi' onPress={() => conversation.sendUserMessage('Hello there!')} />
      <Text style={styles.status}>{conversation.isSpeaking ? 'AI speaking…' : 'Listening / idle'}</Text>
    </View>
  );
}

export default function App() {
  return (
    <ElevenLabsProvider>
      <SafeAreaView style={styles.container}>
        <ConversationScreen />
      </SafeAreaView>
    </ElevenLabsProvider>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', padding: 20},
  card: {gap: 12},
  h1: {fontSize: 20, fontWeight: '600', marginBottom: 4},
  sub: {opacity: 0.7},
  status: {marginTop: 8, opacity: 0.7}
});

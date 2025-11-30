import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../config/socket';

export default function MatchmakingScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<'searching' | 'found' | 'error'>('searching');
  const [queuePosition, setQueuePosition] = useState<number | null>(null);

  useEffect(() => {
    const socket = connectSocket();

    socket.on('connect', () => {
      console.log('Connected to server');
      // Join matchmaking queue
      socket.emit('joinMatchmaking', {
        playerName: 'Player',
      });
    });

    socket.on('matchmakingStatus', (data) => {
      if (data.status === 'searching') {
        setStatus('searching');
        setQueuePosition(data.queuePosition);
      }
    });

    socket.on('matchFound', (data) => {
      setStatus('found');
      // Navigate to online chess board
      setTimeout(() => {
        router.replace({
          pathname: '/chess-board-online',
          params: {
            gameId: data.gameId,
            playerColor: data.playerColor,
            opponentName: data.opponentName,
            yourName: data.yourName,
          },
        });
      }, 1000);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setStatus('error');
    });

    return () => {
      socket.off('connect');
      socket.off('matchmakingStatus');
      socket.off('matchFound');
      socket.off('error');
    };
  }, []);

  const handleCancel = () => {
    const socket = getSocket();
    if (socket) {
      socket.emit('leaveMatchmaking');
      disconnectSocket();
    }
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {status === 'searching' && (
          <>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.title}>Searching for Opponent...</Text>
            {queuePosition !== null && (
              <Text style={styles.subtitle}>
                Players in queue: {queuePosition}
              </Text>
            )}
            <Text style={styles.hint}>
              Please wait while we find you an opponent
            </Text>
          </>
        )}

        {status === 'found' && (
          <>
            <Text style={styles.title}>Match Found!</Text>
            <Text style={styles.subtitle}>Starting game...</Text>
          </>
        )}

        {status === 'error' && (
          <>
            <Text style={styles.title}>Connection Error</Text>
            <Text style={styles.subtitle}>Please try again</Text>
          </>
        )}

        <Text style={styles.cancelButton} onPress={handleCancel}>
          Cancel
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  hint: {
    fontSize: 14,
    color: '#999',
    marginTop: 20,
    textAlign: 'center',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 40,
    padding: 10,
  },
});


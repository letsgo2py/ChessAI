import { StyleSheet, TouchableOpacity, Text, View, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function HomeScreen() {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  const handleFirstButtonPress = () => {
    setShowModal(true);
  };

  const handleSecondButtonPress = () => {
    setShowAIModal(true);
  };

  const handleOkPress = () => {
    if (player1Name.trim() && player2Name.trim()) {
      setShowModal(false);
      router.push({
        pathname: '/chess-board',
        params: {
          player1: player1Name.trim(),
          player2: player2Name.trim(),
        },
      });
      setPlayer1Name('');
      setPlayer2Name('');
    }
  };

  const handleAIOkPress = () => {
    setShowAIModal(false);
    router.push({
      pathname: '/chess-board-ai',
      params: {
        difficulty: aiDifficulty,
      },
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.titleText}>CHESS TIME</Text>
      </View>
      
      <Modal
        visible={showModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Player Names</Text>
            
            <Text style={styles.inputLabel}>Player 1 Name (White):</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Player 1 Name"
              value={player1Name}
              onChangeText={setPlayer1Name}
              autoFocus={true}
            />
            
            <Text style={styles.inputLabel}>Player 2 Name (Black):</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter Player 2 Name"
              value={player2Name}
              onChangeText={setPlayer2Name}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowModal(false);
                  setPlayer1Name('');
                  setPlayer2Name('');
                }}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.okButton]}
                onPress={handleOkPress}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.button}
        onPress={handleFirstButtonPress}
      >
        <Text style={styles.buttonText}>Play with a friend (Offline)</Text>
      </TouchableOpacity>

      <Modal
        visible={showAIModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAIModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Play with AI</Text>
            
            <Text style={styles.inputLabel}>Select AI Difficulty:</Text>
            <View style={styles.difficultyContainer}>
              <TouchableOpacity
                style={[
                  styles.difficultyButton,
                  aiDifficulty === 'easy' && styles.difficultyButtonActive,
                ]}
                onPress={() => setAiDifficulty('easy')}
              >
                <Text
                  style={[
                    styles.difficultyButtonText,
                    aiDifficulty === 'easy' && styles.difficultyButtonTextActive,
                  ]}
                >
                  Easy
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.difficultyButton,
                  aiDifficulty === 'medium' && styles.difficultyButtonActive,
                ]}
                onPress={() => setAiDifficulty('medium')}
              >
                <Text
                  style={[
                    styles.difficultyButtonText,
                    aiDifficulty === 'medium' && styles.difficultyButtonTextActive,
                  ]}
                >
                  Medium
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.difficultyButton,
                  aiDifficulty === 'hard' && styles.difficultyButtonActive,
                ]}
                onPress={() => setAiDifficulty('hard')}
              >
                <Text
                  style={[
                    styles.difficultyButtonText,
                    aiDifficulty === 'hard' && styles.difficultyButtonTextActive,
                  ]}
                >
                  Hard
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAIModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.okButton]}
                onPress={handleAIOkPress}
              >
                <Text style={styles.modalButtonText}>Start Game</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.button}
        onPress={handleSecondButtonPress}
      >
        <Text style={styles.buttonText}>Play with AI</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/matchmaking')}
      >
        <Text style={styles.buttonText}>Play Random Match</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    padding: 20,
  },
  titleContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  titleText: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 4,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    color: '#007AFF',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000',
  },
  buttonText: {
    color: '#000',
    opacity: 0.7,
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#000',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#000',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  okButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },
  difficultyButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ccc',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  difficultyButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  difficultyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  difficultyButtonTextActive: {
    color: '#fff',
  },
});

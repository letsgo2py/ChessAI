import { useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from "react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// ── Confetti particle ────────────────────────────────────────────────────────
const COLORS = ["#FFD700", "#FF4C4C", "#4CFF91", "#4CB8FF", "#FF4CF0", "#FF944C"];
const PARTICLE_COUNT = 60;

type Particle = {
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  shape: "rect" | "circle";
};

function makeParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    x: new Animated.Value(SCREEN_W / 2),
    y: new Animated.Value(SCREEN_H * 0.35),
    rotate: new Animated.Value(0),
    opacity: new Animated.Value(1),
    color: COLORS[i % COLORS.length],
    size: 6 + Math.random() * 8,
    shape: Math.random() > 0.5 ? "rect" : "circle",
  }));
}

function fireParticles(particles: Particle[]) {
  particles.forEach((p) => {
    // reset
    p.x.setValue(SCREEN_W / 2);
    p.y.setValue(SCREEN_H * 0.35);
    p.rotate.setValue(0);
    p.opacity.setValue(1);

    const angle = Math.random() * Math.PI * 2;
    const speed = 120 + Math.random() * 220;
    const destX = SCREEN_W / 2 + Math.cos(angle) * speed;
    const destY = SCREEN_H * 0.35 + Math.sin(angle) * speed - 80;
    const duration = 900 + Math.random() * 600;

    Animated.parallel([
      Animated.timing(p.x, {
        toValue: destX,
        duration,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(p.y, {
          toValue: destY,
          duration: duration * 0.45,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(p.y, {
          toValue: destY + 260,
          duration: duration * 0.55,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(p.rotate, {
        toValue: (Math.random() > 0.5 ? 1 : -1) * (4 + Math.random() * 8),
        duration,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(duration * 0.5),
        Animated.timing(p.opacity, {
          toValue: 0,
          duration: duration * 0.5,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  });
}

// ── Main Component ───────────────────────────────────────────────────────────
type Props = {
  visible: boolean;
  gameResult: null | {
    type: "checkmate" | "stalemate";
    winner?: "w" | "b";
  };
  onRestart: () => void;
  onClose?: () => void;
};

export default function GameModal({ visible, gameResult, onRestart, onClose }: Props) {
  const particles = useRef<Particle[]>(makeParticles()).current;

  // Card entrance animation
  const cardScale = useRef(new Animated.Value(0.7)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Overlay fade-in
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();

      // Card spring entrance
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          damping: 14,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cardOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Confetti only on non-stalemate
      if (gameResult?.type === "checkmate") {
        setTimeout(() => fireParticles(particles), 150);
      }
    } else {
      cardScale.setValue(0.7);
      cardOpacity.setValue(0);
      overlayOpacity.setValue(0);
    }
  }, [visible]);

  const isCheckmate = gameResult?.type === "checkmate";
  const isStalemate = gameResult?.type === "stalemate";
  const winnerLabel =
    gameResult?.winner === "w" ? "White" : gameResult?.winner === "b" ? "Black" : "";

  return (
    <Modal visible={visible} transparent animationType="none">
      {/* Overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Animated.View
          style={[
            styles.card,
            { opacity: cardOpacity, transform: [{ scale: cardScale }] },
          ]}
        >
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose ?? onRestart}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>

          {/* Trophy / handshake icon */}
          <Text style={styles.bigEmoji}>{isCheckmate ? "🏆" : "🤝"}</Text>

          {/* Title */}
          <Text style={styles.title}>
            {isCheckmate ? "Checkmate!" : "Stalemate"}
          </Text>

          {/* Sub-label */}
          {isCheckmate && (
            <View style={[styles.badge, { backgroundColor: gameResult?.winner === "w" ? "#1a1a2e" : "#2e1a1a" }]}>
              <Text style={styles.badgeText}>
                {winnerLabel} wins the match
              </Text>
            </View>
          )}
          {isStalemate && (
            <Text style={styles.subtitle}>It's a draw — well played by both!</Text>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Play Again */}
          <TouchableOpacity style={styles.playBtn} onPress={onRestart} activeOpacity={0.85}>
            <Text style={styles.playBtnText}>Play Again</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Confetti layer — rendered last so it's above the card */}
      <View style={[StyleSheet.absoluteFill, { zIndex: 10 }]} pointerEvents="none">
        {particles.map((p, i) => {
          const spin = p.rotate.interpolate({
            inputRange: [-12, 12],
            outputRange: ["-720deg", "720deg"],
          });
          return (
            <Animated.View
              key={i}
              style={{
                position: "absolute",
                width: p.shape === "circle" ? p.size : p.size * 0.7,
                height: p.shape === "circle" ? p.size : p.size * 1.6,
                borderRadius: p.shape === "circle" ? p.size / 2 : 2,
                backgroundColor: p.color,
                opacity: p.opacity,
                transform: [
                  { translateX: p.x },
                  { translateY: p.y },
                  { rotate: spin },
                ],
              }}
            />
          );
        })}
      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10,10,20,0.72)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: 300,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 20,
  },
  closeBtn: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F0F0F5",
    justifyContent: "center",
    alignItems: "center",
  },
  closeIcon: {
    fontSize: 12,
    color: "#666",
    fontWeight: "700",
  },
  bigEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111",
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 99,
    marginBottom: 4,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginBottom: 4,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#EFEFEF",
    marginVertical: 22,
  },
  playBtn: {
    width: "100%",
    backgroundColor: "#111",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  playBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
});
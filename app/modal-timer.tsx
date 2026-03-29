import { StyleSheet, TouchableOpacity, Text, View, Modal, TextInput } from 'react-native';

type TimerSelectorProps = {
  selectedTime: string;
  onSelect: (time: string) => void;
  theme: any;
};

const TIMER_OPTIONS = ['No timer', '5 min', '10 min', '15 min'];

export function TimerSelector({ selectedTime, onSelect, theme }: TimerSelectorProps) {
  return (
    <View style={styles.timerContainer}>
      {TIMER_OPTIONS.map((time) => (
        <TouchableOpacity
          key={time}
          style={[
            styles.timerOption,
            selectedTime === time && styles.selectedTimer,
          ]}
          onPress={() => onSelect(time)}
        >
          <Text
            style={[
              { color: theme.timerText },
              selectedTime === time && styles.selectedTimerText
            ]}
          >
            {time}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  
   timerOption: {
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },

  selectedTimer: {
    backgroundColor: '#7c1111',
    borderColor: '#7c1111',
  },

  selectedTimerText: {
    color: '#fff',
    fontWeight: 'bold',
  },

})
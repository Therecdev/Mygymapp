"use client"
import { Modal, View, StyleSheet } from "react-native"
import RestTimer from "./RestTimer"

interface RestTimerModalProps {
  visible: boolean
  defaultTime?: number
  onComplete?: () => void
  onClose: () => void
}

export default function RestTimerModal({ visible, defaultTime = 60, onComplete, onClose }: RestTimerModalProps) {
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <RestTimer defaultTime={defaultTime} onComplete={onComplete} onClose={onClose} />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
})


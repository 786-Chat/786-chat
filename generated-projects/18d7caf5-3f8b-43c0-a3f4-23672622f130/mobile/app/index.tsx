import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.brand}>Raja Catering</Text>
        </View>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Operations at a glance</Text>
          <Text style={styles.heroSubtitle}>Production, quality and stock control</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dashboard</Text>
          <Text style={styles.cardText}>View today's production, stock levels and alerts.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Production</Text>
          <Text style={styles.cardText}>Record batches and track cooling.</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Stock</Text>
          <Text style={styles.cardText}>Monitor ingredients and finished goods.</Text>
        </View>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Open Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0b1120",
  },
  container: {
    padding: 20,
    gap: 16,
  },
  header: {
    alignItems: "center",
    paddingVertical: 12,
  },
  brand: {
    color: "#e2e8f0",
    fontSize: 20,
    fontWeight: "700",
  },
  hero: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  heroTitle: {
    color: "#f8fafc",
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  heroSubtitle: {
    color: "#94a3b8",
    fontSize: 16,
    textAlign: "center",
    marginTop: 8,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cardTitle: {
    color: "#e2e8f0",
    fontSize: 18,
    fontWeight: "700",
  },
  cardText: {
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    backgroundColor: "#0ea5e9",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#0f172a",
    fontSize: 16,
    fontWeight: "700",
  },
});

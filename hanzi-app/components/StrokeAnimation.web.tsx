import { createElement, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props { character: string; size?: number; autoPlay?: boolean }

// ── Singleton CDN loader ───────────────────────────────────────────────────────
// Loads hanzi-writer once per page and calls all waiting callbacks on ready.

let hwLoaded  = false;
let hwLoading = false;
const pending: (() => void)[] = [];

function loadHanziWriter(onReady: () => void) {
  if (hwLoaded) { onReady(); return; }
  pending.push(onReady);
  if (hwLoading) return;
  hwLoading = true;
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js';
  s.onload = () => {
    hwLoaded = true;
    hwLoading = false;
    pending.splice(0).forEach(fn => fn());
  };
  document.head.appendChild(s);
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function StrokeAnimation({ character, size = 160, autoPlay = true }: Props) {
  const containerRef = useRef<any>(null);
  const writerRef    = useRef<any>(null);
  const [ready, setReady] = useState(hwLoaded);

  // Load hanzi-writer CDN script (no-op if already loaded)
  useEffect(() => {
    loadHanziWriter(() => setReady(true));
  }, []);

  // Init or re-init the writer whenever the script is ready or the character changes
  useEffect(() => {
    if (!ready) return;
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';   // clear any previous SVG
    writerRef.current = (window as any).HanziWriter.create(container, character, {
      width:  size,
      height: size,
      padding: 8,
      showOutline: true,
      strokeColor:   '#1a1a1a',
      outlineColor:  '#e0e0e0',
      strokeAnimationSpeed: 1,
      delayBetweenStrokes:  300,
    });
    if (autoPlay) writerRef.current.animateCharacter();
  }, [ready, character, size, autoPlay]);

  const replay = () => writerRef.current?.animateCharacter();

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      {/* hanzi-writer draws into this div */}
      {createElement('div', {
        ref:   containerRef,
        style: { width: size, height: size },
      })}

      {/* Replay button — top-right corner, icon only */}
      <TouchableOpacity style={styles.replayBtn} onPress={replay}>
        <Text style={styles.replayIcon}>↺</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d0d0d0',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replayBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(240,240,240,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  replayIcon: { fontSize: 14, color: '#555' },
});

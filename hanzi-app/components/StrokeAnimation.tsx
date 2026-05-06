import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import WebView from 'react-native-webview';

interface Props {
  character: string;
  size?: number;
  autoPlay?: boolean;
}

function buildHtml(character: string, size: number): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:${size}px;height:${size}px;background:#fff;
      display:flex;align-items:center;justify-content:center;overflow:hidden}
  </style>
</head>
<body>
  <div id="t"></div>
  <script src="https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js"></script>
  <script>
    var w = HanziWriter.create('t','${character}',{
      width:${size},height:${size},padding:8,
      showOutline:true,
      strokeColor:'#1a1a1a',
      outlineColor:'#e0e0e0',
      strokeAnimationSpeed:1,
      delayBetweenStrokes:300,
    });
    w.animateCharacter();
    window.replay = function(){ w.animateCharacter(); };
  </script>
</body>
</html>`;
}

export default function StrokeAnimation({ character, size = 160, autoPlay = true }: Props) {
  // Incrementing the key unmounts+remounts the WebView, re-running the animation.
  const [replayKey, setReplayKey] = useState(0);

  return (
    <View style={[styles.box, { width: size, height: size }]}>
      <WebView
        key={`${character}-${replayKey}`}
        source={{ html: buildHtml(character, size) }}
        style={{ width: size, height: size, backgroundColor: 'transparent' }}
        scrollEnabled={false}
        originWhitelist={['*']}
        javaScriptEnabled
      />

      {/* Replay button — top-right corner, icon only */}
      <TouchableOpacity
        style={styles.replayBtn}
        onPress={() => setReplayKey(k => k + 1)}
      >
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

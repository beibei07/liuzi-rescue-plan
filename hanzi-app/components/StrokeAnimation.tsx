import { useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import WebView from 'react-native-webview';

interface Props {
  character: string;
  size?: number;
  autoPlay?: boolean;
}

function buildHtml(character: string, size: number): string {
  const inner = size - 16;
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:${size}px;height:${size}px;background:#fafafa;
      display:flex;align-items:center;justify-content:center;overflow:hidden}
  </style>
</head>
<body>
  <div id="t"></div>
  <script src="https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js"></script>
  <script>
    var w = HanziWriter.create('t','${character}',{
      width:${inner},height:${inner},padding:4,
      showOutline:true,
      strokeColor:'#1a1a1a',
      outlineColor:'#ddd',
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
    <View style={styles.wrapper}>
      <View style={[styles.webviewBox, { width: size, height: size }]}>
        <WebView
          key={`${character}-${replayKey}`}
          source={{ html: buildHtml(character, size) }}
          style={{ width: size, height: size, backgroundColor: 'transparent' }}
          scrollEnabled={false}
          originWhitelist={['*']}
          javaScriptEnabled
        />
      </View>
      <TouchableOpacity style={styles.replayBtn} onPress={() => setReplayKey(k => k + 1)}>
        <Text style={styles.replayText}>↺ 重播</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:     { alignItems: 'center', gap: 6 },
  webviewBox:  { borderRadius: 12, overflow: 'hidden',
                 borderWidth: StyleSheet.hairlineWidth, borderColor: '#d0d0d0' },
  replayBtn:   { paddingHorizontal: 14, paddingVertical: 6,
                 borderRadius: 20, backgroundColor: '#f0f0f0' },
  replayText:  { fontSize: 13, color: '#555' },
});

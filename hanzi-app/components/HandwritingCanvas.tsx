import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export interface HandwritingCanvasRef {
  clear: () => void;
}

interface Props {
  size: number;
  onStrokeEnd?: () => void;
}

const HandwritingCanvas = forwardRef<HandwritingCanvasRef, Props>(
  ({ size, onStrokeEnd }, ref) => {
    const [finishedPaths, setFinishedPaths] = useState<string[]>([]);
    const [activePath, setActivePath]       = useState('');
    const activePathRef                     = useRef('');

    useImperativeHandle(ref, () => ({
      clear() {
        setFinishedPaths([]);
        setActivePath('');
        activePathRef.current = '';
      },
    }));

    const pan = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder:  () => true,

        onPanResponderGrant(e) {
          const { locationX: x, locationY: y } = e.nativeEvent;
          const d = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
          activePathRef.current = d;
          setActivePath(d);
        },

        onPanResponderMove(e) {
          const { locationX: x, locationY: y } = e.nativeEvent;
          const d = activePathRef.current + ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
          activePathRef.current = d;
          setActivePath(d);
        },

        onPanResponderRelease() {
          if (!activePathRef.current) return;
          setFinishedPaths(prev => [...prev, activePathRef.current]);
          activePathRef.current = '';
          setActivePath('');
          onStrokeEnd?.();
        },
      })
    ).current;

    return (
      <View style={[styles.container, { width: size, height: size }]} {...pan.panHandlers}>
        <Svg width={size} height={size}>
          {finishedPaths.map((d, i) => (
            <Path key={i} d={d} stroke="#1a1a1a" strokeWidth={4}
              fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {activePath ? (
            <Path d={activePath} stroke="#1a1a1a" strokeWidth={4}
              fill="none" strokeLinecap="round" strokeLinejoin="round" />
          ) : null}
        </Svg>
      </View>
    );
  }
);

HandwritingCanvas.displayName = 'HandwritingCanvas';
export default HandwritingCanvas;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d0d0d0',
    overflow: 'hidden',
  },
});

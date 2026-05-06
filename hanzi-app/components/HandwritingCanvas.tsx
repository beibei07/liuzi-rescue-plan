import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export interface HandwritingCanvasRef { clear: () => void; }

interface Props {
  size: number;
  displaySize?: number;
  onStrokeEnd?: () => void;
}

const HandwritingCanvas = forwardRef<HandwritingCanvasRef, Props>(
  ({ size, displaySize, onStrokeEnd }, ref) => {
    const ds = displaySize ?? size;

    const [finishedPaths, setFinishedPaths] = useState<string[]>([]);
    const [activePath, setActivePath]       = useState('');
    const activePathRef = useRef('');

    // Kept in a ref so PanResponder callbacks (created once) always read the
    // current scale without needing to be recreated on every render.
    const scaleRef   = useRef(1);
    scaleRef.current = size / ds;

    useImperativeHandle(ref, () => ({
      clear() {
        setFinishedPaths([]);
        setActivePath('');
        activePathRef.current = '';
      },
    }));

    const commit = () => {
      const pathToCommit = activePathRef.current;
      console.log('[HandwritingCanvas] commit called, path:', pathToCommit);
      if (!pathToCommit) return;
      setFinishedPaths(prev => {
        const updated = [...prev, pathToCommit];
        console.log('[HandwritingCanvas] finishedPaths updated, count:', updated.length);
        return updated;
      });
      activePathRef.current = '';
      setActivePath('');
      onStrokeEnd?.();
    };

    const pan = useRef(
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder:  () => true,

        onPanResponderGrant(e) {
          console.log('[HandwritingCanvas] onPanResponderGrant');
          const s = scaleRef.current;
          const x = e.nativeEvent.locationX * s;
          const y = e.nativeEvent.locationY * s;
          const d = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
          activePathRef.current = d;
          setActivePath(d);
        },

        onPanResponderMove(e) {
          const s = scaleRef.current;
          const x = e.nativeEvent.locationX * s;
          const y = e.nativeEvent.locationY * s;
          const d = activePathRef.current + ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
          activePathRef.current = d;
          setActivePath(d);
        },

        onPanResponderRelease() {
          console.log('[HandwritingCanvas] onPanResponderRelease');
          commit();
        },
        onPanResponderTerminate() {
          console.log('[HandwritingCanvas] onPanResponderTerminate');
          commit();
        },
      })
    ).current;

    return (
      <View style={[styles.container, { width: ds, height: ds }]} {...pan.panHandlers}>
        {/*
          viewBox keeps the coordinate space fixed at size×size regardless of
          how the SVG element is actually displayed (ds may differ from size).
        */}
        <Svg
          width={ds}
          height={ds}
          viewBox={`0 0 ${size} ${size}`}
          style={{ backgroundColor: '#fff' }}
          pointerEvents="none"
        >
          {finishedPaths.map((d, i) => {
            console.log('[HandwritingCanvas] rendering finished path', i, d.substring(0, 50));
            return (
              <Path key={i} d={d} stroke="#1a1a1a" strokeWidth={5}
                fill="none" strokeLinecap="round" strokeLinejoin="round" />
            );
          })}
          {activePath ? (
            <Path d={activePath} stroke="#1a1a1a" strokeWidth={5}
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

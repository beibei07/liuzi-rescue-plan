import { createElement, forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

export interface HandwritingCanvasRef { clear: () => void; }

interface Props {
  size: number;
  displaySize?: number;
  onStrokeEnd?: () => void;
}

/**
 * Web implementation using HTML Canvas + Pointer Events.
 *
 * Why not PanResponder + SVG (used on native)?
 * On web, react-native-svg renders a real <svg> DOM element that intercepts
 * pointer events before the parent View's PanResponder sees them, causing
 * strokes to disappear immediately.  Native pointer events on a <canvas> are
 * reliable and setPointerCapture keeps tracking even when the cursor leaves.
 *
 * displaySize: CSS size for the canvas wrapper (defaults to `size`).
 * The internal canvas pixel resolution stays fixed at `size × size` so the
 * drawing survives phase transitions that change displaySize.
 */
const HandwritingCanvas = forwardRef<HandwritingCanvasRef, Props>(
  ({ size, displaySize, onStrokeEnd }, ref) => {
    const ds        = displaySize ?? size;
    const canvasEl  = useRef<any>(null);
    const isDrawing = useRef(false);
    const lastXY    = useRef({ x: 0, y: 0 });

    useImperativeHandle(ref, () => ({
      clear() {
        const c = canvasEl.current;
        if (!c) return;
        c.getContext('2d').clearRect(0, 0, c.width, c.height);
      },
    }));

    // Convert a pointer event's client position to canvas-pixel coordinates.
    // When ds ≠ size the element is CSS-scaled, so we must compensate.
    const getPos = (e: any) => {
      const rect = canvasEl.current.getBoundingClientRect();
      const sx = size / rect.width;
      const sy = size / rect.height;
      return { x: (e.clientX - rect.left) * sx, y: (e.clientY - rect.top) * sy };
    };

    const onPointerDown = (e: any) => {
      isDrawing.current = true;
      e.target.setPointerCapture(e.pointerId); // track even when pointer leaves element
      const p = getPos(e);
      lastXY.current = p;
      const ctx = canvasEl.current?.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); // dot on tap
        ctx.fillStyle = '#1a1a1a';
        ctx.fill();
      }
    };

    const onPointerMove = (e: any) => {
      if (!isDrawing.current) return;
      const p = getPos(e);
      const ctx = canvasEl.current?.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(lastXY.current.x, lastXY.current.y);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth   = 5;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';
        ctx.stroke();
      }
      lastXY.current = p;
    };

    const onPointerUp = () => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      onStrokeEnd?.();
    };

    return (
      <View style={[styles.container, { width: ds, height: ds }]}>
        {createElement('canvas', {
          ref:    canvasEl,
          width:  size,   // internal resolution — never changes → drawing survives CSS resize
          height: size,
          style: {
            display:     'block',
            width:       ds,
            height:      ds,
            borderRadius: 12,
            touchAction: 'none', // prevent browser scroll-hijack while drawing
          },
          onPointerDown,
          onPointerMove,
          onPointerUp,
          onPointerCancel: onPointerUp,
        })}
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

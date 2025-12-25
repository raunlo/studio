"use client";

import { useGesture } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';
import { Check, Trash2 } from 'lucide-react';
import { ReactNode } from 'react';

type SwipeableItemProps = {
  children: ReactNode;
  onSwipeComplete: () => void;
  onSwipeDelete: () => void;
  isCompleted?: boolean;
  swipeThreshold?: number;
};

export function SwipeableItem({
  children,
  onSwipeComplete,
  onSwipeDelete,
  isCompleted = false,
  swipeThreshold = 80,
}: SwipeableItemProps) {
  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  const bind = useGesture({
    onDrag: ({ offset: [ox], direction: [dx], cancel, velocity: [vx] }) => {
      // Right swipe (complete/uncomplete)
      if (ox > swipeThreshold && dx > 0) {
        cancel();
        // Animate to the edge before triggering action
        api.start({ x: 200 }).then(() => {
          onSwipeComplete();
          api.set({ x: 0 });
        });
      }
      // Left swipe (delete)
      else if (ox < -swipeThreshold && dx < 0) {
        cancel();
        // Animate to the edge before triggering action
        api.start({ x: -200 }).then(() => {
          onSwipeDelete();
          api.set({ x: 0 });
        });
      }
      // Normal drag
      else {
        api.start({ x: ox, immediate: false });
      }
    },
    onDragEnd: ({ offset: [ox] }) => {
      // Snap back if didn't reach threshold
      if (Math.abs(ox) < swipeThreshold) {
        api.start({ x: 0 });
      }
    },
  }, {
    drag: {
      axis: 'x',
      filterTaps: true,
      rubberband: true,
    }
  });

  return (
    <div className="relative overflow-hidden rounded-lg touch-manipulation">
      {/* Background actions (revealed on swipe) */}
      <div className="absolute inset-0 flex justify-between items-center pointer-events-none">
        {/* Left side - Complete/Uncomplete (green) */}
        <div className="h-full flex items-center px-6 bg-accent">
          <Check className="text-white w-6 h-6" />
        </div>

        {/* Right side - Delete (red) */}
        <div className="h-full flex items-center px-6 bg-destructive">
          <Trash2 className="text-white w-6 h-6" />
        </div>
      </div>

      {/* Draggable item */}
      <animated.div
        {...bind()}
        style={{ x }}
        className="bg-card relative z-10 cursor-grab active:cursor-grabbing"
      >
        {children}
      </animated.div>
    </div>
  );
}

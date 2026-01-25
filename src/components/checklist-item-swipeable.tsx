"use client";

import { useGesture } from '@use-gesture/react';
import { useSpring, animated } from '@react-spring/web';
import { Check, Trash2 } from 'lucide-react';
import { ReactNode, useState, useEffect, useRef } from 'react';

type SwipeableItemProps = {
  children: ReactNode;
  onSwipeComplete: () => void;
  onSwipeDelete: () => void;
  isCompleted?: boolean;
  deleteButtonWidth?: number;
};

export function SwipeableItem({
  children,
  onSwipeComplete,
  onSwipeDelete,
  isCompleted = false,
  deleteButtonWidth = 80,
}: SwipeableItemProps) {
  const [isDeleteRevealed, setIsDeleteRevealed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [{ x }, api] = useSpring(() => ({ x: 0 }));

  // Close when clicking outside
  useEffect(() => {
    if (!isDeleteRevealed) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDeleteRevealed(false);
        api.start({ x: 0 });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isDeleteRevealed, api]);

  const bind = useGesture({
    onDrag: ({ offset: [ox], direction: [dx], cancel }) => {
      // If delete is revealed and swiping right, close it
      if (isDeleteRevealed && dx > 0) {
        cancel();
        setIsDeleteRevealed(false);
        api.start({ x: 0 });
        return;
      }

      // Right swipe (complete/uncomplete) - auto trigger
      if (ox > 60 && dx > 0) {
        cancel();
        api.start({
          x: 100,
          onRest: () => {
            onSwipeComplete();
            api.start({ x: 0 });
          }
        });
        return;
      }

      // Left swipe - reveal delete button (iOS style)
      if (ox < -deleteButtonWidth && dx < 0) {
        cancel();
        setIsDeleteRevealed(true);
        api.start({ x: -deleteButtonWidth });
        return;
      }

      // Normal drag
      api.start({ x: ox, immediate: false });
    },
    onDragEnd: ({ offset: [ox] }) => {
      if (isDeleteRevealed) return;

      // Snap to reveal delete if past halfway
      if (ox < -deleteButtonWidth / 2) {
        setIsDeleteRevealed(true);
        api.start({ x: -deleteButtonWidth });
      } else {
        // Snap back
        api.start({ x: 0 });
      }
    },
  }, {
    drag: {
      axis: 'x',
      filterTaps: true,
      rubberband: true,
      from: () => [x.get(), 0],
    }
  });

  const handleDeleteClick = () => {
    // Animate out then delete
    api.start({
      x: -300,
      onRest: () => {
        onSwipeDelete();
        // Reset position after delete
        setIsDeleteRevealed(false);
        api.set({ x: 0 });
      }
    });
  };

  const handleContentClick = () => {
    // If delete is revealed, close it on content click
    if (isDeleteRevealed) {
      setIsDeleteRevealed(false);
      api.start({ x: 0 });
    }
  };

  return (
    <div ref={containerRef} className="relative overflow-hidden touch-manipulation flex-1">
      {/* Background actions (revealed on swipe) */}
      <div className="absolute inset-0 flex justify-between items-stretch pointer-events-none">
        {/* Left side - Complete/Uncomplete (green) */}
        <div className="h-full flex items-center px-6 bg-accent">
          <Check className="text-white w-6 h-6" />
        </div>

        {/* Right side - Delete button (red) - clickable when revealed */}
        <button
          onClick={handleDeleteClick}
          className="h-full flex items-center justify-center bg-destructive pointer-events-auto active:bg-destructive/80 transition-colors"
          style={{ width: deleteButtonWidth }}
          aria-label="Delete"
        >
          <Trash2 className="text-white w-6 h-6" />
        </button>
      </div>

      {/* Draggable item */}
      <animated.div
        {...bind()}
        onClick={handleContentClick}
        style={{ x }}
        className="bg-card relative z-10 cursor-grab active:cursor-grabbing"
      >
        {children}
      </animated.div>
    </div>
  );
}

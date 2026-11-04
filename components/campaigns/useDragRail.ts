'use client';

import { useRef, useState } from 'react';
import type { MouseEvent, PointerEvent } from 'react';

/** Past this many pixels, pressing the mouse on the row was a drag and not a press on a card */
const DRAG_START_PX = 5;
/** Longer than the glide onto a card */
const SNAP_BACK_MS = 700;

/**
 * A row of cards that scrolls sideways: fingers and trackpads scroll it natively, a mouse drags it. With `pressBringsIn`,
 * a mouse press on a card not in place brings it in instead of opening it (for a row showing one card and the next one's edge).
 */
export function useDragRail(count: number, { pressBringsIn = true }: { pressBringsIn?: boolean } = {}) {
  const [page, setPage] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const justDragged = useRef(false);
  const snapTimer = useRef<number | null>(null);

  // One card and the gap after it; a row of one has nowhere to go
  const stepOf = (rail: HTMLDivElement) => {
    const [first, second] = [rail.children[0] as HTMLElement | undefined, rail.children[1] as HTMLElement | undefined];
    return first && second ? second.offsetLeft - first.offsetLeft : Math.max(1, rail.clientWidth);
  };
  const goToIn = (rail: HTMLDivElement, index: number) => rail.scrollTo({ left: stepOf(rail) * Math.max(0, Math.min(count - 1, index)), behavior: 'smooth' });

  const handlers = {
    onScroll: (event: { currentTarget: HTMLDivElement }) => setPage(Math.round(event.currentTarget.scrollLeft / stepOf(event.currentTarget))),
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;
      const rail = event.currentTarget;
      // People drag again before the last card has landed: the hand takes over from that glide and its snapping timer
      if (snapTimer.current !== null) {
        window.clearTimeout(snapTimer.current);
        snapTimer.current = null;
        rail.scrollTo({ left: rail.scrollLeft, behavior: 'instant' });
      }
      drag.current = { x: event.clientX, left: rail.scrollLeft, moved: false };
    },
    onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
      const held = drag.current;
      if (!held) return;
      // The button came up where the row could not hear it: the mouse is only passing over now
      if (event.buttons === 0) {
        drag.current = null;
        return;
      }
      const dx = event.clientX - held.x;
      if (!held.moved && Math.abs(dx) < DRAG_START_PX) return;
      if (!held.moved) {
        held.moved = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        // Snapping would fight the hand while it drags
        event.currentTarget.style.scrollSnapType = 'none';
      }
      event.currentTarget.scrollLeft = held.left - dx;
    },
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => endDrag(event),
    onPointerCancel: (event: PointerEvent<HTMLDivElement>) => endDrag(event),
    // A press after a drag opens nothing. Read on the row: after a drag the browser sends the click to the row itself, not to a card
    onClickCapture: (event: MouseEvent<HTMLDivElement>) => {
      const rail = event.currentTarget;
      const index = [...rail.children].findIndex((card) => card.contains(event.target as Node));
      if (justDragged.current) {
        event.preventDefault();
        event.stopPropagation();
      } else if (pressBringsIn && index >= 0 && event.detail > 0 && index !== page) {
        event.preventDefault();
        event.stopPropagation();
        goToIn(rail, index);
      }
    },
  };

  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const held = drag.current;
    if (!held) return;
    drag.current = null;
    const rail = event.currentTarget;
    if (!held.moved) {
      // A press that stopped a glide: let the row settle on a card
      rail.style.scrollSnapType = '';
      return;
    }
    const step = stepOf(rail);
    const passed = (held.x - event.clientX) / step;
    // A short pull is enough to move on, like a swipe
    goToIn(rail, Math.round(held.left / step) + (Math.abs(passed) > 0.15 ? Math.sign(passed) : 0));
    // Snapping comes back once the card has landed, unless the hand comes back first
    snapTimer.current = window.setTimeout(() => {
      snapTimer.current = null;
      rail.style.scrollSnapType = '';
    }, SNAP_BACK_MS);
    // The click that follows this release is not a press on a card
    justDragged.current = true;
    window.setTimeout(() => {
      justDragged.current = false;
    }, 50);
  }

  return {
    railRef,
    page,
    handlers,
    goTo: (index: number) => {
      if (railRef.current) goToIn(railRef.current, index);
    },
  };
}

'use client';

import { useEffect, useRef } from 'react';

export default function ScrollActiveIntoView() {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const nav = ref.current?.closest('nav');
    if (!nav) return;

    const scrollActive = () => {
      const link = nav.querySelector<HTMLElement>('a.active');
      if (!link) return;
      const sidebar = nav.closest('.docs-sidebar');
      const panel = nav.parentElement;
      let scroller: HTMLElement | null = null;
      if (
        sidebar instanceof HTMLElement &&
        getComputedStyle(sidebar).display !== 'none' &&
        getComputedStyle(sidebar).overflowY === 'auto'
      ) {
        scroller = sidebar;
      } else if (panel instanceof HTMLElement && getComputedStyle(panel).display !== 'none') {
        scroller = panel;
      }
      if (!scroller) return;
      const linkRect = link.getBoundingClientRect();
      const boxRect = scroller.getBoundingClientRect();
      if (linkRect.top >= boxRect.top && linkRect.bottom <= boxRect.bottom) return;
      scroller.scrollTop += linkRect.top - boxRect.top - scroller.clientHeight / 2 + linkRect.height / 2;
    };

    scrollActive();
    const toggle = nav.closest('.docs-sidebar')?.querySelector<HTMLInputElement>('.course-nav-toggle');
    toggle?.addEventListener('change', scrollActive);
    return () => toggle?.removeEventListener('change', scrollActive);
  }, []);

  return <span ref={ref} hidden />;
}

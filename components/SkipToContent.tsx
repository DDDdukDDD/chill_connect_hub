'use client';

/** For keyboard and screen reader users: the first Tab on any page offers a jump past the top bar to the page's <main> */
export function SkipToContent() {
  return (
    <button
      type="button"
      onClick={() => {
        const main = document.querySelector('main');
        if (!main) return;
        main.setAttribute('tabindex', '-1');
        main.focus();
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100020] focus:px-4 focus:py-2 focus:rounded-full focus:bg-white focus:border focus:border-slate-200 focus:shadow-sm focus:text-sm focus:font-semibold focus:text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB] cursor-pointer"
    >
      ข้ามไปเนื้อหา
    </button>
  );
}

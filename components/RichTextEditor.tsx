'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Bold,
  Italic,
  List,
  MapPin,
  Clock,
  FileText,
  Trash2,
  Undo
} from 'lucide-react';

interface RichTextEditorProps {
  value: string; // Accepts HTML string or plain/markdown string
  onChange: (htmlContent: string) => void;
  placeholder?: string;
  templateLabel?: string;
  onApplyTemplate?: () => void;
  minHeight?: string;
  className?: string;
}

/**
 * Converts legacy plain/markdown string (with **bold**) to clean HTML
 */
export const markdownToHtml = (text: string): string => {
  if (!text) return '';
  // If it's already HTML (contains <p> or <br> or <div> or <strong>)
  if (/<[a-z][\s\S]*>/i.test(text)) {
    return text;
  }

  // Convert line breaks and **bold**
  const lines = text.split('\n');
  const htmlLines = lines.map((line) => {
    const processed = line
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');

    if (processed.startsWith('• ')) {
      return `<p class="ml-3">• ${processed.slice(2)}</p>`;
    }
    if (processed.trim() === '') {
      return '<br/>';
    }
    return `<p>${processed}</p>`;
  });

  return htmlLines.join('');
};

/**
 * Strips HTML tags and returns clean plain text for snippets, line-clamp and cards
 */
export const stripHtmlToPlainText = (html: string): string => {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/div>/gi, ' ')
    .replace(/<\/li>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<br\s*[\/]?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Formatter for rendering Description safely in Detail Pages
 */
export const renderDescriptionContent = (content: string) => {
  if (!content) return null;

  // If content has HTML tags
  if (/<[a-z][\s\S]*>/i.test(content)) {
    return (
      <div
        className="space-y-2.5 leading-relaxed font-normal text-slate-700 [&_strong]:font-extrabold [&_strong]:text-slate-900 [&_strong]:block [&_strong]:mt-3.5 [&_strong]:mb-1 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_li]:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Fallback markdown parsing for plain text
  const paragraphs = content.split('\n').filter((p) => p.trim() !== '');
  return (
    <div className="space-y-3 leading-relaxed font-normal text-slate-700">
      {paragraphs.map((para, idx) => {
        // Detect bold header pattern **Header:**
        const isHeader = /^\*\*(.*?)\*\*:?$/.test(para.trim());
        const cleanedPara = para.replace(/\*\*(.*?)\*\*/g, '$1');

        if (isHeader) {
          return (
            <h4 key={idx} className="font-extrabold text-slate-900 text-sm sm:text-base pt-2">
              {cleanedPara}
            </h4>
          );
        }

        if (para.trim().startsWith('•')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2 text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-800 shrink-0 mt-2" />
              <span>{cleanedPara.replace(/^•\s*/, '')}</span>
            </div>
          );
        }

        return (
          <p key={idx} className="leading-relaxed">
            {cleanedPara}
          </p>
        );
      })}
    </div>
  );
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'พิมพ์รายละเอียด...',
  templateLabel,
  onApplyTemplate,
  minHeight = '140px',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [characterCount, setCharacterCount] = useState(0);

  const calculateCount = React.useCallback(() => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || '';
      setCharacterCount(text.trim().length);
    }
  }, []);

  // Sync initial value into contentEditable
  useEffect(() => {
    if (editorRef.current) {
      const formattedHtml = markdownToHtml(value || '');
      if (editorRef.current.innerHTML !== formattedHtml) {
        editorRef.current.innerHTML = formattedHtml;
        calculateCount();
      }
    }
  }, [value, calculateCount]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
      calculateCount();
    }
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const insertCustomNode = (htmlSnippet: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, htmlSnippet);
      handleInput();
    }
  };

  return (
    <div className="w-full space-y-1.5 font-sans">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between p-1.5 bg-slate-100/90 rounded-t-xl border border-b-0 border-slate-200 text-xs flex-wrap gap-1.5">
        <div className="flex items-center gap-1 flex-wrap">
          {/* Bold */}
          <button
            type="button"
            onClick={() => exec('bold')}
            className="px-2 py-1 rounded-md bg-white hover:bg-slate-200 text-slate-800 font-extrabold flex items-center gap-1 cursor-pointer shadow-2xs text-[11px] transition-colors active:scale-95"
            title="ทำให้ตัวหนา (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
            <span>ตัวหนา</span>
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => exec('italic')}
            className="px-2 py-1 rounded-md bg-white hover:bg-slate-200 text-slate-800 italic flex items-center gap-1 cursor-pointer shadow-2xs text-[11px] transition-colors active:scale-95"
            title="ทำให้ตัวเอียง (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
            <span>ตัวเอียง</span>
          </button>

          {/* Bullet List */}
          <button
            type="button"
            onClick={() => exec('insertUnorderedList')}
            className="px-2 py-1 rounded-md bg-white hover:bg-slate-200 text-slate-800 font-bold flex items-center gap-1 cursor-pointer shadow-2xs text-[11px] transition-colors active:scale-95"
            title="ใส่สัญลักษณ์ข้อความจุดนำ (Bullet)"
          >
            <List className="w-3.5 h-3.5" />
            <span>Bullet ข้อ</span>
          </button>

          {/* Meeting Point Tag */}
          <button
            type="button"
            onClick={() => insertCustomNode('<p><strong>จุดนัดพบ:</strong> หน้าจุดนัดหมายหลัก</p>')}
            className="px-2 py-1 rounded-md bg-white hover:bg-slate-200 text-slate-800 font-bold flex items-center gap-1 cursor-pointer shadow-2xs text-[11px] transition-colors active:scale-95"
            title="แทรกแถวข้อความจุดนัดพบ"
          >
            <MapPin className="w-3 h-3 text-slate-500" />
            <span>จุดนัด</span>
          </button>

          {/* Time Tag */}
          <button
            type="button"
            onClick={() => insertCustomNode('<p><strong>กำหนดการ:</strong> 07:00 - 09:30 น.</p>')}
            className="px-2 py-1 rounded-md bg-white hover:bg-slate-200 text-slate-800 font-bold flex items-center gap-1 cursor-pointer shadow-2xs text-[11px] transition-colors active:scale-95"
            title="แทรกแถวข้อความกำหนดการ"
          >
            <Clock className="w-3 h-3 text-slate-500" />
            <span>เวลา</span>
          </button>
        </div>

        {/* Template Button */}
        {onApplyTemplate && (
          <button
            type="button"
            onClick={onApplyTemplate}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#4A7C59] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-all cursor-pointer shadow-2xs active:scale-95"
            title="คลิกเพื่อวางโครงสร้างตัวอย่างมาตรฐานลงในกล่องข้อความ"
          >
            <FileText className="w-3.5 h-3.5 text-[#4A7C59]" />
            <span>{templateLabel || 'ใช้โครงสร้างตัวอย่าง (Template)'}</span>
          </button>
        )}
      </div>

      {/* ContentEditable WYSIWYG Surface */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        style={{ minHeight: minHeight || '240px' }}
        data-placeholder={placeholder}
        className="w-full px-3.5 py-3 rounded-b-xl border border-slate-200 text-xs sm:text-[13px] leading-relaxed outline-none focus:border-[#4A7C59] focus:ring-1 focus:ring-[#4A7C59]/30 bg-white text-slate-800 overflow-y-auto max-h-[380px] empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 [&_strong]:font-black [&_strong]:text-slate-950 [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mb-1.5"
      />

      {/* Character Counter & Helper Footer */}
      <div className="flex items-center justify-between text-[10.5px] text-slate-400 px-1">
        <span>💡 คุณสามารถพิมพ์ตัวหนาหรือไฮไลต์หัวข้อได้ทันทีโดยไม่ต้องใส่เครื่องหมาย **</span>
        <span>{characterCount} ตัวอักษร</span>
      </div>
    </div>
  );
};

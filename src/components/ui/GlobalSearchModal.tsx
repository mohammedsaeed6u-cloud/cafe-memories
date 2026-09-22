'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Search, X, ArrowLeft, Tv, Camera, Gift, Calculator, Sparkles, ShieldCheck, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SearchItem {
  id: string;
  title: string;
  description: string;
  category: string;
  href: string;
  icon: React.ElementType;
}

const SEARCH_ITEMS: SearchItem[] = [
  {
    id: 'customer',
    title: 'تجربة العميل وكارت التصوير',
    description: 'محاكاة كاملة لكاميرا العميل وكارت تصوير بولارويد مع أختام الولاء',
    category: 'التطبيقات',
    href: '/c/espresso-lab',
    icon: Camera,
  },
  {
    id: 'wall',
    title: 'شاشة الصالة الحية (Live TV Wall)',
    description: 'شاشة العرض المباشر التفاعلية للبث الحي في كافيهات القهوة المختصة',
    category: 'التطبيقات',
    href: '/wall/screen-1',
    icon: Tv,
  },
  {
    id: 'dashboard',
    title: 'لوحة تحكم التاجر والكافيه',
    description: 'إدارة الفروع، إعدادات الولاء، رموز PIN الطاقم، واعتماد الصور',
    category: 'الإدارة',
    href: '/dashboard',
    icon: Sparkles,
  },
  {
    id: 'roi',
    title: 'حاسبة العائد المتوقع (ROI Estimator)',
    description: 'حساب الأثر المالي والزيارات المتكررة وتكلفة المنظومة',
    category: 'الخدمات',
    href: '#roi',
    icon: Calculator,
  },
  {
    id: 'pricing',
    title: 'الباقات والاشتراكات',
    description: 'باقة الكافيهات المستقلة، الباقة الاحترافية مع الشاشة الحية، والمؤسسات',
    category: 'الأسعار',
    href: '#pricing',
    icon: Gift,
  },
  {
    id: 'faq',
    title: 'الأسئلة الشائعة والأجهزة المدعومة',
    description: 'كل ما تحتاج معرفته عن الشاشات والعمل بدون إنترنت وتوافق الطابعات',
    category: 'المساعدة',
    href: '#faq',
    icon: ShieldCheck,
  },
  {
    id: 'privacy',
    title: 'سياسة الخصوصية وأمان البيانات',
    description: 'معايير حماية صور الزوار وتشفير البيانات وعزل المستأجرين',
    category: 'قانوني',
    href: '/privacy',
    icon: FileText,
  },
  {
    id: 'terms',
    title: 'شروط الخدمة والاستخدام',
    description: 'شروط اشتراك المقاهي وحقوق الملكية والتزامات الخدمة',
    category: 'قانوني',
    href: '/terms',
    icon: FileText,
  },
];

export function GlobalSearchModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = query.trim()
    ? SEARCH_ITEMS.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.description.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : SEARCH_ITEMS;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        handleSelect(filtered[selectedIndex].href);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  const handleSelect = (href: string) => {
    onClose();
    if (href.startsWith('#')) {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      router.push(href);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-stone-950/60 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="البحث في المنظومة"
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-[#FAF6EE] dark:bg-[#142721] border border-[#E8DCC6] dark:border-[#2A4F44] shadow-2xl overflow-hidden font-cairo text-right animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E8DCC6] dark:border-[#2A4F44] gap-3">
          <Search className="w-5 h-5 text-[#8A9A7B] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="ابحث في المنظومة (الباقات، الشاشة الحية، كارت العميل...)"
            className="flex-1 bg-transparent border-none outline-none text-sm text-[#3B2F2A] dark:text-[#FAF6EE] placeholder-[#3B2F2A]/40 dark:placeholder-[#FAF6EE]/40 font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[#3B2F2A]/60 dark:text-[#FAF6EE]/60 hover:text-[#3B2F2A] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#E8DCC6] dark:bg-[#1E3A32] text-[#3B2F2A] dark:text-[#FAF6EE]">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#3B2F2A]/60 dark:text-[#FAF6EE]/60">
              لم نجد أي نتائج مطابقة لـ &quot;{query}&quot;
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.href)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full p-3 rounded-2xl flex items-center justify-between gap-3 text-right transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#1E3A32] text-[#FAF6EE]'
                      : 'hover:bg-[#E8DCC6]/40 dark:hover:bg-[#1E3A32]/40 text-[#3B2F2A] dark:text-[#FAF6EE]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-[#FAF6EE] text-[#1E3A32]'
                          : 'bg-[#E8DCC6] dark:bg-[#1E3A32] text-[#1E3A32] dark:text-[#FAF6EE]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs truncate">{item.title}</span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-mono ${
                            isSelected
                              ? 'bg-white/20 text-[#FAF6EE]'
                              : 'bg-[#8A9A7B]/15 text-[#8A9A7B]'
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p
                        className={`text-[11px] truncate mt-0.5 ${
                          isSelected ? 'text-[#E8DCC6]' : 'text-[#3B2F2A]/70 dark:text-[#FAF6EE]/70'
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <ArrowLeft
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? '-translate-x-1 text-[#B85C43]' : 'opacity-40'
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 border-t border-[#E8DCC6] dark:border-[#2A4F44] bg-[#FAF6EE]/50 dark:bg-[#142721]/50 flex items-center justify-between text-[11px] text-[#3B2F2A]/60 dark:text-[#FAF6EE]/60 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ للتنقل</span>
            <span>↵ للاختيار</span>
          </div>
          <span>memories search </span>
        </div>
      </div>
    </div>
  );
}

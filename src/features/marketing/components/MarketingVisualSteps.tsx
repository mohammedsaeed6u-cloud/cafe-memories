'use client';

import React from 'react';

export function MarketingVisualSteps() {
  return (
    <>
      {/* Tappy Stamp Divider */}
      <div className="stamp-divider" aria-hidden="true">
        <div className="sd-circle on" />
        <div className="sd-circle on" />
        <span className="sd-star">✦</span>
        <div className="sd-circle on" />
        <div className="sd-circle on" />
        <span className="sd-star">✦</span>
        <div className="sd-circle on" />
        <div className="sd-circle on" />
        <span className="sd-star">✦</span>
        <div className="sd-circle on" />
        <div className="sd-circle on" />
      </div>

      <section className="how-section" id="how">
        <div className="sec-in">
          {/* Section Header */}
          <div className="how-head">
            <span className="kicker">THE SAAS JOURNEY • كيف يعمل؟</span>
            <h2 className="h2-poster center">
              Three taps to <span className="purp">loyal.</span>
            </h2>
            <p className="sub-poster center">
              From first visit to favourite spot — no apps, no cards, no fuss.
            </p>
          </div>

          {/* Three Taps Grid */}
          <div className="how-grid">
            {/* Step 1 */}
            <div className="how-block how-block--1">
              <span className="how-step-num" aria-hidden="true">01</span>
              <div className="how-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 7a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M8 11l2 2 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="18.5" cy="5.5" r="3" fill="#F0456A" />
                </svg>
              </div>
              <h3 className="how-title-poster">مسح QR الطاولة السريع وضبط المكافآت</h3>
              <p className="how-body-poster">
                اختر عدد الأختام والمكافأة. يمسح العميل الـ QR من طاولته بدون تحميل أي تطبيق، ويبدأ فوراً في جمع الأختام.
              </p>
              <div className="how-meta">
                <span className="how-meta-star">✦</span>
                <span>جاهز في دقيقتين (Live in 5 minutes)</span>
              </div>
            </div>

            {/* Arrow 1 */}
            <div className="how-arrow" aria-hidden="true">
              <span>→</span>
            </div>

            {/* Step 2 */}
            <div className="how-block how-block--2">
              <span className="how-step-num" aria-hidden="true">02</span>
              <div className="how-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="7" y="2" width="10" height="20" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M10 5.5h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  <path d="M14.5 11l2-2M16.5 13l2.5 0M14.5 15l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="how-title-poster">حفظ الكارت في Apple & Google Wallet</h3>
              <p className="how-body-poster">
                يلمس العميل هاتفه بالكاونتر بنقرة واحدة. يستقر كارت علامتك في المحفظة الرسمية لهاتفه للأبد بدون نسيان أو ضياع.
              </p>
              <div className="how-meta">
                <span className="how-meta-star">✦</span>
                <span>ختم فوري بنقرة واحدة (Instant stamp)</span>
              </div>
            </div>

            {/* Arrow 2 */}
            <div className="how-arrow" aria-hidden="true">
              <span>→</span>
            </div>

            {/* Step 3 */}
            <div className="how-block how-block--3">
              <span className="how-step-num" aria-hidden="true">03</span>
              <div className="how-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 17l4-4 4 4 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 6h4v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="3" cy="17" r="1.4" fill="currentColor" />
                  <circle cx="7" cy="13" r="1.4" fill="currentColor" />
                  <circle cx="11" cy="17" r="1.4" fill="currentColor" />
                </svg>
              </div>
              <h3 className="how-title-poster">ختم الكاونتر وربط الذكرى وتكرار الزيارة</h3>
              <p className="how-body-poster">
                يختم الكاشير في ثانيتين. وتتولى إشعارات APNs Push Notifications تذكير العميل بالعودة كلما اقترب 100م من فرعك.
              </p>
              <div className="how-meta">
                <span className="how-meta-star">✦</span>
                <span>تذكير شاشة القفل تلقائياً (Reminders built in)</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

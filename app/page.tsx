'use client';

import React from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>✨ 100% Client-Side Private Processing</div>
          <h1 className={styles.title}>
            Professional Passport Photos<br />
            <span className={styles.gradientText}>In Seconds.</span>
          </h1>
          <p className={styles.subtitle}>
            Upload your photo, let our local AI perfectly crop your face, remove backgrounds, enhance lighting, and instantly generate a print-ready A4 PDF sheet for <strong>zero cost</strong>.
          </p>
          <div className={styles.ctaRow}>
            <Link href="/studio" className={styles.primaryBtn}>
              Start Creating →
            </Link>
            <span className={styles.featureList}>
              <span>✓ No server uploads</span>
              <span className={styles.dot}>•</span>
              <span>✓ Free forever</span>
            </span>
          </div>
        </div>
        
        <div className={styles.heroImage}>
          <div className={styles.mockup}>
            <div className={styles.mockupHeader}>
              <div className={styles.mockupDot} style={{ background: '#ff5f56' }} />
              <div className={styles.mockupDot} style={{ background: '#ffbd2e' }} />
              <div className={styles.mockupDot} style={{ background: '#27c93f' }} />
            </div>
            <div className={styles.mockupBody}>
              <div className={styles.grid}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className={styles.mockupPhoto}>
                    <div className={styles.photoInner}>👤</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.features}>
        <div className={styles.featureCard}>
          <div className={styles.fIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="22" y1="12" x2="18" y2="12"></line>
              <line x1="6" y1="12" x2="2" y2="12"></line>
              <line x1="12" y1="6" x2="12" y2="2"></line>
              <line x1="12" y1="22" x2="12" y2="18"></line>
            </svg>
          </div>
          <h3>AI Face Detection</h3>
          <p>Automatically crops to perfect passport dimensions (35x45mm) with ICAO compliance checks.</p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.fIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
            </svg>
          </div>
          <h3>Background Removal</h3>
          <p>Instant magic background removal using advanced MediaPipe segmentation running locally.</p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.fIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <h3>Pro Enhancements</h3>
          <p>Adjust brightness, contrast, sharpness, and warmth to fix imperfect lighting.</p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.fIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
          </div>
          <h3>Ready to Print</h3>
          <p>Exports losslessly to A4 PDF or PNG, perfectly spaced with cut marks and margins.</p>
        </div>
      </div>

      <section className={styles.seoContent}>
        <div className={styles.seoSection}>
          <h2 className={styles.seoTitle}>Mobile se Passport Size Photo Kaise Banaye?</h2>
          <p className={styles.seoText}>
            Kya aap apne mobile se professional passport photo banana chahte hain? PassPhoto Studio ek best online tool hai jo aapko <strong>free mein</strong> passport photo banane ki suvidha deta hai. Bas niche diye gaye steps follow karein:
          </p>
          <div className={styles.seoSteps}>
            <div className={styles.seoStep}>
              <span className={styles.stepNumber}>1</span>
              <div>
                <h4>Photo Upload Karein</h4>
                <p>Apni gallery se ek achhi photo select karein jisme aapka chehra saaf dikh raha ho.</p>
              </div>
            </div>
            <div className={styles.seoStep}>
              <span className={styles.stepNumber}>2</span>
              <div>
                <h4>Auto Crop & Background</h4>
                <p>Hamara AI automatically face detect karke perfect size mein crop kar dega aur background remove kar dega.</p>
              </div>
            </div>
            <div className={styles.seoStep}>
              <span className={styles.stepNumber}>3</span>
              <div>
                <h4>Download & Print</h4>
                <p>A4 sheet generate karein aur kisi bhi printer se print nikal lein. Bilkul asaan!</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.faqSection}>
          <h2 className={styles.seoTitle}>Frequently Asked Questions (FAQ)</h2>
          <div className={styles.faqGrid}>
            <div className={styles.faqItem}>
              <h4>Kya ye service free hai?</h4>
              <p>Haan, PassPhoto Studio bilkul free hai. Aap jitni chahe utni passport photos bana sakte hain bina kisi charge ke.</p>
            </div>
            <div className={styles.faqItem}>
              <h4>Is it safe to upload my photos?</h4>
              <p>Yes! Your photos never leave your device. All processing happens locally in your browser, making it 100% private and secure.</p>
            </div>
            <div className={styles.faqItem}>
              <h4>How to make passport size photo in mobile?</h4>
              <p>Just open our website on your mobile browser, upload your selfie, and let our AI do the work. It's the easiest way to make passport photos on the go.</p>
            </div>
            <div className={styles.faqItem}>
              <h4>Print kaise nikalne?</h4>
              <p>Hum aapko ek A4 size ki PDF sheet dete hain jise aap kisi bhi cyber cafe ya home printer se print kar sakte hain.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

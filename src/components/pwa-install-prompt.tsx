'use client';

import { useState, useEffect } from 'react';
import { X, Share, PlusSquare, MoreVertical, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { useStableTranslation } from '@/hooks/useStableTranslation';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWA_PROMPT_SHOWN_KEY = 'pwa-install-prompt-shown';

export function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { t } = useStableTranslation();

  const [{ y }, api] = useSpring(() => ({ y: 0 }));

  const bind = useDrag(
    ({ down, movement: [, my], velocity: [, vy], direction: [, dy], cancel }) => {
      // Only allow dragging down
      if (my < 0) {
        api.start({ y: 0, immediate: true });
        return;
      }

      if (down) {
        api.start({ y: my, immediate: true });
      } else {
        // If dragged down more than 80px or with high velocity downward, dismiss
        if (my > 80 || (vy > 0.5 && dy > 0)) {
          api.start({ y: 300, immediate: false, config: { tension: 200, friction: 25 } });
          setTimeout(() => handleDismiss(), 200);
        } else {
          api.start({ y: 0, immediate: false, config: { tension: 300, friction: 30 } });
        }
      }
    },
    { axis: 'y', filterTaps: true }
  );

  useEffect(() => {
    // Check if prompt was already shown before
    if (localStorage.getItem(PWA_PROMPT_SHOWN_KEY)) {
      return;
    }

    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    // Detect platform
    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroidDevice = /Android/.test(ua);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // For Android/Chrome - listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS - show custom instructions after a delay
    if (isIOSDevice) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  // Any dismiss marks as shown - won't show again
  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(PWA_PROMPT_SHOWN_KEY, 'true');
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe">
      <animated.div
        {...bind()}
        style={{ y, touchAction: 'none' }}
        className="mx-auto max-w-md rounded-xl bg-card border border-border shadow-lg overflow-hidden"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1 cursor-grab active:cursor-grabbing">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="px-4 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Download className="w-6 h-6 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">{t('pwa.installTitle')}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {t('pwa.installDescription')}
              </p>

              {isIOS && (
                <div className="mt-3 text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">1</span>
                    <span className="flex items-center gap-1">
                      {t('pwa.iosStep1')} <Share className="w-4 h-4 inline" />
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">2</span>
                    <span>{t('pwa.iosStep2')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">3</span>
                    <span className="flex items-center gap-1">
                      {t('pwa.iosStep3')} <PlusSquare className="w-4 h-4 inline" />
                    </span>
                  </div>
                </div>
              )}

              {isAndroid && !deferredPrompt && (
                <div className="mt-3 text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">1</span>
                    <span className="flex items-center gap-1">
                      {t('pwa.androidStep1')} <MoreVertical className="w-4 h-4 inline" /> {t('pwa.androidStep1Icon')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">2</span>
                    <span>{t('pwa.androidStep2')}</span>
                  </div>
                </div>
              )}

              {deferredPrompt && (
                <div className="mt-3">
                  <Button onClick={handleInstall} size="sm" className="w-full">
                    {t('pwa.installButton')}
                  </Button>
                </div>
              )}
            </div>

            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 rounded-md hover:bg-muted transition-colors"
              aria-label={t('common.close')}
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </animated.div>
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { fetchGoogleClientId, loadGsiScript, redirectToGoogleOAuth2 } from '../../utils/googleAuth';

export const GoogleButton = ({
  onSuccess,
  onError,
  onClick,
  portal = 'partner',
  apiBaseUrl = '/api',
  disabled = false,
  label = 'Continue with Google',
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const hiddenBtnRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const initGsi = async () => {
      await loadGsiScript();
      if (!isMounted || !window.google?.accounts?.id) return;
      const clientId = await fetchGoogleClientId(apiBaseUrl);
      if (!clientId) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential && onSuccess) {
              onSuccess(response.credential);
            } else if (onError) {
              onError(new Error('Missing Google credentials'));
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        if (hiddenBtnRef.current) {
          window.google.accounts.id.renderButton(hiddenBtnRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            width: 320,
          });
        }
      } catch (err) {
        console.warn('[GoogleButton] Partner GSI initialization warning:', err);
      }
    };

    initGsi();
    return () => {
      isMounted = false;
    };
  }, [apiBaseUrl, onSuccess, onError]);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
      return;
    }

    e.preventDefault();
    if (disabled || loading) return;

    // 1. If hidden rendered Google button exists, click its inner button to open native popup
    if (hiddenBtnRef.current) {
      const nativeBtn =
        hiddenBtnRef.current.querySelector('div[role="button"]') ||
        hiddenBtnRef.current.querySelector('button');
      if (nativeBtn) {
        nativeBtn.click();
        return;
      }
    }

    // 2. Try Google One Tap prompt
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fall back to server-side OAuth2 redirect flow
          redirectToGoogleOAuth2(portal, apiBaseUrl);
        }
      });
      return;
    }

    // 3. Direct server-side redirect fallback
    redirectToGoogleOAuth2(portal, apiBaseUrl);
  };

  return (
    <div className="relative w-full">
      {/* Hidden container where GIS renders official button to trigger native popup */}
      <div ref={hiddenBtnRef} className="hidden" aria-hidden="true" />

      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className={`w-full py-2.5 sm:py-3 px-4 text-xs sm:text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{label}</span>
      </button>
    </div>
  );
};

export default GoogleButton;

import React, { useState, useEffect } from "react";
import { Button, Checkbox, Modal } from "antd";
import { SettingOutlined } from "@ant-design/icons";

const COOKIE_CONSENT_KEY = "lawmaster_cookie_consent";
const COOKIE_PREFERENCE_KEY = "lawmaster_cookie_preferences";

const CookieConsent = () => {
  // null = not yet determined (waiting for useEffect), false = hidden, true = show banner
  const [bannerVisible, setBannerVisible] = useState(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // No consent recorded — show the banner
      setBannerVisible(true);
      setHasConsented(false);
    } else {
      // Already consented — hide banner, show settings cog
      setBannerVisible(false);
      setHasConsented(true);
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCE_KEY);
      if (savedPrefs) {
        try {
          setPreferences(JSON.parse(savedPrefs));
        } catch (_) {}
      }
    }
  }, []);

  const saveConsent = (prefs) => {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        preferences: prefs,
      }),
    );
    localStorage.setItem(COOKIE_PREFERENCE_KEY, JSON.stringify(prefs));

    if (prefs.analytics) {
      console.log("Analytics enabled");
    }
    if (prefs.marketing) {
      console.log("Marketing enabled");
    }
  };

  const handleAcceptAll = () => {
    const allPrefs = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allPrefs);
    saveConsent(allPrefs);
    setBannerVisible(false);
    setHasConsented(true);
  };

  const handleRejectAll = () => {
    const minimalPrefs = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    setPreferences(minimalPrefs);
    saveConsent(minimalPrefs);
    setBannerVisible(false);
    setHasConsented(true);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
    setSettingsVisible(false);
    setBannerVisible(false);
    setHasConsented(true);
  };

  // Still waiting for useEffect — render nothing to avoid flash
  if (bannerVisible === null) return null;

  return (
    <>
      {/* Floating settings cog — only shown after consent has been given */}
      {!bannerVisible && hasConsented && (
        <Button
          type="text"
          icon={<SettingOutlined />}
          onClick={() => setSettingsVisible(true)}
          className="fixed bottom-4 right-4 bg-white shadow-lg rounded-full px-4 z-50"
          size="small">
          Cookie Settings
        </Button>
      )}

      {/* Cookie Banner */}
      {bannerVisible && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-gray-200 p-4 z-50">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  We value your privacy
                </h3>
                <p className="text-sm text-gray-600">
                  We use cookies to enhance your browsing experience, serve
                  personalized content, and analyze our traffic. By clicking
                  "Accept All", you consent to our use of cookies.{" "}
                  <a href="/privacy-policy" className="text-blue-600 underline">
                    Read More
                  </a>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setSettingsVisible(true)}>
                Customize
              </Button>
              <Button onClick={handleRejectAll} className="bg-gray-100">
                Reject All
              </Button>
              <Button type="primary" onClick={handleAcceptAll}>
                Accept All
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Settings Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <span>Cookie Preferences</span>
          </div>
        }
        open={settingsVisible}
        onCancel={() => setSettingsVisible(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setSettingsVisible(false)}>Cancel</Button>
            <Button type="primary" onClick={handleSavePreferences}>
              Save Preferences
            </Button>
          </div>
        }
        width={500}>
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            We use different types of cookies to optimize your experience on our
            website. Click on the categories below to learn more and change your
            preferences.
          </p>

          {[
            {
              key: "necessary",
              label: "Necessary Cookies",
              desc: "Essential for the website to function",
              disabled: true,
            },
            {
              key: "functional",
              label: "Functional Cookies",
              desc: "Enable personalized features",
              disabled: false,
            },
            {
              key: "analytics",
              label: "Analytics Cookies",
              desc: "Help us understand how visitors interact",
              disabled: false,
            },
            {
              key: "marketing",
              label: "Marketing Cookies",
              desc: "Used to deliver relevant advertisements",
              disabled: false,
            },
          ].map(({ key, label, desc, disabled }) => (
            <div key={key} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{label}</h4>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <Checkbox
                  checked={preferences[key]}
                  disabled={disabled}
                  onChange={
                    disabled
                      ? undefined
                      : (e) =>
                          setPreferences((prev) => ({
                            ...prev,
                            [key]: e.target.checked,
                          }))
                  }
                />
              </div>
            </div>
          ))}

          <div className="text-sm text-gray-500 pt-2">
            <p>
              For more information about how we use cookies, please read our{" "}
              <a href="/privacy-policy" className="text-blue-600 underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CookieConsent;

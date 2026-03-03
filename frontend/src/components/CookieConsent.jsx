import React, { useState, useEffect } from "react";
import { Button, Checkbox, Modal } from "antd";
import { SettingOutlined } from "@ant-design/icons";

const COOKIE_CONSENT_KEY = "lawmaster_cookie_consent";
const COOKIE_PREFERENCE_KEY = "lawmaster_cookie_preferences";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    } else {
      const savedPrefs = localStorage.getItem(COOKIE_PREFERENCE_KEY);
      if (savedPrefs) {
        setPreferences(JSON.parse(savedPrefs));
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allPrefs = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    setPreferences(allPrefs);
    saveConsent(allPrefs);
    setVisible(false);
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
    setVisible(false);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
    setSettingsVisible(false);
    setVisible(false);
  };

  const saveConsent = (prefs) => {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({
        timestamp: new Date().toISOString(),
        preferences: prefs,
      }),
    );
    localStorage.setItem(COOKIE_PREFERENCE_KEY, JSON.stringify(prefs));

    // Apply preferences (e.g., load analytics scripts)
    if (prefs.analytics) {
      // Enable analytics
      console.log("Analytics enabled");
    }
    if (prefs.marketing) {
      // Enable marketing cookies
      console.log("Marketing enabled");
    }
  };

  const handleManagePreferences = () => {
    setSettingsVisible(true);
  };

  if (!visible && localStorage.getItem(COOKIE_CONSENT_KEY)) {
    return (
      <Button
        type="text"
        icon={<SettingOutlined />}
        onClick={() => setSettingsVisible(true)}
        className="fixed bottom-4 right-4 bg-white shadow-lg rounded-full px-4 z-50"
        size="small">
        Cookie Settings
      </Button>
    );
  }

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] border-t border-gray-200 p-4 z-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {/* <CookieOutlined className="text-2xl text-blue-600 mt-1" /> */}
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
            <Button onClick={handleManagePreferences}>Customize</Button>
            <Button onClick={handleRejectAll} className="bg-gray-100">
              Reject All
            </Button>
            <Button type="primary" onClick={handleAcceptAll}>
              Accept All
            </Button>
          </div>
        </div>
      </div>

      {/* Cookie Settings Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            {/* <CookieOutlined className="text-blue-600" /> */}
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

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Necessary Cookies</h4>
                <p className="text-xs text-gray-500">
                  Essential for the website to function
                </p>
              </div>
              <Checkbox checked={preferences.necessary} disabled />
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Functional Cookies</h4>
                <p className="text-xs text-gray-500">
                  Enable personalized features
                </p>
              </div>
              <Checkbox
                checked={preferences.functional}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    functional: e.target.checked,
                  })
                }
              />
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Analytics Cookies</h4>
                <p className="text-xs text-gray-500">
                  Help us understand how visitors interact
                </p>
              </div>
              <Checkbox
                checked={preferences.analytics}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    analytics: e.target.checked,
                  })
                }
              />
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Marketing Cookies</h4>
                <p className="text-xs text-gray-500">
                  Used to deliver relevant advertisements
                </p>
              </div>
              <Checkbox
                checked={preferences.marketing}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    marketing: e.target.checked,
                  })
                }
              />
            </div>
          </div>

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

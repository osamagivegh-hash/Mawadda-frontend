"use client";

import { useState } from "react";
import Link from "next/link";

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    matchNotifications: true,
    messageNotifications: true,
    consultationReminders: true,
    marketingEmails: false,
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  const ToggleSwitch = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-accent-600' : 'bg-slate-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-white to-primary-50 py-12">
      <div className="section-container max-w-2xl">
        <div className="mb-6">
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 text-accent-600 hover:text-accent-700"
          >
            ← العودة للملف الشخصي
          </Link>
        </div>

        <div className="rounded-3xl border border-accent-100 bg-white p-8 shadow-lg">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-secondary-900">🔔 إعدادات الإشعارات</h1>
            <p className="mt-2 text-secondary-600">
              تحكم في الإشعارات التي تريد استلامها
            </p>
          </div>

          <div className="space-y-6">
            {/* Email Notifications */}
            <div className="border-b border-slate-100 pb-6">
              <h3 className="text-lg font-semibold text-secondary-800 mb-4">📧 إشعارات البريد الإلكتروني</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-secondary-700">الإشعارات العامة</p>
                    <p className="text-sm text-secondary-500">استقبال الإشعارات المهمة عبر البريد</p>
                  </div>
                  <ToggleSwitch 
                    enabled={settings.emailNotifications} 
                    onToggle={() => handleToggle('emailNotifications')} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-secondary-700">رسائل تسويقية</p>
                    <p className="text-sm text-secondary-500">عروض وأخبار المنصة</p>
                  </div>
                  <ToggleSwitch 
                    enabled={settings.marketingEmails} 
                    onToggle={() => handleToggle('marketingEmails')} 
                  />
                </div>
              </div>
            </div>

            {/* SMS Notifications */}
            <div className="border-b border-slate-100 pb-6">
              <h3 className="text-lg font-semibold text-secondary-800 mb-4">📱 إشعارات الرسائل النصية</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-secondary-700">الرسائل النصية</p>
                  <p className="text-sm text-secondary-500">استقبال إشعارات مهمة عبر SMS</p>
                </div>
                <ToggleSwitch 
                  enabled={settings.smsNotifications} 
                  onToggle={() => handleToggle('smsNotifications')} 
                />
              </div>
            </div>

            {/* App Notifications */}
            <div className="border-b border-slate-100 pb-6">
              <h3 className="text-lg font-semibold text-secondary-800 mb-4">🔔 إشعارات التطبيق</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-secondary-700">إشعارات المطابقة</p>
                    <p className="text-sm text-secondary-500">عند وجود مطابقات جديدة</p>
                  </div>
                  <ToggleSwitch 
                    enabled={settings.matchNotifications} 
                    onToggle={() => handleToggle('matchNotifications')} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-secondary-700">إشعارات الرسائل</p>
                    <p className="text-sm text-secondary-500">عند استلام رسائل جديدة</p>
                  </div>
                  <ToggleSwitch 
                    enabled={settings.messageNotifications} 
                    onToggle={() => handleToggle('messageNotifications')} 
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-secondary-700">تذكير الاستشارات</p>
                    <p className="text-sm text-secondary-500">تذكير بمواعيد الاستشارات</p>
                  </div>
                  <ToggleSwitch 
                    enabled={settings.consultationReminders} 
                    onToggle={() => handleToggle('consultationReminders')} 
                  />
                </div>
              </div>
            </div>
          </div>

          {success && (
            <div className="mb-6 rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-600">
              ✅ تم حفظ إعدادات الإشعارات بنجاح!
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 rounded-full bg-accent-600 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-accent-700 hover:shadow-lg disabled:opacity-70"
            >
              {loading ? "جاري الحفظ..." : "💾 حفظ الإعدادات"}
            </button>
            
            <Link
              href="/profile"
              className="rounded-full border border-slate-200 px-6 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              إلغاء
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

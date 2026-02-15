"use client";

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestNotificationPermission } from "@/lib/notifications";

export function NotificationPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // 通知許可が未設定の場合のみプロンプト表示
    if (
      "Notification" in window &&
      Notification.permission === "default" &&
      !localStorage.getItem("notification-prompt-dismissed")
    ) {
      // 初回訪問から5秒後に表示
      const timer = setTimeout(() => setShow(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setShow(false);
      localStorage.setItem("notification-prompt-dismissed", "true");
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("notification-prompt-dismissed", "true");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-stone-200 bg-white p-4 shadow-lg dark:border-stone-800 dark:bg-stone-900">
      <button
        onClick={handleDismiss}
        className="absolute right-2 top-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#c35a2c]/10 dark:bg-[#c35a2c]/20">
          <Bell className="h-5 w-5 text-[#c35a2c]" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            通知を有効にしますか?
          </h3>
          <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
            タスクの完了や失敗時にブラウザ通知でお知らせします
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={handleEnable}
              className="h-7 bg-[#c35a2c] hover:bg-[#a84d26] text-white text-xs"
            >
              有効にする
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-7 text-xs text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
            >
              後で
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

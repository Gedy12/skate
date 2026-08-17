"use client";

import { useEffect } from "react";
import { App } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { Capacitor } from "@capacitor/core";

export default function CapacitorInitializer() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Hardware Back Button Handling
      App.addListener("backButton", ({ canGoBack }) => {
        if (!canGoBack) {
          App.exitApp();
        } else {
          window.history.back();
        }
      });

      // Configure Status Bar
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
      StatusBar.setBackgroundColor({ color: "#1e293b" }).catch(() => {});

      // Hide splash screen when ready
      setTimeout(() => {
        SplashScreen.hide();
      }, 500);
    }
  }, []);

  return null;
}

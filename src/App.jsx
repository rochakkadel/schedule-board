/* eslint-disable no-unused-vars */

// Import React hooks
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import "./App.css";

// Import Firebase modules
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  setLogLevel,
  getDocs,
} from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

// --- Firebase Configuration ---
// This will be populated by the .env.local file or GitHub Secrets during build
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Check if Firebase config is valid
const isFirebaseConfigValid = () => {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
};

// Initialize Firebase (Modular syntax)
let app, db, auth;
if (isFirebaseConfigValid()) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    setLogLevel("debug"); // Enable Firebase logging
    console.log("Firebase initialized successfully");
  } catch (e) {
    console.error("Firebase initialization error:", e);
    // Create dummy objects to prevent further crashes
    db = null;
    auth = null;
  }
} else {
  console.error("Firebase configuration is missing. Required values:", {
    hasApiKey: !!firebaseConfig.apiKey,
    hasAuthDomain: !!firebaseConfig.authDomain,
    hasProjectId: !!firebaseConfig.projectId,
    hasAppId: !!firebaseConfig.appId,
  });
  db = null;
  auth = null;
}

// --- App ID Handling ---
const appId = "default-app-id";

// --- Constants ---
const ACCESS_CODE = "91965";
const DEFAULT_SITE_NAMES = [
  "Rochak Kadel",
  "736 Mission",
  "600 Cal",
  "120 Kearny",
  "1128 Market",
  "420 23rd",
  "1 La Avanzada",
  "500 Howard",
  "500 Pine",
  "1800 Mission",
  "130 Battery",
  "1400 Geary",
  "300 Kansas",
  "633 Folsom",
  "501 2nd",
  "111 Pine",
  "400 Paul",
  "1 Kearny St",
  "1200 Van Ness",
  "181 Fremont",
  "274 Brannan",
  "360 Spear",
  "1035 Market",
  "150 Spear",
  "750 Battery",
  "1635 Divisadero",
  "115 Sansome",
  "180 Montgomery",
  "220 Montgomery",
  "601 Cal",
  "711 Eddy",
  "1280 Laguna",
  "71 Stevenson",
  "240 Stockton",
  "30 Grant",
  "170 Maiden Lane",
  "599 Skyline",
  "456 Montgomery",
  "717 Market",
  "201 Mission",
  "101 Mission",
  "100 Montgomery",
  "166 Geary",
  "26 O'Farrell",
  "153 Kearny",
  "110 Sutter",
  "311 Cal",
  "90 NM",
  "785 Market",
  "230 Cal",
  "101 Montgomery",
  "425 Cal",
  "210 Post",
  "30 Maiden Lane",
  "222 Kearny",
  "150 Post",
  "1019 Market",
   "Sutro Tower",
  "425 Market",
  "A.Shaef Breaks (717M, 240S, 115S)",
  "A.Hayes Breaks (425C, 101M, 153K, 150P)",
  "Y.Perez Breaks (71S, 1019M, 90NM, 30G)",
  "I.Anwar Breaks (210P, 30ML, 111P)",
  "E.Walin Breaks (750B, 222K, 230C)",
  "M.Horn Breaks (26O, 101M, 110S, 1K)",
  
];
const FONT_COLORS = ["#000000", "#FFFFFF", "#FF0000"]; // black, white, red
const FILL_COLORS = ["#FFFFFF", "#008000", "#0000FF", "#000000", "#FFA500", "#800080"]; // white, green, blue, black, orange, purple

const COLOR_COMPLETE_BG = "#32CD32"; // Lighter Green
const COLOR_COMPLETE_FONT = "#FFFFFF"; // White
const COLOR_OPS_BG = "#6495ED"; // Lighter Blue
const COLOR_OPS_FONT = "#FFFFFF"; // White
const ANALYSIS_URL =
  "https://xxxrkxxxrkxxx-ui.github.io/Analysis/";
const SITE_MANAGER_URL =
  "https://xxxrkxxxrkxxx-ui.github.io/KadelSiteManager/";
const SITE_DIRECTORY_DOC_PATH = [
  "artifacts",
  appId,
  "public",
  "data",
  "site-directory",
];
const REGISTERED_USERS_COLLECTION = `/artifacts/${appId}/public/data/registered-users`;

const formatTimestamp = (isoString) => {
  if (!isoString) return "--";
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch (err) {
    return isoString;
  }
};

const extractDisplayName = (displayString = "") => {
  if (!displayString) return "Unknown User";
  const trimmed = displayString.trim();
  const withoutInitials = trimmed.replace(/\s*\([^)]+\)\s*$/, "").trim();
  return withoutInitials || trimmed;
};

const extractInitials = (displayString = "") => {
  if (!displayString) return "??";
  const match = displayString.match(/\(([A-Za-z]{1,4})\)\s*$/);
  if (match && match[1]) {
    return match[1].slice(0, 3).toUpperCase();
  }
  const parts = displayString
    .replace(/[()]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "??";
  const initials = parts.slice(0, 2).map((part) => part[0]);
  return initials.join("").toUpperCase();
};

// --- Shared Styling Helpers ---
const modalLabelStyle = {
  display: "block",
  fontSize: "0.85rem",
  fontWeight: 600,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "#94a3b8",
  marginBottom: "0.35rem",
};

const modalInputStyle = {
  width: "100%",
  padding: "0.65rem 0.75rem",
  borderRadius: "0.5rem",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  backgroundColor: "rgba(15, 23, 42, 0.55)",
  color: "#f8fafc",
  fontSize: "1.05rem",
  outline: "none",
  boxShadow: "inset 0 0 0 1px rgba(15, 23, 42, 0.35)",
  transition: "box-shadow 0.15s ease, border 0.15s ease",
};

const modalPrimaryButtonStyle = {
  padding: "0.65rem 1.35rem",
  borderRadius: "0.75rem",
  border: "none",
  background: "linear-gradient(135deg, #2563eb, #60a5fa)",
  color: "#f8fafc",
  fontWeight: 600,
  fontSize: "1.05rem",
  cursor: "pointer",
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
};

const modalSecondaryButtonStyle = {
  padding: "0.65rem 1.2rem",
  borderRadius: "0.75rem",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  backgroundColor: "rgba(15, 23, 42, 0.65)",
  color: "#e2e8f0",
  fontWeight: 500,
  fontSize: "1.05rem",
  cursor: "pointer",
  transition: "border 0.15s ease, color 0.15s ease",
};

const modalTextAreaStyle = {
  width: "100%",
  minHeight: "6rem",
  padding: "0.75rem 0.85rem",
  borderRadius: "0.75rem",
  border: "1px solid rgba(148, 163, 184, 0.35)",
  backgroundColor: "rgba(15, 23, 42, 0.55)",
  color: "#f8fafc",
  fontSize: "1.05rem",
  resize: "vertical",
  outline: "none",
  boxShadow: "inset 0 0 0 1px rgba(15, 23, 42, 0.35)",
  transition: "box-shadow 0.15s ease, border 0.15s ease",
};

// --- Date Utility Functions ---
/**
 * Gets the start of the week (Sunday) for a given date.
 */
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

const getDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Gets a unique week ID in 'YYYY-WW' format.
 */
const getWeekId = (date) => {
  const d = new Date(date);
  const startOfWeek = getStartOfWeek(d);
  const year = startOfWeek.getFullYear();
  const firstDayOfYear = new Date(year, 0, 1);
  const pastDaysOfYear = (startOfWeek - firstDayOfYear) / 86400000;
  const weekNumber = Math.ceil(
    (pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7
  );
  return `${year}-W${String(weekNumber).padStart(2, "0")}`;
};

/**
 * Formats a date as 'DAY MM/DD'.
 */
const formatDateHeader = (date) => {
  const options = { weekday: "short", month: "numeric", day: "numeric" };
  return new Intl.DateTimeFormat("en-US", options)
    .format(date)
    .replace(",", "")
    .toUpperCase();
};

/**
 * Generates the 7 days for the current week.
 */
const getWeekDays = (startDate) => {
  return Array(7)
    .fill(null)
    .map((_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      return d;
    });
};

// --- Custom Hooks ---

/**
 * Custom hook to manage user authentication and access.
 */
const useUserAccess = () => {
  const [user, setUser] = useState(null);
  const [userInfo, setUserInfo] = useState(() => {
    try {
      const savedUser = localStorage.getItem("scheduleUser");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Initialize Firebase Auth
  useEffect(() => {
    if (!auth) {
      console.error("Auth is not initialized.");
      setIsAuthReady(true); // Proceed without auth
      return;
    }

    const initAuth = async () => {
      try {
        await signInAnonymously(auth); // Modular syntax
      } catch (error) {
        console.error("Error during authentication:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
      if (!user) {
        localStorage.removeItem("scheduleUser");
        setUserInfo(null);
      }
      if (user && user.uid) {
        try {
          const savedUser = localStorage.getItem("scheduleUser");
          if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUserInfo((current) => current || parsedUser);
          }
        } catch (e) {
          console.error("Error reloading user info:", e);
        }
      }
    });

    initAuth();
    return () => unsubscribe();
  }, []);

  const hasAccess = useMemo(() => userInfo?.hasAccess === true, [userInfo]);
  const initials = useMemo(() => userInfo?.initials || "??", [userInfo]);
  const userId = useMemo(() => user?.uid || null, [user]);

  useEffect(() => {
    if (!user?.uid || !userInfo || userInfo.userId === user.uid) return;

    const updatedInfo = {
      ...userInfo,
      userId: user.uid,
      syncedWithFirebase: true,
    };

    setUserInfo(updatedInfo);
    try {
      localStorage.setItem("scheduleUser", JSON.stringify(updatedInfo));
    } catch (storageError) {
      console.error("Error updating stored user info:", storageError);
    }

    if (db) {
      const userDocRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "registered-users",
        user.uid
      );
      setDoc(userDocRef, updatedInfo, { merge: true }).catch((firestoreError) => {
        console.error("Error syncing user info after auth ready:", firestoreError);
      });
    }
  }, [user?.uid, userInfo]);

  const signUp = async (firstName, lastName, code) => {
    const trimmedCode = code.trim();
    const isVip = trimmedCode === "12893";
    const grantsEditAccess =
      trimmedCode.length > 0 && (trimmedCode === ACCESS_CODE || isVip);
    const invalidCodeEntered = trimmedCode.length > 0 && !grantsEditAccess;

    const resolveUserId = async () => {
      if (userId) return userId;
      if (auth?.currentUser?.uid) return auth.currentUser.uid;
      if (!auth) return null;

      try {
        await signInAnonymously(auth);
      } catch (authError) {
        console.warn("Retry anonymous sign-in failed:", authError);
      }

      return await new Promise((resolve) => {
        let resolved = false;
        let unsubscribeFn = null;
        const timeout = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            if (unsubscribeFn) unsubscribeFn();
            resolve(null);
          }
        }, 2000);

        unsubscribeFn = onAuthStateChanged(auth, (nextUser) => {
          if (resolved) return;
          if (nextUser?.uid) {
            resolved = true;
            clearTimeout(timeout);
            if (unsubscribeFn) unsubscribeFn();
            resolve(nextUser.uid);
          }
        });
      });
    };

    let ensuredUserId = await resolveUserId();
    const usedFallbackId = !ensuredUserId;

    if (!ensuredUserId) {
      try {
        ensuredUserId = `local-${crypto.randomUUID()}`;
      } catch {
        ensuredUserId = `local-${Date.now()}`;
      }
    }

    const firstInitial = firstName.trim()[0] || "";
    const lastInitial = lastName.trim()[0] || "";
    const newInfo = {
      firstName,
      lastName,
      initials: `${firstInitial}${lastInitial}`.toUpperCase(),
      hasAccess: grantsEditAccess,
      isAdmin: isVip,
      userId: ensuredUserId,
      createdAt: new Date().toISOString(),
      syncedWithFirebase: !usedFallbackId,
    };

    try {
      localStorage.setItem("scheduleUser", JSON.stringify(newInfo));
    } catch (storageError) {
      console.error("Error saving user info to local storage:", storageError);
      return { success: false, error: "Could not save user data locally." };
    }

    setUserInfo(newInfo);

    let remoteSyncWarning = null;
    if (db && !usedFallbackId) {
      try {
        const userDocRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "registered-users",
          ensuredUserId
        );
        await setDoc(userDocRef, newInfo, { merge: true });
      } catch (firestoreError) {
        console.error("Error syncing user info to Firestore:", firestoreError);
        remoteSyncWarning =
          "Account saved locally, but cloud sync failed. We'll retry later.";
      }
    }

    return {
      success: true,
      error: null,
      user: newInfo,
      warning: [
        invalidCodeEntered
          ? "Invalid access code. View-only account created."
          : null,
        usedFallbackId
          ? "Account saved locally. We will sync once authentication finishes."
          : null,
        remoteSyncWarning,
      ]
        .filter(Boolean)
        .join(" "),
    };
  };

  const clearUserInfo = useCallback(() => {
    try {
      localStorage.removeItem("scheduleUser");
    } catch (error) {
      console.error("Error clearing stored user info:", error);
    }
    setUserInfo(null);
  }, []);

  return {
    user,
    userId,
    userInfo,
    hasAccess,
    initials,
    isAuthReady,
    signUp,
    clearUserInfo,
  };
};

/**
 * Custom hook to manage click-outside-element detection.
 */
const useClickOutside = (callback) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [callback]);

  return ref;
};

// --- Sub-Components ---

/**
 * Leaderboard Component
 */
const Leaderboard = ({ weekData }) => {
  const leaderboardData = useMemo(() => {
    const shiftCounts = {};
    
    // Count filled shifts by initials for the current week
    // A shift is considered "filled" if it has a bgColor that's not white/default
    weekData.days?.forEach((day) => {
      day.shifts?.forEach((shift) => {
        if (shift.initials && shift.initials.trim()) {
          const bgColor = shift.bgColor || "#FFFFFF";
          const normalizedBg = bgColor.toUpperCase();
          // Count if shift has a fill color (not white/default)
          const isFilled = normalizedBg !== "#FFFFFF" && normalizedBg !== "FFFFFF";
          
          if (isFilled) {
            const initials = shift.initials.trim().toUpperCase();
            shiftCounts[initials] = (shiftCounts[initials] || 0) + 1;
          }
        }
      });
    });
    
    // Convert to array and sort by count (descending)
    return Object.entries(shiftCounts)
      .map(([initials, count]) => ({ initials, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10
  }, [weekData]);

  if (leaderboardData.length === 0) {
    return null;
  }

  const getTrophyIcon = (index) => {
    if (index === 0) {
      return "🏆"; // Trophy (Titan style)
    } else if (index === 1) {
      return "🥇"; // Gold Medal
    } else if (index === 2) {
      return "🥈"; // Silver Medal
    }
    return null;
  };

  const getTrophyColor = (index) => {
    if (index === 0) {
      return "#8B5CF6"; // Titan (Purple/Violet)
    } else if (index === 1) {
      return "#FFD700"; // Gold
    } else if (index === 2) {
      return "#C0C0C0"; // Silver
    }
    return "#94a3b8";
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 0.75rem",
        backgroundColor: "rgba(15, 23, 42, 0.65)",
        borderRadius: "0.5rem",
        border: "1px solid rgba(148, 163, 184, 0.25)",
      }}
    >
      <div
        style={{
          fontSize: "0.7rem",
          fontWeight: 600,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          whiteSpace: "nowrap",
        }}
      >
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          flexWrap: "wrap",
        }}
      >
        {leaderboardData.map((item, index) => (
          <div
            key={item.initials}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              padding: "0.25rem 0.5rem",
              position: "relative",
              backgroundColor: index === 0 
                ? "rgba(139, 92, 246, 0.2)" 
                : index === 1
                ? "rgba(255, 215, 0, 0.15)"
                : index === 2
                ? "rgba(192, 192, 192, 0.15)"
                : "rgba(148, 163, 184, 0.1)",
              borderRadius: "0.375rem",
              border: index === 0 
                ? "2px solid rgba(139, 92, 246, 0.7)" 
                : index === 1
                ? "1px solid rgba(255, 215, 0, 0.4)"
                : index === 2
                ? "1px solid rgba(192, 192, 192, 0.4)"
                : "1px solid rgba(148, 163, 184, 0.2)",
            }}
          >
            {getTrophyIcon(index) && (
              <span 
                style={{ 
                  fontSize: index === 0 ? "1.2rem" : "1.0rem",
                  ...(index === 0 && {
                    filter: "drop-shadow(0 0 8px rgba(139, 92, 246, 1)) drop-shadow(0 0 16px rgba(124, 58, 237, 0.8)) drop-shadow(0 0 24px rgba(109, 40, 217, 0.6))",
                    animation: "titanShine 2.5s ease-in-out infinite",
                  }),
                  ...(index === 1 && {
                    filter: "drop-shadow(0 0 4px rgba(255, 215, 0, 0.9)) drop-shadow(0 0 8px rgba(255, 193, 7, 0.7)) drop-shadow(0 0 12px rgba(255, 152, 0, 0.5))",
                    animation: "goldGlow 2s ease-in-out infinite alternate",
                  }),
                  ...(index === 2 && {
                    filter: "drop-shadow(0 0 4px rgba(192, 192, 192, 0.9)) drop-shadow(0 0 8px rgba(169, 169, 169, 0.7)) drop-shadow(0 0 12px rgba(128, 128, 128, 0.5))",
                    animation: "silverGlow 2s ease-in-out infinite alternate",
                  }),
                }}
              >
                {getTrophyIcon(index)}
              </span>
            )}
            <span
              style={{
                fontSize: "0.9rem",
                fontWeight: 700,
                color: getTrophyColor(index),
              }}
            >
              {item.initials}
            </span>
            <span
              style={{
                fontSize: "0.8rem",
                color: getTrophyColor(index),
                fontWeight: 600,
              }}
            >
              {item.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Header Component
 */
const Header = ({
  onPrevWeek,
  onNextWeek,
  onToday,
  onOpenCalendar,
  onSignUp,
  userInfo,
  hasAccess,
  onOpenAnalysis,
  onOpenSiteManager,
  showSettings,
  onOpenSettings,
  onLogout,
  weekData,
}) => {
  const isAdmin = Boolean(userInfo?.isAdmin);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useClickOutside(() => setIsAvatarMenuOpen(false));

  const navButtonStyle = {
    padding: "0.5rem 0.75rem",
    backgroundColor: "#1f2937",
    border: "2px solid #ffffff",
    color: "#ffffff",
    borderRadius: "0.375rem",
    fontWeight: "bold",
    fontSize: "1.15rem",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
  };

  const linkButtonStyle = {
    padding: "0.45rem 0.9rem",
    borderRadius: "9999px",
    border: "1px solid rgba(148, 163, 184, 0.45)",
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    color: "#e2e8f0",
    fontSize: "1.02rem",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    fontWeight: 600,
    cursor: "pointer",
    transition: "border 0.15s ease, color 0.15s ease, transform 0.15s ease",
  };

  const legalButtonStyle = {
    ...linkButtonStyle,
    padding: "0.4rem 0.85rem",
    fontSize: "0.95rem",
    letterSpacing: "0.06em",
  };

  const openLegalOverview = useCallback
  (() => {
    if (typeof window !== "undefined") {
      window.open(
        "https://github.com/rochakkadel/schedule-board/blob/main/LEGAL_AND_TECH_OVERVIEW.md",
        "_blank",
        "noopener,noreferrer"
      );
    }
  }, []);

  const renderNavButton = (label, handler, fontSize) => (
    <button
      className="micro-pressable"
      onClick={handler}
      style={{ ...navButtonStyle, fontSize: fontSize || "inherit" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#374151";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#1f2937";
      }}
    >
      {label}
    </button>
  );

  return (
    <header
      className="mb-4 p-4 bg-black border border-white rounded-lg shadow flex flex-col md:flex-row justify-between items-center"
      style={{
        marginBottom: "1rem",
        padding: "1rem",
        backgroundColor: "#000000",
        border: "1px solid #ffffff",
        borderRadius: "0.5rem",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        {renderNavButton("<", onPrevWeek)}
        {renderNavButton("This Week", onToday, "1.1rem")}
        {renderNavButton(">", onNextWeek)}
        {renderNavButton(<CalendarIcon />, onOpenCalendar)}
        <Leaderboard weekData={weekData} />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <button
          className="micro-pressable micro-pill"
          type="button"
          onClick={onOpenAnalysis}
          style={linkButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.border = "1px solid rgba(96, 165, 250, 0.75)";
            e.currentTarget.style.color = "#bfdbfe";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.45)";
            e.currentTarget.style.color = "#e2e8f0";
            e.currentTarget.style.transform = "none";
          }}
        >
          Analysis
        </button>
        <button
          className="micro-pressable micro-pill"
          type="button"
          onClick={onOpenSiteManager}
          style={linkButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.border = "1px solid rgba(34, 197, 94, 0.65)";
            e.currentTarget.style.color = "#86efac";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.45)";
            e.currentTarget.style.color = "#e2e8f0";
            e.currentTarget.style.transform = "none";
          }}
        >
          Site Manager
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.9rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "0.3rem",
          }}
        >
          <button
            type="button"
            onClick={openLegalOverview}
            className="micro-pressable micro-pill"
            style={legalButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = "1px solid rgba(96, 165, 250, 0.75)";
              e.currentTarget.style.color = "#bfdbfe";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.45)";
              e.currentTarget.style.color = "#e2e8f0";
              e.currentTarget.style.transform = "none";
            }}
          >
            Documentation
          </button>
          <span
            style={{
              color: "#ffffff",
              fontSize: "0.70rem",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textShadow: "0 0 6px rgba(255, 191, 0, 0.75)",
              fontWeight: 500,
            }}
          >
            © 2025 Rochak Kadel. All rights reserved
          </span>
        </div>
        {userInfo ? (
          <div
            ref={avatarMenuRef}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
        <button
              type="button"
              onClick={() => setIsAvatarMenuOpen((open) => !open)}
              style={{
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "50%",
                border: isAdmin ? "3px solid rgba(255, 215, 0, 0.8)" : "2px solid #ffffff",
                background: isAdmin 
                  ? "linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 193, 7, 0.2) 50%, rgba(255, 215, 0, 0.3) 100%)"
                  : hasAccess 
                  ? "#2563eb" 
                  : "rgba(59,130,246,0.45)",
                color: "#ffffff",
                fontWeight: "bold",
                fontSize: isAdmin ? "1.3rem" : "1.05rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
                ...(isAdmin && {
                  boxShadow: "0 0 10px rgba(255, 215, 0, 0.6), 0 0 20px rgba(255, 193, 7, 0.4), inset 0 0 20px rgba(255, 215, 0, 0.2)",
                  animation: "adminAvatarFade 4s ease-in-out infinite",
                }),
              }}
              title={hasAccess ? "Editor Access" : "Viewer Access"}
            >
            {userInfo.initials}
            {isAdmin && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "linear-gradient(135deg, rgba(255, 215, 0, 0.4) 0%, transparent 50%, rgba(255, 193, 7, 0.4) 100%)",
                  borderRadius: "50%",
                  opacity: 0.6,
                  pointerEvents: "none",
                }}
              />
            )}
        </button>
            {showSettings && (
        <button
                type="button"
                onClick={onOpenSettings}
                style={{
                  width: "2.25rem",
                  height: "2.25rem",
                  borderRadius: "9999px",
                  border: "1px solid rgba(148,163,184,0.45)",
                  backgroundColor: "rgba(15,23,42,0.65)",
                  color: "#e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "border 0.15s ease, transform 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.border = "1px solid rgba(96,165,250,0.75)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.border = "1px solid rgba(148,163,184,0.45)";
                  e.currentTarget.style.transform = "none";
                }}
                aria-label="View registered users"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ width: "1.25rem", height: "1.25rem" }}
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              </button>
            )}
            {isAvatarMenuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 0.6rem)",
                  right: showSettings ? "calc(-2.5rem)" : 0,
                  minWidth: "10rem",
                  backgroundColor: "rgba(15,23,42,0.96)",
                  border: "1px solid rgba(148,163,184,0.35)",
                  borderRadius: "0.75rem",
                  boxShadow: "0 18px 40px rgba(2, 6, 23, 0.55)",
                  padding: "0.45rem",
                  zIndex: 60,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsAvatarMenuOpen(false);
                    onLogout();
                  }}
                  style={{
                    width: "100%",
                    padding: "0.55rem 0.75rem",
                    borderRadius: "0.6rem",
                    border: "none",
                    backgroundColor: "rgba(239,68,68,0.18)",
                    color: "#fca5a5",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(248,113,113,0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.18)";
                  }}
                >
                  Log Out
        </button>
      </div>
            )}
          </div>
        ) : (
          <button
            className="micro-pressable"
            onClick={onSignUp}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "",
              border: "2px solid #ffffff",
              color: "#ffffff",
              borderRadius: "0.475rem",
              fontSize: "0.875rem",
              fontWeight: "bold",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "blue";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "";
            }}
          >
            LOGIN
          </button>
        )}
      </div>
    </header>
  );
};

/**
 * Shift Item Component
 */
const Shift = ({ shift, onContextMenu, onDoubleClick, topUserInitials }) => {
  const {
    site,
    startTime,
    endTime,
    initials,
    bgColor,
    fontColor,
    comments,
  } = shift;

  const effectiveBgColor = bgColor || "#FFFFFF";
  const effectiveFontColor = fontColor || "#000000";
  const normalizedBg = effectiveBgColor.toUpperCase();
  const isComplete = normalizedBg === COLOR_COMPLETE_BG.toUpperCase();
  const isOps = normalizedBg === COLOR_OPS_BG.toUpperCase();
  const displayBackground = isComplete
    ? COLOR_COMPLETE_BG
    : isOps
    ? COLOR_OPS_BG
    : effectiveBgColor;
  // Always use the effective font color, don't force white for complete/ops
  const displayFont = effectiveFontColor;

  const defaultTextColor = site.startsWith("@") ? "#880808" : displayFont;
  const siteStyle = {
    color: defaultTextColor,
  };

  const hasComments = comments && comments.length > 0;
  const shiftStatusClass = isComplete
    ? " shift-complete"
    : isOps
    ? " shift-ops"
    : "";

  // Check if time is "xxxx" (case-insensitive)
  const isXxxx = (startTime && startTime.toUpperCase() === "XXXX") || 
                 (endTime && endTime.toUpperCase() === "XXXX");
  
  // Determine font size - bigger if xxxx
  const siteFontSize = isXxxx ? "1.35rem" : "1.35rem";
  
  // Determine what to display - hide time if xxxx
  const displayText = isXxxx ? site : `${site} ${startTime}-${endTime}`;

  // Check if shift is filled (non-white bgColor) and matches top 3 users
  const isFilled = normalizedBg !== "#FFFFFF" && normalizedBg !== "FFFFFF" && 
                   normalizedBg !== COLOR_COMPLETE_BG.toUpperCase() && 
                   normalizedBg !== COLOR_OPS_BG.toUpperCase();
  
  // Determine which top user this is (1, 2, or 3)
  let glowType = null;
  if (topUserInitials && initials && isFilled) {
    const userInitials = initials.trim().toUpperCase();
    if (Array.isArray(topUserInitials)) {
      const top1Index = topUserInitials.findIndex(t => t.initials === userInitials);
      if (top1Index === 0) {
        glowType = "titan"; // Top 1 - Titan purple
      } else if (top1Index === 1) {
        glowType = "gold"; // Top 2 - Gold
      } else if (top1Index === 2) {
        glowType = "silver"; // Top 3 - Silver
      }
    } else if (userInitials === topUserInitials.toUpperCase()) {
      glowType = "titan"; // Legacy support for single top user
    }
  }
  const shouldGlow = glowType !== null;

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(e, shift);
      }}
      onDoubleClick={() => onDoubleClick(shift)}
      className={`shift-item p-2 rounded-md cursor-pointer select-none mb-2${shiftStatusClass}`}
      style={{
        padding: "0rem 1.15rem",
        borderRadius: "0.5rem",
        cursor: "pointer",
        userSelect: "none",
        marginBottom: "0.15rem",
        backgroundColor: displayBackground,
        color: displayFont,
        border: glowType === "titan" 
          ? "2px solid rgba(139, 92, 246, 0.7)"
          : glowType === "gold"
          ? "2px solid rgba(255, 215, 0, 0.7)"
          : glowType === "silver"
          ? "2px solid rgba(192, 192, 192, 0.7)"
          : "1px solid rgba(148, 163, 184, 0.25)",
        ...(hasComments && { 
          borderRight: "5px solid #FF8C00",
          boxShadow: glowType === "titan"
            ? "inset -2px 0 0 #000000, 0 0 8px rgba(139, 92, 246, 0.6), 0 0 16px rgba(124, 58, 237, 0.4), 0 6px 16px rgba(2, 6, 23, 0.35)"
            : glowType === "gold"
            ? "inset -2px 0 0 #000000, 0 0 8px rgba(255, 215, 0, 0.6), 0 0 16px rgba(255, 193, 7, 0.4), 0 6px 16px rgba(2, 6, 23, 0.35)"
            : glowType === "silver"
            ? "inset -2px 0 0 #000000, 0 0 8px rgba(192, 192, 192, 0.6), 0 0 16px rgba(169, 169, 169, 0.4), 0 6px 16px rgba(2, 6, 23, 0.35)"
            : "inset -2px 0 0 #000000, 0 6px 16px rgba(2, 6, 23, 0.35)"
        }),
        ...(!hasComments && { 
          boxShadow: glowType === "titan"
            ? "0 0 8px rgba(139, 92, 246, 0.6), 0 0 16px rgba(124, 58, 237, 0.4), 0 6px 16px rgba(2, 6, 23, 0.35)"
            : glowType === "gold"
            ? "0 0 8px rgba(255, 215, 0, 0.6), 0 0 16px rgba(255, 193, 7, 0.4), 0 6px 16px rgba(2, 6, 23, 0.35)"
            : glowType === "silver"
            ? "0 0 8px rgba(192, 192, 192, 0.6), 0 0 16px rgba(169, 169, 169, 0.4), 0 6px 16px rgba(2, 6, 23, 0.35)"
            : "0 6px 16px rgba(2, 6, 23, 0.35)"
        }),
        transition: "transform 0.12s ease, box-shadow 0.12s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
          lineHeight: isOps ? "1.0" : "1.5",
          transform: isOps ? "scaleY(0.9)" : "none",
          transformOrigin: "center",
        }}
      >
        <span
          className="font-mono font-bold text-sm"
          style={{
            ...siteStyle,
            fontSize: siteFontSize,
            letterSpacing: "0.04em",
            fontWeight: 700,
            lineHeight: isOps ? "1.0" : "inherit",
          }}
        >
          {displayText}
        </span>
        <span
          className="font-mono font-bold text-sm ml-2 flex-shrink-0"
            style={{ 
            color: displayFont,
            marginLeft: "auto",
            fontWeight: 700,
            textTransform: "uppercase",
            fontSize: "0.92rem",
            lineHeight: isOps ? "1.0" : "inherit",
            }}
          >
            {initials}
        </span>
      </div>
    </div>
  );
};

/**
 * Day Column Component
 */
const DayColumn = ({
  day,
  shifts,
  onContextMenu,
  onDoubleClick,
  hasAccess,
  onAddShift,
  onPasteMenu,
  onDayNotes,
  hasNotes,
  boardScrollRef,
  syncScrollRef,
  topUserInitials,
}) => {
  const sortedShifts = useMemo(() => {
    return [...shifts].sort((a, b) => {
      const timeA = a.startTime || "0000";
      const timeB = b.startTime || "0000";
      return timeA.localeCompare(timeB);
    });
  }, [shifts]);

  return (
    <div 
      className="flex flex-col flex-shrink-0"
      style={{
        display: "flex",
        flexDirection: "column",
        flexBasis: "22%",
        maxWidth: "22%",
        flexShrink: 0,
        height: "100%",
      }}
    >
      <div 
        className="text-center p-3 sticky top-0 bg-black z-10 border-b border-gray-800"
        style={{
          textAlign: "center",
          padding: "0.75rem",
          position: "sticky",
          top: 0,
          backgroundColor: "#000000",
          zIndex: 10,
          borderBottom: "1px solid #1f2937",
        }}
      >
        <div 
          className="font-bold text-white text-sm uppercase"
          style={{
            fontWeight: "bold",
            color: "#ffffff",
            fontSize: "0.98rem",
            textTransform: "uppercase",
          }}
        >
          {formatDateHeader(day.date)}
        </div>
      </div>
      <div 
        className="day-column-content hide-scrollbar p-2 flex-1 bg-black min-h-[400px] overflow-y-auto"
        style={{
          padding: "0.5rem",
          flex: 1,
          backgroundColor: "#000000",
          minHeight: "400px",
          overflowY: "auto",
          fontSize: "0.85rem",
        }}
        onScroll={(e) => {
          const container = boardScrollRef?.current;
          if (!container) return;
          const allColumns = container.querySelectorAll('.day-column-content');
          const currentScroll = e.currentTarget.scrollTop;

          if (syncScrollRef) {
            if (syncScrollRef.current) {
              return;
            }
            syncScrollRef.current = true;
          }

          allColumns.forEach(col => {
            if (col !== e.currentTarget) {
              col.scrollTop = currentScroll;
            }
          });

          if (syncScrollRef) {
            syncScrollRef.current = false;
          }
        }}
      >
        {sortedShifts.map((shift) => (
            <Shift
              key={shift.id}
              shift={shift}
              onContextMenu={onContextMenu}
              onDoubleClick={onDoubleClick}
              topUserInitials={topUserInitials}
            />
        ))}
      </div>
      {/* Bottom controls: Add shift and Notes */}
      <div 
        className="p-2 flex items-center gap-2 bg-black border-t border-gray-800"
        style={{
          padding: "0.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          backgroundColor: "#000000",
          borderTop: "1px solid #1f2937",
          marginTop: "auto",
        }}
      >
        {hasAccess && (
          <button
            className="flex-grow py-2 text-center text-gray-400 font-bold text-xl rounded-md hover:bg-white hover:text-black transition-colors duration-150 plus-button micro-pressable"
            onClick={onAddShift}
            onContextMenu={onPasteMenu}
            style={{
              flexGrow: 1,
              padding: "0.5rem 0",
              textAlign: "center",
              color: "#9ca3af",
              fontWeight: "bold",
              fontSize: "1.25rem",
              borderRadius: "0.375rem",
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = "#ffffff";
              e.target.style.color = "#000000";
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = "transparent";
              e.target.style.color = "#9ca3af";
            }}
          >
            +
          </button>
        )}
        <button
          className="note-button micro-pressable"
          onClick={onDayNotes}
          style={{
            padding: "0.5rem",
            borderRadius: "0.475rem",
            backgroundColor: "#1f2937",
            border: hasNotes ? "2.1px solid #FFBF00" : "0.5px solid #ffffff",
            color: hasNotes ? "#f97316" : "#ffffff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = hasNotes
              ? "rgba(249, 115, 22, 0.12)"
              : "rgba(255, 255, 255, 0.12)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#1f2937";
          }}
          aria-label="View  Notes"
        >
          <NoteIcon />
        </button>
      </div>
    </div>
  );
};

/**
 * Context Menu Component
 */
const ContextMenu = ({
  menuState,
  onClose,
  onEdit,
  onDelete,
  onComplete,
  onOps,
  onColor,
  onComment,
  onCopy, // New prop
  onSplit, // New prop for split shift
}) => {
  const menuRef = useClickOutside(onClose);

  if (!menuState.visible) return null;

  const groups = [
    [
      { label: "✅ Complete", action: onComplete },
      { label: "⚙️ OPS", action: onOps },
    ],
    [
      { label: "Comment", action: onComment },
      { label: "Change Colors", action: onColor },
    ],
    [
      { label: "Copy Shift", action: onCopy },
      { label: "Edit Shift", action: onEdit },
      { label: "Split Shift", action: onSplit },
    ],
    [
      {
        label: "Delete Shift",
        action: onDelete,
        danger: true,
      },
    ],
  ];

  return (
    <div
      ref={menuRef}
      className="context-menu fixed z-50"
      style={{
        top: menuState.y,
        left: menuState.x,
        position: "fixed",
        zIndex: 50,
        minWidth: "13rem",
        backgroundColor: "rgba(15,23,42,0.95)",
        border: "1px solid rgba(148,163,184,0.35)",
        borderRadius: "0.75rem",
        boxShadow: "0 20px 50px rgba(2, 6, 23, 0.55)",
        backdropFilter: "blur(18px)",
        overflow: "hidden",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <ul
        style={{
          padding: "0.35rem 0",
          fontSize: "1.02rem",
          color: "#e2e8f0",
        }}
      >
        {groups.map((group, groupIndex) => (
          <li key={`group-${groupIndex}`}>
            {group.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  item.action();
                  onClose();
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "0.6rem 1rem",
                  background: "transparent",
                  border: "none",
                  color: item.danger ? "#fca5a5" : "#f8fafc",
                  cursor: "pointer",
                  display: "block",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(59,130,246,0.18)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {item.label}
              </button>
            ))}
            {groupIndex !== groups.length - 1 && (
              <div
                style={{
                  height: "1px",
                  margin: "0.25rem 0.75rem",
                  backgroundColor: "rgba(148,163,184,0.25)",
                }}
              />
            )}
        </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Paste Context Menu Component
 */
const PasteMenu = ({ menuState, onClose, onPaste }) => {
  const menuRef = useClickOutside(onClose);

  if (!menuState.visible) return null;

  return (
    <div
      ref={menuRef}
      className="paste-menu"
      style={{
        top: menuState.y,
        left: menuState.x,
        position: "fixed",
        zIndex: 50,
        minWidth: "11rem",
        backgroundColor: "rgba(15,23,42,0.95)",
        border: "1px solid rgba(148,163,184,0.35)",
        borderRadius: "0.75rem",
        boxShadow: "0 20px 45px rgba(2,6,23,0.45)",
        overflow: "hidden",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          onPaste();
          onClose();
        }}
        style={{
          width: "100%",
          padding: "0.7rem 1rem",
          textAlign: "left",
          background: "transparent",
          border: "none",
          color: "#f8fafc",
          fontSize: "0.92rem",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(34,197,94,0.18)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
        >
          Paste Shift
      </button>
    </div>
  );
};

// --- Modal Components ---

/**
 * Modal Container
 */
const Modal = ({ children, onClose }) => {
  const modalRef = useClickOutside(onClose);
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-75 modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        padding: "1rem",
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={modalRef}
        className="bg-black border border-white p-6 rounded-lg shadow-xl w-full max-w-md modal-panel"
        style={{
          backgroundColor: "#000000",
          border: "1px solid #FFFFFF",
          padding: "1.5rem",
          borderRadius: "0.75rem",
          boxShadow: "0 20px 45px rgba(0,0,0,0.45)",
          width: "100%",
          maxWidth: "480px",
        }}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * Add Shift Modal
 */
const AddShiftModal = ({
  day,
  onClose,
  onAddShift,
}) => {
  const [site, setSite] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState("");

  const suggestionRef = useClickOutside(() => {
    setIsFocused(false);
  });

  const handleSiteChange = (e) => {
    const value = e.target.value;
    setSite(value);
    if (value) {
      setSuggestions(
        DEFAULT_SITE_NAMES.filter((name) =>
          name.toLowerCase().includes(value.toLowerCase())
        )
      );
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion) => {
    setSite(suggestion);
    setSuggestions([]);
    setIsFocused(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && suggestions.length > 0) {
      e.preventDefault();
      selectSuggestion(suggestions[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!site || !startTime || !endTime) {
      setError("All fields are required.");
      return;
    }
    if (startTime.length !== 4 || endTime.length !== 4) {
      setError("Time must be in HHMM format.");
      return;
    }
    setError("");

    // Check if time is "xxxx" (case-insensitive) - set black bg and white font
    const isXxxx = (startTime && startTime.toUpperCase() === "XXXX") || 
                   (endTime && endTime.toUpperCase() === "XXXX");
    const defaultBgColor = isXxxx ? "#000000" : "#FFFFFF";
    const defaultFontColor = isXxxx ? "#FFFFFF" : "#000000";

    const newShift = {
      id: crypto.randomUUID(),
      site,
      startTime,
      endTime,
      initials: "",
      bgColor: defaultBgColor,
      fontColor: defaultFontColor,
      comments: [],
    };

    try {
      await onAddShift(day, newShift);
      onClose();
    } catch (err) {
      console.error("Error adding shift:", err);
      setError("Failed to add shift. Please try again.");
    }
  };

  return (
    <Modal onClose={onClose}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#f8fafc",
              marginBottom: "0.35rem",
            }}
          >
            Add New Shift
          </h3>
          <p
            style={{
              fontSize: "1.0rem",
              color: "#94a3b8",
              margin: 0,
            }}
          >

          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          <div className="relative" ref={suggestionRef} style={{ position: "relative" }}>
            <label style={modalLabelStyle}>Site Name</label>
          <input
            type="text"
              placeholder="Start typing…"
            value={site}
            onChange={handleSiteChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
              style={{
                ...modalInputStyle,
                boxShadow: isFocused
                  ? "0 0 0 2px rgba(96, 165, 250, 0.45)"
                  : modalInputStyle.boxShadow,
              }}
          />
          {isFocused && suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  inset: "calc(100% + 0.5rem) 0 auto 0",
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  borderRadius: "0.75rem",
                  border: "1px solid rgba(148, 163, 184, 0.25)",
                  maxHeight: "12rem",
                  overflowY: "auto",
                  boxShadow: "0 18px 40px rgba(2, 6, 23, 0.45)",
                  backdropFilter: "blur(18px)",
                  zIndex: 20,
                }}
              >
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                  onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    selectSuggestion(suggestion);
                  }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "0.7rem 0.9rem",
                      background: "transparent",
                      border: "none",
                      color: "#e2e8f0",
                      fontSize: "1.05rem",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                >
                  {suggestion}
                  </button>
              ))}
            </div>
          )}
        </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "1rem",
            }}
          >
            <div>
              <label style={modalLabelStyle}>Start </label>
            <input
              type="text"
                placeholder="0000"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              maxLength="4"
                style={{ ...modalInputStyle, fontFamily: "monospace", letterSpacing: "0.08em" }}
            />
          </div>
            <div>
              <label style={modalLabelStyle}>End </label>
            <input
              type="text"
                placeholder="0000"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              maxLength="4"
                style={{ ...modalInputStyle, fontFamily: "monospace", letterSpacing: "0.08em" }}
            />
          </div>
        </div>

          {error && (
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                color: "#fca5a5",
                fontSize: "0.95rem",
              }} 
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              marginTop: "0.5rem",
            }}
          >
        <button
          type="button"
          onClick={onClose}
            style={modalSecondaryButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.55)";
              e.currentTarget.style.color = "#f8fafc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.35)";
              e.currentTarget.style.color = "#e2e8f0";
            }}
        >
          Cancel
        </button>
        <button
            type="submit"
              style={modalPrimaryButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 12px 24px rgba(37, 99, 235, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
          >
            Add Shit
          </button>
        </div>
      </form>
      </div>
    </Modal>
  );
};

/**
 * Edit Shift Modal
 */
const EditShiftModal = ({ shift, day, weekId, onClose, onUpdateShift }) => {
  const [site, setSite] = useState(shift.site);
  const [startTime, setStartTime] = useState(shift.startTime);
  const [endTime, setEndTime] = useState(shift.endTime);
  const [initials, setInitials] = useState(shift.initials);
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!site || !startTime || !endTime) {
      setError("Site and times are required.");
      return;
    }
    if (startTime.length !== 4 || endTime.length !== 4) {
      setError("Time must be in HHMM format.");
      return;
    }
    setError("");

    const updatedShift = {
      ...shift,
      site,
      startTime,
      endTime,
      initials: initials || "",
    };
    onUpdateShift(day, updatedShift);
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#f8fafc",
              marginBottom: "0.35rem",
            }}
          >
            Edit Shift
          </h3>
          <p
            style={{
              fontSize: "1.0rem",
              color: "#94a3b8",
              margin: 0,
            }}
          >

          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          <div>
            <label style={modalLabelStyle}>Site Name</label>
          <input
            type="text"
            value={site}
            onChange={(e) => setSite(e.target.value)}
              style={modalInputStyle}
          />
        </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "1rem",
            }}
          >
            <div>
              <label style={modalLabelStyle}>Start (HHMM)</label>
            <input
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              maxLength="4"
                style={{ ...modalInputStyle, fontFamily: "monospace", letterSpacing: "0.08em" }}
            />
          </div>
            <div>
              <label style={modalLabelStyle}>End (HHMM)</label>
            <input
              type="text"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              maxLength="4"
                style={{ ...modalInputStyle, fontFamily: "monospace", letterSpacing: "0.08em" }}
            />
          </div>
        </div>
        <div>
            <label style={modalLabelStyle}>Initials (Optional)</label>
          <input
            type="text"
            value={initials}
            onChange={(e) => setInitials(e.target.value)}
            maxLength="4"
              style={{ ...modalInputStyle, fontFamily: "monospace", letterSpacing: "0.12em" }}
          />
        </div>

          {error && (
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                color: "#fca5a5",
                fontSize: "0.95rem",
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              marginTop: "0.5rem",
            }}
          >
          <button
            type="button"
            onClick={onClose}
              style={modalSecondaryButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.55)";
                e.currentTarget.style.color = "#f8fafc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.35)";
                e.currentTarget.style.color = "#e2e8f0";
              }}
          >
            Cancel
          </button>
          <button
            type="submit"
              style={modalPrimaryButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 12px 24px rgba(37, 99, 235, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
          >
            Save Changes
          </button>
        </div>
      </form>
      </div>
    </Modal>
  );
};

/**
 * Split Shift Modal
 */
const SplitShiftModal = ({ shift, day, onClose, onSplitShift }) => {
  const [splitTime, setSplitTime] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!splitTime) {
      setError("Split time is required.");
      return;
    }
    if (splitTime.length !== 4) {
      setError("Time must be in HHMM format.");
      return;
    }

    // Validate split time is between start and end time
    const startTimeNum = parseInt(shift.startTime, 10);
    const endTimeNum = parseInt(shift.endTime, 10);
    const splitTimeNum = parseInt(splitTime, 10);

    if (isNaN(splitTimeNum)) {
      setError("Invalid time format.");
      return;
    }

    if (splitTimeNum <= startTimeNum || splitTimeNum >= endTimeNum) {
      setError(`Split time must be between ${shift.startTime} and ${shift.endTime}.`);
      return;
    }

    setError("");
    onSplitShift(day, shift, splitTime);
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#f8fafc",
              marginBottom: "0.35rem",
            }}
          >
            Split Shift
          </h3>
          <p
            style={{
              fontSize: "1.0rem",
              color: "#94a3b8",
              margin: 0,
            }}
          >
            Split this shift into two shifts 
          </p>
        </div>

        <div
          style={{
            padding: "1rem",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderRadius: "0.75rem",
            border: "1px solid rgba(59, 130, 246, 0.2)",
          }}
        >
          <p style={{ color: "#cbd5e1", margin: 0, fontSize: "0.95rem", marginBottom: "0.5rem" }}>
            Current Shift:
          </p>
          <p style={{ color: "#f8fafc", margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>
            {shift.site} {shift.startTime}-{shift.endTime}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          <div>
            <label style={modalLabelStyle}>Start Time</label>
            <input
              type="text"
              value={shift.startTime}
              disabled
              style={{
                ...modalInputStyle,
                opacity: 0.6,
                cursor: "not-allowed",
                fontFamily: "monospace",
                letterSpacing: "0.08em",
              }}
            />
          </div>

          <div>
            <label style={modalLabelStyle}>Split Time </label>
            <input
              type="text"
              placeholder="1100"
              value={splitTime}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "").slice(0, 4);
                setSplitTime(value);
                setError("");
              }}
              maxLength="4"
              style={{
                ...modalInputStyle,
                fontFamily: "monospace",
                letterSpacing: "0.08em",
              }}
              autoFocus
            />
            
          </div>

          <div>
            <label style={modalLabelStyle}>End Time </label>
            <input
              type="text"
              value={shift.endTime}
              disabled
              style={{
                ...modalInputStyle,
                opacity: 0.6,
                cursor: "not-allowed",
                fontFamily: "monospace",
                letterSpacing: "0.08em",
              }}
            />
          </div>

          <div
            style={{
              padding: "1rem",
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              borderRadius: "0.75rem",
              border: "1px solid rgba(34, 197, 94, 0.2)",
            }}
          >
            <p style={{ color: "#cbd5e1", margin: 0, fontSize: "0.95rem", marginBottom: "0.5rem" }}>
              Result:
            </p>
            {splitTime.length === 4 && !error ? (
              <>
                <p style={{ color: "#f8fafc", margin: "0.25rem 0", fontSize: "1rem" }}>
                  Shift 1: {shift.site} {shift.startTime}-{splitTime}
                </p>
                <p style={{ color: "#f8fafc", margin: "0.25rem 0", fontSize: "1rem" }}>
                  Shift 2: {shift.site} {splitTime}-{shift.endTime}
                </p>
              </>
            ) : (
              <p style={{ color: "#94a3b8", margin: 0, fontSize: "0.9rem" }}>
                Enter split time to see preview
              </p>
            )}
          </div>

          {error && (
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                color: "#fca5a5",
                fontSize: "0.95rem",
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              marginTop: "0.5rem",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={modalSecondaryButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.55)";
                e.currentTarget.style.color = "#f8fafc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.35)";
                e.currentTarget.style.color = "#e2e8f0";
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={modalPrimaryButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 12px 24px rgba(37, 99, 235, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              Split Shift
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

/**
 * Color Picker Modal
 */
const ColorModal = ({ shift, day, onClose, onUpdateShift }) => {
  // Always use the actual shift colors, even if it's marked as complete/ops
  const [fontColor, setFontColor] = useState(shift.fontColor || "#000000");
  const [bgColor, setBgColor] = useState(shift.bgColor || "#FFFFFF");

  const handleBgColorChange = (newBgColor) => {
    setBgColor(newBgColor);
    // If changing to a non-Complete/Ops color and font is white, change to black
    const normalizedNewBg = newBgColor.toUpperCase();
    const isNewComplete = normalizedNewBg === COLOR_COMPLETE_BG.toUpperCase();
    const isNewOps = normalizedNewBg === COLOR_OPS_BG.toUpperCase();
    if (!isNewComplete && !isNewOps && (fontColor === COLOR_COMPLETE_FONT || fontColor === COLOR_OPS_FONT || fontColor === "#FFFFFF")) {
      setFontColor("#000000");
    }
  };

  const handleSave = () => {
    const updatedShift = {
      ...shift,
      fontColor,
      bgColor,
    };
    onUpdateShift(day, updatedShift);
    onClose();
  };

  const ColorSelector = ({ title, colors, selected, onChange }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
      <span style={{ ...modalLabelStyle, marginBottom: 0 }}>{title}</span>
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
        {colors.map((color) => {
          const isSelected = selected === color;
          return (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
              style={{
                width: "2.4rem",
                height: "2.4rem",
                borderRadius: "0.75rem",
                border: isSelected ? "2px solid #f8fafc" : "1px solid rgba(148,163,184,0.35)",
                backgroundColor: color,
                cursor: "pointer",
                boxShadow: isSelected ? "0 0 0 4px rgba(37, 99, 235, 0.35)" : "none",
                transition: "transform 0.15s ease, border 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
              }}
            />
          );
        })}
      </div>
    </div>
  );

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#f8fafc",
              marginBottom: "0.35rem",
            }}
          >
            Shift Colors
          </h3>
          <p
            style={{
              fontSize: "1.0rem",
              color: "#94a3b8",
              margin: 0,
            }}
          >
           
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.3rem" }}>
        <ColorSelector
          title="Font Color"
          colors={FONT_COLORS}
          selected={fontColor}
          onChange={setFontColor}
        />
        <ColorSelector
          title="Fill Color"
          colors={FILL_COLORS}
          selected={bgColor}
          onChange={handleBgColorChange}
        />
        </div>

        <div
          style={{
            marginTop: "0.25rem",
            padding: "1rem",
            borderRadius: "1rem",
            border: "1px solid rgba(148, 163, 184, 0.15)",
            backgroundColor: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          <span style={{ fontSize: "0.9rem", color: "#94a3b8", textTransform: "uppercase" }}>
            Preview
          </span>
          <div
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "0.75rem",
              border: "1px solid rgba(148,163,184,0.25)",
              backgroundColor: bgColor,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
          <span
              style={{
                fontFamily: "monospace",
                fontWeight: 700,
                fontSize: "1.05rem",
                color: fontColor,
              }}
          >
            {shift.site} {shift.startTime}-{shift.endTime}
          </span>
            <span
              style={{
                fontFamily: "monospace",
                fontWeight: 700,
                fontSize: "1.05rem",
                color: fontColor,
              }}
            >
              {shift.initials || "??"}
          </span>
        </div>
      </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            paddingTop: "0.5rem",
          }}
        >
        <button
          type="button"
          onClick={onClose}
            style={modalSecondaryButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.55)";
              e.currentTarget.style.color = "#f8fafc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.35)";
              e.currentTarget.style.color = "#e2e8f0";
            }}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
            style={modalPrimaryButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 12px 24px rgba(37, 99, 235, 0.25)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
        >
          Save Colors
        </button>
        </div>
      </div>
    </Modal>
  );
};

/**
 * Calendar Picker Modal
 */
const CalendarModal = ({ currentDate, onClose, onDateSelect }) => {
  const [displayDate, setDisplayDate] = useState(new Date(currentDate));

  const startOfMonth = useMemo(
    () => new Date(displayDate.getFullYear(), displayDate.getMonth(), 1),
    [displayDate]
  );

  const startOfGrid = useMemo(() => {
    const start = new Date(startOfMonth);
    const day = start.getDay();
    start.setDate(start.getDate() - day); // back to Sunday
    return start;
  }, [startOfMonth]);

  const gridDays = useMemo(() => {
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(startOfGrid);
      day.setDate(startOfGrid.getDate() + index);
      return day;
    });
  }, [startOfGrid]);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const today = new Date();

  const changeMonth = (delta) => {
    setDisplayDate(
      new Date(displayDate.getFullYear(), displayDate.getMonth() + delta, 1)
    );
  };

  const handleDayClick = (date) => {
    onDateSelect(date);
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ width: "100%", maxWidth: "24rem", color: "#f8fafc" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
          }}
        >
          <button
            onClick={() => changeMonth(-1)}
            style={{
              width: "2.25rem",
              height: "2.25rem",
              borderRadius: "9999px",
              border: "1px solid rgba(148, 163, 184, 0.35)",
              background: "rgba(15, 23, 42, 0.65)",
              color: "#e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ArrowLeftIcon />
          </button>
          <div style={{ textAlign: "center" }}>
            <h4
              style={{
                fontSize: "1.35rem",
                fontWeight: 600,
                margin: 0,
              }}
            >
            {displayDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h4>
          </div>
          <button
            onClick={() => changeMonth(1)}
            style={{
              width: "2.25rem",
              height: "2.25rem",
              borderRadius: "9999px",
              border: "1px solid rgba(148, 163, 184, 0.35)",
              background: "rgba(15, 23, 42, 0.65)",
              color: "#e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <ArrowRightIcon />
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            textAlign: "center",
            fontSize: "0.75rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#94a3b8",
            marginBottom: "0.75rem",
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: "0.4rem",
          }}
        >
          {gridDays.map((day) => {
            const inMonth = day.getMonth() === displayDate.getMonth();
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, currentDate);

            return (
            <button
                key={day.toISOString()}
              onClick={() => handleDayClick(day)}
                style={{
                  padding: "0.55rem 0.35rem",
                  borderRadius: "0.9rem",
                  border: isSelected
                    ? "1px solid rgba(37, 99, 235, 0.65)"
                    : "1px solid transparent",
                  background: isSelected
                    ? "linear-gradient(135deg, rgba(37, 99, 235, 0.95), rgba(30, 64, 175, 0.85))"
                    : isToday
                    ? "rgba(59, 130, 246, 0.18)"
                    : "rgba(15, 23, 42, 0.55)",
                  color: inMonth ? "#f8fafc" : "rgba(148, 163, 184, 0.55)",
                  fontWeight: inMonth ? 600 : 400,
                  cursor: "pointer",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 12px 18px rgba(2, 6, 23, 0.35)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
            >
                {day.getDate()}
            </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

/**
 * Sign Up Modal
 */
const SignUpModal = ({ onClose, onSignUp }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFeedback("");
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    const result = await onSignUp(firstName.trim(), lastName.trim(), accessCode);
    if (result.success) {
      if (result.warning) {
        setFeedback(result.warning);
      } else {
        onClose();
      }
    } else if (result.error) {
      setError(result.error);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "1.4rem",
              fontWeight: 700,
              color: "#f8fafc",
              marginBottom: "0.35rem",
            }}
          >
            Create Your Account
          </h3>
          <p
            style={{
              fontSize: "1.0rem",
              color: "#94a3b8",
              margin: 0,
            }}
          >

          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "1rem",
            }}
          >
            <div>
              <label style={modalLabelStyle}>First Name</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
                style={modalInputStyle}
          />
        </div>
        <div>
              <label style={modalLabelStyle}>Last Name</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
                style={modalInputStyle}
          />
            </div>
        </div>
        <div>
            <label style={modalLabelStyle}>Access Code (optional)</label>
          <input
            type="password"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
              style={modalInputStyle}
              placeholder="Enter editor or admin code"
          />
            <p
              style={{
                marginTop: "0.35rem",
                fontSize: "0.85rem",
                color: "#64748b",
              }}
            >
              Leave blank to continue with view-only access.
            </p>
        </div>

          {error && (
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                color: "#fca5a5",
                fontSize: "0.95rem",
              }}
            >
              {error}
            </div>
          )}

          {feedback && (
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(37, 99, 235, 0.12)",
                color: "#bfdbfe",
                fontSize: "0.95rem",
              }}
            >
              {feedback}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "0.75rem",
              marginTop: "0.5rem",
            }}
          >
        <button
          type="button"
          onClick={onClose}
            style={modalSecondaryButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.55)";
              e.currentTarget.style.color = "#f8fafc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.35)";
              e.currentTarget.style.color = "#e2e8f0";
            }}
        >
          {feedback ? "Close" : "Cancel"}
        </button>
          <button
            type="submit"
              style={modalPrimaryButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 12px 24px rgba(37, 99, 235, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = "none";
              }}
          >
            Sign Up
          </button>
        </div>
      </form>
      </div>
    </Modal>
  );
};

/**
 * Comments Modal (for Shifts)
 */
const CommentModal = ({
  shift,
  day,
  onClose,
  onUpdateShift,
  hasAccess,
  userInfo,
  isAdmin,
  registeredUsers,
}) => {
  const [newComment, setNewComment] = useState("");
  const comments = useMemo(() => shift.comments || [], [shift.comments]);
  const commentsEndRef = useRef(null);

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [comments]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment = {
      id: crypto.randomUUID(),
      user: `${userInfo.firstName} ${userInfo.lastName} (${userInfo.initials})`,
      text: newComment,
      date: new Date().toISOString(),
      isAdmin: isAdmin || false, // Store admin status with comment
    };

    const updatedShift = {
      ...shift,
      comments: [...comments, comment],
    };

    onUpdateShift(day, updatedShift);
    setNewComment("");
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#f8fafc",
              marginBottom: "0.2rem",
            }}
          >
            Comments · {shift.site}
      </h3>
          <p
            style={{
              fontSize: "1.0rem",
              color: "#94a3b8",
              margin: 0,
            }}
          >
            
          </p>
        </div>

        <div
          style={{
            maxHeight: "40rem",
            minHeight: "30rem",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.9rem",
            padding: "1.25rem",
            backgroundColor: "rgba(2, 6, 23, 0.85)",
            borderRadius: "1rem",
            border: "1px solid rgba(148, 163, 184, 0.35)",
            boxShadow: "0 18px 36px rgba(2, 6, 23, 0.45)",
          }}
        >
          {comments.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: "rgba(148, 163, 184, 0.8)",
                fontSize: "1.0rem",
              }}
            >
              No comments yet.
            </div>
          )}
          {comments.map((comment) => {
            const displayName = extractDisplayName(comment.user);
            const initials = extractInitials(comment.user);
            // Simply check if the comment has isAdmin flag set to true
            const isAdminUser = comment.isAdmin === true;
            return (
              <div
                key={comment.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.9rem",
                  paddingBottom: "1.1rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "transparent",
                  border: "none",
                  boxShadow: "none",
                }}
              >
                <div
                  style={{
                    width: "2.6rem",
                    height: "2.6rem",
                    borderRadius: "9999px",
                    background: isAdminUser 
                      ? "linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 193, 7, 0.2) 50%, rgba(255, 215, 0, 0.3) 100%)"
                      : "linear-gradient(135deg, #1f2937, #3b82f6)",
                    border: isAdminUser ? "2px solid rgba(255, 215, 0, 0.6)" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    color: "#e2e8f0",
                    flexShrink: 0,
                    position: "relative",
                    overflow: "hidden",
                    ...(isAdminUser && {
                      boxShadow: "0 0 8px rgba(255, 215, 0, 0.5), inset 0 0 15px rgba(255, 215, 0, 0.15)",
                      animation: "adminAvatarFade 4s ease-in-out infinite",
                    }),
                  }}
                >
                  {initials}
                  {isAdminUser && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "linear-gradient(135deg, rgba(255, 215, 0, 0.4) 0%, transparent 50%, rgba(255, 193, 7, 0.4) 100%)",
                        borderRadius: "9999px",
                        opacity: 0.6,
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.45rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: "1rem",
                    }}
                  >
                    <span 
                      style={{ 
                        position: "relative",
                        display: "inline-block",
                        fontWeight: 600, 
                        color: isAdminUser ? "#FFD700" : "#f1f5f9", 
                        fontSize: "0.95rem",
                        ...(isAdminUser && {
                          background: "linear-gradient(90deg, #FFD700 0%, #FFF700 25%, #FFA500 50%, #FFF700 75%, #FFD700 100%)",
                          backgroundSize: "200% 100%",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                          animation: "shimmer 3s linear infinite",
                          filter: "drop-shadow(0 0 3px rgba(255, 215, 0, 0.8))",
                        }),
                      }}
                    >
                      {isAdminUser && (
                        <>
                          <span
                            style={{
                              position: "absolute",
                              top: "-8px",
                              left: "50%",
                              transform: "translateX(-50%)",
                              fontSize: "0.6rem",
                              animation: "starRotate 4s linear infinite",
                              animationDelay: "0s",
                              pointerEvents: "none",
                            }}
                          >
                            ✨
                          </span>
                          <span
                            style={{
                              position: "absolute",
                              top: "50%",
                              right: "-12px",
                              transform: "translateY(-50%)",
                              fontSize: "0.5rem",
                              animation: "starRotate 4s linear infinite",
                              animationDelay: "1s",
                              pointerEvents: "none",
                            }}
                          >
                            ⭐
                          </span>
                          <span
                            style={{
                              position: "absolute",
                              bottom: "-8px",
                              left: "50%",
                              transform: "translateX(-50%)",
                              fontSize: "0.6rem",
                              animation: "starRotate 4s linear infinite",
                              animationDelay: "2s",
                              pointerEvents: "none",
                            }}
                          >
                            ✨
                          </span>
                          <span
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "-12px",
                              transform: "translateY(-50%)",
                              fontSize: "0.5rem",
                              animation: "starRotate 4s linear infinite",
                              animationDelay: "3s",
                              pointerEvents: "none",
                            }}
                          >
                            ⭐
                          </span>
                        </>
                      )}
                      {displayName}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                        {formatTimestamp(comment.date)}
                      </span>
                      {hasAccess && (
                        <button
                          onClick={() => {
                            const updatedComments = comments.filter(c => c.id !== comment.id);
                            const updatedShift = {
                              ...shift,
                              comments: updatedComments,
                            };
                            onUpdateShift(day, updatedShift);
                          }}
                          style={{
                            padding: "0.25rem 0.5rem",
                            fontSize: "0.75rem",
                            color: "#fca5a5",
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "0.375rem",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
                            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
                            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <p
                    style={{
                      whiteSpace: "pre-wrap",
                      fontSize: "1.05rem",
                      margin: 0,
                      color: "#cbd5f5",
                      lineHeight: 1.5,
                    }}
                  >
                    {comment.text}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={commentsEndRef} />
        </div>

        {hasAccess ? (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <textarea
              rows="3"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Type your comment…"
              style={modalTextAreaStyle}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(96, 165, 250, 0.35)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(15, 23, 42, 0.35)";
              }}
            ></textarea>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
                style={modalPrimaryButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 12px 24px rgba(37, 99, 235, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
            >
              Add Comment
            </button>
            </div>
          </form>
        ) : (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={modalSecondaryButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.55)";
                e.currentTarget.style.color = "#f8fafc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.35)";
                e.currentTarget.style.color = "#e2e8f0";
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

/**
 * Day Notes Modal (New)
 */
const DayNotesModal = ({
  day,
  notes,
  onClose,
  onUpdateDayNotes,
  hasAccess,
  userInfo,
  isAdmin,
  registeredUsers,
}) => {
  const [newNote, setNewNote] = useState("");
  const dayNotes = useMemo(() => notes || [], [notes]);
  const notesEndRef = useRef(null);

  const scrollToBottom = () => {
    notesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [dayNotes]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const note = {
      id: crypto.randomUUID(),
      user: `${userInfo.firstName} ${userInfo.lastName} (${userInfo.initials})`,
      text: newNote,
      date: new Date().toISOString(),
      isAdmin: isAdmin || false, // Store admin status with note
    };

    onUpdateDayNotes(day, [...dayNotes, note]);
    setNewNote("");
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#f8fafc",
              marginBottom: "0.2rem",
            }}
          >
             Notes / Call Offs | {formatDateHeader(day.date)}
      </h3>
          <p
            style={{
              fontSize: "1.0rem",
              color: "#94a3b8",
              margin: 0,
            }}
          >

          </p>
        </div>

        <div
          style={{
            maxHeight: "40rem",
            minHeight: "30rem",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.9rem",
            padding: "1.25rem",
            backgroundColor: "rgba(2, 6, 23, 0.85)",
            borderRadius: "1rem",
            border: "1px solid rgba(148, 163, 184, 0.35)",
            boxShadow: "0 18px 36px rgba(2, 6, 23, 0.45)",
          }}
        >
          {dayNotes.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: "rgba(148, 163, 184, 0.85)",
                fontSize: "1.0rem",
              }}
            >
              No notes recorded yet.
            </div>
          )}
          {dayNotes.map((note) => {
            const displayName = extractDisplayName(note.user);
            const initials = extractInitials(note.user);
            // Simply check if the note has isAdmin flag set to true
            const isAdminUser = note.isAdmin === true;
            return (
              <div
                key={note.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.9rem",
                  paddingBottom: "1.1rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "transparent",
                  border: "none",
                  boxShadow: "none",
                }}
              >
                <div
                  style={{
                    width: "2.6rem",
                    height: "2.6rem",
                    borderRadius: "9999px",
                    background: isAdminUser 
                      ? "linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 193, 7, 0.2) 50%, rgba(255, 215, 0, 0.3) 100%)"
                      : "linear-gradient(135deg, #1f2937, #22d3ee)",
                    border: isAdminUser ? "2px solid rgba(255, 215, 0, 0.6)" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "1.05rem",
                    color: "#e2e8f0",
                    flexShrink: 0,
                    position: "relative",
                    overflow: "hidden",
                    ...(isAdminUser && {
                      boxShadow: "0 0 8px rgba(255, 215, 0, 0.5), inset 0 0 15px rgba(255, 215, 0, 0.15)",
                      animation: "adminAvatarFade 4s ease-in-out infinite",
                    }),
                  }}
                >
                  {initials}
                  {isAdminUser && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: "linear-gradient(135deg, rgba(255, 215, 0, 0.4) 0%, transparent 50%, rgba(255, 193, 7, 0.4) 100%)",
                        borderRadius: "9999px",
                        opacity: 0.6,
                        pointerEvents: "none",
                      }}
                    />
                  )}
                </div>
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.45rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: "1rem",
                    }}
                  >
                    <span 
                      style={{ 
                        position: "relative",
                        display: "inline-block",
                        fontWeight: 600, 
                        color: isAdminUser ? "#FFD700" : "#f1f5f9", 
                        fontSize: "0.95rem",
                        ...(isAdminUser && {
                          background: "linear-gradient(90deg, #FFD700 0%, #FFF700 25%, #FFA500 50%, #FFF700 75%, #FFD700 100%)",
                          backgroundSize: "200% 100%",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                          animation: "shimmer 3s linear infinite",
                          filter: "drop-shadow(0 0 3px rgba(255, 215, 0, 0.8))",
                        }),
                      }}
                    >
                      {isAdminUser && (
                        <>
                          <span
                            style={{
                              position: "absolute",
                              top: "-8px",
                              left: "50%",
                              transform: "translateX(-50%)",
                              fontSize: "0.6rem",
                              animation: "starRotate 4s linear infinite",
                              animationDelay: "0s",
                              pointerEvents: "none",
                            }}
                          >
                            ✨
                          </span>
                          <span
                            style={{
                              position: "absolute",
                              top: "50%",
                              right: "-12px",
                              transform: "translateY(-50%)",
                              fontSize: "0.5rem",
                              animation: "starRotate 4s linear infinite",
                              animationDelay: "1s",
                              pointerEvents: "none",
                            }}
                          >
                            ⭐
                          </span>
                          <span
                            style={{
                              position: "absolute",
                              bottom: "-8px",
                              left: "50%",
                              transform: "translateX(-50%)",
                              fontSize: "0.6rem",
                              animation: "starRotate 4s linear infinite",
                              animationDelay: "2s",
                              pointerEvents: "none",
                            }}
                          >
                            ✨
                          </span>
                          <span
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "-12px",
                              transform: "translateY(-50%)",
                              fontSize: "0.5rem",
                              animation: "starRotate 4s linear infinite",
                              animationDelay: "3s",
                              pointerEvents: "none",
                            }}
                          >
                            ⭐
                          </span>
                        </>
                      )}
                      {displayName}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                        {formatTimestamp(note.date)}
                      </span>
                      {hasAccess && (
                        <button
                          onClick={() => {
                            const updatedNotes = dayNotes.filter(n => n.id !== note.id);
                            onUpdateDayNotes(day, updatedNotes);
                          }}
                          style={{
                            padding: "0.25rem 0.5rem",
                            fontSize: "0.75rem",
                            color: "#fca5a5",
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            borderRadius: "0.375rem",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
                            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
                            e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <p
                    style={{
                      whiteSpace: "pre-wrap",
                      fontSize: "1.05rem",
                      margin: 0,
                      color: "#cbd5f5",
                      lineHeight: 1.5,
                    }}
                  >
                    {note.text}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={notesEndRef} />
        </div>

        {hasAccess ? (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <textarea
              rows="3"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note…"
              style={modalTextAreaStyle}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(96, 165, 250, 0.35)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(15, 23, 42, 0.35)";
              }}
            ></textarea>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                style={modalPrimaryButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 12px 24px rgba(37, 99, 235, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                Add Note
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={modalSecondaryButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.55)";
                e.currentTarget.style.color = "#f8fafc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.35)";
                e.currentTarget.style.color = "#e2e8f0";
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};

/**
 * Registered Users Modal
 */
const RegisteredUsersModal = ({ users, onClose }) => {
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const nameA = `${a.lastName || ""}${a.firstName || ""}`.toLowerCase();
      const nameB = `${b.lastName || ""}${b.firstName || ""}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [users]);

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%", maxWidth: "36rem" }}>
        <div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#f8fafc",
              marginBottom: "0.25rem",
            }}
          >
            Registered Accounts
          </h3>
          <p
            style={{
              fontSize: "1.0rem",
              color: "#94a3b8",
              margin: 0,
            }}
          >
            Overview of every profile that has signed in on this device.
          </p>
        </div>

        <div
          style={{
            maxHeight: "22rem",
            overflowY: "auto",
            borderRadius: "1rem",
            border: "1px solid rgba(148, 163, 184, 0.18)",
            background: "linear-gradient(180deg, rgba(15,23,42,0.75), rgba(15,23,42,0.45))",
            boxShadow: "inset 0 0 0 1px rgba(15, 23, 42, 0.35)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr 0.8fr 1.2fr",
              padding: "0.85rem 1rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontSize: "0.7rem",
              color: "#94a3b8",
              borderBottom: "1px solid rgba(148, 163, 184, 0.18)",
            }}
          >
            <span>Name</span>
            <span>Initials</span>
            <span>Role</span>
            <span>Created</span>
          </div>
          {sortedUsers.length === 0 ? (
            <div
              style={{
                padding: "1.25rem",
                textAlign: "center",
                fontSize: "1.05rem",
                color: "rgba(148, 163, 184, 0.85)",
              }}
            >
              No registered profiles yet.
            </div>
          ) : (
            sortedUsers.map((user) => (
              <div
                key={`${user.userId}-${user.initials}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 0.8fr 0.8fr 1.2fr",
                  padding: "0.9rem 1rem",
                  borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
                  color: "#e2e8f0",
                  fontSize: "1.0rem",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span>{`${user.firstName || ""} ${user.lastName || ""}`.trim() || "—"}</span>
                <span style={{ fontFamily: "monospace", letterSpacing: "0.08em" }}>
                  {user.initials || "??"}
                </span>
                <span>
                  {user.isAdmin ? "Admin" : user.hasAccess ? "Editor" : "Viewer"}
                </span>
                <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                  {formatTimestamp(user.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
            style={modalSecondaryButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.55)";
              e.currentTarget.style.color = "#f8fafc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.35)";
              e.currentTarget.style.color = "#e2e8f0";
            }}
            >
              Close
            </button>
          </div>
      </div>
    </Modal>
  );
};

// --- Icon Components ---
const ArrowLeftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 19l-7-7 7-7"
    />
  </svg>
);
const ArrowRightIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);
const CalendarIcon = () => (
  <span role="img" aria-label="Calendar" style={{ fontSize: "1.15rem", lineHeight: 1 }}>
    🗓️
  </span>
);
// New Note Icon
const NoteIcon = () => (
  <span role="img" aria-label="Notes" style={{ fontSize: "0.9rem", lineHeight: 0.5 }}>
    📄
  </span>
);

// --- Main App Component ---
const App = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekData, setWeekData] = useState({ days: [] });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [currentModalType, setCurrentModalType] = useState(null); // Track which modal is open: 'addShift', 'dayNotes', etc.
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    day: null,
    shift: null,
  });
  const [firebaseError, setFirebaseError] = useState(false);
  const [clipboard, setClipboard] = useState(null); // State for copied shift
  const [pasteMenuState, setPasteMenuState] = useState({
    visible: false,
    x: 0,
    y: 0,
    day: null,
  }); // State for paste menu
  const boardScrollRef = useRef(null); // Ref for board scroll container
  const syncScrollRef = useRef(false); // Prevent recursive scroll syncing
  // Cache for week documents to reduce Firebase reads
  const weekCacheRef = useRef(new Map());
  
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    // OPTIMIZED: Load from localStorage with cleanup and limits
    try {
      const saved = localStorage.getItem("scheduleRegisteredUsers");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Limit initial load to 500 entries to reduce memory usage
        return Array.isArray(parsed) ? parsed.slice(0, 500) : [];
      }
      return [];
    } catch (error) {
      // If corrupted, clear it
      try {
        localStorage.removeItem("scheduleRegisteredUsers");
      } catch (clearError) {
        // Ignore clear errors
      }
      return [];
    }
  });

  const { user, userId, userInfo, hasAccess, initials, isAuthReady, signUp, clearUserInfo } =
    useUserAccess();

  const handleSignUp = useCallback(
    async (firstName, lastName, code) => {
      const result = await signUp(firstName, lastName, code);
      if (result.success && result.user) {
        setRegisteredUsers((prev) => {
          const existingIndex = prev.findIndex(
            (u) => u.userId === result.user.userId
          );
          if (existingIndex === -1) {
            return [...prev, result.user];
          }
          const clone = [...prev];
          clone[existingIndex] = { ...clone[existingIndex], ...result.user };
          return clone;
        });
      }
      return result;
    },
    [signUp]
  );
  const handleOpenAnalysis = useCallback(() => {
    if (typeof window !== "undefined") {
      window.open(ANALYSIS_URL, "_blank", "noopener,noreferrer");
    }
  }, []);
  const handleOpenSiteManager = useCallback(() => {
    if (typeof window !== "undefined") {
      window.open(SITE_MANAGER_URL, "_blank", "noopener,noreferrer");
    }
  }, []);

  // OPTIMIZED: Limit localStorage usage and add cleanup
  useEffect(() => {
    if (!db) return;

    try {
      // Only store essential data: initials and admin status (not full user objects)
      const essentialData = registeredUsers.map(u => ({
        userId: u.userId,
        initials: u.initials,
        isAdmin: u.isAdmin || false,
      }));
      
      // Limit stored data to 1000 entries max
      const limitedData = essentialData.slice(0, 1000);
      
      localStorage.setItem(
        "scheduleRegisteredUsers",
        JSON.stringify(limitedData)
      );
      
      // Cleanup: Remove old localStorage data if it exceeds 5MB
      try {
        const stored = localStorage.getItem("scheduleRegisteredUsers");
        if (stored && new Blob([stored]).size > 5 * 1024 * 1024) {
          // If stored data > 5MB, only keep last 500 entries
          const parsed = JSON.parse(stored);
          const cleaned = parsed.slice(-500);
          localStorage.setItem("scheduleRegisteredUsers", JSON.stringify(cleaned));
        }
      } catch (cleanupError) {
        console.warn("Error cleaning up localStorage:", cleanupError);
      }
    } catch (error) {
      console.error("Unable to persist registered users:", error);
      // If storage quota exceeded, clear old data
      try {
        localStorage.removeItem("scheduleRegisteredUsers");
      } catch (clearError) {
        console.error("Unable to clear localStorage:", clearError);
      }
    }
  }, [registeredUsers]);

  // Load registered users from Firestore with real-time listener
  // OPTIMIZED: Only load users that are admins or recently active (last 90 days)
  useEffect(() => {
    if (!db || !isAuthReady || !userId) return;

    let unsubscribe = null;

    try {
      // Split collection path into segments for Firestore
      const collectionPath = REGISTERED_USERS_COLLECTION.split('/').filter(Boolean);
      const usersCollectionRef = collection(db, ...collectionPath);
      
      // Use query with limit to prevent loading too many users
      // Load all users for now (needed for admin detection), but limit to 1000 max
      // In future, can optimize to only load admins + recent users
      unsubscribe = onSnapshot(usersCollectionRef, (usersSnapshot) => {
        const usersFromFirestore = [];
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
        
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          if (userData.initials && userData.initials.trim()) {
            // Only include admin users or users created/active in last 90 days
            const createdAt = userData.createdAt ? new Date(userData.createdAt) : null;
            const isRecent = createdAt && createdAt >= ninetyDaysAgo;
            const isAdmin = userData.isAdmin === true;
            
            // Always include admins, include recent users, limit total to prevent memory issues
            if (isAdmin || isRecent || usersFromFirestore.length < 500) {
              usersFromFirestore.push({
                ...userData,
                userId: doc.id,
              });
            }
          }
        });
        
        // Sort: admins first, then by creation date (newest first)
        usersFromFirestore.sort((a, b) => {
          if (a.isAdmin && !b.isAdmin) return -1;
          if (!a.isAdmin && b.isAdmin) return 1;
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bDate - aDate;
        });
        
        // Limit to top 500 users (all admins + most recent users)
        const limitedUsers = usersFromFirestore.slice(0, 500);
        
        // Merge with local userInfo if it exists (always include current user)
        if (userInfo && userInfo.userId) {
          const existingIndex = limitedUsers.findIndex(
            (u) => u.userId === userInfo.userId
          );
          const enriched = {
            ...userInfo,
            createdAt: userInfo.createdAt || new Date().toISOString(),
          };
          if (existingIndex === -1) {
            // Current user not in list, add them (replace last if at limit)
            if (limitedUsers.length >= 500) {
              limitedUsers[499] = enriched;
            } else {
              limitedUsers.push(enriched);
            }
          } else {
            limitedUsers[existingIndex] = {
              ...limitedUsers[existingIndex],
              ...enriched,
            };
          }
        }
        
        setRegisteredUsers(limitedUsers);
      }, (error) => {
        console.error("Error loading registered users:", error);
        // Fallback to local userInfo if Firestore fails
        if (userInfo && userInfo.userId) {
          setRegisteredUsers([{
            ...userInfo,
            createdAt: userInfo.createdAt || new Date().toISOString(),
          }]);
        }
      });
    } catch (error) {
      console.error("Error setting up registered users listener:", error);
      // Fallback to local userInfo if Firestore fails
      if (userInfo && userInfo.userId) {
        setRegisteredUsers([{
          ...userInfo,
          createdAt: userInfo.createdAt || new Date().toISOString(),
        }]);
      }
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [db, isAuthReady, userId, userInfo]);
  
  // Also sync current user to Firestore
  useEffect(() => {
    if (!db || !userInfo || !userInfo.userId) return;

    const syncUserToFirestore = async () => {
      try {
        // Split collection path into segments for Firestore
        const collectionPath = REGISTERED_USERS_COLLECTION.split('/').filter(Boolean);
        const userDocRef = doc(db, ...collectionPath, userInfo.userId);
        await setDoc(userDocRef, {
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          initials: userInfo.initials,
          hasAccess: userInfo.hasAccess,
          isAdmin: userInfo.isAdmin,
          createdAt: userInfo.createdAt || new Date().toISOString(),
          syncedWithFirebase: true,
        }, { merge: true });
      } catch (error) {
        console.error("Error syncing user to Firestore:", error);
      }
    };

    syncUserToFirestore();
  }, [db, userInfo]);

  const weekId = useMemo(() => getWeekId(currentDate), [currentDate]);
  const weekDays = useMemo(() => {
    const start = getStartOfWeek(currentDate);
    return getWeekDays(start).map((date) => ({
      date,
      dateString: getDateKey(date),
    }));
  }, [currentDate]);

  // Firestore collection path
  const collectionPath = `/artifacts/${appId}/public/data/schedule-weeks`;

  // Data fetching and real-time listener
  useEffect(() => {
    // If auth is ready but Firebase is not initialized, show error immediately
    if (isAuthReady && !db) {
      console.error("Firestore is not initialized.");
      setFirebaseError(true);
      setLoading(false);
      return;
    }
    
    // Wait for auth to be ready AND for a user to be signed in (even anon)
    if (!isAuthReady || !userId) {
      // If auth is ready but no userId, and we've waited, stop loading
      if (isAuthReady && !userId && !auth) {
        setLoading(false);
        setFirebaseError(true);
      }
      return;
    }

    setLoading(true);
    const weekDocRef = doc(db, collectionPath, weekId); // Modular syntax

    const unsubscribe = onSnapshot( // Modular syntax
      weekDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const daysWithData = weekDays.map((day) => {
            const matchingDay = data.days.find(
              (d) => d.date === day.dateString
            );
            return {
              date: new Date(day.date),
              dateString: day.dateString,
              shifts: matchingDay ? matchingDay.shifts : [],
              notes: matchingDay ? matchingDay.notes : [], // Add notes
            };
          });
          setWeekData({ days: daysWithData });
        } else {
          const blankWeek = weekDays.map((day) => ({
            date: new Date(day.date),
            dateString: day.dateString,
            shifts: [],
            notes: [], // Add notes
          }));
          setWeekData({ days: blankWeek });
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching week data:", error);
        setFirebaseError(true);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [weekId, isAuthReady, userId, collectionPath, weekDays]); // Removed db and appId (outer scope constants)

  // Calculate top 3 user initials from leaderboard
  const topUserInitials = useMemo(() => {
    const shiftCounts = {};
    weekData.days?.forEach((day) => {
      day.shifts?.forEach((shift) => {
        if (shift.initials && shift.initials.trim()) {
          const bgColor = shift.bgColor || "#FFFFFF";
          const normalizedBg = bgColor.toUpperCase();
          const isFilled = normalizedBg !== "#FFFFFF" && normalizedBg !== "FFFFFF" &&
                          normalizedBg !== COLOR_COMPLETE_BG.toUpperCase() &&
                          normalizedBg !== COLOR_OPS_BG.toUpperCase();
          if (isFilled) {
            const initials = shift.initials.trim().toUpperCase();
            shiftCounts[initials] = (shiftCounts[initials] || 0) + 1;
          }
        }
      });
    });
    const sorted = Object.entries(shiftCounts)
      .map(([initials, count]) => ({ initials, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3); // Top 3
    return sorted.length > 0 ? sorted : null;
  }, [weekData]);
  
  // Get isAdmin status
  const isAdmin = Boolean(userInfo?.isAdmin);

  // --- Firestore Update Functions ---

  /**
   * Helper to get the current state of the week document
   * OPTIMIZED: Uses cached data from weekData state when available
   */
  const getWeekDoc = async () => {
    if (!db) return [];
    
    // Use cached weekData if available and matches current week
    if (weekData.days && weekData.days.length > 0) {
      return weekData.days.map((day) => ({
        date: day.dateString || getDateKey(day.date),
        shifts: day.shifts || [],
        notes: day.notes || [],
      }));
    }
    
    // Fallback to fetching from Firebase
    const weekDocRef = doc(db, collectionPath, weekId);
    const docSnap = await getDoc(weekDocRef);
    if (docSnap.exists()) {
      const savedDays = Array.isArray(docSnap.data().days)
        ? docSnap.data().days
        : [];
      const savedMap = new Map(savedDays.map((day) => [day.date, day]));
      return weekDays.map((day) => {
        const existing = savedMap.get(day.dateString);
        return {
          date: day.dateString,
          shifts: existing?.shifts || [],
          notes: existing?.notes || [],
        };
      });
    }
    return weekDays.map((day) => ({
      date: day.dateString,
      shifts: [],
      notes: [],
    }));
  };

  /**
   * Updates a single shift in the database.
   */
  const handleUpdateShift = useCallback(async (day, updatedShift) => {
    if (!db) {
      console.error("Cannot update shift, DB not connected.");
      return;
    }
    const dayString = getDateKey(day.date);
    const currentDays = await getWeekDoc();
    const dayIndex = currentDays.findIndex((d) => d.date === dayString);

    if (dayIndex === -1) return;

    // Ensure shifts array exists
    currentDays[dayIndex].shifts = currentDays[dayIndex].shifts || [];

    const shiftIndex = currentDays[dayIndex].shifts.findIndex(
      (s) => s.id === updatedShift.id
    );
    if (shiftIndex > -1) {
      currentDays[dayIndex].shifts[shiftIndex] = updatedShift;
    }

    const weekDocRef = doc(db, collectionPath, weekId); // Modular syntax
    await setDoc(weekDocRef, { days: currentDays }, { merge: true }); // Modular syntax
    closeModal();
  }, [db, weekId, collectionPath, weekData, weekDays]);

  /**
   * Deletes a shift from the database.
   */
  const handleDeleteShift = useCallback(async (day, shiftToDelete) => {
    if (!db) {
      console.error("Cannot delete shift, DB not connected.");
      return;
    }
    const dayString = getDateKey(day.date);
    const currentDays = await getWeekDoc();
    const dayIndex = currentDays.findIndex((d) => d.date === dayString);

    if (dayIndex === -1) return;

    currentDays[dayIndex].shifts = (
      currentDays[dayIndex].shifts || []
    ).filter((s) => s.id !== shiftToDelete.id);

    const weekDocRef = doc(db, collectionPath, weekId); // Modular syntax
    await setDoc(weekDocRef, { days: currentDays }, { merge: true }); // Modular syntax
    closeModal();
  }, [db, weekId, collectionPath, weekData, weekDays]);

  /**
   * Pastes a shift into a day.
   */
  const handlePasteShift = useCallback(async () => {
    const { day } = pasteMenuState;
    if (!db || !day || !clipboard) {
      console.error("Cannot paste shift, DB, day, or clipboard missing.");
      return;
    }

    // Create a new shift object with a new ID
    const newShift = { ...clipboard, id: crypto.randomUUID() };

    const dayString = getDateKey(day.date);
    const currentDays = await getWeekDoc();
    const dayIndex = currentDays.findIndex((d) => d.date === dayString);

    if (dayIndex === -1) return; // Day not found

    // Ensure shifts array exists
    currentDays[dayIndex].shifts = currentDays[dayIndex].shifts || [];

    // Add the new shift to the day's shifts array
    currentDays[dayIndex].shifts.push(newShift);

    const weekDocRef = doc(db, collectionPath, weekId); // Modular syntax
    await setDoc(weekDocRef, { days: currentDays }, { merge: true }); // Modular syntax
    setPasteMenuState({ visible: false }); // Close paste menu
  }, [db, weekId, collectionPath, clipboard, weekData, weekDays]);

  /**
   * Updates the notes for a specific day.
   */
  const handleUpdateDayNotes = useCallback(async (day, newNotes) => {
    if (!db) {
      console.error("Cannot update notes, DB not connected.");
      return;
    }
    const dayString = getDateKey(day.date);
    const currentDays = await getWeekDoc();
    const dayIndex = currentDays.findIndex((d) => d.date === dayString);

    if (dayIndex === -1) return;

    // Update the notes for the specific day
    currentDays[dayIndex].notes = newNotes;

    const weekDocRef = doc(db, collectionPath, weekId); // Modular syntax
    await setDoc(weekDocRef, { days: currentDays }, { merge: true }); // Modular syntax
    // Don't close modal, just update
  }, [db, weekId, collectionPath, weekData, weekDays]);

  /**
   * Adds a new shift to a specific day.
   */
  const handleAddShift = useCallback(async (day, newShift) => {
    if (!db) {
      console.error("Cannot add shift, DB not connected.");
      return;
    }
    const dayString = getDateKey(day.date);
    const currentDays = await getWeekDoc();
    const dayIndex = currentDays.findIndex((d) => d.date === dayString);

    if (dayIndex === -1) {
      console.error("Day not found in week data.");
      return;
    }

    // Ensure shifts array exists
    currentDays[dayIndex].shifts = currentDays[dayIndex].shifts || [];
    currentDays[dayIndex].shifts.push(newShift);

    const weekDocRef = doc(db, collectionPath, weekId); // Modular syntax
    await setDoc(weekDocRef, { days: currentDays }, { merge: true }); // Modular syntax
  }, [db, weekId, collectionPath, weekData, weekDays]);

  /**
   * Splits a shift into two shifts at the specified split time.
   */
  const handleSplitShift = useCallback(async (day, originalShift, splitTime) => {
    if (!db) {
      console.error("Cannot split shift, DB not connected.");
      return;
    }

    const dayString = getDateKey(day.date);
    const currentDays = await getWeekDoc();
    const dayIndex = currentDays.findIndex((d) => d.date === dayString);

    if (dayIndex === -1) {
      console.error("Day not found in week data.");
      return;
    }

    // Ensure shifts array exists
    currentDays[dayIndex].shifts = currentDays[dayIndex].shifts || [];

    // Find the original shift index
    const originalShiftIndex = currentDays[dayIndex].shifts.findIndex(
      (s) => s.id === originalShift.id
    );

    if (originalShiftIndex === -1) {
      console.error("Original shift not found.");
      return;
    }

    // Create first shift: original startTime to splitTime
    const firstShift = {
      ...originalShift,
      id: crypto.randomUUID(),
      startTime: originalShift.startTime,
      endTime: splitTime,
    };

    // Create second shift: splitTime to original endTime
    const secondShift = {
      ...originalShift,
      id: crypto.randomUUID(),
      startTime: splitTime,
      endTime: originalShift.endTime,
    };

    // Remove the original shift and insert the two new shifts at the same position
    currentDays[dayIndex].shifts.splice(originalShiftIndex, 1, firstShift, secondShift);

    const weekDocRef = doc(db, collectionPath, weekId); // Modular syntax
    await setDoc(weekDocRef, { days: currentDays }, { merge: true }); // Modular syntax
  }, [db, weekId, collectionPath, weekData, weekDays]);

  // --- Navigation Handlers ---
  const goToPrevWeek = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() - 7);
      return next;
    });
  };
  const goToNextWeek = () => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + 7);
      return next;
    });
  };
  const goToToday = () => {
    const today = new Date();
    const normalized = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    setCurrentDate(normalized);
  };
  const selectDate = (date) => {
    const normalized = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    setCurrentDate(normalized);
    closeModal();
  };

  // --- Modal Handlers ---
  const openModal = (content, modalType = null) => {
    setModalContent(content);
    setIsModalOpen(true);
    setCurrentModalType(modalType);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
    setCurrentModalType(null);
    setContextMenu({ visible: false });
    setPasteMenuState({ visible: false }); // Close paste menu too
  };

  const openAddShiftModal = (day) => {
    // FIX: Force read local storage here to ensure hasAccess is fresh before opening.
    const userAccess = JSON.parse(localStorage.getItem('scheduleUser'));

    // The button is shown if 'hasAccess' is true, but this click handler must also check it.
    if (!userAccess || !userAccess.hasAccess) {
      console.warn("Attempted to open Add Shift modal without edit access. User must sign up with code.");
      return;
    }
    openModal(
      <AddShiftModal
        day={day}
        onClose={closeModal}
        onAddShift={handleAddShift}
      />,
      'addShift'
    );
  };
  const openEditShiftModal = (day, shift) => {
    openModal(
      <EditShiftModal
        shift={shift}
        day={day}
        weekId={weekId}
        onClose={closeModal}
        onUpdateShift={handleUpdateShift}
      />
    );
  };
  const openColorModal = (day, shift) => {
    openModal(
      <ColorModal
        shift={shift}
        day={day}
        onClose={closeModal}
        onUpdateShift={handleUpdateShift}
      />
    );
  };
  const openCalendarModal = () => {
    openModal(
      <CalendarModal
        currentDate={currentDate}
        onClose={closeModal}
        onDateSelect={selectDate}
      />
    );
  };
  const openSignUpModal = () => {
    openModal(<SignUpModal onClose={closeModal} onSignUp={handleSignUp} />);
  };
  const openCommentModal = (day, shift) => {
    openModal(
      <CommentModal
        shift={shift}
        day={day}
        onClose={closeModal}
        onUpdateShift={handleUpdateShift}
        hasAccess={hasAccess}
        userInfo={userInfo}
        isAdmin={isAdmin}
        registeredUsers={registeredUsers}
      />
    );
  };
  const openSplitShiftModal = (day, shift) => {
    openModal(
      <SplitShiftModal
        shift={shift}
        day={day}
        onClose={closeModal}
        onSplitShift={handleSplitShift}
      />
    );
  };
  const openRegisteredUsersModal = () => {
    openModal(
      <RegisteredUsersModal
        users={registeredUsers}
        onClose={closeModal}
      />
    );
  };
  // New modal handler for Day Notes
  const openDayNotesModal = (day, notes) => {
    openModal(
      <DayNotesModal
        day={day}
        notes={notes}
        onClose={closeModal}
        onUpdateDayNotes={handleUpdateDayNotes}
        hasAccess={hasAccess}
        userInfo={userInfo}
        isAdmin={isAdmin}
        registeredUsers={registeredUsers}
      />,
      'dayNotes'
    );
  };

  // --- Context Menu Handlers ---
  const handleContextMenu = (e, day, shift) => {
    e.preventDefault();
    if (!hasAccess) return;
    setPasteMenuState({ visible: false }); // Close other menu
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      day: day,
      shift: shift,
    });
  };

  const handleContextDelete = () => {
    const { day, shift } = contextMenu;
    if (day && shift) {
      handleDeleteShift(day, shift);
    }
    setContextMenu({ visible: false });
  };

  const handleContextEdit = () => {
    const { day, shift } = contextMenu;
    if (day && shift) {
      openEditShiftModal(day, shift);
    }
    setContextMenu({ visible: false });
  };

  const handleContextColor = () => {
    const { day, shift } = contextMenu;
    if (day && shift) {
      openColorModal(day, shift);
    }
    setContextMenu({ visible: false });
  };

  const handleContextComplete = () => {
    const { day, shift } = contextMenu;
    if (day && shift) {
      handleUpdateShift(day, {
        ...shift,
        bgColor: COLOR_COMPLETE_BG, // Lighter green
        initials: shift.initials || initials,
      });
    }
    setContextMenu({ visible: false });
  };

  const handleContextOps = () => {
    const { day, shift } = contextMenu;
    if (day && shift) {
      handleUpdateShift(day, {
        ...shift,
        bgColor: COLOR_OPS_BG, // Lighter blue
      });
    }
    setContextMenu({ visible: false });
  };

  const handleContextComment = () => {
    const { day, shift } = contextMenu;
    if (day && shift) {
      openCommentModal(day, shift);
    }
    setContextMenu({ visible: false });
  };

  const handleContextCopy = () => {
    const { shift } = contextMenu;
    if (shift) {
      setClipboard(shift); // Copy shift data to state
      const details = `${shift.site} ${shift.startTime}-${shift.endTime}`;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(details).catch((err) => {
          console.warn("Unable to write shift details to clipboard:", err);
        });
      }
    }
    setContextMenu({ visible: false });
  };

  const handleContextSplit = () => {
    const { day, shift } = contextMenu;
    if (day && shift) {
      openSplitShiftModal(day, shift);
    }
    setContextMenu({ visible: false });
  };

  // New handler for the '+' button's context menu
  const handlePasteMenu = (e, day) => {
    e.preventDefault();
    if (!clipboard || !hasAccess) return; // Only show if something is copied
    setContextMenu({ visible: false }); // Close other menu
    setPasteMenuState({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      day: day,
    });
  };

  // --- Double-Click Handler ---
  const handleDoubleClick = (day, shift) => {
    openCommentModal(day, shift);
  };

  const handleLogout = useCallback(async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      clearUserInfo();
      setRegisteredUsers([]);
    }
  }, [clearUserInfo]);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if:
      // 1. User is typing in an input, textarea, or contenteditable element
      // 2. User is holding Ctrl/Cmd or Alt (to allow normal shortcuts)
      const target = e.target;
      const isInputElement = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('[contenteditable="true"]');
      
      if (isInputElement || e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const key = e.key.toLowerCase();
      const isToggleKey = key === 't' || key === 'c';
      
      // For non-toggle keys (j, k), don't work when modal is open
      if (!isToggleKey && isModalOpen) {
        return;
      }

      // Get current day (today) from weekData.days
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayKey = getDateKey(today);
      const currentDay = weekData.days?.find((day) => {
        const dayKey = day.dateString || getDateKey(day.date);
        return dayKey === todayKey;
      });

      // If not found in weekData, try weekDays as fallback
      const fallbackDay = !currentDay ? weekDays.find((day) => {
        const dayDate = new Date(day.date);
        dayDate.setHours(0, 0, 0, 0);
        return dayDate.getTime() === today.getTime();
      }) : null;

      const dayToUse = currentDay || fallbackDay;

      switch (key) {
        case 't':
          // Toggle add shift modal for current day
          if (dayToUse && hasAccess) {
            e.preventDefault();
            if (isModalOpen && currentModalType === 'addShift') {
              closeModal();
            } else {
              openAddShiftModal(dayToUse);
            }
          }
          break;
        case 'j':
          // Go to previous week
          e.preventDefault();
          goToPrevWeek();
          break;
        case 'k':
          // Go to next week
          e.preventDefault();
          goToNextWeek();
          break;
        case 'c':
          // Toggle notes for current day
          if (dayToUse) {
            e.preventDefault();
            if (isModalOpen && currentModalType === 'dayNotes') {
              closeModal();
            } else {
              const notes = currentDay?.notes || dayToUse.notes || [];
              openDayNotesModal(dayToUse, notes);
            }
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [weekDays, weekData, hasAccess, isModalOpen, currentModalType, openAddShiftModal, goToPrevWeek, goToNextWeek, openDayNotesModal, closeModal]);

  // --- Render ---
  if (!isAuthReady) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-white">
        Loading Authentication...
      </div>
    );
  }

  if (firebaseError) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-red-500 p-8">
        <div className="bg-gray-800 p-6 rounded-lg border border-red-500">
          <h2 className="text-xl font-bold mb-4">Database Error</h2>
          <p>Could not connect to the scheduling database.</p>
          <p>
            Please check the console and ensure Firebase is set up correctly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-4 md:p-6 bg-black min-h-screen font-sans text-gray-100"
      style={{
        padding: "1rem",
        backgroundColor: "#000000",
        minHeight: "100vh",
        color: "#f3f4f6",
        fontFamily: "monospace",
        fontSize: "0.88rem",
      }}
      onClick={(e) => {
        // Only close menus if clicking outside of them
        if (!e.target.closest('.context-menu')) {
        setContextMenu({ visible: false });
        setPasteMenuState({ visible: false });
        }
      }}
      onContextMenu={(e) => {
        // Prevent default context menu on the main container
        if (!e.target.closest('.shift-item')) {
          e.preventDefault();
        }
      }}
    >
      <Header
        onPrevWeek={goToPrevWeek}
        onNextWeek={goToNextWeek}
        onToday={goToToday}
        onOpenCalendar={openCalendarModal}
        onSignUp={openSignUpModal}
        userInfo={userInfo}
        hasAccess={hasAccess}
        onOpenAnalysis={handleOpenAnalysis}
        onOpenSiteManager={handleOpenSiteManager}
        showSettings={Boolean(userInfo?.isAdmin)}
        onOpenSettings={openRegisteredUsersModal}
        onLogout={handleLogout}
        weekData={weekData}
      />

      {/* Schedule Board */}
        <div
        ref={boardScrollRef}
        className="overflow-x-auto hide-scrollbar pb-4 relative"
          style={{
          overflowX: "auto", 
          overflowY: "hidden",
          paddingBottom: "1rem",
          position: "relative",
          msOverflowStyle: "none",
          scrollbarWidth: "none",

        }}
        onWheel={(e) => {
          if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
            e.preventDefault();
            e.stopPropagation();
            const container = e.currentTarget;
            container.scrollLeft += e.deltaY;
          }
        }}
      >
        <div 
          className="flex flex-row" 
          style={{ 
            display: "flex",
            flexDirection: "row",
            alignItems: "stretch",
            width: "95%",
            minWidth: "80%" 
          }}
        >
          {loading ? (
            <div className="text-white text-center p-10 w-full">
              Loading Week Data...
            </div>
          ) : (
            weekData.days.map((day) => {
              const hasNotes = day.notes && day.notes.length > 0;
              return (
                  <DayColumn
                  key={day.dateString || getDateKey(day.date)}
                    day={day}
                    shifts={day.shifts}
                    hasAccess={hasAccess}
                    hasNotes={hasNotes}
                    boardScrollRef={boardScrollRef}
                    syncScrollRef={syncScrollRef}
                    topUserInitials={topUserInitials}
                    onContextMenu={(e, shift) =>
                      handleContextMenu(e, day, shift)
                    }
                    onDoubleClick={(shift) => handleDoubleClick(day, shift)}
                    onAddShift={() => openAddShiftModal(day)}
                    onPasteMenu={(e) => handlePasteMenu(e, day)}
                    onDayNotes={() => openDayNotesModal(day, day.notes)}
                  />
              );
            })
          )}
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && modalContent}

      {/* Context Menu for Shifts */}
      <ContextMenu
        menuState={contextMenu}
        onClose={() => setContextMenu({ visible: false })}
        onEdit={handleContextEdit}
        onDelete={handleContextDelete}
        onComplete={handleContextComplete}
        onOps={handleContextOps}
        onColor={handleContextColor}
        onComment={handleContextComment}
        onCopy={handleContextCopy}
        onSplit={handleContextSplit}
      />

      {/* Context Menu for Pasting */}
      <PasteMenu
        menuState={pasteMenuState}
        onClose={() => setPasteMenuState({ visible: false })}
        onPaste={handlePasteShift}
      />
    </div>
  );
}

export default App;
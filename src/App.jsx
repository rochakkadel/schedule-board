/* eslint-disable no-unused-vars */

// Import React hooks
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

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
  "736 Mission St",
  "600 California St",
  "120 Kearny St",
  "1128 Market St",
  "420 23rd St",
  "1 La Avanzada St",
  "500 Howard St",
  "500 Pine St",
  "1800 Mission St",
  "130 Battery St",
  "1400 Geary Blvd",
  "300 Kansas St",
  "633 Folsom St",
  "501 2nd St",
  "111 Pine St",
  "400 Paul Ave",
  "1 Kearny St",
  "1200 Van Ness Ave",
  "181 Fremont St",
  "274 Brannan St",
  "360 Spear St",
  "1035 Market St",
  "150 Spear St",
  "750 Battery St",
  "1635 Divisadero St",
  "115 Sansome St",
  "180 Montgomery St",
  "220 Montgomery St",
  "601 California St",
  "711 Eddy St",
  "1280 Laguna St",
  "71 Stevenson St",
  "240 Stockton St",
  "30 Grant Ave",
  "170 Maiden Lane",
  "599 Skyline Blvd",
  "456 Montgomery St",
  "717 Market St",
  "201 Mission St",
  "101 Mission St",
  "100 Montgomery St",
  "166 Geary St",
  "26 O'Farrell St",
  "153 Kearny St",
  "110 Sutter St",
  "311 California St",
  "90 New Montgomery St",
  "785 Market St",
  "230 California St",
  "101 Montgomery St",
  "425 California St",
  "210 Post St",
  "30 Maiden Lane",
  "222 Kearny St",
  "150 Post St",
  "1019 Market St",
   "Sutro Tower",
  "425 Market St",
  
];
const FONT_COLORS = ["#000000", "#FFFFFF", "#FF0000"]; // black, white, red
const FILL_COLORS = ["#FFFFFF", "#008000", "#0000FF", "#000000", "#FFA500"]; // white, green, blue, black, orange

const COLOR_COMPLETE_BG = "#32CD32"; // Lighter Green
const COLOR_COMPLETE_FONT = "#FFFFFF"; // White
const COLOR_OPS_BG = "#6495ED"; // Lighter Blue
const COLOR_OPS_FONT = "#FFFFFF"; // White
const ANALYSIS_URL =
  "https://xxxrkxxxrkxxx-ui.github.io/Analysis/?reportId=ipyvgB5vn4FqlEOxTgIL";
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

// --- Shared Styling Helpers ---
const modalLabelStyle = {
  display: "block",
  fontSize: "0.75rem",
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
  fontSize: "0.95rem",
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
  fontSize: "0.95rem",
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
  fontSize: "0.95rem",
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
  fontSize: "0.95rem",
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

  const signUp = async (firstName, lastName, code) => {
    const trimmedCode = code.trim();
    const isVip = trimmedCode === "12893";
    const hasEditAccess =
      trimmedCode.length === 0
        ? false
        : trimmedCode === ACCESS_CODE || isVip;

    if (trimmedCode.length > 0 && !hasEditAccess) {
      return { success: false, error: "Invalid access code." };
    }
    if (!userId) {
      return { success: false, error: "Authentication not ready." };
    }

    const firstInitial = firstName.trim()[0] || "";
    const lastInitial = lastName.trim()[0] || "";
    const newInfo = {
      firstName,
      lastName,
      initials: `${firstInitial}${lastInitial}`.toUpperCase(),
      hasAccess: hasEditAccess,
      isAdmin: isVip,
      userId: userId,
      createdAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem("scheduleUser", JSON.stringify(newInfo));
      setUserInfo(newInfo);
      if (db) {
        const userDocRef = doc(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "registered-users",
          userId
        );
        await setDoc(userDocRef, newInfo, { merge: true });
      }
      return { success: true, error: null, user: newInfo };
    } catch (e) {
      console.error("Error saving user info:", e);
      return { success: false, error: "Could not save user data." };
    }
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
}) => {
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const avatarMenuRef = useClickOutside(() => setIsAvatarMenuOpen(false));

  const navButtonStyle = {
    padding: "0.5rem 0.75rem",
    backgroundColor: "#1f2937",
    border: "2px solid #ffffff",
    color: "#ffffff",
    borderRadius: "0.375rem",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.15s ease",
  };

  const linkButtonStyle = {
    padding: "0.45rem 0.9rem",
    borderRadius: "9999px",
    border: "1px solid rgba(148, 163, 184, 0.45)",
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    color: "#e2e8f0",
    fontSize: "0.82rem",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    fontWeight: 600,
    cursor: "pointer",
    transition: "border 0.15s ease, color 0.15s ease, transform 0.15s ease",
  };

  const renderNavButton = (label, handler, fontSize) => (
    <button
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
        {renderNavButton("ts week", onToday, "0.875rem")}
        {renderNavButton(">", onNextWeek)}
        {renderNavButton(<CalendarIcon />, onOpenCalendar)}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <button
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
          gap: "0.6rem",
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontSize: "0.62rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            textShadow: "0 0 6px rgba(255, 191, 0, 0.75)",
            fontWeight: 500,
          }}
        >
          © 2025 Rochak Kadel. All rights reserved
        </span>
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
                border: "2px solid #ffffff",
                backgroundColor: hasAccess ? "#2563eb" : "rgba(59,130,246,0.45)",
                color: "#ffffff",
                fontWeight: "bold",
                fontSize: "0.95rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              title={hasAccess ? "Editor Access" : "Viewer Access"}
            >
            {userInfo.initials}
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
const Shift = ({ shift, onContextMenu, onDoubleClick }) => {
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
  const displayFont = isComplete || isOps ? "#FFFFFF" : effectiveFontColor;

  const defaultTextColor = site.startsWith("@") ? "#880808" : displayFont;
  const siteStyle = {
    color: defaultTextColor,
  };

  const hasComments = comments && comments.length > 0;

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu(e, shift);
      }}
      onDoubleClick={() => onDoubleClick(shift)}
      className="shift-item p-2 rounded-md cursor-pointer select-none mb-2"
      style={{
        padding: "0.65rem",
        borderRadius: "0.5rem",
        cursor: "pointer",
        userSelect: "none",
        marginBottom: "0.5rem",
        backgroundColor: displayBackground,
        color: displayFont,
        border: "1px solid rgba(148, 163, 184, 0.25)",
        ...(hasComments && { borderRight: "3px solid #FFA500" }),
        boxShadow: "0 6px 16px rgba(2, 6, 23, 0.35)",
        transition: "transform 0.12s ease, box-shadow 0.12s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <span
          className="font-mono font-bold text-sm"
          style={{
            ...siteStyle,
            fontSize: "0.82rem",
            letterSpacing: "0.04em",
            fontWeight: 700,
          }}
        >
          {site} {startTime}-{endTime}
        </span>
        <span
          className="font-mono font-bold text-sm ml-2 flex-shrink-0"
            style={{ 
            color: displayFont,
            marginLeft: "auto",
            fontWeight: 700,
            textTransform: "uppercase",
            fontSize: "0.78rem",
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
        flexBasis: "20%",
        maxWidth: "20%",
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
            fontSize: "0.875rem",
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
            onClick={onAddShift}
            onContextMenu={onPasteMenu}
            className="flex-grow py-2 text-center text-gray-400 font-bold text-xl rounded-md hover:bg-white hover:text-black transition-colors duration-150"
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
          fontSize: "0.92rem",
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
      className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-75"
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
        className="bg-black border border-white p-6 rounded-lg shadow-xl w-full max-w-md"
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

    const newShift = {
      id: crypto.randomUUID(),
      site,
      startTime,
      endTime,
      initials: "",
      bgColor: "#FFFFFF",
      fontColor: "#000000",
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
              fontSize: "1.35rem",
              fontWeight: 700,
              color: "#f8fafc",
              marginBottom: "0.35rem",
            }}
          >
            Add New Shift
          </h3>
          <p
            style={{
              fontSize: "0.9rem",
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
                      fontSize: "0.95rem",
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
                fontSize: "0.85rem",
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
            Add Shift
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
              fontSize: "1.35rem",
              fontWeight: 700,
              color: "#f8fafc",
              marginBottom: "0.35rem",
            }}
          >
            Edit Shift
          </h3>
          <p
            style={{
              fontSize: "0.9rem",
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
                fontSize: "0.85rem",
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
 * Color Picker Modal
 */
const ColorModal = ({ shift, day, onClose, onUpdateShift }) => {
  const [fontColor, setFontColor] = useState(shift.fontColor || "#000000");
  const [bgColor, setBgColor] = useState(shift.bgColor || "#FFFFFF");

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
              fontSize: "1.35rem",
              fontWeight: 700,
              color: "#f8fafc",
              marginBottom: "0.35rem",
            }}
          >
            Shift Colors
          </h3>
          <p
            style={{
              fontSize: "0.9rem",
              color: "#94a3b8",
              margin: 0,
            }}
          >
            Personalize how this shift appears on the board. Preview updates in real time.
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
          onChange={setBgColor}
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
          <span style={{ fontSize: "0.8rem", color: "#94a3b8", textTransform: "uppercase" }}>
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
                fontSize: "0.95rem",
                color: fontColor,
              }}
          >
            {shift.site} {shift.startTime}-{shift.endTime}
          </span>
            <span
              style={{
                fontFamily: "monospace",
                fontWeight: 700,
                fontSize: "0.95rem",
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
                fontSize: "1.2rem",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required.");
      return;
    }
    const result = await onSignUp(firstName.trim(), lastName.trim(), accessCode);
    if (result.success) {
      onClose();
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
              fontSize: "0.9rem",
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
            <label style={modalLabelStyle}>Acces Code</label>
          <input
            type="password"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
              style={modalInputStyle}
              placeholder="OPTIONAL, ADMIN ACCES"
          />
            <p
              style={{
                marginTop: "0.35rem",
                fontSize: "0.75rem",
                color: "#64748b",
              }}
            >

            </p>
        </div>

          {error && (
            <div
              style={{
                padding: "0.75rem",
                borderRadius: "0.75rem",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                color: "#fca5a5",
                fontSize: "0.85rem",
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
              fontSize: "1.35rem",
              fontWeight: 700,
              color: "#f8fafc",
              marginBottom: "0.2rem",
            }}
          >
            Comments · {shift.site}
      </h3>
          <p
            style={{
              fontSize: "0.9rem",
              color: "#94a3b8",
              margin: 0,
            }}
          >
            
          </p>
        </div>

        <div
          style={{
            maxHeight: "16rem",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.9rem",
            padding: "1rem",
            background: "linear-gradient(180deg, rgba(15,23,42,0.75), rgba(15,23,42,0.35))",
            borderRadius: "1rem",
            border: "1px solid rgba(148, 163, 184, 0.18)",
            boxShadow: "inset 0 0 0 1px rgba(15, 23, 42, 0.35)",
          }}
        >
          {comments.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: "rgba(148, 163, 184, 0.8)",
                fontSize: "0.9rem",
              }}
            >
                
            </div>
          )}
          {comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                backgroundColor: "rgba(30, 64, 175, 0.18)",
                border: "1px solid rgba(96, 165, 250, 0.25)",
                borderRadius: "0.9rem",
                padding: "0.75rem 0.9rem",
                color: "#e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span style={{ fontWeight: 600, color: "#60a5fa", fontSize: "0.9rem" }}>
                    {comment.user}
                  </span>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  {formatTimestamp(comment.date)}
                  </span>
                </div>
              <p
                style={{
                  whiteSpace: "pre-wrap",
                  fontSize: "0.92rem",
                  margin: 0,
                  color: "#f8fafc",
                }}
              >
                  {comment.text}
                </p>
              </div>
            ))}
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
              fontSize: "1.35rem",
              fontWeight: 700,
              color: "#f8fafc",
              marginBottom: "0.2rem",
            }}
          >
             Notes · {formatDateHeader(day.date)}
      </h3>
          <p
            style={{
              fontSize: "0.9rem",
              color: "#94a3b8",
              margin: 0,
            }}
          >

          </p>
        </div>

        <div
          style={{
            maxHeight: "16rem",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "0.9rem",
            padding: "1rem",
            background: "linear-gradient(180deg, rgba(6,78,59,0.55), rgba(6,78,59,0.25))",
            borderRadius: "1rem",
            border: "1px solid rgba(74, 222, 128, 0.25)",
            boxShadow: "inset 0 0 0 1px rgba(15, 23, 42, 0.35)",
          }}
        >
          {dayNotes.length === 0 && (
            <div
              style={{
                textAlign: "center",
                color: "rgba(148, 163, 184, 0.85)",
                fontSize: "0.9rem",
              }}
            >
              No notes recorded yet.
            </div>
          )}
          {dayNotes.map((note) => (
            <div
              key={note.id}
              style={{
                backgroundColor: "rgba(22, 163, 74, 0.18)",
                border: "1px solid rgba(74, 222, 128, 0.25)",
                borderRadius: "0.9rem",
                padding: "0.75rem 0.9rem",
                color: "#e2e8f0",
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <span style={{ fontWeight: 600, color: "#4ade80", fontSize: "0.9rem" }}>
                    {note.user}
                  </span>
                <span style={{ fontSize: "0.75rem", color: "#a7f3d0" }}>
                  {formatTimestamp(note.date)}
                  </span>
                </div>
              <p
                style={{
                  whiteSpace: "pre-wrap",
                  fontSize: "0.92rem",
                  margin: 0,
                  color: "#f8fafc",
                }}
              >
                  {note.text}
                </p>
              </div>
            ))}
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
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(74, 222, 128, 0.35)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "inset 0 0 0 1px rgba(15, 23, 42, 0.35)";
              }}
            ></textarea>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="submit"
                style={{
                  ...modalPrimaryButtonStyle,
                  background: "linear-gradient(135deg, #22c55e, #86efac)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow = "0 12px 24px rgba(34, 197, 94, 0.25)";
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
              fontSize: "1.35rem",
              fontWeight: 700,
              color: "#f8fafc",
              marginBottom: "0.25rem",
            }}
          >
            Registered Accounts
          </h3>
          <p
            style={{
              fontSize: "0.9rem",
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
                fontSize: "0.95rem",
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
                  fontSize: "0.9rem",
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
  const [registeredUsers, setRegisteredUsers] = useState([]);

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

  useEffect(() => {
    if (!db) return;

    try {
      localStorage.setItem(
        "scheduleRegisteredUsers",
        JSON.stringify(registeredUsers)
      );
    } catch (error) {
      console.error("Unable to persist registered users:", error);
    }
  }, [registeredUsers]);

  useEffect(() => {
    if (!userInfo || !userInfo.userId) return;
    setRegisteredUsers((prev) => {
      const existingIndex = prev.findIndex((u) => u.userId === userInfo.userId);
      const enriched = {
        ...userInfo,
        createdAt: userInfo.createdAt || new Date().toISOString(),
      };
      if (existingIndex === -1) {
        return [...prev, enriched];
      }
      const clone = [...prev];
      clone[existingIndex] = { ...clone[existingIndex], ...enriched };
      return clone;
    });
  }, [userInfo]);

  const weekId = useMemo(() => getWeekId(currentDate), [currentDate]);
  const weekDays = useMemo(() => {
    const start = getStartOfWeek(currentDate);
    return getWeekDays(start).map((date) => ({
      date,
      dateString: date.toISOString().split("T")[0],
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
              date: day.date,
              shifts: matchingDay ? matchingDay.shifts : [],
              notes: matchingDay ? matchingDay.notes : [], // Add notes
            };
          });
          setWeekData({ days: daysWithData });
        } else {
          const blankWeek = weekDays.map((day) => ({
            date: day.date,
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

  // --- Firestore Update Functions ---

  /**
   * Helper to get the current state of the week document
   */
  const getWeekDoc = async () => {
    if (!db) return [];
    const weekDocRef = doc(db, collectionPath, weekId); // Modular syntax
    const docSnap = await getDoc(weekDocRef); // Modular syntax
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
      notes: [], // Add notes
    }));
  };

  /**
   * Updates a single shift in the database.
   */
  const handleUpdateShift = async (day, updatedShift) => {
    if (!db) {
      console.error("Cannot update shift, DB not connected.");
      return;
    }
    const dayString = day.date.toISOString().split("T")[0];
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
  };

  /**
   * Deletes a shift from the database.
   */
  const handleDeleteShift = async (day, shiftToDelete) => {
    if (!db) {
      console.error("Cannot delete shift, DB not connected.");
      return;
    }
    const dayString = day.date.toISOString().split("T")[0];
    const currentDays = await getWeekDoc();
    const dayIndex = currentDays.findIndex((d) => d.date === dayString);

    if (dayIndex === -1) return;

    currentDays[dayIndex].shifts = (
      currentDays[dayIndex].shifts || []
    ).filter((s) => s.id !== shiftToDelete.id);

    const weekDocRef = doc(db, collectionPath, weekId); // Modular syntax
    await setDoc(weekDocRef, { days: currentDays }, { merge: true }); // Modular syntax
    closeModal();
  };

  /**
   * Pastes a shift into a day.
   */
  const handlePasteShift = async () => {
    const { day } = pasteMenuState;
    if (!db || !day || !clipboard) {
      console.error("Cannot paste shift, DB, day, or clipboard missing.");
      return;
    }

    // Create a new shift object with a new ID
    const newShift = { ...clipboard, id: crypto.randomUUID() };

    const dayString = day.date.toISOString().split("T")[0];
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
  };

  /**
   * Updates the notes for a specific day.
   */
  const handleUpdateDayNotes = async (day, newNotes) => {
    if (!db) {
      console.error("Cannot update notes, DB not connected.");
      return;
    }
    const dayString = day.date.toISOString().split("T")[0];
    const currentDays = await getWeekDoc();
    const dayIndex = currentDays.findIndex((d) => d.date === dayString);

    if (dayIndex === -1) return;

    // Update the notes for the specific day
    currentDays[dayIndex].notes = newNotes;

    const weekDocRef = doc(db, collectionPath, weekId); // Modular syntax
    await setDoc(weekDocRef, { days: currentDays }, { merge: true }); // Modular syntax
    // Don't close modal, just update
  };

  /**
   * Adds a new shift to a specific day.
   */
  const handleAddShift = async (day, newShift) => {
    if (!db) {
      console.error("Cannot add shift, DB not connected.");
      return;
    }
    const dayString = day.date.toISOString().split("T")[0];
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
  };

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
  const openModal = (content) => {
    setModalContent(content);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
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
      />
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
      />
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
        fontColor: COLOR_COMPLETE_FONT, // White
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
        fontColor: COLOR_OPS_FONT, // White
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
      const details = `Site: ${shift.site}\nTime: ${shift.startTime}-${shift.endTime}\nInitials: ${shift.initials || ""}`;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(details).catch((err) => {
          console.warn("Unable to write shift details to clipboard:", err);
        });
      }
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
                  key={day.date.toISOString()}
                    day={day}
                    shifts={day.shifts}
                    hasAccess={hasAccess}
                    hasNotes={hasNotes}
                    boardScrollRef={boardScrollRef}
                    syncScrollRef={syncScrollRef}
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

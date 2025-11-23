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
  deleteDoc,
  onSnapshot,
  collection,
  setLogLevel,
  getDocs,
  addDoc,
  updateDoc,
  writeBatch,
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
const SUB_ADMIN_CODE = "Rochak";
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
  "E.Walin Breaks (750B, 222K)",
  "M.Horne Breaks (26OF, 101M, 110S, 1K)",
  
];
const FONT_COLORS = ["#000000", "#FFFFFF", "#5d0909ff"]; // black, white, red
const FILL_COLORS = ["#FFFFFF", "#008000", "#0000FF", "#000000", "#FFA500", "#800080"]; // white, green, blue, black, orange, purple

const COLOR_COMPLETE_BG = "#8bf855ff"; // Green for completed shifts
const COLOR_COMPLETE_FONT = "#FFFFFF"; // White
const COLOR_OPS_BG = "#7da6f1ff"; // Lighter Blue
const COLOR_OPS_FONT = "#FFFFFF"; // White
const ANALYSIS_URL =
  "https://xxxrkxxxrkxxx-ui.github.io/Analysis/";
const RESEARCH_URL =
  "https://paladinsec-my.sharepoint.com/:x:/r/personal/bperry_palamerican_com1/_layouts/15/doc2.aspx?sourcedoc=%7BF4F6F36A-BECE-4618-ADAC-D38D7AE20154%7D&file=Site%20Trained%20Officers.xlsx&action=default&mobileredirect=true&DefaultItemOpen=1";
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
const SITES_COLLECTION_PATH = "public_sites"; // Shared collection for site directory

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
 * Formats current time as military time (HH:MM).
 */
const formatMilitaryTime = (date) => {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

/**
 * Checks if a date is today (same year, month, and day).
 */
const isToday = (date) => {
  const today = new Date();
  const checkDate = new Date(date);
  return (
    checkDate.getFullYear() === today.getFullYear() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getDate() === today.getDate()
  );
};

/**
 * Strips parentheses and their contents from site name.
 * Example: "600 Cal (N.Watson)" -> "600 Cal"
 */
const stripParentheses = (siteName) => {
  if (!siteName || typeof siteName !== 'string') return siteName || '';
  // Remove everything in parentheses including the parentheses
  return siteName.replace(/\s*\([^)]*\)/g, '').trim();
};

/**
 * Extracts OPS name from parentheses in site name.
 * Example: "600 Cal (N.Watson)" -> "N.Watson"
 * Returns null if no parentheses found.
 */
const extractOpsName = (siteName) => {
  if (!siteName || typeof siteName !== 'string') return null;
  const match = siteName.match(/\(([^)]+)\)/);
  return match ? match[1].trim() : null;
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
    const isSubAdmin = trimmedCode === SUB_ADMIN_CODE;
    const grantsEditAccess =
      trimmedCode.length > 0 && (trimmedCode === ACCESS_CODE || isVip || isSubAdmin);
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
      isSubAdmin: isSubAdmin || false,
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
      return "🥇"; // Gold Medal
    } else if (index === 1) {
      return "🥈"; // Silver Medal
    } else if (index === 2) {
      return "🥉"; // Bronze Medal
    }
    return null;
  };

  const getTrophyColor = (index) => {
    if (index === 0) {
      return "#FFD700"; // Gold
    } else if (index === 1) {
      return "#FFFFFF"; // White
    } else if (index === 2) {
      return "#CD7F32"; // Bronze
    }
    return "#94a3b8";
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.65rem 0.95rem",
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
          gap: "0.5rem",
          flexWrap: "wrap",
        }}
      >
        {leaderboardData.map((item, index) => (
          <div
            key={item.initials}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.35rem 0.65rem",
              position: "relative",
              backgroundColor: index === 0 
                ? "rgba(255, 215, 0, 0.15)" 
                : index === 1
                ? "rgba(192, 192, 192, 0.15)"
                : index === 2
                ? "rgba(205, 127, 50, 0.15)"
                : "rgba(148, 163, 184, 0.1)",
              borderRadius: "0.375rem",
              border: index === 0 
                ? "1px solid rgba(255, 215, 0, 0.4)" 
                : index === 1
                ? "1px solid rgba(192, 192, 192, 0.4)"
                : index === 2
                ? "1px solid rgba(205, 127, 50, 0.4)"
                : "1px solid rgba(148, 163, 184, 0.2)",
            }}
          >
            {getTrophyIcon(index) && (
              <span 
                style={{ 
                  fontSize: index === 0 ? "1.4rem" : "1.2rem",
                  ...(index === 0 && {
                    filter: "drop-shadow(0 0 4px rgba(255, 215, 0, 0.9)) drop-shadow(0 0 8px rgba(255, 193, 7, 0.7)) drop-shadow(0 0 12px rgba(255, 152, 0, 0.5))",
                    animation: "goldGlow 2s ease-in-out infinite alternate",
                  }),
                  ...(index === 1 && {
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
                fontSize: "1.1rem",
                fontWeight: 700,
                color: getTrophyColor(index),
                ...(index === 0 && {
                  textShadow: "0 0 8px rgba(255, 215, 0, 0.8), 0 0 15px rgba(255, 193, 7, 0.6), 0 0 25px rgba(255, 140, 0, 0.4)",
                  animation: "goldTextGlow 3s ease-in-out infinite",
                }),
              }}
            >
              {item.initials}
            </span>
            <span
              style={{
                fontSize: "1.0rem",
                color: getTrophyColor(index),
                fontWeight: 600,
                ...(index === 0 && {
                  textShadow: "0 0 8px rgba(255, 215, 0, 0.8), 0 0 15px rgba(255, 193, 7, 0.6), 0 0 25px rgba(255, 140, 0, 0.4)",
                  animation: "goldTextGlow 3s ease-in-out infinite",
                }),
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
/**
 * Site Search Input Component
 */
const SiteSearchInput = ({ onSelectSite, db }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sites, setSites] = useState([]);
  const [filteredSites, setFilteredSites] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const suggestionsRef = useClickOutside(() => {
    setShowSuggestions(false);
  });

  // Load sites from Firebase
  useEffect(() => {
    if (!db) return;

    const sitesCollectionRef = collection(db, SITES_COLLECTION_PATH);
    
    const unsubscribe = onSnapshot(sitesCollectionRef, (snapshot) => {
      const sitesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSites(sitesData);
    }, (error) => {
      console.error("Error listening to sites:", error);
    });

    return () => unsubscribe();
  }, [db]);

  // Filter sites based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSites([]);
      setShowSuggestions(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const matches = sites.filter((site) =>
      site.address?.toLowerCase().includes(query)
    );
    setFilteredSites(matches);
    setShowSuggestions(matches.length > 0);
  }, [searchQuery, sites]);

  const handleSelectSite = (site) => {
    setSearchQuery("");
    setShowSuggestions(false);
    onSelectSite(site);
  };

  return (
    <div
      ref={suggestionsRef}
      style={{
        position: "relative",
        minWidth: "200px",
        maxWidth: "400px",
        flex: 1,
      }}
    >
      <input
        ref={searchRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => {
          if (filteredSites.length > 0) {
            setShowSuggestions(true);
          }
        }}
        placeholder="Search site"
        style={{
          width: "100%",
          padding: "0.45rem 0.9rem",
          borderRadius: "9999px",
          border: "1px solid rgba(148, 163, 184, 0.45)",
          backgroundColor: "rgba(15, 23, 42, 0.65)",
          color: "#e2e8f0",
          fontSize: "1.02rem",
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          fontWeight: 600,
          fontFamily: "monospace",
          transition: "border 0.15s ease, color 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.border = "1px solid rgba(139, 92, 246, 0.75)";
          e.currentTarget.style.color = "#c4b5fd";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.45)";
          e.currentTarget.style.color = "#e2e8f0";
        }}
      />
      {showSuggestions && filteredSites.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "0.25rem",
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            border: "1px solid rgba(148, 163, 184, 0.35)",
            borderRadius: "0.5rem",
            maxHeight: "300px",
            overflowY: "auto",
            zIndex: 50,
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
          }}
        >
          {filteredSites.map((site) => (
            <div
              key={site.id}
              onClick={() => handleSelectSite(site)}
              style={{
                padding: "0.75rem 1rem",
                cursor: "pointer",
                borderBottom: "1px solid rgba(148, 163, 184, 0.15)",
                color: "#e2e8f0",
                fontSize: "0.95rem",
                transition: "background-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.18)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              {site.address}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Header = ({
  onPrevWeek,
  onNextWeek,
  onToday,
  onOpenCalendar,
  onSignUp,
  userInfo,
  hasAccess,
  onOpenSearch,
  onOpenAnalysis,
  onOpenResearch,
  onOpenSiteManager,
  onOpenSummary,
  showSettings,
  onOpenSettings,
  onLogout,
  weekData,
  db,
}) => {
  const isAdmin = Boolean(userInfo?.isAdmin);
  const isSubAdmin = Boolean(userInfo?.isSubAdmin);
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
        <SiteSearchInput
          onSelectSite={onOpenSearch}
          db={db}
        />
        <button
          className="micro-pressable micro-pill"
          type="button"
          onClick={() => {
            window.open(
              "https://palamerican.staffr.net/app#patrol/default/index",
              "_blank",
              "noopener,noreferrer"
            );
          }}
          style={linkButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.border = "1px solid rgba(239, 68, 68, 0.75)";
            e.currentTarget.style.color = "#fca5a5";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.45)";
            e.currentTarget.style.color = "#e2e8f0";
            e.currentTarget.style.transform = "none";
          }}
        >
          Tracktik
        </button>
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
        {userInfo && userInfo.userId && (
          <button
            className="micro-pressable micro-pill"
            type="button"
            onClick={onOpenResearch}
            style={linkButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = "1px solid rgba(251, 191, 36, 0.75)";
              e.currentTarget.style.color = "#fde68a";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.45)";
              e.currentTarget.style.color = "#e2e8f0";
              e.currentTarget.style.transform = "none";
            }}
          >
            Research
          </button>
        )}
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
        {(isAdmin || isSubAdmin) && (
          <button
            className="micro-pressable micro-pill"
            type="button"
            onClick={onOpenSummary}
            style={linkButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.border = "1px solid rgba(251, 146, 60, 0.75)";
              e.currentTarget.style.color = "#fbbf24";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.border = "1px solid rgba(148, 163, 184, 0.45)";
              e.currentTarget.style.color = "#e2e8f0";
              e.currentTarget.style.transform = "none";
            }}
          >
            Summary
          </button>
        )}
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
              fontSize: "0.90rem",
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
    isStrikeout,
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

  // Get minimal flaming glow styles for initials - all top 3 get same gold flame effect
  const getInitialsGlowStyle = () => {
    if (!glowType) return {};
    
    // All top 3 users get the same minimal gold/yellow flame effect - very subtle
    return {
      color: "#000000ff", 
      textShadow: "0 0 1px rgba(225, 210, 38, 0.6), 0 0 4px rgba(242, 251, 0, 0.5)",
    };
  };

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
        border: "none",
        ...(hasComments && { 
          borderRight: "5px solid #FF8C00",
          boxShadow: "inset -2px 0 0 #000000, 0 6px 16px rgba(2, 6, 23, 0.35)"
        }),
        ...(!hasComments && { 
          boxShadow: "0 6px 16px rgba(2, 6, 23, 0.35)"
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
            textDecoration: isStrikeout ? "line-through" : "none",
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
            ...getInitialsGlowStyle(),
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const dayDate = day.date instanceof Date ? day.date : new Date(day.date);
  const isCurrentDay = isToday(dayDate);

  // Update time every second if it's the current day
  useEffect(() => {
    if (!isCurrentDay) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [isCurrentDay]);

  const sortedShifts = useMemo(() => {
    return [...shifts].sort((a, b) => {
      const timeA = a.startTime || "0000";
      const timeB = b.startTime || "0000";
      return timeA.localeCompare(timeB);
    });
  }, [shifts]);

  // Calculate open shifts (white background only) and total shifts
  const { openShifts, totalShifts } = useMemo(() => {
    const total = shifts.length;
    const open = shifts.filter(shift => {
      // A shift is open only if it has white background (not OPS or Complete)
      const bgColor = shift.bgColor || "#FFFFFF";
      const normalizedBg = bgColor.toUpperCase();
      const isWhite = normalizedBg === "#FFFFFF" || normalizedBg === "FFFFFF";
      return isWhite;
    }).length;
    return { openShifts: open, totalShifts: total };
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
            color: isCurrentDay ? "#22c55e" : "#ffffff",
            fontSize: "0.98rem",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <span>{formatDateHeader(dayDate)}</span>
          {isCurrentDay && (
            <span
              style={{
                fontSize: "0.9rem",
                fontWeight: 600,
                color: "#22c55e",
                fontFamily: "monospace",
              }}
            >
              {formatMilitaryTime(currentTime)}
            </span>
          )}
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
        <div
          style={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "0.25rem",
          }}
        >
          {hasAccess && (
            <button
              className="flex-grow py-2 text-center text-gray-400 font-bold text-xl rounded-md hover:bg-white hover:text-black transition-colors duration-150 plus-button micro-pressable"
              onClick={onAddShift}
              onContextMenu={onPasteMenu}
              style={{
                width: "100%",
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
          {totalShifts > 0 && (
            <span
              style={{
                color: openShifts > 0 ? "#ffffff" : "#22c55e",
                fontSize: "1rem",
                fontWeight: 600,
              }}
            >
              {openShifts > 0 ? openShifts : totalShifts}
            </span>
          )}
        </div>
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
  onCopy, // Copy shift data for pasting
  onCopyToClipboard, // Copy text to system clipboard
  onSplit, // New prop for split shift
}) => {
  const menuRef = useClickOutside(onClose);
  const [adjustedPosition, setAdjustedPosition] = useState({ x: menuState.x, y: menuState.y });

  useEffect(() => {
    // Reset position when menu becomes visible or position changes
    if (menuState.visible) {
      setAdjustedPosition({ x: menuState.x, y: menuState.y });
    }
  }, [menuState.visible, menuState.x, menuState.y]);

  useEffect(() => {
    if (!menuState.visible || !menuRef.current) return;
    
    // Adjust position after menu is rendered
    const adjustPosition = () => {
      if (!menuRef.current) return;
      
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      const padding = 10;
      
      let newX = menuState.x;
      let newY = menuState.y;
      
      // Adjust horizontal position if menu goes off right edge
      if (rect.right > windowWidth - padding) {
        newX = windowWidth - rect.width - padding;
      }
      
      // Adjust horizontal position if menu goes off left edge
      if (rect.left < padding) {
        newX = padding;
      }
      
      // Adjust vertical position if menu goes off bottom edge
      if (rect.bottom > windowHeight - padding) {
        newY = windowHeight - rect.height - padding;
      }
      
      // Adjust vertical position if menu goes off top edge
      if (rect.top < padding) {
        newY = padding;
      }
      
      // Ensure menu doesn't go off screen in any direction
      newX = Math.max(padding, Math.min(newX, windowWidth - rect.width - padding));
      newY = Math.max(padding, Math.min(newY, windowHeight - rect.height - padding));
      
      setAdjustedPosition({ x: newX, y: newY });
    };
    
    // Use requestAnimationFrame to ensure rendering is complete
    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(adjustPosition);
    });
    
    return () => cancelAnimationFrame(rafId);
  }, [menuState.visible, menuState.x, menuState.y, menuRef]);

  if (!menuState.visible) return null;

  const groups = [
    [
      { label: "✅ Complete", action: onComplete },
      { label: "⚙️ OPS", action: onOps },
      { label: "Edit Shift", action: onEdit },
      { label: "Split Shift", action: onSplit },
    ],
    [
      { label: "Change Color", action: onColor },
      { label: "Copy Shift", action: onCopy },
      { label: "Copy to Clipboard", action: onCopyToClipboard },
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
        top: adjustedPosition.y,
        left: adjustedPosition.x,
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
          maxWidth: "72rem",
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
  const [isStrikeout, setIsStrikeout] = useState(shift.isStrikeout || false);

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
      isStrikeout,
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
        
        {/* Strikeout Option */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
          <span style={{ ...modalLabelStyle, marginBottom: 0 }}>Text Style</span>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              cursor: "pointer",
              padding: "0.5rem",
              borderRadius: "0.5rem",
              backgroundColor: isStrikeout ? "rgba(59, 130, 246, 0.15)" : "transparent",
              border: isStrikeout ? "1px solid rgba(59, 130, 246, 0.4)" : "1px solid rgba(148, 163, 184, 0.2)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!isStrikeout) {
                e.currentTarget.style.backgroundColor = "rgba(148, 163, 184, 0.08)";
              }
            }}
            onMouseLeave={(e) => {
              if (!isStrikeout) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            <input
              type="checkbox"
              checked={isStrikeout}
              onChange={(e) => setIsStrikeout(e.target.checked)}
              style={{
                width: "1.25rem",
                height: "1.25rem",
                cursor: "pointer",
                accentColor: "#3b82f6",
              }}
            />
            <span style={{ color: "#f8fafc", fontSize: "1rem", fontWeight: 500 }}>
              Strikeout 
            </span>
          </label>
        </div>
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
                textDecoration: isStrikeout ? "line-through" : "none",
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
      isSubAdmin: Boolean(userInfo?.isSubAdmin) || false, // Store sub-admin status with comment
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
            const isSubAdminUser = comment.isSubAdmin === true;
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
                        color: isAdminUser ? "#FFD700" : isSubAdminUser ? "#C0C0C0" : "#f1f5f9", 
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
                        ...(isSubAdminUser && {
                          background: "linear-gradient(90deg, #C0C0C0 0%, #E8E8E8 25%, #A9A9A9 50%, #E8E8E8 75%, #C0C0C0 100%)",
                          backgroundSize: "200% 100%",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                          animation: "shimmer 3s linear infinite",
                          filter: "drop-shadow(0 0 3px rgba(192, 192, 192, 0.8))",
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
      isSubAdmin: Boolean(userInfo?.isSubAdmin) || false, // Store sub-admin status with note
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
            const isSubAdminUser = note.isSubAdmin === true;
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
                        color: isAdminUser ? "#FFD700" : isSubAdminUser ? "#C0C0C0" : "#f1f5f9", 
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
                        ...(isSubAdminUser && {
                          background: "linear-gradient(90deg, #C0C0C0 0%, #E8E8E8 25%, #A9A9A9 50%, #E8E8E8 75%, #C0C0C0 100%)",
                          backgroundSize: "200% 100%",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                          animation: "shimmer 3s linear infinite",
                          filter: "drop-shadow(0 0 3px rgba(192, 192, 192, 0.8))",
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
 * Summary Modal Component
 */
const SummaryModal = ({ weekData, onClose, isAdmin, weekId, onOpenDetails, onOpenManagerData, onOpenOpsData }) => {
  // Calculate hours from time string (e.g., "0800", "1600")
  const timeToHours = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const upperTime = timeStr.toUpperCase();
    // Skip xxxx times
    if (upperTime === 'XXXX') return null;
    
    // Parse time string (format: "HHMM" or "HH:MM")
    const cleanTime = timeStr.replace(/[^0-9]/g, '');
    if (cleanTime.length !== 4) return null;
    
    const hours = parseInt(cleanTime.substring(0, 2), 10);
    const minutes = parseInt(cleanTime.substring(2, 4), 10);
    
    // Handle midnight (0000) as 24 hours for correct overnight shift calculation
    // e.g., 1600-0000 should be 4pm to midnight = 8 hours
    if (hours === 0 && minutes === 0) {
      return 24.0;
    }
    
    return hours + (minutes / 60);
  };

  // Calculate shift hours
  const calculateShiftHours = (startTime, endTime) => {
    const start = timeToHours(startTime);
    const end = timeToHours(endTime);
    
    // Return 0 if either time is invalid (null means invalid/XXXX)
    if (start === null || end === null) return 0;
    
    // Special case: both start and end are midnight (0000) = 24 hours
    if (start === 24.0 && end === 24.0) {
      return 24.0;
    }
    
    // Handle overnight shifts (end < start or end === 24)
    let hours = end - start;
    if (hours < 0) {
      // Normal overnight shift (e.g., 2200-0600)
      hours = (24 - start) + end;
    } else if (end === 24.0 && start < 24) {
      // Shift ending at midnight (0000), treated as 24.0
      // e.g., 1600-0000 = 16 to 24 = 8 hours (correct!)
      hours = 24 - start;
    }
    
    return hours;
  };

  // Calculate statistics
  const stats = useMemo(() => {
    let totalHours = 0;
    let opsHours = 0;
    let noCoverageHours = 0;

    if (!weekData || !weekData.days) {
      return { totalHours: 0, opsHours: 0, noCoverageHours: 0 };
    }

    weekData.days.forEach(day => {
      if (!day.shifts || !Array.isArray(day.shifts)) return;

      day.shifts.forEach(shift => {
        const startTime = shift.startTime || '';
        const endTime = shift.endTime || '';
        const upperStart = startTime.toUpperCase();
        const upperEnd = endTime.toUpperCase();

        // Skip shifts with xxxx time
        if (upperStart === 'XXXX' || upperEnd === 'XXXX') return;

        const shiftHours = calculateShiftHours(startTime, endTime);
        if (shiftHours <= 0) return;

        const bgColor = shift.bgColor || '#FFFFFF';
        const normalizedBg = bgColor.toUpperCase();

        // Check if it's OPS (blue background)
        const isOps = normalizedBg === COLOR_OPS_BG.toUpperCase();

        // Check if it's no coverage (black background)
        const isNoCoverage = normalizedBg === '#000000' || normalizedBg === '000000';

        totalHours += shiftHours;

        if (isOps) {
          opsHours += shiftHours;
        } else if (isNoCoverage) {
          noCoverageHours += shiftHours;
        }
      });
    });

    return { totalHours, opsHours, noCoverageHours };
  }, [weekData]);

  const maxHours = Math.max(stats.totalHours, stats.opsHours, stats.noCoverageHours, 1);
  const barContainerHeight = 250; // Fixed height in pixels

  // Calculate bar heights in pixels - use exact proportions without minimums for accurate scaling
  const totalBarHeight = maxHours > 0 && stats.totalHours > 0 ? (stats.totalHours / maxHours) * barContainerHeight : 0;
  const opsBarHeight = maxHours > 0 && stats.opsHours > 0 ? (stats.opsHours / maxHours) * barContainerHeight : 0;
  const noCoverageBarHeight = maxHours > 0 && stats.noCoverageHours > 0 ? (stats.noCoverageHours / maxHours) * barContainerHeight : 0;

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%", maxWidth: "72rem" }}>
        <div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#f8fafc",
              marginBottom: "0.25rem",
            }}
          >
            Week Summary
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

        <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
          {/* Terminal-style text panel */}
          <div
            style={{
              flex: 1,
              backgroundColor: "#000000",
              border: "2px solid #00ff00",
              borderRadius: "0.5rem",
              padding: "2rem",
              fontFamily: "monospace",
              fontSize: "1.2rem",
              color: "#00ff00",
              boxShadow: "0 0 20px rgba(0, 255, 0, 0.3), inset 0 0 20px rgba(0, 255, 0, 0.1)",
              minHeight: "300px",
            }}
          >
            <div style={{ marginBottom: "1.5rem", color: "#00ff00" }}>
              <span style={{ color: "#00ffff" }}></span> 
            </div>
            <div style={{ marginBottom: "1rem", lineHeight: "2" }}>
              <span style={{ color: "#00ff00" }}>Total Shifts:</span>{" "}
              <span style={{ color: "#00ff00" }}>{stats.totalHours.toFixed(1)} hrs</span>
            </div>
            <div style={{ marginBottom: "1rem", lineHeight: "2" }}>
              <span style={{ color: "#00ff00" }}>OPS Coverage:</span>{" "}
              <span style={{ color: "#00ff00" }}>{stats.opsHours.toFixed(1)} hrs</span>
            </div>
            <div style={{ marginBottom: "1rem", lineHeight: "2" }}>
              <span style={{ color: "#00ff00" }}>No Coverage:</span>{" "}
              <span style={{ color: "#00ff00" }}>{stats.noCoverageHours.toFixed(1)} hrs</span>
            </div>
            <div style={{ marginTop: "1.5rem", color: "#00ff00", fontSize: "1rem" }}>
              <span style={{ color: "#00ffff" }}></span>
            </div>
          </div>

          {/* Vertical Bar chart visualization */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: "2rem",
              padding: "2rem",
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              borderRadius: "0.75rem",
              border: "1px solid rgba(148, 163, 184, 0.18)",
              minHeight: "300px",
              justifyContent: "flex-end",
            }}
          >
            <div style={{ fontSize: "1.1rem", fontWeight: 600, color: "#f8fafc", marginBottom: "1rem" }}>

            </div>

            <div style={{ display: "flex", gap: "2rem", alignItems: "flex-end", height: `${barContainerHeight}px`, position: "relative", paddingBottom: "2rem" }}>
              {/* Total Shifts Bar */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", height: `${barContainerHeight}px`, justifyContent: "flex-end" }}>
                {stats.totalHours > 0 && (
                  <span style={{ fontSize: "0.85rem", color: "#f8fafc", fontWeight: 600, marginBottom: "0.25rem" }}>
                    {stats.totalHours.toFixed(1)}h
                  </span>
                )}
                <div
                  style={{
                    width: "100%",
                    height: `${totalBarHeight}px`,
                    backgroundColor: "#22c55e",
                    borderRadius: "0.375rem 0.375rem 0 0",
                    border: "2px solid rgba(34, 197, 94, 0.6)",
                    transition: "height 0.5s ease",
                    display: stats.totalHours > 0 ? "block" : "none",
                  }}
                />
                <span style={{ fontSize: "0.9rem", color: "#94a3b8", fontWeight: 500 }}>Total</span>
              </div>

              {/* OPS Coverage Bar */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", height: `${barContainerHeight}px`, justifyContent: "flex-end" }}>
                {stats.opsHours > 0 && (
                  <span style={{ fontSize: "0.85rem", color: "#f8fafc", fontWeight: 600, marginBottom: "0.25rem" }}>
                    {stats.opsHours.toFixed(1)}h
                  </span>
                )}
                <div
                  style={{
                    width: "100%",
                    height: `${opsBarHeight}px`,
                    backgroundColor: "#3b82f6",
                    borderRadius: "0.375rem 0.375rem 0 0",
                    border: "2px solid rgba(59, 130, 246, 0.6)",
                    transition: "height 0.5s ease",
                    display: stats.opsHours > 0 ? "block" : "none",
                  }}
                />
                <span style={{ fontSize: "0.9rem", color: "#94a3b8", fontWeight: 500 }}>OPS</span>
              </div>

              {/* No Coverage Bar */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", height: `${barContainerHeight}px`, justifyContent: "flex-end" }}>
                {stats.noCoverageHours > 0 && (
                  <span style={{ fontSize: "0.85rem", color: "#f8fafc", fontWeight: 600, marginBottom: "0.25rem" }}>
                    {stats.noCoverageHours.toFixed(1)}h
                  </span>
                )}
                <div
                  style={{
                    width: "100%",
                    height: `${noCoverageBarHeight}px`,
                    backgroundColor: "#FFFFFF",
                    borderRadius: "0.375rem 0.375rem 0 0",
                    border: "2px solid rgba(255, 255, 255, 0.8)",
                    transition: "height 0.5s ease",
                    display: stats.noCoverageHours > 0 ? "block" : "none",
                  }}
                />
                <span style={{ fontSize: "0.9rem", color: "#94a3b8", fontWeight: 500 }}>No Cov</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {isAdmin && onOpenDetails && (
              <button
                type="button"
                onClick={onOpenDetails}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "rgba(59, 130, 246, 0.15)",
                  border: "1px solid rgba(59, 130, 246, 0.45)",
                  borderRadius: "0.5rem",
                  color: "#3b82f6",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.25)";
                  e.currentTarget.style.border = "1px solid rgba(59, 130, 246, 0.65)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
                  e.currentTarget.style.border = "1px solid rgba(59, 130, 246, 0.45)";
                }}
              >
                More Detail
              </button>
            )}
            {isAdmin && onOpenManagerData && (
              <button
                type="button"
                onClick={onOpenManagerData}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "rgba(139, 92, 246, 0.15)",
                  border: "1px solid rgba(139, 92, 246, 0.45)",
                  borderRadius: "0.5rem",
                  color: "#a78bfa",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(139, 92, 246, 0.25)";
                  e.currentTarget.style.border = "1px solid rgba(139, 92, 246, 0.65)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(139, 92, 246, 0.15)";
                  e.currentTarget.style.border = "1px solid rgba(139, 92, 246, 0.45)";
                }}
              >
                Manager Data
              </button>
            )}
            {isAdmin && onOpenOpsData && (
              <button
                type="button"
                onClick={onOpenOpsData}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "rgba(59, 130, 246, 0.15)",
                  border: "1px solid rgba(59, 130, 246, 0.45)",
                  borderRadius: "0.5rem",
                  color: "#60a5fa",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.25)";
                  e.currentTarget.style.border = "1px solid rgba(59, 130, 246, 0.65)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
                  e.currentTarget.style.border = "1px solid rgba(59, 130, 246, 0.45)";
                }}
              >
                Ops Data
              </button>
            )}
          </div>
          <div style={{ marginLeft: "auto" }}>
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
      </div>
    </Modal>
  );
};

/**
 * Detailed Summary Modal Component
 */
const DetailedSummaryModal = ({ weekData, onClose }) => {
  // Calculate hours from time string (e.g., "0800", "1600")
  const timeToHours = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const upperTime = timeStr.toUpperCase();
    // Skip xxxx times
    if (upperTime === 'XXXX') return null;
    
    // Parse time string (format: "HHMM" or "HH:MM")
    const cleanTime = timeStr.replace(/[^0-9]/g, '');
    if (cleanTime.length !== 4) return null;
    
    const hours = parseInt(cleanTime.substring(0, 2), 10);
    const minutes = parseInt(cleanTime.substring(2, 4), 10);
    
    // Handle midnight (0000) as 24 hours for correct overnight shift calculation
    // e.g., 1600-0000 should be 4pm to midnight = 8 hours
    if (hours === 0 && minutes === 0) {
      return 24.0;
    }
    
    return hours + (minutes / 60);
  };

  // Calculate shift hours
  const calculateShiftHours = (startTime, endTime) => {
    const start = timeToHours(startTime);
    const end = timeToHours(endTime);
    
    // Return 0 if either time is invalid (null means invalid/XXXX)
    if (start === null || end === null) return 0;
    
    // Special case: both start and end are midnight (0000) = 24 hours
    if (start === 24.0 && end === 24.0) {
      return 24.0;
    }
    
    // Handle overnight shifts (end < start or end === 24)
    let hours = end - start;
    if (hours < 0) {
      // Normal overnight shift (e.g., 2200-0600)
      hours = (24 - start) + end;
    } else if (end === 24.0 && start < 24) {
      // Shift ending at midnight (0000), treated as 24.0
      // e.g., 1600-0000 = 16 to 24 = 8 hours (correct!)
      hours = 24 - start;
    }
    
    return hours;
  };

  // Calculate top sites statistics
  const siteStats = useMemo(() => {
    const allShiftsBySite = {}; // All shifts by site (all colors) - total coverage needed
    const opsShiftsBySite = {}; // OPS shifts by site (blue background only)

    if (!weekData || !weekData.days) {
      return { coverageNeeded: [], opsNeeded: [] };
    }

    weekData.days.forEach(day => {
      if (!day.shifts || !Array.isArray(day.shifts)) return;

      day.shifts.forEach(shift => {
        const startTime = shift.startTime || '';
        const endTime = shift.endTime || '';
        const upperStart = startTime.toUpperCase();
        const upperEnd = endTime.toUpperCase();

        // Skip shifts with xxxx time
        if (upperStart === 'XXXX' || upperEnd === 'XXXX') return;

        const shiftHours = calculateShiftHours(startTime, endTime);
        if (shiftHours <= 0) return;

        // Strip parentheses from site name for grouping (e.g., "600 Cal (N.Watson)" -> "600 Cal")
        const site = stripParentheses(shift.site || 'Unknown');
        const bgColor = shift.bgColor || '#FFFFFF';
        
        // Normalize bgColor - handle various formats
        let normalizedBg = bgColor.toUpperCase().trim();
        // Remove # if present for comparison
        if (normalizedBg.startsWith('#')) {
          normalizedBg = normalizedBg.substring(1);
        }
        
        // Normalize OPS color for comparison
        const opsBgNormalized = COLOR_OPS_BG.toUpperCase().trim();
        let opsBgToCompare = opsBgNormalized.startsWith('#') ? opsBgNormalized.substring(1) : opsBgNormalized;
        // Handle 8-digit hex codes - compare first 6 digits
        if (opsBgToCompare.length === 8) {
          opsBgToCompare = opsBgToCompare.substring(0, 6);
        }
        const normalizedBgFirst6 = normalizedBg.length >= 6 ? normalizedBg.substring(0, 6) : normalizedBg;
        
        // Check if it's OPS (blue background) - handle various formats
        const isOps = normalizedBgFirst6 === opsBgToCompare || 
                     normalizedBgFirst6 === '7DA6F1';

        // Count all shifts (all colors) for total coverage needed
        if (!allShiftsBySite[site]) {
          allShiftsBySite[site] = 0;
        }
        allShiftsBySite[site] += shiftHours;

        // Count OPS shifts (blue background only)
        if (isOps) {
          if (!opsShiftsBySite[site]) {
            opsShiftsBySite[site] = 0;
          }
          opsShiftsBySite[site] += shiftHours;
        }
      });
    });

    // Convert to arrays and sort by hours (descending), then take top 10
    const coverageNeededArray = Object.entries(allShiftsBySite)
      .map(([site, hours]) => ({ site, hours }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10);

    const opsNeededArray = Object.entries(opsShiftsBySite)
      .map(([site, hours]) => ({ site, hours }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10);

    return { coverageNeeded: coverageNeededArray, opsNeeded: opsNeededArray };
  }, [weekData]);

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%", maxWidth: "80rem" }}>
        <div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#f8fafc",
              marginBottom: "0.25rem",
            }}
          >
            Detailed Coverage Analysis
          </h3>
          <p
            style={{
              fontSize: "1.0rem",
              color: "#94a3b8",
              margin: 0,
            }}
          >
            Top sites requiring coverage attention
          </p>
        </div>

        <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
          {/* Left side: Top 10 sites with most coverage needed */}
          <div
            style={{
              flex: 1,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              borderRadius: "0.75rem",
              border: "1px solid rgba(148, 163, 184, 0.18)",
              padding: "2rem",
            }}
          >
            <h4
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "#f8fafc",
                marginBottom: "1.5rem",
              }}
            >
              Top 10 Demanding Sites 
            </h4>
            {siteStats.coverageNeeded.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {siteStats.coverageNeeded.map((item, index) => (
                  <div
                    key={item.site}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.75rem 1rem",
                      backgroundColor: "rgba(0, 0, 0, 0.3)",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(148, 163, 184, 0.2)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          color: "#94a3b8",
                          minWidth: "1.5rem",
                        }}
                      >
                        {index + 1}.
                      </span>
                      <span
                        style={{
                          fontSize: "1rem",
                          fontWeight: 600,
                          color: "#ffffff",
                        }}
                      >
                        {stripParentheses(item.site)}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "#ffffff",
                      }}
                    >
                      {item.hours.toFixed(1)} hrs
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: "1rem",
                }}
              >
                No shifts found
              </div>
            )}
          </div>

          {/* Right side: Top sites where OPS needed */}
          <div
            style={{
              flex: 1,
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              borderRadius: "0.75rem",
              border: "1px solid rgba(148, 163, 184, 0.18)",
              padding: "2rem",
            }}
          >
            <h4
              style={{
                fontSize: "1.2rem",
                fontWeight: 700,
                color: "#f8fafc",
                marginBottom: "1.5rem",
              }}
            >
              Top 10 OPS Covered Sites
            </h4>
            {siteStats.opsNeeded.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {siteStats.opsNeeded.map((item, index) => {
                  // Remove any "OPS" text and parentheses from site name for display
                  const displaySiteName = stripParentheses(item.site).replace(/\s*OPS\s*/gi, '').trim();
                  return (
                    <div
                      key={item.site}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.75rem 1rem",
                        backgroundColor: "rgba(59, 130, 246, 0.15)",
                        borderRadius: "0.5rem",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <span
                          style={{
                            fontSize: "0.9rem",
                            fontWeight: 600,
                            color: "#94a3b8",
                            minWidth: "1.5rem",
                          }}
                        >
                          {index + 1}.
                        </span>
                        <span
                          style={{
                            fontSize: "1rem",
                            fontWeight: 600,
                            color: "#ffffff",
                          }}
                        >
                          {displaySiteName}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "#3b82f6",
                        }}
                      >
                        {item.hours.toFixed(1)} hrs
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: "1rem",
                }}
              >
                No OPS shifts found
              </div>
            )}
          </div>
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

/**
 * Manager Data Modal Component
 */
const ManagerDataModal = ({ weekData, onClose, db }) => {
  const [sites, setSites] = useState([]);

  // Load sites from Firebase
  useEffect(() => {
    if (!db) return;

    const sitesCollectionRef = collection(db, SITES_COLLECTION_PATH);
    
    const unsubscribe = onSnapshot(sitesCollectionRef, (snapshot) => {
      const sitesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSites(sitesData);
    }, (error) => {
      console.error("Error listening to sites:", error);
    });

    return () => unsubscribe();
  }, [db]);

  // Helper to normalize site name for matching (removes @ prefix and normalizes)
  const normalizeSiteName = (siteName) => {
    if (!siteName) return '';
    // Remove @ prefix
    let normalized = siteName.replace(/^@\s*/, '').trim();
    // Normalize to uppercase for comparison
    return normalized.toUpperCase();
  };

  // Helper to match shift site to site directory site
  const findSiteMatch = (shiftSiteName) => {
    const normalizedShift = normalizeSiteName(shiftSiteName);
    
    // Try exact match first (after normalization)
    let match = sites.find(site => {
      const normalizedAddress = (site.address || '').toUpperCase();
      return normalizedAddress === normalizedShift;
    });

    // Try partial match (shift site contains site address or vice versa)
    if (!match) {
      match = sites.find(site => {
        const normalizedAddress = (site.address || '').toUpperCase();
        // Check if shift site contains address or address contains shift site
        return normalizedAddress.includes(normalizedShift) || 
               normalizedShift.includes(normalizedAddress) ||
               // Also try matching without common suffixes
               normalizedAddress.replace(/\s+(ST|AVE|BLVD|STREET|AVENUE|BOULEVARD)$/i, '') === normalizedShift.replace(/\s+(ST|AVE|BLVD|STREET|AVENUE|BOULEVARD)$/i, '');
      });
    }

    return match;
  };

  // Calculate hours from time string
  const timeToHours = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const upperTime = timeStr.toUpperCase();
    if (upperTime === 'XXXX') return null;
    
    const cleanTime = timeStr.replace(/[^0-9]/g, '');
    if (cleanTime.length !== 4) return null;
    
    const hours = parseInt(cleanTime.substring(0, 2), 10);
    const minutes = parseInt(cleanTime.substring(2, 4), 10);
    
    if (hours === 0 && minutes === 0) {
      return 24.0;
    }
    
    return hours + (minutes / 60);
  };

  // Calculate shift hours
  const calculateShiftHours = (startTime, endTime) => {
    const start = timeToHours(startTime);
    const end = timeToHours(endTime);
    
    if (start === null || end === null) return 0;
    
    if (start === 24.0 && end === 24.0) {
      return 24.0;
    }
    
    let hours = end - start;
    if (hours < 0) {
      hours = (24 - start) + end;
    } else if (end === 24.0 && start < 24) {
      hours = 24 - start;
    }
    
    return hours;
  };

  // Calculate manager statistics
  const managerStats = useMemo(() => {
    const managerHours = {}; // { managerName: { totalHours: 0, opsHours: 0 } }

    if (!weekData || !weekData.days || !sites.length) {
      return [];
    }

    weekData.days.forEach(day => {
      if (!day.shifts || !Array.isArray(day.shifts)) return;

      day.shifts.forEach(shift => {
        const startTime = shift.startTime || '';
        const endTime = shift.endTime || '';
        const upperStart = startTime.toUpperCase();
        const upperEnd = endTime.toUpperCase();

        // Skip shifts with xxxx time
        if (upperStart === 'XXXX' || upperEnd === 'XXXX') return;

        const shiftHours = calculateShiftHours(startTime, endTime);
        if (shiftHours <= 0) return;

        // Strip parentheses from site name for matching (e.g., "600 Cal (N.Watson)" -> "600 Cal")
        const shiftSite = stripParentheses(shift.site || '');
        
        // Find matching site in directory
        const matchedSite = findSiteMatch(shiftSite);
        
        if (!matchedSite || !matchedSite.manager) {
          // If no match found, skip this shift
          return;
        }

        const managerName = matchedSite.manager;
        
        // Initialize manager if not exists
        if (!managerHours[managerName]) {
          managerHours[managerName] = { totalHours: 0, opsHours: 0 };
        }

        // Add to total hours
        managerHours[managerName].totalHours += shiftHours;

        // Check if OPS (blue background)
        const bgColor = shift.bgColor || '#FFFFFF';
        let normalizedBg = bgColor.toUpperCase().trim();
        if (normalizedBg.startsWith('#')) {
          normalizedBg = normalizedBg.substring(1);
        }
        
        const opsBgNormalized = COLOR_OPS_BG.toUpperCase().trim();
        let opsBgToCompare = opsBgNormalized.startsWith('#') ? opsBgNormalized.substring(1) : opsBgNormalized;
        if (opsBgToCompare.length === 8) {
          opsBgToCompare = opsBgToCompare.substring(0, 6);
        }
        const normalizedBgFirst6 = normalizedBg.length >= 6 ? normalizedBg.substring(0, 6) : normalizedBg;
        
        const isOps = normalizedBgFirst6 === opsBgToCompare || normalizedBgFirst6 === '7DA6F1';

        if (isOps) {
          managerHours[managerName].opsHours += shiftHours;
        }
      });
    });

    // Convert to array and sort by total hours (descending)
    return Object.entries(managerHours)
      .map(([manager, stats]) => ({
        manager,
        totalHours: stats.totalHours,
        opsHours: stats.opsHours,
      }))
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [weekData, sites]);

  // Calculate max hours for scaling
  const maxHours = useMemo(() => {
    if (managerStats.length === 0) return 1;
    return Math.max(
      ...managerStats.map(m => Math.max(m.totalHours, m.opsHours)),
      1
    );
  }, [managerStats]);

  const barContainerHeight = 150; // Fixed height for bars

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%", maxWidth: "80rem" }}>
        <div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#f8fafc",
              marginBottom: "0.25rem",
            }}
          >
            CSM Coverage Data
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

        {managerStats.length > 0 ? (
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              borderRadius: "0.75rem",
              border: "1px solid rgba(148, 163, 184, 0.18)",
              padding: "1.5rem",
              overflowX: "auto",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {managerStats.map((item, index) => {
                // Calculate bar heights based on maxHours
                const totalBarHeight = maxHours > 0 && item.totalHours > 0 
                  ? (item.totalHours / maxHours) * barContainerHeight 
                  : 0;
                const opsBarHeight = maxHours > 0 && item.opsHours > 0 
                  ? (item.opsHours / maxHours) * barContainerHeight 
                  : 0;

                return (
                  <div
                    key={item.manager}
                    style={{
                      display: "flex",
                      gap: "2rem",
                      padding: "0.75rem 1rem",
                      backgroundColor: index % 2 === 0 ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.1)",
                      borderRadius: "0.5rem",
                      border: "1px solid rgba(148, 163, 184, 0.1)",
                      minHeight: `${barContainerHeight + 80}px`,
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Left Side: Data */}
                    <div style={{ 
                      flex: "0 0 250px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}>
                      <div style={{ 
                        fontSize: "1rem", 
                        fontWeight: 600, 
                        color: "#f8fafc",
                        marginBottom: "0.5rem",
                      }}>
                        {item.manager}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        {item.totalHours > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>Total Coverage:</span>
                            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#22c55e" }}>
                              {item.totalHours.toFixed(1)} hrs
                            </span>
                          </div>
                        )}
                        {item.opsHours > 0 && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.9rem", color: "#94a3b8" }}>OPS Coverage:</span>
                            <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "#3b82f6" }}>
                              {item.opsHours.toFixed(1)} hrs
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Side: Bar Charts */}
                    <div style={{ 
                      flex: 1,
                      display: "flex", 
                      gap: "2rem", 
                      alignItems: "flex-end", 
                      minHeight: `${barContainerHeight + 60}px`,
                      justifyContent: "flex-start",
                    }}>
                      {/* Total Coverage Bar */}
                      <div style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "center", 
                        justifyContent: "flex-end",
                        minWidth: "80px",
                        height: `${barContainerHeight + 50}px`,
                      }}>
                        <div style={{
                          width: "100%",
                          height: `${barContainerHeight}px`,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "flex-end",
                          position: "relative",
                        }}>
                          <div
                            style={{
                              width: "100%",
                              height: `${totalBarHeight}px`,
                              backgroundColor: "#22c55e",
                              borderRadius: "0.375rem 0.375rem 0 0",
                              border: "2px solid rgba(34, 197, 94, 0.6)",
                              transition: "height 0.5s ease",
                              display: item.totalHours > 0 ? "block" : "none",
                            }}
                          />
                        </div>
                        <span style={{ 
                          fontSize: "0.85rem", 
                          color: "#94a3b8", 
                          fontWeight: 500,
                          marginTop: "0.5rem",
                          height: "1.2rem",
                          display: "flex",
                          alignItems: "center",
                        }}>
                          Total
                        </span>
                      </div>

                      {/* OPS Coverage Bar */}
                      <div style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        alignItems: "center", 
                        justifyContent: "flex-end",
                        minWidth: "80px",
                        height: `${barContainerHeight + 50}px`,
                      }}>
                        <div style={{
                          width: "100%",
                          height: `${barContainerHeight}px`,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "flex-end",
                          position: "relative",
                        }}>
                          <div
                            style={{
                              width: "100%",
                              height: `${opsBarHeight}px`,
                              backgroundColor: "#3b82f6",
                              borderRadius: "0.375rem 0.375rem 0 0",
                              border: "2px solid rgba(59, 130, 246, 0.6)",
                              transition: "height 0.5s ease",
                              display: item.opsHours > 0 ? "block" : "none",
                            }}
                          />
                        </div>
                        <span style={{ 
                          fontSize: "0.85rem", 
                          color: "#94a3b8", 
                          fontWeight: 500,
                          marginTop: "0.5rem",
                          height: "1.2rem",
                          display: "flex",
                          alignItems: "center",
                        }}>
                          OPS
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: "#94a3b8",
              fontSize: "1rem",
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              borderRadius: "0.75rem",
              border: "1px solid rgba(148, 163, 184, 0.18)",
            }}
          >
            {sites.length === 0 ? "Loading site data..." : "No manager data available for this week"}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.6rem 1.2rem",
              backgroundColor: "transparent",
              border: "1px solid rgba(148, 163, 184, 0.35)",
              color: "#e2e8f0",
              borderRadius: "0.5rem",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: "0.95rem",
              transition: "all 0.2s ease",
            }}
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

/**
 * Ops Data Modal Component
 */
const OpsDataModal = ({ weekData, onClose }) => {
  // Calculate hours from time string
  const timeToHours = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return null;
    const upperTime = timeStr.toUpperCase();
    if (upperTime === 'XXXX') return null;
    
    const cleanTime = timeStr.replace(/[^0-9]/g, '');
    if (cleanTime.length !== 4) return null;
    
    const hours = parseInt(cleanTime.substring(0, 2), 10);
    const minutes = parseInt(cleanTime.substring(2, 4), 10);
    
    if (hours === 0 && minutes === 0) {
      return 24.0;
    }
    
    return hours + (minutes / 60);
  };

  // Calculate shift hours
  const calculateShiftHours = (startTime, endTime) => {
    const start = timeToHours(startTime);
    const end = timeToHours(endTime);
    
    if (start === null || end === null) return 0;
    
    if (start === 24.0 && end === 24.0) {
      return 24.0;
    }
    
    let hours = end - start;
    if (hours < 0) {
      hours = (24 - start) + end;
    } else if (end === 24.0 && start < 24) {
      hours = 24 - start;
    }
    
    return hours;
  };

  // Calculate OPS statistics
  const opsStats = useMemo(() => {
    const opsHours = {}; // { opsName: totalHours }

    if (!weekData || !weekData.days) {
      return [];
    }

    weekData.days.forEach(day => {
      if (!day.shifts || !Array.isArray(day.shifts)) return;

      day.shifts.forEach(shift => {
        const startTime = shift.startTime || '';
        const endTime = shift.endTime || '';
        const upperStart = startTime.toUpperCase();
        const upperEnd = endTime.toUpperCase();

        // Skip shifts with xxxx time
        if (upperStart === 'XXXX' || upperEnd === 'XXXX') return;

        const shiftHours = calculateShiftHours(startTime, endTime);
        if (shiftHours <= 0) return;

        // Extract OPS name from parentheses (e.g., "600 Cal (N.Watson)" -> "N.Watson")
        const opsName = extractOpsName(shift.site || '');
        
        if (!opsName) {
          // No OPS name in parentheses, skip this shift
          return;
        }

        // Initialize OPS if not exists
        if (!opsHours[opsName]) {
          opsHours[opsName] = 0;
        }

        // Add to total hours
        opsHours[opsName] += shiftHours;
      });
    });

    // Convert to array and sort by total hours (descending)
    return Object.entries(opsHours)
      .map(([opsName, totalHours]) => ({
        opsName,
        totalHours,
      }))
      .sort((a, b) => b.totalHours - a.totalHours);
  }, [weekData]);

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%", maxWidth: "80rem" }}>
        <div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#f8fafc",
              marginBottom: "0.25rem",
            }}
          >
            F/S Standing Post
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

        {opsStats.length > 0 ? (
          <div
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              borderRadius: "0.75rem",
              border: "1px solid rgba(148, 163, 184, 0.18)",
              padding: "1.5rem",
              overflowX: "auto",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {opsStats.map((item, index) => (
                <div
                  key={item.opsName}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.75rem 1rem",
                    backgroundColor: index % 2 === 0 ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.1)",
                    borderRadius: "0.5rem",
                    border: "1px solid rgba(148, 163, 184, 0.1)",
                  }}
                >
                  <span style={{ 
                    fontSize: "1rem", 
                    fontWeight: 600, 
                    color: "#f8fafc",
                  }}>
                    {item.opsName}
                  </span>
                  <span style={{ 
                    fontSize: "1rem", 
                    fontWeight: 700, 
                    color: "#3b82f6",
                  }}>
                    {item.totalHours.toFixed(1)} hrs
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: "#94a3b8",
              fontSize: "1rem",
              backgroundColor: "rgba(15, 23, 42, 0.6)",
              borderRadius: "0.75rem",
              border: "1px solid rgba(148, 163, 184, 0.18)",
            }}
          >
            No OPS data available for this week
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.6rem 1.2rem",
              backgroundColor: "transparent",
              border: "1px solid rgba(148, 163, 184, 0.35)",
              color: "#e2e8f0",
              borderRadius: "0.5rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
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

/**
 * Site Search Modal Component
 */
const SiteSearchModal = ({ onClose, hasAccess, db, initialSelectedSite = null }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sites, setSites] = useState([]);
  const [filteredSites, setFilteredSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(initialSelectedSite);

  // Set selected site when initialSelectedSite changes (before sites are loaded)
  useEffect(() => {
    if (initialSelectedSite && !selectedSite) {
      setSelectedSite(initialSelectedSite);
    }
  }, [initialSelectedSite]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [formData, setFormData] = useState({
    address: "",
    manager: "",
    uniform: {
      blazer: "",
      pant: "",
      shirt: "",
      tie: "",
    },
  });

  // Load sites from Firebase
  useEffect(() => {
    if (!db) return;

    const sitesCollectionRef = collection(db, SITES_COLLECTION_PATH);
    
    const unsubscribe = onSnapshot(sitesCollectionRef, (snapshot) => {
      const sitesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSites(sitesData);
      
      // Seed database if empty
      if (sitesData.length === 0) {
        seedDatabase();
      }
    }, (error) => {
      console.error("Error listening to sites:", error);
    });

    return () => unsubscribe();
  }, [db]);

  // Seed database with default sites
  const seedDatabase = async () => {
    if (!db) return;

    const defaultSites = [
      { manager: "Doug Fletcher", address: "736 Mission St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Doug Fletcher", address: "600 California St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Doug Fletcher", address: "120 Kearny St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Jason Daugherty", address: "1128 Market St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Jason Daugherty", address: "420 23rd St", uniform: { blazer: "Green Jacket", pant: "Cargo (Blk)", shirt: "Polo (Blk)", tie: "---" } },
      { manager: "Jason Daugherty", address: "1 La Avanzada St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Jason Daugherty", address: "500 Howard St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Jason Daugherty", address: "500 Pine St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Jason Daugherty", address: "1800 Mission St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Jason Daugherty", address: "130 Battery St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Jason Daugherty", address: "1400 Geary Blvd", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Jason Daugherty", address: "300 Kansas St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Jason Daugherty", address: "633 Folsom St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Jason Daugherty", address: "501 2nd St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Jason Daugherty", address: "111 Pine St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Jason Daugherty", address: "400 Paul Ave", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Jason Daugherty", address: "1 Kearny St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Jason Daugherty", address: "1200 Van Ness Ave", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Aldo Diaz", address: "181 Fremont St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Gray" } },
      { manager: "Aldo Diaz", address: "274 Brannan St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Gray" } },
      { manager: "Aldo Diaz", address: "360 Spear St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Gray" } },
      { manager: "Aldo Diaz", address: "1035 Market St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Aldo Diaz", address: "150 Spear St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Aldo Diaz", address: "750 Battery St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Aldo Diaz", address: "1635 Divisadero St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Aldo Diaz", address: "115 Sansome St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Aldo Diaz", address: "180 Montgomery St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Aldo Diaz", address: "220 Montgomery St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Aldo Diaz", address: "601 California St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Aldo Diaz", address: "711 Eddy St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Aldo Diaz", address: "1280 Laguna St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Aldo Diaz", address: "71 Stevenson St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Mohamed Ezzat", address: "240 Stockton St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Mohamed Ezzat", address: "30 Grant Ave", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Mohamed Ezzat", address: "170 Maiden Lane", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Mohamed Ezzat", address: "599 Skyline Blvd", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Mohamed Ezzat", address: "456 Montgomery St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Mohamed Ezzat", address: "717 Market St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Mohamed Ezzat", address: "201 Mission St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Mohamed Ezzat", address: "101 Mission St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Mohamed Ezzat", address: "100 Montgomery St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Mohamed Ezzat", address: "166 Geary St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Inderprit Gill", address: "26 O'Farrell St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Inderprit Gill", address: "153 Kearny St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Inderprit Gill", address: "110 Sutter St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Inderprit Gill", address: "311 California St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Inderprit Gill", address: "90 New Montgomery St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Inderprit Gill", address: "785 Market St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Inderprit Gill", address: "230 California St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Inderprit Gill", address: "101 Montgomery St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Inderprit Gill", address: "425 California St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Inderprit Gill", address: "210 Post St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Inderprit Gill", address: "30 Maiden Lane", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Inderprit Gill", address: "222 Kearny St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Inderprit Gill", address: "150 Post St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Inderprit Gill", address: "1019 Market St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
      { manager: "Inderprit Gill", address: "425 Market St", uniform: { blazer: "Black", pant: "Black", shirt: "White", tie: "Black" } },
    ];

    try {
      const sitesCollectionRef = collection(db, SITES_COLLECTION_PATH);
      const batch = writeBatch(db);

      defaultSites.forEach((site) => {
        const docRef = doc(sitesCollectionRef);
        batch.set(docRef, site);
      });

      await batch.commit();
      console.log("Database seeded with default sites");
    } catch (error) {
      console.error("Error seeding database:", error);
    }
  };

  // When sites are loaded, match initialSelectedSite with loaded sites to get full data
  useEffect(() => {
    if (initialSelectedSite && sites.length > 0 && selectedSite === initialSelectedSite) {
      // Find the matching site in the loaded sites by id or address
      const matchedSite = sites.find(
        (site) => site.id === initialSelectedSite.id || 
        site.address === initialSelectedSite.address
      );
      if (matchedSite && matchedSite.id !== selectedSite?.id) {
        setSelectedSite(matchedSite);
      }
    }
  }, [sites, initialSelectedSite, selectedSite]);

  // Filter sites based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSites([]);
      // Don't clear selectedSite - keep it if it exists
      return;
    }

    const query = searchQuery.toLowerCase();
    const matches = sites.filter((site) =>
      site.address?.toLowerCase().includes(query)
    );
    setFilteredSites(matches);
  }, [searchQuery, sites]);

  const handleSelectSite = (site) => {
    setSelectedSite(site);
    setSearchQuery("");
    setFilteredSites([]);
  };

  const handleEdit = (site) => {
    setEditingSite(site);
    setFormData({
      address: site.address || "",
      manager: site.manager || "",
      uniform: {
        blazer: site.uniform?.blazer || "",
        pant: site.uniform?.pant || "",
        shirt: site.uniform?.shirt || "",
        tie: site.uniform?.tie || "",
      },
    });
    setShowEditModal(true);
  };

  const handleCreateNew = () => {
    setEditingSite(null);
    setFormData({
      address: "",
      manager: "",
      uniform: {
        blazer: "",
        pant: "",
        shirt: "",
        tie: "",
      },
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!formData.address || !formData.manager || !db) {
      alert("Address and Manager are required.");
      return;
    }

    try {
      const sitesCollectionRef = collection(db, SITES_COLLECTION_PATH);
      
      if (editingSite) {
        // Update existing site
        const docRef = doc(db, SITES_COLLECTION_PATH, editingSite.id);
        await updateDoc(docRef, formData);
      } else {
        // Create new site
        await addDoc(sitesCollectionRef, formData);
      }

      setShowEditModal(false);
      setEditingSite(null);
      if (selectedSite && editingSite && editingSite.id === selectedSite.id) {
        setSelectedSite({ ...selectedSite, ...formData });
      }
    } catch (error) {
      console.error("Error saving site:", error);
      alert("Error saving site. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!editingSite || !db) return;

    try {
      const docRef = doc(db, SITES_COLLECTION_PATH, editingSite.id);
      await deleteDoc(docRef);
      setShowEditModal(false);
      setShowDeleteConfirm(false);
      setEditingSite(null);
      if (selectedSite && editingSite.id === selectedSite.id) {
        setSelectedSite(null);
      }
    } catch (error) {
      console.error("Error deleting site:", error);
      alert("Error deleting site. Please try again.");
    }
  };

  const modalSecondaryButtonStyle = {
    padding: "0.6rem 1.2rem",
    backgroundColor: "transparent",
    border: "1px solid rgba(148, 163, 184, 0.35)",
    color: "#e2e8f0",
    borderRadius: "0.5rem",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.95rem",
    transition: "all 0.2s ease",
  };

  const modalPrimaryButtonStyle = {
    ...modalSecondaryButtonStyle,
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    border: "1px solid rgba(34, 197, 94, 0.4)",
    color: "#86efac",
  };

  const modalDangerButtonStyle = {
    ...modalSecondaryButtonStyle,
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    border: "1px solid rgba(239, 68, 68, 0.4)",
    color: "#fca5a5",
  };

  return (
    <Modal onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%", maxWidth: "60rem" }}>
        <div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "#f8fafc",
              marginBottom: "0.25rem",
            }}
          >
            Site Search
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

        {/* Search Input */}
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="search"
            style={{
              width: "100%",
              padding: "0.75rem 1rem",
              backgroundColor: "#111",
              color: "#fff",
              border: "1px solid #fff",
              borderRadius: "0.5rem",
              fontSize: "1rem",
              fontFamily: "monospace",
              fontWeight: "bold",
            }}
          />
          {filteredSites.length > 0 && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                backgroundColor: "#111",
                border: "1px solid #fff",
                borderTop: "none",
                borderRadius: "0 0 0.5rem 0.5rem",
                zIndex: 10,
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              {filteredSites.map((site) => (
                <div
                  key={site.id}
                  onClick={() => handleSelectSite(site)}
                  style={{
                    padding: "0.75rem 1rem",
                    cursor: "pointer",
                    borderBottom: "1px solid #333",
                    transition: "background-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#333";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {site.address}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Site Details */}
        {selectedSite && (
          <div
            style={{
              border: "1px solid #333",
              borderRadius: "0.5rem",
              padding: "1.5rem",
              backgroundColor: "rgba(15, 23, 42, 0.6)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h4 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#f8fafc", margin: 0 }}>
                {selectedSite.address}
              </h4>
              {hasAccess && (
                <button
                  type="button"
                  onClick={() => handleEdit(selectedSite)}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "transparent",
                    border: "1px solid rgba(148, 163, 184, 0.35)",
                    color: "#e2e8f0",
                    borderRadius: "0.375rem",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(148, 163, 184, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  Edit
                </button>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px dashed #333" }}>
                <span style={{ color: "#94a3b8" }}>Manager</span>
                <span style={{ color: "#fff", fontWeight: 600 }}>{selectedSite.manager}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px dashed #333" }}>
                <span style={{ color: "#94a3b8" }}>Blazer</span>
                <span style={{ color: "#fff", fontWeight: 600 }}>{selectedSite.uniform?.blazer || "---"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px dashed #333" }}>
                <span style={{ color: "#94a3b8" }}>Pant</span>
                <span style={{ color: "#fff", fontWeight: 600 }}>{selectedSite.uniform?.pant || "---"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "0.5rem", borderBottom: "1px dashed #333" }}>
                <span style={{ color: "#94a3b8" }}>Shirt</span>
                <span style={{ color: "#fff", fontWeight: 600 }}>{selectedSite.uniform?.shirt || "---"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94a3b8" }}>Tie</span>
                <span style={{ color: "#fff", fontWeight: 600 }}>{selectedSite.uniform?.tie || "---"}</span>
              </div>
            </div>
          </div>
        )}

        {hasAccess && (
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={handleCreateNew}
              style={modalPrimaryButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(34, 197, 94, 0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(34, 197, 94, 0.15)";
              }}
            >
              Add New Site
            </button>
          </div>
        )}

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

      {/* Edit/Create Modal */}
      {showEditModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            padding: "1rem",
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              backgroundColor: "#000",
              border: "1px solid #fff",
              borderRadius: "0.5rem",
              padding: "1.5rem",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc", marginBottom: "1rem" }}>
              {editingSite ? "Edit Site" : "Create New Site"}
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", color: "#94a3b8", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                  Address *
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    backgroundColor: "#111",
                    color: "#fff",
                    border: "1px solid #fff",
                    borderRadius: "0.375rem",
                    fontSize: "1rem",
                    fontFamily: "monospace",
                  }}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", color: "#94a3b8", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                  Manager *
                </label>
                <input
                  type="text"
                  value={formData.manager}
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    backgroundColor: "#111",
                    color: "#fff",
                    border: "1px solid #fff",
                    borderRadius: "0.375rem",
                    fontSize: "1rem",
                    fontFamily: "monospace",
                  }}
                  required
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", color: "#94a3b8", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                    Blazer
                  </label>
                  <input
                    type="text"
                    value={formData.uniform.blazer}
                    onChange={(e) => setFormData({ ...formData, uniform: { ...formData.uniform, blazer: e.target.value } })}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      backgroundColor: "#111",
                      color: "#fff",
                      border: "1px solid #fff",
                      borderRadius: "0.375rem",
                      fontSize: "1rem",
                      fontFamily: "monospace",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", color: "#94a3b8", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                    Pant
                  </label>
                  <input
                    type="text"
                    value={formData.uniform.pant}
                    onChange={(e) => setFormData({ ...formData, uniform: { ...formData.uniform, pant: e.target.value } })}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      backgroundColor: "#111",
                      color: "#fff",
                      border: "1px solid #fff",
                      borderRadius: "0.375rem",
                      fontSize: "1rem",
                      fontFamily: "monospace",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", color: "#94a3b8", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                    Shirt
                  </label>
                  <input
                    type="text"
                    value={formData.uniform.shirt}
                    onChange={(e) => setFormData({ ...formData, uniform: { ...formData.uniform, shirt: e.target.value } })}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      backgroundColor: "#111",
                      color: "#fff",
                      border: "1px solid #fff",
                      borderRadius: "0.375rem",
                      fontSize: "1rem",
                      fontFamily: "monospace",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", color: "#94a3b8", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                    Tie
                  </label>
                  <input
                    type="text"
                    value={formData.uniform.tie}
                    onChange={(e) => setFormData({ ...formData, uniform: { ...formData.uniform, tie: e.target.value } })}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      backgroundColor: "#111",
                      color: "#fff",
                      border: "1px solid #fff",
                      borderRadius: "0.375rem",
                      fontSize: "1rem",
                      fontFamily: "monospace",
                    }}
                  />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1.5rem", gap: "0.75rem" }}>
              {editingSite && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  style={modalDangerButtonStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
                  }}
                >
                  Delete
                </button>
              )}
              <div style={{ display: "flex", gap: "0.75rem", marginLeft: "auto" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingSite(null);
                  }}
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
                    e.currentTarget.style.backgroundColor = "rgba(34, 197, 94, 0.25)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(34, 197, 94, 0.15)";
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            padding: "1rem",
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              backgroundColor: "#000",
              border: "1px solid #fff",
              borderRadius: "0.5rem",
              padding: "1.5rem",
              maxWidth: "450px",
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#f8fafc", marginBottom: "1rem" }}>
              Confirm Deletion
            </h4>
            <p style={{ color: "#e2e8f0", marginBottom: "1.5rem", lineHeight: 1.5 }}>
              Are you sure you want to delete this site?
              <br />
              <br />
              <strong>{editingSite?.address}</strong>
              <br />
              <br />
              This action cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
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
                onClick={handleDelete}
                style={modalDangerButtonStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.15)";
                }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

/**
 * Registered Users Modal
 */
const RegisteredUsersModal = ({ users, onClose, onDeleteUser, isAdmin }) => {
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
            ADMIN PANEL - Registered Accounts
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
              gridTemplateColumns: isAdmin ? "1.2fr 0.8fr 0.8fr 1.2fr 0.6fr" : "1.2fr 0.8fr 0.8fr 1.2fr",
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
            {isAdmin && <span>Action</span>}
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
                  gridTemplateColumns: isAdmin ? "1.2fr 0.8fr 0.8fr 1.2fr 0.6fr" : "1.2fr 0.8fr 0.8fr 1.2fr",
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
                  {user.isAdmin ? "Admin" : user.isSubAdmin ? "Sub-Admin" : user.hasAccess ? "Editor" : "Viewer"}
                </span>
                <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                  {formatTimestamp(user.createdAt)}
                </span>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete ${user.firstName || ""} ${user.lastName || ""} (${user.initials})? This action cannot be undone.`)) {
                        onDeleteUser(user);
                      }
                    }}
                    style={{
                      padding: "0.4rem 0.6rem",
                      borderRadius: "0.375rem",
                      border: "1px solid rgba(239, 68, 68, 0.5)",
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      color: "#fca5a5",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.2)";
                      e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.7)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
                      e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)";
                    }}
                  >
                    Delete
                  </button>
                )}
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
  const handleOpenResearch = useCallback(() => {
    if (typeof window !== "undefined") {
      window.open(RESEARCH_URL, "_blank", "noopener,noreferrer");
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
  const isSubAdmin = Boolean(userInfo?.isSubAdmin);

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
  const handlePasteShift = async () => {
    const pasteDay = pasteMenuState.day;
    if (!db || !pasteDay || !clipboard) {
      console.error("Cannot paste shift, DB, day, or clipboard missing.", { db: !!db, day: !!pasteDay, clipboard: !!clipboard });
      alert("Cannot paste shift. Please copy a shift first and right-click on the '+' button.");
      return;
    }

    try {
      // Create a new shift object with a new ID
      const newShift = { ...clipboard, id: crypto.randomUUID() };

      const dayString = getDateKey(pasteDay.date);
      const currentDays = await getWeekDoc();
      const dayIndex = currentDays.findIndex((d) => d.date === dayString);

      if (dayIndex === -1) {
        console.error("Day not found:", dayString, "Available days:", currentDays.map(d => d.date));
        alert(`Day not found: ${dayString}`);
        return;
      }

      // Ensure shifts array exists
      if (!currentDays[dayIndex].shifts) {
        currentDays[dayIndex].shifts = [];
      }

      // Add the new shift to the day's shifts array
      currentDays[dayIndex].shifts.push(newShift);

      const weekDocRef = doc(db, collectionPath, weekId);
      await setDoc(weekDocRef, { days: currentDays }, { merge: true });
      setPasteMenuState({ visible: false }); // Close paste menu
      console.log("Shift pasted successfully to day:", dayString);
    } catch (error) {
      console.error("Error pasting shift:", error);
      alert(`Failed to paste shift: ${error.message}`);
    }
  };

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
  const openSearchModal = (selectedSite = null) => {
    openModal(
      <SiteSearchModal
        onClose={closeModal}
        hasAccess={hasAccess}
        db={db}
        initialSelectedSite={selectedSite}
      />,
      'siteSearch'
    );
  };
  // Delete user handler
  const handleDeleteUser = useCallback(async (userToDelete) => {
    const currentIsAdmin = Boolean(userInfo?.isAdmin);
    if (!db || !currentIsAdmin) {
      console.error("Cannot delete user: DB not connected or user is not admin.");
      alert("You do not have permission to delete users.");
      return;
    }

    try {
      // Delete from Firestore
      const collectionPath = REGISTERED_USERS_COLLECTION.split('/').filter(Boolean);
      const userDocRef = doc(db, ...collectionPath, userToDelete.userId);
      await deleteDoc(userDocRef);

      // Update local state
      setRegisteredUsers((prev) => prev.filter(u => u.userId !== userToDelete.userId));

      console.log(`User ${userToDelete.initials} deleted successfully.`);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Failed to delete user. Please try again.");
    }
  }, [db, userInfo]);

  const openRegisteredUsersModal = () => {
    const currentIsAdmin = Boolean(userInfo?.isAdmin);
    openModal(
      <RegisteredUsersModal
        users={registeredUsers}
        onClose={closeModal}
        onDeleteUser={handleDeleteUser}
        isAdmin={currentIsAdmin}
      />
    );
  };

  const openDetailedSummaryModal = () => {
    openModal(
      <DetailedSummaryModal
        weekData={weekData}
        onClose={closeModal}
      />
    );
  };

  const openManagerDataModal = () => {
    openModal(
      <ManagerDataModal
        weekData={weekData}
        onClose={closeModal}
        db={db}
      />
    );
  };

  const openOpsDataModal = () => {
    openModal(
      <OpsDataModal
        weekData={weekData}
        onClose={closeModal}
      />
    );
  };

  const openSummaryModal = () => {
    openModal(
      <SummaryModal
        weekData={weekData}
        onClose={closeModal}
        isAdmin={isAdmin}
        weekId={weekId}
        onOpenDetails={openDetailedSummaryModal}
        onOpenManagerData={openManagerDataModal}
        onOpenOpsData={openOpsDataModal}
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

  // Copy shift data for pasting within the app
  const handleContextCopy = () => {
    const { shift } = contextMenu;
    if (shift) {
      // Copy shift data to state for pasting within the app
      setClipboard({ ...shift }); // Make a copy to avoid reference issues
    }
    setContextMenu({ visible: false });
  };

  // Copy shift text to system clipboard
  const handleContextCopyToClipboard = () => {
    const { shift } = contextMenu;
    if (shift) {
      const details = `${shift.site} ${shift.startTime}-${shift.endTime}`;
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(details).then(() => {
          console.log("Shift details copied to clipboard");
        }).catch((err) => {
          console.warn("Unable to write shift details to clipboard:", err);
          alert("Failed to copy to clipboard. Please try again.");
        });
      } else {
        alert("Clipboard API not available in this browser.");
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

  // Paste shift onto an existing shift (replace it)
  const handlePasteShiftOntoShift = async () => {
    if (!db || !clipboard) {
      console.error("Cannot paste shift, DB or clipboard missing.");
      alert("No shift copied. Please copy a shift first.");
      return;
    }

    // Get current contextMenu at call time (read from state directly)
    const menuDay = contextMenu.day;
    const menuShift = contextMenu.shift;
    
    if (!menuDay || !menuShift) {
      console.error("Cannot paste shift, day or shift missing from context menu.", { day: menuDay, shift: menuShift });
      alert("Cannot paste shift. Please right-click on a shift to paste.");
      return;
    }

    try {
      // Create a new shift object with a new ID
      const newShift = { ...clipboard, id: crypto.randomUUID() };

      // Use the same pattern as handleUpdateShift
      const dayString = getDateKey(menuDay.date);
      const currentDays = await getWeekDoc();
      const dayIndex = currentDays.findIndex((d) => d.date === dayString);

      if (dayIndex === -1) {
        console.error("Day not found:", dayString, "Available days:", currentDays.map(d => d.date));
        alert(`Day not found: ${dayString}`);
        return;
      }

      // Ensure shifts array exists
      if (!currentDays[dayIndex].shifts) {
        currentDays[dayIndex].shifts = [];
      }

      // Find and replace the existing shift
      const shiftIndex = currentDays[dayIndex].shifts.findIndex((s) => s.id === menuShift.id);
      if (shiftIndex === -1) {
        console.error("Shift not found:", menuShift.id, "Available shifts:", currentDays[dayIndex].shifts.map(s => s.id));
        alert(`Shift not found in day. Please try again.`);
        return;
      }

      // Replace the shift at this index
      currentDays[dayIndex].shifts[shiftIndex] = newShift;

      const weekDocRef = doc(db, collectionPath, weekId);
      await setDoc(weekDocRef, { days: currentDays }, { merge: true });
      setContextMenu({ visible: false }); // Close context menu
      console.log("Shift pasted successfully");
    } catch (error) {
      console.error("Error pasting shift:", error);
      alert(`Failed to paste shift: ${error.message}`);
    }
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
        onOpenSearch={openSearchModal}
        onOpenAnalysis={handleOpenAnalysis}
        onOpenResearch={handleOpenResearch}
        onOpenSiteManager={handleOpenSiteManager}
        onOpenSummary={openSummaryModal}
        showSettings={Boolean(userInfo?.isAdmin)}
        onOpenSettings={openRegisteredUsersModal}
        onLogout={handleLogout}
        weekData={weekData}
        db={db}
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
        onCopyToClipboard={handleContextCopyToClipboard}
        onSplit={handleContextSplit}
        hasClipboard={!!clipboard}
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



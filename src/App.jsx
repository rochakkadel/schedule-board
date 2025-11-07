/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unknown-property */

// Import React hooks
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";

// Import Firebase modules
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  collection,
  setLogLevel,
} from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from "firebase/auth";

// --- Firebase Configuration ---
// This will be populated by the .env.local file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase (Modular syntax)
let app, db, auth;
try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  setLogLevel("debug"); // Enable Firebase logging
} catch (e) {
  console.error("Firebase initialization error:", e);
  // Create dummy objects to prevent further crashes
  db = null;
  auth = null;
}

// --- App ID Handling ---
const appId = "default-app-id";

// --- Constants ---
const ACCESS_CODE = "91965";
const SITE_NAMES = [
  "425 California", "101 Mission", "425 Market", "180 Montgomery",
  "360 Spear", "1019 Market", "@220 Montgomery", "Sutro",
  "201 Mission", "111 Pine", "501 2nd", "@360 Spear",
  "420 23rd", "101 Mission", "@350 Spear",
];
const FONT_COLORS = ["#000000", "#FFFFFF", "#FF0000"]; // black, white, red
const FILL_COLORS = ["#FFFFFF", "#008000", "#0000FF", "#000000", "#FFA500"]; // white, green, blue, black, orange

const COLOR_COMPLETE_BG = "#22C55E"; // Lighter Green
const COLOR_COMPLETE_FONT = "#FFFFFF"; // White
const COLOR_OPS_BG = "#3B82F6"; // Lighter Blue
const COLOR_OPS_FONT = "#FFFFFF"; // White

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
        // For a public site, we just sign in anonymously.
        // __initial_auth_token will not exist.
        await signInAnonymously(auth); // Modular syntax
      } catch (error) {
        console.error("Error during authentication:", error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Modular syntax
      setUser(user);
      setIsAuthReady(true);
      if (!user) {
        localStorage.removeItem("scheduleUser");
        setUserInfo(null);
      }
      // CRITICAL FIX: Re-load userInfo if auth changes and local storage exists
      if (user && user.uid && !userInfo) {
        try {
          const savedUser = localStorage.getItem("scheduleUser");
          if (savedUser) {
            setUserInfo(JSON.parse(savedUser));
          }
        } catch (e) {
          console.error("Error reloading user info:", e);
        }
      }
    });

    initAuth();
    return () => unsubscribe();
  }, []);

  // Memoized access right
  const hasAccess = useMemo(() => userInfo?.hasAccess === true, [userInfo]);
  const initials = useMemo(() => userInfo?.initials || "??", [userInfo]);
  const userId = useMemo(() => user?.uid || null, [user]); // Return null if no user

  /**
   * Attempts to sign up and grant access.
   */
  const signUp = async (firstName, lastName, code) => {
    if (code.trim() !== ACCESS_CODE) {
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
      hasAccess: true,
      userId: userId,
    };

    try {
      localStorage.setItem("scheduleUser", JSON.stringify(newInfo));
      setUserInfo(newInfo); // Update state to trigger re-render and check `hasAccess`
      return { success: true, error: null };
    } catch (e) {
      console.error("Error saving user info:", e);
      return { success: false, error: "Could not save user data." };
    }
  };

  return { user, userId, userInfo, hasAccess, initials, isAuthReady, signUp };
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
}) => {
  return (
    <header className="mb-4 p-4 bg-black border border-white rounded-lg shadow flex flex-col md:flex-row justify-between items-center">
      {/* Left Side: Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPrevWeek}
          className="px-3 py-2 bg-gray-800 border border-white text-white rounded-md hover:bg-gray-700"
        >
          <ArrowLeftIcon />
        </button>
        <button
          onClick={onToday}
          className="px-4 py-2 bg-gray-800 border border-white text-white rounded-md hover:bg-gray-700 text-sm font-medium"
        >
          Today
        </button>
        <button
          onClick={onNextWeek}
          className="px-3 py-2 bg-gray-800 border border-white text-white rounded-md hover:bg-gray-700"
        >
          <ArrowRightIcon />
        </button>
        <button
          onClick={onOpenCalendar}
          className="px-3 py-2 bg-gray-800 border border-white text-white rounded-md hover:bg-gray-700"
        >
          <CalendarIcon />
        </button>
      </div>

      {/* Right Side: Auth */}
      <div className="flex items-center gap-4 mt-2 md:mt-0">
        {hasAccess && userInfo ? (
          <div className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full font-bold border-2 border-white">
            {userInfo.initials}
          </div>
        ) : (
          <button
            onClick={onSignUp}
            className="px-4 py-2 bg-blue-600 border border-white text-white rounded-md hover:bg-blue-500 text-sm font-medium"
          >
            Sign Up
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

  // Default colors if not specified
  const effectiveBgColor = bgColor || "#FFFFFF";
  const effectiveFontColor = fontColor || "#000000";

  // Special case for "@" sites: always red, overrides other font colors
  const siteStyle = {
    color: site.startsWith("@") ? "#FF0000" : effectiveFontColor,
  };

  const hasComments = comments && comments.length > 0;

  return (
    <div
      onContextMenu={(e) => onContextMenu(e, shift)}
      onDoubleClick={() => onDoubleClick(shift)}
      className="p-2 rounded-md cursor-pointer select-none mb-2 border border-gray-600"
      style={{
        backgroundColor: effectiveBgColor,
        color: effectiveFontColor,
        borderRight: hasComments ? "3px solid #FFA500" : "1px solid #4B5563",
      }}
    >
      <div className="flex justify-between items-center">
        <span
          className="font-mono font-bold text-sm" // Removed 'truncate'
          style={siteStyle}
        >
          {site} {startTime}-{endTime}
        </span>
        <span
          className="font-mono font-bold text-sm ml-2 flex-shrink-0"
          style={{ color: effectiveFontColor }}
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
const DayColumn = ({ day, shifts, onContextMenu, onDoubleClick }) => {
  const sortedShifts = useMemo(() => {
    return [...shifts].sort((a, b) => {
      const timeA = a.startTime || "0000";
      const timeB = b.startTime || "0000";
      return timeA.localeCompare(timeB);
    });
  }, [shifts]);

  return (
    <div className="flex-1 min-w-[200px] md:min-w-[220px]">
      <div className="text-center p-3 sticky top-0 bg-black z-10">
        <div className="font-bold text-white text-sm">
          {formatDateHeader(day.date)}
        </div>
      </div>
      <div className="p-2 h-full">
        {sortedShifts.map((shift) => (
          <Shift
            key={shift.id}
            shift={shift}
            onContextMenu={onContextMenu}
            onDoubleClick={onDoubleClick}
          />
        ))}
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

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-48 bg-gray-900 border border-white rounded-md shadow-lg"
      style={{ top: menuState.y, left: menuState.x }}
    >
      <ul className="py-1 text-sm text-gray-200">
        <li
          onClick={onComplete}
          className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
        >
          Complete
        </li>
        <li
          onClick={onOps}
          className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
        >
          OPS
        </li>
        <li
          onClick={onComment}
          className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
        >
          Comment
        </li>
        <li
          onClick={onColor}
          className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
        >
          Change Colors
        </li>
        <li className="border-t border-gray-700 my-1"></li>
        <li
          onClick={onCopy} // New handler
          className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
        >
          Copy Shift
        </li>
        <li
          onClick={onEdit}
          className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
        >
          Edit Shift
        </li>
        <li
          onClick={onDelete}
          className="px-4 py-2 hover:bg-gray-700 text-red-400 cursor-pointer"
        >
          Delete Shift
        </li>
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
      className="absolute z-50 w-48 bg-gray-900 border border-white rounded-md shadow-lg"
      style={{ top: menuState.y, left: menuState.x }}
    >
      <ul className="py-1 text-sm text-gray-200">
        <li
          onClick={onPaste}
          className="px-4 py-2 hover:bg-gray-700 cursor-pointer"
        >
          Paste Shift
        </li>
      </ul>
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-75">
      <div
        ref={modalRef}
        className="bg-black border border-white p-6 rounded-lg shadow-xl w-full max-w-md"
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
        SITE_NAMES.filter((name) =>
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
      <h3 className="text-xl font-semibold text-white mb-4">Add New Shift</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative" ref={suggestionRef}>
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Site Name
          </label>
          <input
            type="text"
            placeholder="Start typing to search..."
            value={site}
            onChange={handleSiteChange}
            onFocus={() => setIsFocused(true)}
            className="w-full p-2 bg-black border border-gray-400 text-white rounded-md text-sm"
          />
          {isFocused && suggestions.length > 0 && (
            <div className="absolute z-10 w-full bg-black border border-white rounded-md shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion}-${index}`}
                  onMouseDown={(e) => {
                    e.stopPropagation(); // Prevent click from closing modal
                    selectSuggestion(suggestion);
                  }}
                  className="p-2 text-sm text-gray-200 hover:bg-gray-800 cursor-pointer"
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-4">
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Start (HHMM)
            </label>
            <input
              type="text"
              placeholder="HHMM"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              maxLength="4"
              className="w-full p-2 bg-black border border-gray-400 text-white rounded-md text-sm font-mono"
            />
          </div>
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-200 mb-1">
              End (HHMM)
            </label>
            <input
              type="text"
              placeholder="HHMM"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              maxLength="4"
              className="w-full p-2 bg-black border border-gray-400 text-white rounded-md text-sm font-mono"
            />
          </div>
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 text-sm font-medium"
          >
            Add Shift
          </button>
        </div>
      </form>
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
      <h3 className="text-xl font-semibold text-white mb-4">Edit Shift</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Site Name
          </label>
          <input
            type="text"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            className="w-full p-2 bg-black border border-gray-400 text-white rounded-md text-sm"
          />
        </div>
        <div className="flex gap-4">
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Start (HHMM)
            </label>
            <input
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              maxLength="4"
              className="w-full p-2 bg-black border border-gray-400 text-white rounded-md text-sm font-mono"
            />
          </div>
          <div className="w-1/2">
            <label className="block text-sm font-medium text-gray-200 mb-1">
              End (HHMM)
            </label>
            <input
              type="text"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              maxLength="4"
              className="w-full p-2 bg-black border border-gray-400 text-white rounded-md text-sm font-mono"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Initials (Optional)
          </label>
          <input
            type="text"
            value={initials}
            onChange={(e) => setInitials(e.target.value)}
            maxLength="4"
            className="w-full p-2 bg-black border border-gray-400 text-white rounded-md text-sm font-mono"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 text-sm font-medium"
          >
            Save Changes
          </button>
        </div>
      </form>
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
    <div>
      <label className="block text-sm font-medium text-gray-200 mb-2">
        {title}
      </label>
      <div className="flex gap-2">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`w-8 h-8 rounded-full border-2 ${
              selected === color ? "border-white" : "border-gray-600"
            }`}
            style={{ backgroundColor: color }}
          ></button>
        ))}
      </div>
    </div>
  );

  return (
    <Modal onClose={onClose}>
      <h3 className="text-xl font-semibold text-white mb-4">Change Colors</h3>
      <div className="space-y-4">
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
        <div className="mt-6 p-2 rounded-md" style={{ backgroundColor: bgColor }}>
          <span
            className="font-mono font-bold text-sm"
            style={{ color: fontColor }}
          >
            {shift.site} {shift.startTime}-{shift.endTime}
          </span>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 text-sm font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 text-sm font-medium"
        >
          Save Colors
        </button>
      </div>
    </Modal>
  );
};

/**
 * Calendar Picker Modal
 */
const CalendarModal = ({ currentDate, onClose, onDateSelect }) => {
  const [displayDate, setDisplayDate] = useState(new Date(currentDate));

  const startOfMonth = new Date(
    displayDate.getFullYear(),
    displayDate.getMonth(),
    1
  );
  const endOfMonth = new Date(
    displayDate.getFullYear(),
    displayDate.getMonth() + 1,
    0
  );

  const startDay = startOfMonth.getDay();
  const totalDays = endOfMonth.getDate();

  const blanks = Array(startDay).fill(null);
  const daysInMonth = Array.from({ length: totalDays }, (_, i) => i + 1);

  const changeMonth = (delta) => {
    setDisplayDate(
      new Date(displayDate.getFullYear(), displayDate.getMonth() + delta, 1)
    );
  };

  const handleDayClick = (day) => {
    const selected = new Date(
      displayDate.getFullYear(),
      displayDate.getMonth(),
      day
    );
    onDateSelect(selected);
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 text-white hover:bg-gray-700 rounded-full"
          >
            <ArrowLeftIcon />
          </button>
          <h4 className="text-lg font-semibold text-white">
            {displayDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h4>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 text-white hover:bg-gray-700 rounded-full"
          >
            <ArrowRightIcon />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-400 mb-2">
          <span>S</span>
          <span>M</span>
          <span>T</span>
          <span>W</span>
          <span>T</span>
          <span>F</span>
          <span>S</span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {blanks.map((_, i) => (
            <div key={`blank-${i}`}></div>
          ))}
          {daysInMonth.map((day) => (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className="p-2 text-center text-white rounded-full hover:bg-blue-600"
            >
              {day}
            </button>
          ))}
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
    if (!firstName || !lastName || !accessCode) {
      setError("All fields are required.");
      return;
    }
    const result = await onSignUp(firstName, lastName, accessCode);
    if (result.success) {
      onClose();
    } else {
      setError(result.error);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h3 className="text-xl font-semibold text-white mb-4">Create Account</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">
            First Name
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full p-2 bg-black border border-gray-400 text-white rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Last Name
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full p-2 bg-black border border-gray-400 text-white rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Access Code
          </label>
          <input
            type="password"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            className="w-full p-2 bg-black border border-gray-400 text-white rounded-md text-sm"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 text-sm font-medium"
          >
            Sign Up
          </button>
        </div>
      </form>
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
  const comments = shift.comments || [];
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
      <h3 className="text-xl font-semibold text-white mb-4">
        Comments for {shift.site}
      </h3>
      <div className="space-y-4">
        <div className="max-h-64 overflow-y-auto space-y-3 bg-gray-900 p-3 rounded-md border border-gray-700">
          {comments.length > 0 &&
            comments.map((comment) => (
              <div key={comment.id} className="text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-400">
                    {comment.user}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(comment.date).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-200 whitespace-pre-wrap">
                  {comment.text}
                </p>
              </div>
            ))}
          <div ref={commentsEndRef} />
        </div>

        {hasAccess && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <textarea
              rows="3"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add your comment..."
              className="w-full p-2 bg-black border border-gray-400 text-white rounded-md text-sm"
            ></textarea>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 text-sm font-medium self-end"
            >
              Add Comment
            </button>
          </form>
        )}

        {!hasAccess && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 text-sm font-medium"
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
  const dayNotes = notes || [];
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
      <h3 className="text-xl font-semibold text-white mb-4">
        Notes for {formatDateHeader(day.date)}
      </h3>
      <div className="space-y-4">
        <div className="max-h-64 overflow-y-auto space-y-3 bg-gray-900 p-3 rounded-md border border-gray-700">
          {dayNotes.length > 0 &&
            dayNotes.map((note) => (
              <div key={note.id} className="text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-blue-400">
                    {note.user}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(note.date).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-200 whitespace-pre-wrap">
                  {note.text}
                </p>
              </div>
            ))}
          <div ref={notesEndRef} />
        </div>

        {hasAccess && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <textarea
              rows="3"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a new note..."
              className="w-full p-2 bg-black border border-gray-400 text-white rounded-md text-sm"
            ></textarea>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 text-sm font-medium self-end"
            >
              Add Note
            </button>
          </form>
        )}

        {!hasAccess && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 text-sm font-medium"
            >
              Close
            </button>
          </div>
        )}
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
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);
// New Note Icon
const NoteIcon = () => (
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
      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
    />
  </svg>
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

  const { user, userId, userInfo, hasAccess, initials, isAuthReady, signUp } =
    useUserAccess();

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
    // Wait for auth to be ready AND for a user to be signed in (even anon)
    if (!isAuthReady || !userId) {
      return;
    }
    if (!db) {
      console.error("Firestore is not initialized.");
      setFirebaseError(true);
      setLoading(false);
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
  }, [weekId, isAuthReady, userId, db, appId, collectionPath, weekDays]); // Added userId dependency

  // --- Firestore Update Functions ---

  /**
   * Helper to get the current state of the week document
   */
  const getWeekDoc = async () => {
    if (!db) return [];
    const weekDocRef = doc(db, collectionPath, weekId); // Modular syntax
    const docSnap = await getDoc(weekDocRef); // Modular syntax
    if (docSnap.exists()) {
      return docSnap.data().days;
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
    setCurrentDate((prev) => new Date(prev.setDate(prev.getDate() - 7)));
  };
  const goToNextWeek = () => {
    setCurrentDate((prev) => new Date(prev.setDate(prev.getDate() + 7)));
  };
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  const selectDate = (date) => {
    setCurrentDate(date);
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
    openModal(<SignUpModal onClose={closeModal} onSignUp={signUp} />);
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
      x: e.pageX,
      y: e.pageY,
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
      onClick={() => {
        setContextMenu({ visible: false });
        setPasteMenuState({ visible: false });
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
      />

      {/* Schedule Board */}
      <div className="overflow-x-auto pb-4">
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(7, minmax(25vw, 1fr))", // 4 days visible
          }}
        >
          {loading ? (
            <div className="text-white col-span-7 text-center p-10">
              Loading Week Data...
            </div>
          ) : (
            weekData.days.map((day) => {
              const hasNotes = day.notes && day.notes.length > 0;
              return (
                <div
                  key={day.date.toISOString()}
                  className="" // Removed border-r
                >
                  <DayColumn
                    day={day}
                    shifts={day.shifts}
                    onContextMenu={(e, shift) =>
                      handleContextMenu(e, day, shift)
                    }
                    onDoubleClick={(shift) => handleDoubleClick(day, shift)}
                  />
                  {/* Bottom controls: Add shift and Notes */}
                  <div className="p-2 flex items-center gap-2">
                    {hasAccess && (
                      <button
                        onClick={() => openAddShiftModal(day)}
                        onContextMenu={(e) => handlePasteMenu(e, day)} // Right-click to paste
                        className="flex-grow py-2 text-center text-gray-400 font-bold text-lg rounded-md hover:bg-white hover:text-black transition-colors duration-150"
                      >
                        +
                      </button>
                    )}
                    <button
                      onClick={() => openDayNotesModal(day, day.notes)}
                      className={`p-2 rounded-md hover:bg-gray-800 ${
                        hasNotes
                          ? "border border-orange-500"
                          : "border border-transparent"
                      }`}
                      aria-label="View Day Notes"
                    >
                      <NoteIcon />
                    </button>
                  </div>
                </div>
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

import { useEffect, useState } from "react";
import { X, Bell, AlertCircle } from "lucide-react";

type Reminder = {
  id: string;
  title: string;
  message: string;
  booking_id?: number;
  action_url?: string;
};

export default function ReminderNotificationPopup({
  reminder,
  onClose,
  onAction,
}: {
  reminder: Reminder | null;
  onClose: () => void;
  onAction?: (url?: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (reminder) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(), 300);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [reminder, onClose]);

  if (!reminder) return null;

  return (
    <div
      className={`fixed top-16 xs:top-20 right-2 xs:right-4 z-50 transition-all duration-300 transform ${
        isVisible
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-white rounded-lg border border-blue-200 p-3 xs:p-4 max-w-xs xs:max-w-sm w-[calc(100vw-1rem)] xs:w-full">
        <div className="flex items-start gap-2 xs:gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-8 xs:w-10 h-8 xs:h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Bell size={16} className="xs:w-5 xs:h-5 text-blue-600" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-xs xs:text-sm">{reminder.title}</h3>
            <p className="text-gray-600 text-xs xs:text-sm mt-0.5 xs:mt-1 line-clamp-2">{reminder.message}</p>

            {reminder.action_url && (
              <button
                onClick={() => {
                  setIsVisible(false);
                  onAction?.(reminder.action_url);
                }}
                className="mt-2 xs:mt-3 inline-block px-2 xs:px-3 py-1 xs:py-1.5 bg-blue-600 text-white text-[10px] xs:text-xs font-medium rounded hover:bg-blue-700 transition-colors"
              >
                Lihat Sesi
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={() => {
              setIsVisible(false);
              setTimeout(() => onClose(), 300);
            }}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} className="xs:w-5 xs:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

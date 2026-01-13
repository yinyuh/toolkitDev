import React, { useState, useEffect, useRef } from "react";
import { FaBell } from "react-icons/fa";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const containerRef = useRef(null);

  // Notificaciones
  const baseNotifications = [
    { id: 1, text: "新项目已发布 🚀", read: false },
    {
      id: 2,
      text: "你好！我想告诉你，我目前正在学习React Native移动开发",
      read: false,
    },
  ];

  // Obtener el id
  const lastBaseId =
    baseNotifications.length > 0
      ? baseNotifications[baseNotifications.length - 1].id
      : null;

  // Obtener el id del último elemento no leído
  const lastUnreadId =
    notifications.length > 0
      ? [...notifications].reverse().find((n) => !n.read)?.id
      : null;

  // Cargar desde localStorage y mezclar con base
  useEffect(() => {
    const saved = localStorage.getItem("notifications");
    let merged = baseNotifications;

    if (saved) {
      const savedArray = JSON.parse(saved);
      const savedMap = new Map(savedArray.map((n) => [n.id, n]));
      merged = baseNotifications.map((n) => savedMap.get(n.id) || n);
    }
    setNotifications(merged);
  }, []);

  // localStorage
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem("notifications", JSON.stringify(notifications));
    }
  }, [notifications]);

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);
  const unreadCount = unread.length;

  // Cerrar dropdown
  useEffect(() => {
    function handleDocClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleDocClick);
    return () => document.removeEventListener("click", handleDocClick);
  }, []);

  // Marca como leidas
  useEffect(() => {
    if (open && unreadCount > 0) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label="通知"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 hover:bg-theme-secondary"
      >
        <FaBell className="text-2xl text-theme-primary cursor-pointer" />
        {unreadCount > 0 && lastBaseId && (
          <span className="absolute top-0 right-0 inline-flex h-4 w-4 items-center justify-center rounded-full bg-theme-notification text-xs text-theme-primary">
            {lastBaseId}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-70 max-w-sm rounded-lg border-none bg-div-theme shadow-lg drop-shadow-[4px_4px_0_#7836cf]">
          <div className="p-3">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xm font-bold text-div-theme drop-shadow-[1px_1px_0_#7836cf]">
                通知
              </h4>
            </div>

            {read.length > 0 ? (
              <ul className="max-h-48 divide-y divide-theme-border overflow-auto">
                {read.map((n) => (
                  <li key={n.id} className="py-2 text-sm text-theme-secondary">
                    {n.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-theme-secondary">暂无通知。</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
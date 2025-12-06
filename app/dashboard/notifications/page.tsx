"use client";

import { Bell, MessageSquare, UserPlus, Archive } from "lucide-react";

export default function NotificationsPage() {
  // Mock notifications - replace with real data from your backend
  const notifications = [
    {
      id: 1,
      type: "message",
      title: "New message",
      description: "You have a new message from a friend",
      time: "5 minutes ago",
      read: false,
    },
    {
      id: 2,
      type: "friend",
      title: "Friend request",
      description: "Someone sent you a friend request",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      type: "archive",
      title: "Message archived",
      description: "A conversation was archived",
      time: "2 hours ago",
      read: true,
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="w-5 h-5" />;
      case "friend":
        return <UserPlus className="w-5 h-5" />;
      case "archive":
        return <Archive className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Notifications</h1>
      
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-[#26211c] border border-[#53473c] rounded-lg p-4 flex items-start gap-4 hover:bg-[#2d2520] transition-colors ${
              !notification.read ? "border-[#e67919]" : ""
            }`}
          >
            <div className="p-2 bg-[#3a322e] rounded-lg text-[#e67919]">
              {getIcon(notification.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-medium">{notification.title}</h3>
                  <p className="text-[#b8aa9d] text-sm mt-1">{notification.description}</p>
                </div>
                {!notification.read && (
                  <span className="w-2 h-2 bg-[#e67919] rounded-full"></span>
                )}
              </div>
              <span className="text-xs text-[#b8aa9d] mt-2 block">{notification.time}</span>
            </div>
          </div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="bg-[#26211c] border border-[#53473c] rounded-lg p-8 text-center">
          <Bell className="w-12 h-12 mx-auto text-[#b8aa9d] mb-4" />
          <p className="text-[#b8aa9d]">No notifications yet</p>
        </div>
      )}
    </div>
  );
}

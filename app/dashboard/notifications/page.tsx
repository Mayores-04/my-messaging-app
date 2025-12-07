"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Bell, Check, X, UserPlus } from "lucide-react";
import Image from "next/image";

export default function NotificationsPage() {
  const notifications = useQuery(api.notification.getNotificationsForCurrentUser);
  const pendingRequests = useQuery(api.friends.getPendingRequests);
  const acceptRequest = useMutation(api.friends.acceptFriendRequest);
  const rejectRequest = useMutation(api.friends.rejectFriendRequest);
  const markAsRead = useMutation(api.notification.markAsRead);

  const handleAccept = async (friendshipId: any) => {
    try {
      await acceptRequest({ friendshipId });
      alert("Friend request accepted!");
    } catch (error: any) {
      alert(error.message || "Failed to accept request");
    }
  };

  const handleReject = async (friendshipId: any) => {
    try {
      await rejectRequest({ friendshipId });
      alert("Friend request rejected");
    } catch (error: any) {
      alert(error.message || "Failed to reject request");
    }
  };

  return (
    <div className="max-w-7xl mx-auto  p-5">
      <h1 className="text-3xl font-bold text-white mb-6">Notifications</h1>

      {/* Friend Requests Section */}
      {pendingRequests && pendingRequests.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Friend Requests</h2>
          <div className="space-y-3">
            {pendingRequests.map((request: any) => (
              <div
                key={request._id}
                className="bg-[#26211c] border-2 border-[#e67919] rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[#53473c] flex items-center justify-center text-white font-semibold">
                    {request.senderAvatar ? (
                      <Image
                        src={request.senderAvatar}
                        alt={request.senderName}
                        width={48}
                        height={48}
                      />
                    ) : (
                      <span className="text-lg">{request.senderName[0]}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <UserPlus className="w-5 h-5 text-[#e67919] mt-1" />
                      <div>
                        <h3 className="text-white font-medium">{request.senderName}</h3>
                        <p className="text-[#b8aa9d] text-sm mt-1">
                          sent you a friend request
                        </p>
                        <span className="text-xs text-[#b8aa9d] mt-2 block">
                          {new Date(request.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(request._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#e67919] hover:bg-[#cf6213] text-white rounded-lg transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(request._id)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#53473c] hover:bg-[#3a322e] text-white rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Notifications Section */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">All Notifications</h2>
        <div className="space-y-3">
          {notifications === undefined ? (
            <div className="text-[#b8aa9d]">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="bg-[#26211c] border border-[#53473c] rounded-lg p-8 text-center">
              <Bell className="w-12 h-12 mx-auto text-[#b8aa9d] mb-4" />
              <p className="text-[#b8aa9d]">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notification: any) => (
              <div
                key={notification._id}
                className={`bg-[#26211c] border border-[#53473c] rounded-lg p-4 flex items-start gap-4 hover:bg-[#2d2520] transition-colors ${
                  !notification.read ? "border-[#e67919]" : ""
                }`}
                onClick={() => !notification.read && markAsRead({ notificationId: notification._id })}
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#53473c] flex items-center justify-center text-white font-semibold">
                  {notification.senderAvatar ? (
                    <Image
                      src={notification.senderAvatar}
                      alt={notification.senderName}
                      width={40}
                      height={40}
                    />
                  ) : (
                    <span className="text-sm">{notification.senderName[0]}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-white font-medium">{notification.senderName}</h3>
                      <p className="text-[#b8aa9d] text-sm mt-1">{notification.message}</p>
                    </div>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-[#e67919] rounded-full"></span>
                    )}
                  </div>
                  <span className="text-xs text-[#b8aa9d] mt-2 block">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

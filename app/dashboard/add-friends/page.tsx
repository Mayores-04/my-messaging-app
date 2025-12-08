"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Search, UserPlus, Check } from "lucide-react";
import Image from "next/image";

export default function AddFriendsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [addedFriends, setAddedFriends] = useState<Set<string>>(new Set());
  
  const searchResults = useQuery(
    api.users.searchUsers,
    { searchTerm }
  );
  const sendFriendRequest = useMutation(api.friends.sendFriendRequest);
  const storeUser = useMutation(api.users.storeUser);
  const currentFriends = useQuery(api.friends.getFriendsForCurrentUser);
  const pendingRequests = useQuery(api.friends.getPendingRequests);
  
  // Get sent requests (where current user is the sender)
  const sentRequests = useQuery(api.friends.getSentRequests);

  // Store current user in database on mount
  useEffect(() => {
    console.log("AddFriends page mounted, storing user...");
    storeUser()
      .then((id) => console.log("User stored successfully with ID:", id))
      .catch((err) => console.error("Failed to store user:", err));
  }, [storeUser]);

  const handleSendRequest = async (email: string) => {
    try {
      await sendFriendRequest({ friendEmail: email });
      setAddedFriends(new Set([...addedFriends, email]));
      alert("Friend request sent!");
    } catch (error: any) {
      alert(error.message || "Failed to send friend request");
    }
  };

  const getFriendshipStatus = (email: string) => {
    // Check if already friends
    if (currentFriends?.some((f: any) => f.email === email)) {
      return 'friends';
    }
    // Check if request was sent (from database)
    if (sentRequests?.some((req: any) => req.receiverEmail === email)) {
      return 'pending';
    }
    // Check if request was just sent (local state)
    if (addedFriends.has(email)) {
      return 'pending';
    }
    return 'none';
  };

  return (
    <div className="max-w-4xl mx-auto p-5">
      <h1 className="text-3xl font-bold text-white mb-6">Add Friends</h1>

      <div className="bg-[#26211c] border border-[#53473c] rounded-lg p-6">
        <div className="mb-6">
          <label className="block text-white font-medium mb-2">
            Search for users
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#b8aa9d]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#211811] text-white placeholder-[#b8aa9d] rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e67919]"
            />
          </div>
        </div>

        <div className="space-y-3">
          {searchResults === undefined && (
            <div className="text-[#b8aa9d] text-center py-8">Loading users...</div>
          )}

          {searchResults?.length === 0 && (
            <div className="text-[#b8aa9d] text-center py-8">
              {searchTerm.length >= 2 
                ? `No users found matching "${searchTerm}"`
                : "No other users found"}
            </div>
          )}

          {searchResults?.map((user: any) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-4 bg-[#211811] rounded-lg border border-[#53473c] hover:border-[#e67919] transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#53473c] flex items-center justify-center text-white font-semibold shrink-0">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.fullName ?? "user"}
                      width={48}
                      height={48}
                    />
                  ) : (
                    <span className="text-sm">
                      {(user.firstName || user.fullName || "?")[0]}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">
                    {user.fullName || user.firstName || "Unknown"}
                  </p>
                  <p className="text-[#b8aa9d] text-sm truncate">{user.email}</p>
                </div>
              </div>

              {(() => {
                const status = getFriendshipStatus(user.email);
                if (status === 'friends') {
                  return (
                    <button
                      disabled
                      className="flex items-center gap-2 px-4 py-2 bg-[#53473c] text-[#b8aa9d] rounded-lg cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" />
                      Friends
                    </button>
                  );
                } else if (status === 'pending') {
                  return (
                    <button
                      disabled
                      className="flex items-center gap-2 px-4 py-2 bg-[#53473c] text-[#b8aa9d] rounded-lg cursor-not-allowed"
                    >
                      <Check className="w-4 h-4" />
                      Pending
                    </button>
                  );
                } else {
                  return (
                    <button
                      onClick={() => handleSendRequest(user.email)}
                      className="flex items-center gap-2 px-4 py-2 bg-[#e67919] hover:bg-[#cf6213] text-white rounded-lg transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      Send Request
                    </button>
                  );
                }
              })()}
            </div>
          ))}
        </div>
      </div>

      {currentFriends && currentFriends.length > 0 && (
        <div className="mt-8 bg-[#26211c] border border-[#53473c] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Your Friends ({currentFriends.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {currentFriends.map((friend: any) => (
              <div
                key={friend._id}
                className="flex items-center gap-2 p-3 bg-[#211811] rounded-lg border border-[#53473c]"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#53473c] flex items-center justify-center text-white font-semibold">
                  {friend.avatarUrl ? (
                    <Image
                      src={friend.avatarUrl}
                      alt={friend.fullName ?? "user"}
                      width={40}
                      height={40}
                    />
                  ) : (
                    <span className="text-xs">
                      {(friend.firstName || friend.fullName || "?")[0]}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {friend.fullName || friend.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

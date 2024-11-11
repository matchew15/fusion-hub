import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/lib/socket";
import useSWR from "swr";
import type { Chat, User } from "db/schema";
import { useUser } from "@/hooks/use-user";

interface ChatWindowProps {
  userId: number;
}

export default function ChatWindow({ userId }: ChatWindowProps) {
  const { user } = useUser();
  const [message, setMessage] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { data: messages, mutate } = useSWR<Chat[]>(`/api/chats/${userId}`);
  const { data: otherUser } = useSWR<User>(`/api/users/${userId}`);

  useSocket("chat", (data) => {
    if (data.senderId === userId || data.receiverId === userId) {
      mutate();
    }
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: userId,
          message: message.trim(),
        }),
      });

      if (response.ok) {
        setMessage("");
        mutate();
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-primary/20 pb-4 mb-4">
        <h2 className="text-xl font-bold">
          Chat with {otherUser?.username || "Loading..."}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages?.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.senderId === user?.id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.senderId === user?.id
                  ? "bg-primary/20 text-primary"
                  : "bg-secondary"
              }`}
            >
              {msg.message}
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <form onSubmit={sendMessage} className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="cyber-panel"
        />
        <Button type="submit" className="neon-border">
          Send
        </Button>
      </form>
    </div>
  );
}

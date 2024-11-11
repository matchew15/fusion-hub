import { useState } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/card";
import ChatWindow from "@/components/chat/ChatWindow";
import { useUser } from "@/hooks/use-user";
import type { User } from "db/schema";

export default function Chat() {
  const { user } = useUser();
  const { data: users } = useSWR<User[]>("/api/users");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  if (!user) {
    return (
      <Card className="cyber-panel p-6 text-center">
        <p>Please login to use the chat feature</p>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-[300px,1fr] gap-6 h-[calc(100vh-12rem)]">
      <Card className="cyber-panel p-4">
        <h2 className="text-xl font-bold mb-4">Contacts</h2>
        <div className="space-y-2">
          {users?.filter(u => u.id !== user.id).map((contact) => (
            <button
              key={contact.id}
              onClick={() => setSelectedUserId(contact.id)}
              className={`w-full p-3 text-left rounded-lg transition-colors ${
                selectedUserId === contact.id
                  ? "bg-primary/20 text-primary"
                  : "hover:bg-primary/10"
              }`}
            >
              {contact.username}
            </button>
          ))}
        </div>
      </Card>

      <Card className="cyber-panel p-4">
        {selectedUserId ? (
          <ChatWindow userId={selectedUserId} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select a contact to start chatting
          </div>
        )}
      </Card>
    </div>
  );
}

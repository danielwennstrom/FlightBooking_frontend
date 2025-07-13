import { useEffect, useState } from "react";
import "./App.css";
import type { Message } from "./types/Message";
import api from "./services/api";

function App() {
  const [conversationId, setConversationId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const sendWelcomeMessage = async () => {
      if (loading) return;

      setLoading(true);

      try {
        const response = await api.post("welcome");
        const welcomeData: Message = response.data;
        setConversationId("3fab5a9a-150d-4e8b-93fa-03b6a80054a1");
        // setConversationId(welcomeData.id);
        welcomeData.isTyping = true;
        setMessages((prevMessages) => [...prevMessages, welcomeData]);
      } catch (error) {
        console.error("Error sending welcome message:", error);
      } finally {
        setLoading(false);
      }
    };

    sendWelcomeMessage();
  }, [loading]);

  return (
    <>
      <div className="sm:w-10/12 lg:w-6/12 mx-auto py-7 flex-1 flex flex-col">
        <div className="flex-1 flex flex-col bg-white rounded-2xl p-4">
          <div className="flex-1 flex flex-col-reverse justify-end space-y-reverse space-y-4 overflow-y-auto">
            {loading && messages.length === 0 ? (
              <div className="flex flex-col items-center my-auto">
                <div className="mr-3 size-20 border-4 border-gray-200 border-t-brand-primary rounded-full animate-spin" />
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={index}
                  className={`bg-${
                    message.sender ? "bubble-user" : "bubble-bot"
                  } text-brand-primary p-3 rounded max-w-xs ${
                    message.sender ? "self-start" : "self-end"
                  }`}
                >
                  {message.isTyping ? (
                    <div className="flex flex-col">
                      <div className="mx-auto size-8 border-4 border-brand-secondary border-t-brand-primary rounded-full animate-spin" />
                    </div>
                  ) : (
                    <>{message.content}</>
                  )}
                </div>
              ))
            )}

            {/* <div className="bg-bubble-bot text-brand-primary p-3 rounded max-w-xs">
              Latest message (always at bottom)
            </div>
            <div className="bg-gray-700 text-white p-3 rounded max-w-xs">
              Bot response
            </div>
            <div className="bg-bubble-user text-brand-primary p-3 rounded max-w-xs self-end">
              User message
            </div>
            <div className="bg-gray-700 text-white p-3 rounded max-w-xs">
              Old message 1
            </div> */}
          </div>

          <div className="pt-4">
            <input
              type="text"
              placeholder="Type your message..."
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default App;

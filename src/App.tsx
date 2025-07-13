import { useEffect, useRef, useState } from "react";
import "./App.css";
import type { Message } from "./types/Message";
import api from "./services/api";
import { Sender } from "./types/Sender";

const exampleTools: string[] = [
  "Book a flight",
  "Cancel my flight",
  "Check my bookings",
];

function App() {
  const [conversationId, setConversationId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sendWelcomeMessage = async () => {
      if (loading) return;

      setLoading(true);

      try {
        const response = await api.post("welcome");
        const welcomeData: Message = response.data;
        setConversationId(welcomeData.id);
        setMessages((prevMessages) => [...prevMessages, welcomeData]);
      } catch (error) {
        console.error("Error sending welcome message:", error);
      } finally {
        setLoading(false);
      }
    };

    sendWelcomeMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createMessage = (content: string, sender: Sender): Message => ({
    id: conversationId,
    content,
    sender,
    isTyping: content === "" ? true : false,
  });

  const sendUserMessage = async (message: string) => {
    if (loading) return;

    setLoading(true);

    try {
      setMessages((prevMessages) => [
        ...prevMessages,
        createMessage(message, Sender.USER),
      ]);
      // temporary message for a typing indicator
      setMessages((prevMessages) => [
        ...prevMessages,
        createMessage("", Sender.BOT),
      ]);

      const response = await api.post("flights/chat", {
        id: conversationId,
        content: message,
      });
      const botMessage: Message = response.data;

      // once we get the actual response, remove typing indicator message from Message array
      setMessages((prevMessages) =>
        prevMessages
          .slice(0, -1)
          .concat([createMessage(botMessage.content, botMessage.sender)])
      );
    } catch (error) {
      console.error("Error sending user message:", error);
      // something went wrong, remove indicator
      setMessages((prevMessages) => prevMessages.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="xl:w-6/12 w-8/12 mx-auto py-7 flex-1 flex flex-col">
        <div className="flex-1 flex flex-col bg-white rounded-2xl p-4">
          <div
            className={`flex-1 flex ${
              messages.length > 1
                ? "flex-col"
                : "flex-col-reverse justify-end space-y-reverse"
            } space-y-4 overflow-y-auto`}
          >
            {loading && messages.length === 0 ? (
              <div className="flex flex-col items-center my-auto">
                <div className="mr-3 size-20 border-4 border-gray-200 border-t-brand-primary rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`bg-${
                      message.sender === Sender.USER
                        ? "bubble-user"
                        : "bubble-bot"
                    } text-brand-primary p-3 rounded max-w-xs
                    ${
                      message.sender === Sender.USER ? "self-end" : "self-start"
                    }
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
                ))}

                <div ref={messagesEndRef} />

                {messages.filter((message) => message.sender === Sender.USER)
                  .length === 0 && (
                  <div className="flex flex-col xl:flex-row xl:space-y-0 space-y-4 space-x-4">
                    {exampleTools.map((tool, index) => (
                      <button
                        key={index}
                        type="button"
                        className="w-full xl:w-max rounded-sm bg-brand-secondary hover:bg-brand-primary px-3 py-2 text-sm font-semibold text-white cursor-pointer"
                        onClick={() => sendUserMessage(tool)}
                      >
                        {tool}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="pt-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendUserMessage(inputValue);
                setInputValue("");
              }}
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="w-full p-2 border border-accent-secondary rounded focus:outline-accent-primary"
              />
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default App;

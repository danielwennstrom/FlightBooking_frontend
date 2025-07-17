import { useEffect, useRef, useState } from "react";
import "./App.css";
import type { Message } from "./types/Message";
import api from "./services/api";
import { Sender } from "./types/Sender";
import type { ToolResponse } from "./types/ToolResponse";
import DateRangePicker from "./components/DateRangePicker/DateRangePicker";
import type { DateRange } from "./types/DateRange";
import type { ToolResponseUpdate } from "./types/ToolResponseUpdate";
import DestinationPicker from "./components/DestinationPicker/DestinationPicker";
import type { Airport } from "./types/Airport";

const examplePrompts: string[] = [
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
  const [userToolResponseMessage, setUserToolResponseMessage] =
    useState<Message>();
  const [airportSource, setAirportSource] = useState<Airport | null>(null);
  const [airportDestination, setAirportDestination] = useState<Airport | null>(
    null
  );

  const useToolResponseHandler = () => {
    const submitCompletedToolResponse = async (toolResponse: ToolResponse) => {
      if (!toolResponse.isCompleted || !toolResponse.message) return;

      try {
        const toolResps: ToolResponse[] = [toolResponse];
        const userMessage = createMessage(
          toolResponse.message,
          Sender.USER,
          toolResps
        );

        sendUserMessage(userMessage);
        setUserToolResponseMessage(undefined);
      } catch (error) {
        console.error("Error submitting tool response:", error);
      }
    };

    return { submitCompletedToolResponse };
  };

  const { submitCompletedToolResponse } = useToolResponseHandler();

  useEffect(() => {
    if (userToolResponseMessage?.toolResponses) {
      const completedTool = userToolResponseMessage.toolResponses.find(
        (tool) => tool.isCompleted
      );

      if (completedTool) {
        submitCompletedToolResponse(completedTool);
      }
    }
  }, [userToolResponseMessage, submitCompletedToolResponse]);

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

  const formatDateMessage = (range: DateRange): string => {
    if (range.startDate && range.endDate) {
      return `I am departing on ${range.startDate.toDateString()} and returning on ${range.endDate.toDateString()}.`;
    } else if (range.startDate) {
      return `I am departing on ${range.startDate.toDateString()}.`;
    }
    return "";
  };

  const createMessage = (
    content: string,
    sender: Sender,
    toolResps?: ToolResponse[]
  ): Message => ({
    id: conversationId,
    content,
    sender,
    isTyping: content === "" && sender === Sender.BOT,
    toolResponses: toolResps || [],
  });

  const initializeToolResponses = (
    toolResponses: ToolResponse[]
  ): ToolResponse[] => {
    return toolResponses.map((tool) => ({
      ...tool,
      isCompleted: false,
      message: "",
    }));
  };

  const sendUserMessage = async (userMessage: Message) => {
    if (loading || userMessage.content === "") return;

    setLoading(true);

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    console.log(userMessage);

    // temporary message for a typing indicator
    const typingMessage = createMessage("", Sender.BOT);
    setMessages((prevMessages) => [...prevMessages, typingMessage]);

    try {
      const response = await api.post("flights/chat", {
        id: conversationId,
        content: userMessage.content,
      });

      const botMessage: Message = response.data;

      // replace typing indicator message from Message array
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        createMessage(
          botMessage.content,
          botMessage.sender,
          botMessage.toolResponses
        ),
      ]);

      // if there are any tool responses needed from the bot, create a user tool response message
      if ( botMessage.toolResponses !== undefined && botMessage.toolResponses?.length > 0) {
        const initializedToolResponses = initializeToolResponses(
          botMessage.toolResponses
        );
        setUserToolResponseMessage(
          createMessage("", Sender.USER, initializedToolResponses)
        );
      }
    } catch (error) {
      console.error("Error sending user message:", error);
      // remove typing indicator on error
      setMessages((prevMessages) => prevMessages.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  function updateToolResponses(
    toolResponses: ToolResponse[] | undefined,
    update: ToolResponseUpdate
  ): ToolResponse[] | undefined {
    if (!toolResponses) return toolResponses;

    const updated = [...toolResponses];
    const currentTool = updated[update.toolIndex];

    if (!currentTool) return toolResponses;

    updated[update.toolIndex] = {
      ...currentTool,
      isCompleted: update.isCompleted,
      message: update.message,
      ...(update.data && { data: update.data }),
    };

    return updated;
  }

  // updates the user's message state but also the overall messages state for rendering purposes
  const updateToolResponse = (update: ToolResponseUpdate) => {
    const updatedMessages = [...messages];
    const lastIndex = updatedMessages.length - 1;

    if (lastIndex >= 0) {
      const botMessage = updatedMessages[lastIndex];

      updatedMessages[lastIndex] = {
        ...botMessage,
        toolResponses: updateToolResponses(botMessage.toolResponses, update),
      };
    }

    setMessages(updatedMessages);
    setUserToolResponseMessage((prevMessage) => {
      if (!prevMessage?.toolResponses) return prevMessage;

      return {
        ...prevMessage,
        toolResponses: updateToolResponses(prevMessage.toolResponses, update),
      };
    });
  };

  const handleToolCompletion = (
    toolIndex: number,
    message: string,
    data?: unknown
  ) => {
    updateToolResponse({
      toolIndex,
      isCompleted: true,
      message,
      data,
    });
  };

  const handleDateSelect = (range: DateRange, toolIndex: number) => {
    const isCompleted = Boolean(range.startDate && range.endDate);
    const message = formatDateMessage(range);

    updateToolResponse({
      toolIndex,
      isCompleted,
      message,
      data: range,
    });
  };

  const handleAirportSource = (airport: Airport | null) => {
    if (airport === null) return;
    setAirportSource(airport);
  };

  const handleAirportDestination = (airport: Airport | null) => {
    setAirportDestination(airport);
  };

  const handleAirportsSelect = (toolIndex: number) => {
    if (!airportSource) return;

    const message = formatDestinationMessage(airportSource, airportDestination);

    handleToolCompletion(toolIndex, message, null);
  };

  const formatDestinationMessage = (
    airportSource: Airport,
    airportDestination: Airport | null
  ): string => {
    if (airportSource && airportDestination) {
      return `I am departing from ${airportSource.iataCode} and flying to ${airportDestination.iataCode}.`;
    } else if (airportSource) {
      return `I am departing from ${airportSource.iataCode}.`;
    }

    return "";
  };

  return (
    <>
      <div className="xl:w-6/12 md:w-8/12 w-10/12 mx-auto py-7 flex-1 flex flex-col">
        <div className="flex flex-1 flex-col bg-background rounded-2xl p-4 shadow-sm">
          <div
            className={`flex flex-1 ${
              messages.length > 1
                ? "flex-col"
                : "flex-col-reverse justify-end space-y-reverse"
            } space-y-4 overflow-y-auto`}
          >
            {loading && messages.length === 0 ? (
              <div className="flex flex-col items-center my-auto">
                <div className="mr-3 size-20 border-4 border-brand-secondary border-t-brand-primary rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {messages.map((message, index) => (
                  <div className="w-full flex flex-col">
                    <div
                      key={index}
                      className={`${
                        message.sender === Sender.USER
                          ? "bg-user-bubble text-user-text"
                          : "bg-bot-bubble text-bot-text"
                      } p-3 rounded max-w-xs shadow-sm
                    ${
                      message.sender === Sender.USER ? "self-end" : "self-start"
                    }
                    `}
                    >
                      {message.isTyping ? (
                        <div className="flex flex-col">
                          <div className="mx-auto size-8 border-4 border-brand-secondary border-t-brand-primary rounded-full animate-spin" />
                        </div>
                      ) : (
                        <>
                          <div className="flex flex-col">
                            {message.content}

                            {message?.toolResponses?.map((tool, toolIndex) => (
                              <div
                                key={toolIndex}
                                className="flex flex-col animate-grow"
                              >
                                {tool.type === "DATE_PICKER" &&
                                  !tool.isCompleted && (
                                    <DateRangePicker
                                      toolIndex={toolIndex}
                                      onDateSelect={handleDateSelect}
                                    />
                                  )}
                                {tool.type === "DESTINATION_PICKER" &&
                                  !tool.isCompleted && (
                                    <div className="mt-4">
                                      <DestinationPicker
                                        subtitle="Departure from..."
                                        onSelect={handleAirportSource}
                                      />
                                      <DestinationPicker
                                        subtitle="To..."
                                        onSelect={handleAirportDestination}
                                      />
                                      {airportSource && (
                                        <div className="flex flex-col">
                                          <button
                                            type="button"
                                            className="w-full xl:w-max rounded-sm bg-button-secondary hover:bg-button-secondary-hover px-3 py-2 text-sm font-semibold text-white cursor-pointer self-end"
                                            onClick={() =>
                                              handleAirportsSelect(toolIndex)
                                            }
                                          >
                                            Confirm
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                <div ref={messagesEndRef} />

                {!loading &&
                  messages.filter((message) => message.sender === Sender.USER)
                    .length === 0 && (
                    <div className="flex flex-col sm:flex-row sm:space-y-0 space-y-4 space-x-4">
                      {examplePrompts.map((prompt, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full xl:w-max rounded-sm bg-button-secondary hover:bg-button-secondary-hover px-3 py-2 text-sm font-semibold text-white cursor-pointer"
                          onClick={() =>
                            sendUserMessage(createMessage(prompt, Sender.USER))
                          }
                        >
                          {prompt}
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
                sendUserMessage(createMessage(inputValue, Sender.USER));
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

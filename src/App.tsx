import { useCallback, useEffect, useRef, useState } from "react";
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
import FlightPicker from "./components/FlightPicker/FlightPicker";
import type { Flight } from "./types/GoogleFlightsData/Flight";
import type { FlightInfo } from "./types/FlightInfo";
import type { GoogleFlightResponse } from "./types/GoogleFlightsData/GoogleFlightsResponse";
import type { Itineraries } from "./types/GoogleFlightsData/Itineraries";
import LoadingIndicator from "./components/LoadingIndicator";

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
  const [flightInfo, setFlightInfo] = useState<FlightInfo | null>();
  const [airportSource, setAirportSource] = useState<Airport | null>(null);
  const [airportDestination, setAirportDestination] = useState<Airport | null>(
    null
  );
  const [departureFlightItineraries, setDepartureFlightItineraries] =
    useState<Itineraries>([]);
  const [returnFlightList, setReturnFlightList] = useState<Flight[]>([]);
  const [departureFlight, setDepartureFlight] = useState<Flight | null>(null);
  const [returnFlight, setReturnFlight] = useState<Flight | null>(null);

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
    toolResps?: ToolResponse[],
    fullWidth?: boolean,
    flightInfo?: FlightInfo
  ): Message => ({
    id: conversationId,
    content,
    sender,
    isTyping: content === "" && sender === Sender.BOT,
    toolResponses: toolResps || [],
    fullWidth,
    flightInfo,
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

    // mark all previous incomplete tool responses as completed when user interrupts
    setMessages((prevMessages) =>
      prevMessages.map((msg) => ({
        ...msg,
        toolResponses: msg.toolResponses?.map((tool) => ({
          ...tool,
          isCompleted: true,
        })),
      }))
    );

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    console.log(userMessage);

    // temporary message for a loading indicator
    const typingMessage = createMessage("", Sender.BOT);
    setMessages((prevMessages) => [...prevMessages, typingMessage]);

    try {
      const response = await api.post("/chat", {
        id: conversationId,
        content: userMessage.content,
      });

      const botMessage: Message = response.data;

      // replace loading indicator message from Message array
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        createMessage(
          botMessage.content,
          botMessage.sender,
          botMessage.toolResponses,
          botMessage.fullWidth
        ),
      ]);

      console.log(messages);

      // set flight info based on the current parsed flight info from the bot message
      const botFlightData = botMessage.flightInfo;
      console.log(botFlightData);
      if (botFlightData) safeSetFlightInfo(botFlightData);

      // if there are any tool responses needed from the bot, create a user tool response message
      if (
        botMessage.toolResponses !== undefined &&
        botMessage.toolResponses?.length > 0
      ) {
        const initializedToolResponses = initializeToolResponses(
          botMessage.toolResponses
        );
        setUserToolResponseMessage(
          createMessage("", Sender.USER, initializedToolResponses)
        );

        if (
          botMessage.toolResponses.some(
            (toolResponse) => toolResponse.type == "FLIGHT_PICKER"
          )
        ) {
          setLoading(true);
          try {
            if (botFlightData) {
              const departureItineraries = await getDepartureFlightList(
                botFlightData
              );

              if (departureItineraries) {
                setDepartureFlightItineraries(departureItineraries);
                setLoading(false);
              }
            }
          } catch (error) {
            console.error("Error fetching itineraries:", error);
            // remove loading indicator on error
          }
        }
      }
    } catch (error) {
      console.error("Error sending user message:", error);
      // remove loading indicator on error
      setMessages((prevMessages) => prevMessages.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const safeSetFlightInfo = (updates: Partial<FlightInfo>) => {
    setFlightInfo((prev) => {
      const baseFlightInfo = prev || {
        departure: "",
        destination: "",
        departureDate: "",
        returnDate: "",
        passengers: 1,
        cabinClass: "",
        isRoundTrip: false,
        departureFlight: undefined,
        returnFlight: undefined,
      };

      return {
        ...baseFlightInfo,
        ...updates,
      };
    });
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
  const updateToolResponse = useCallback((update: ToolResponseUpdate) => {
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages];
      const lastIndex = updatedMessages.length - 1;

      if (lastIndex >= 0) {
        const botMessage = updatedMessages[lastIndex];
        updatedMessages[lastIndex] = {
          ...botMessage,
          toolResponses: updateToolResponses(botMessage.toolResponses, update),
        };
      }

      return updatedMessages;
    });

    setUserToolResponseMessage((prevMessage) => {
      if (!prevMessage?.toolResponses) return prevMessage;

      return {
        ...prevMessage,
        toolResponses: updateToolResponses(prevMessage.toolResponses, update),
      };
    });
  }, []);

  const handleToolCompletion = useCallback(
    (toolIndex: number, message: string, data?: unknown) => {
      updateToolResponse({
        toolIndex,
        isCompleted: true,
        message,
        data,
      });
    },
    [updateToolResponse]
  );

  const handleDateSelect = (range: DateRange, toolIndex: number) => {
    const message = formatDateMessage(range);
    handleToolCompletion(toolIndex, message, null);
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

  const getDepartureFlightList = async (botFlightData: FlightInfo) => {
    console.log(typeof botFlightData);
    if (!botFlightData) {
      console.error("FlightInfo is null or undefined");
      return;
    }
    try {
      console.log(botFlightData);
      const response = await api.post("flights/search", botFlightData);
      const data: Itineraries = response.data;
      console.log(data);
      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleDepartureFlight = (flight: Flight) => {
    if (!flight) return;
    safeSetFlightInfo({ departureFlight: flight });
  };

  const handleReturnFlight = (flight: Flight) => {
    if (!flight) return;
    console.log("Return flight selected:", flight);
    safeSetFlightInfo({ returnFlight: flight });
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

  useEffect(() => {
    const formatFlightsMessage = () => {
      if (
        flightInfo?.isRoundTrip &&
        flightInfo?.departureFlight &&
        flightInfo?.returnFlight
      ) {
        return `I want flight ${flightInfo.departureFlight.flights[0].flightNumber} for departure and flight ${flightInfo.returnFlight.flights[0].flightNumber} for return.`;
      } else if (!flightInfo?.isRoundTrip && flightInfo?.departureFlight) {
        return `I want flight ${flightInfo.departureFlight.flights[0].flightNumber} for my departure flight.`;
      }
      return "";
    };

    const isDepartureSelected = !!flightInfo?.departureFlight;
    const isReturnSelected = !!flightInfo?.returnFlight;
    const isRoundTrip = flightInfo?.isRoundTrip;

    const isComplete =
      (isDepartureSelected && !isRoundTrip) ||
      (isDepartureSelected && isReturnSelected && isRoundTrip);

    if (isComplete && userToolResponseMessage?.toolResponses) {
      const toolIndex = userToolResponseMessage.toolResponses.findIndex(
        (tool) => !tool.isCompleted && tool.type === "FLIGHT_PICKER"
      );

      if (toolIndex !== -1) {
        const message = formatFlightsMessage();
        handleToolCompletion(toolIndex, message, flightInfo);
      }
    }
  }, [flightInfo, userToolResponseMessage, handleToolCompletion]);

  return (
    <>
      <div className="xl:w-6/12 w-10/12 mx-auto py-7 flex-1 flex flex-col">
        <div className="flex flex-1 flex-col bg-background rounded-2xl p-4 shadow-sm">
          <div
            className={`flex flex-1 ${
              messages.length > 1
                ? "flex-col"
                : "flex-col-reverse justify-end space-y-reverse"
            } space-y-4`}
          >
            {loading && messages.length === 0 ? (
              <LoadingIndicator />
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
                      } px-3 rounded shadow-md ${
                        message.fullWidth ? "w-full" : "max-w-xs"
                      }
                    ${
                      message.sender === Sender.USER ? "self-end" : "self-start"
                    }
                    `}
                    >
                      {message.isTyping ? (
                        <LoadingIndicator />
                      ) : (
                        <>
                          <div className="flex flex-col py-4 px-2">
                            <div className="whitespace-pre-wrap">
                              {message.content}
                            </div>
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
                                {tool.type === "FLIGHT_PICKER" &&
                                  !tool.isCompleted && (
                                    <>
                                      {loading ||
                                      !departureFlightItineraries ? (
                                        <LoadingIndicator />
                                      ) : (
                                        <>
                                          <FlightPicker
                                            flightInfo={flightInfo}
                                            headerTitle="Top flights"
                                            flightList={
                                              departureFlightItineraries.topFlights
                                            }
                                            onSelectDeparture={
                                              handleDepartureFlight
                                            }
                                          />
                                          <FlightPicker
                                            flightInfo={flightInfo}
                                            headerTitle="Other flights"
                                            flightList={
                                              departureFlightItineraries.otherFlights
                                            }
                                            onSelectDeparture={
                                              handleDepartureFlight
                                            }
                                          />
                                        </>
                                      )}
                                    </>
                                  )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {!userToolResponseMessage && <div ref={messagesEndRef} />}

                {!loading &&
                  messages.filter((message) => message.sender === Sender.USER)
                    .length === 0 && (
                    <div className="flex flex-col sm:flex-row sm:space-y-0 space-y-4 space-x-4 px-4">
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

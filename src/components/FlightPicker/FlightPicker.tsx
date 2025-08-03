import { useEffect, useRef, useState } from "react";
import type { FlightInfo } from "../../types/FlightInfo";
import type { Flight } from "../../types/GoogleFlightsData/Flight";
import { format, isValid, parse, parseISO } from "date-fns";
import type { FlightSegment } from "../../types/GoogleFlightsData/FlightSegment";
import type { Layover } from "../../types/GoogleFlightsData/Layover";
import { ChevronDownIcon } from "@heroicons/react/16/solid";
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Transition,
} from "@headlessui/react";

type Props = {
  flightInfo: FlightInfo | null | undefined;
  flightList: Flight[];
  isOtherFlights?: boolean;
  isReturn?: boolean;
  headerTitle: string;
  onSelectDeparture?: (flight: Flight) => void;
  onSelectReturn?: (flight: Flight) => void;
};

const FlightPicker = ({
  flightInfo,
  flightList,
  headerTitle,
  isOtherFlights,
  isReturn,
  onSelectDeparture,
  onSelectReturn,
}: Props) => {
  const scrollToRef = useRef<HTMLDivElement>();

  const breakpoints = {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  };

  function useBreakpoint() {
    const [breakpoint, setBreakpoint] = useState("");

    useEffect(() => {
      const updateBreakpoint = () => {
        if (window.matchMedia(`(min-width: ${breakpoints["2xl"]})`).matches) {
          setBreakpoint("2xl");
        } else if (
          window.matchMedia(`(min-width: ${breakpoints.xl})`).matches
        ) {
          setBreakpoint("xl");
        } else if (
          window.matchMedia(`(min-width: ${breakpoints.lg})`).matches
        ) {
          setBreakpoint("lg");
        } else if (
          window.matchMedia(`(min-width: ${breakpoints.md})`).matches
        ) {
          setBreakpoint("md");
        } else if (
          window.matchMedia(`(min-width: ${breakpoints.sm})`).matches
        ) {
          setBreakpoint("sm");
        } else {
          setBreakpoint("xs");
        }
      };

      updateBreakpoint();

      const mediaQueries = Object.entries(breakpoints).map(([key, value]) => {
        const mq = window.matchMedia(`(min-width: ${value})`);
        mq.addEventListener("change", updateBreakpoint);
        return mq;
      });

      return () => {
        mediaQueries.forEach((mq) =>
          mq.removeEventListener("change", updateBreakpoint)
        );
      };
    }, []);

    return breakpoint;
  }

  const currentBreakpoint = useBreakpoint();
  const isMobile =
    currentBreakpoint === "xs" ||
    currentBreakpoint === "sm" ||
    currentBreakpoint === "md";
  const isDesktop =
    currentBreakpoint === "lg" ||
    currentBreakpoint === "xl" ||
    currentBreakpoint === "2xl";

  const FORMATS = [
    "dd-MM-yyyy hh:mm a", // e.g. 22-07-2025 08:47 PM
    "yyyy-M-d HH:mm", // e.g. 2025-7-22 20:47
    "dd-MM-yyyy HH:mm", // e.g. 22-07-2025 20:47 (24h format)
    "yyyy-MM-dd'T'HH:mm:ss", // e.g. 2025-07-22T20:47:00
    "yyyy-MM-dd'T'HH:mm", // e.g. 2025-07-22T20:47
  ];

  function parseDate(dateStr: string): Date {
    const cleanedStr = dateStr
      .trim()
      .replace(/(\d{4}-\d{1,2}-\d{1,2})(\d{1,2}:\d{2})/, "$1 $2");

    const isoDate = parseISO(cleanedStr);

    if (isValid(isoDate)) return isoDate;

    for (const format of FORMATS) {
      const parsed = parse(cleanedStr, format, new Date());
      if (isValid(parsed)) return parsed;
    }

    throw new Error(`Unrecognized date format: ${dateStr}`);
  }

  const formatDate = (dateStr: string) => {
    const parsed = parseDate(dateStr);
    return format(parsed, "E d LLL");
  };

  const formatTime = (dateStr: string) => {
    const parsed = parseDate(dateStr);
    return format(parsed, "HH:mm");
  };

  const getAirlines = (flights: FlightSegment[]) => {
    return [...new Set(flights.map((flight) => flight.airline))].join(", ");
  };

  const getAirports = (flights: FlightSegment[]) => {
    const firstStop = flights[0];
    const lastStop = flights[flights.length - 1];
    return `${firstStop.departureAirport.airportCode} - ${lastStop.arrivalAirport.airportCode}`;
  };

  const getTotalStops = (layovers: Layover[] | null) => {
    const words = ["Zero", "One", "Two", "Three", "Four", "Five"];

    if (layovers && layovers.length === 1) return "One stop";
    else if (layovers && layovers.length > 1)
      return `${words[layovers.length]} stops`;
    else return "Nonstop";
  };

  const getLayoverLabel = (layovers: Layover[]) => {
    if (layovers.length > 1)
      layovers.map((layover) => layover.airportCode).join(", ");
    else return layovers[0].durationLabel;
  };

  const getTripTypeLabel = () => {
    if (flightInfo?.isRoundTrip) return "round trip";
    else return "one way";
  };

  const getBestPrice = (flights: Flight[]) => {
    let bestPrice = Infinity;
    let bestFlightIndex = -1;
    for (let i = 0; i < flights.length; i++) {
      if (flights[i].price < bestPrice) {
        bestPrice = flights[i].price;
        bestFlightIndex = i;
      }
    }
    return bestFlightIndex !== -1 ? flights[bestFlightIndex] : null;
  };

  useEffect(() => {
    scrollToRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const selectFlightButton = (flight: Flight) => {
    return (
      <>
        <button
          onClick={() => {
            if (!isReturn && onSelectDeparture) {
              onSelectDeparture(flight);
            } else if (isReturn && onSelectReturn) {
              onSelectReturn(flight);
            }
          }}
          className="py-2 px-4 rounded-full text-white transition bg-button-secondary hover:bg-button-secondary-hover cursor-pointer"
        >
          Select flight
        </button>
      </>
    );
  };

  return (
    <>
      {flightList && (
        <div className="py-3">
          <p className="text-lg font-bold pb-3">{headerTitle}</p>
          {/* {!isOtherFlights && <div ref={scrollToRef} />} */}
          <div className="rounded-xl bg-bot-bubble overflow-hidden">
            {flightList
              ?.filter(
                (flight) =>
                  flight.price !== null &&
                  flight.price !== undefined
              )
              ?.map((flight, index) => (
                <Disclosure as="div" key={index} className="group">
                  {({ open }) => (
                    <>
                      <div
                        className={`${
                          open ? "shadow-lg rounded-xl mb-3" : "bg-white"
                        } ${
                          !open && index < flightList.length - 1
                            ? "border-b border-gray-200"
                            : ""
                        }`}
                      >
                        <div
                          className={`flex flex-row flex-1 space-y-3 px-4 py-2 ${
                            open ? "bg-white border-b border-gray-200" : ""
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center w-16 h-12 mr-4">
                            <img
                              src={flight?.airlineLogo}
                              className="w-10 h-10"
                            />
                            {/* <div className="w-10 h-8 rounded-b-2xl flex items-center justify-center text-xs text-gray-500">
                            logo
                          </div> */}
                          </div>
                          {!open ? (
                            <>
                              <div className="flex flex-col items-start flex-1 gap-4">
                                {flight?.flights && (
                                  <>
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <div className="md:text-lg font-medium text-gray-900">
                                        {formatTime(flight.departure)} -{" "}
                                        {formatTime(flight.arrival)}
                                      </div>
                                      <div className="text-sm text-gray-500">
                                        {getAirlines(flight.flights)}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>

                              <div className="flex flex-col flex-1 min-w-0 mr-6">
                                {flight?.duration && (
                                  <>
                                    <div className="md:text-lg font-medium text-gray-900">
                                      {flight?.duration.text}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {getAirports(flight.flights)}
                                    </div>
                                  </>
                                )}
                              </div>
                              {flight?.layovers ? (
                                <>
                                  <div className="flex flex-col flex-1 min-w-0 mr-6">
                                    <div className="md:text-lg font-medium text-gray-900">
                                      {getTotalStops(flight.layovers)}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {getLayoverLabel(flight.layovers)}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="hidden md:flex flex-col flex-1 min-w-0 mr-6"></div>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="flex flex-col items-start justify-center flex-1 min-w-0 mr-6">
                                {isReturn ? "Return" : "Departure"} -{" "}
                                {formatDate(flight.departure)}
                              </div>
                              {/* <div className="flex flex-col flex-1 min-w-0 mr-6"></div> */}
                            </>
                          )}
                          {open && (
                            <>
                              {!isMobile && (
                                <div className="flex flex-col md:justify-center min-w-0 mx-4">
                                  {selectFlightButton(flight)}
                                </div>
                              )}
                            </>
                          )}
                          <div
                            className={`flex flex-col items-center md:justify-center`}
                          >
                            <div className={`flex flex-row text-right`}>
                              {flight?.price && (
                                <>
                                  <div className="flex flex-col">
                                    <div className="text-md md:text-lg font-semibold text-gray-900">
                                      {flight.price} US$
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {getTripTypeLabel()}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="mx-4 flex items-center">
                            <DisclosureButton className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors">
                              <ChevronDownIcon className="w-5 h-5 text-gray-600 group-data-open:rotate-180 transition-transform duration-200" />
                            </DisclosureButton>
                          </div>
                        </div>
                        <Transition
                          as="div"
                          show={open}
                          enter="transition-all duration-200 ease-out"
                          enterFrom="max-h-0 opacity-0"
                          enterTo="max-h-96 opacity-100"
                          leave="transition-all duration-200 ease-in"
                          leaveFrom="max-h-96 opacity-100"
                          leaveTo="max-h-0 opacity-0"
                        >
                          <DisclosurePanel className="px-4 pb-4 bg-white rounded-b-xl">
                            {flight?.flights && (
                              <>
                                {flight?.flights.map((segment, index) => (
                                  <>
                                    <div
                                      className={`pt-4 flex flex-col space-x-4 lg:grid lg:grid-cols-[68px_28px_minmax(0,1fr)_minmax(0,280px)] md:[grid-template-rows:40px auto auto auto]`}
                                    >
                                      <div className="w-10 h-10 mr-4 row-start-2 row-end-4 col-start-1">
                                        {flight?.flights.length > 1 && (
                                          <>
                                            {
                                              <img
                                                src={flight?.airlineLogo}
                                                className="w-10 h-10"
                                              />
                                            }
                                            {/* {
                                            <div className="w-10 h-10 rounded-b-2xl flex items-center justify-center text-xs text-gray-500">
                                              logo
                                            </div>
                                          } */}
                                          </>
                                        )}
                                      </div>
                                      <div className="hidden col-start-2 row-start-1 row-span-4 lg:flex lg:flex-col items-center justify-between py-2">
                                        <div className="h-3 w-3 border-2 rounded-full" />

                                        <div className="flex-1 w-px border-r-4 border-dotted my-1" />

                                        <div className="h-3 w-3 border-2 rounded-full" />
                                      </div>

                                      {/* <div className="flex flex-col flex-1 min-w-0 mr-6"> */}
                                      <div className="text-lg font-medium text-gray-900 col-start-3 row-start-1">
                                        {formatTime(
                                          segment.departureAirport.time
                                        )}{" "}
                                        - {segment.departureAirport.airportName}{" "}
                                        ({segment.departureAirport.airportCode})
                                      </div>
                                      <div className="text-sm text-gray-500 my-3 col-start-3 row-start-3">
                                        <>
                                          Travel time: {segment.duration.text}
                                        </>
                                      </div>
                                      <div className="text-lg font-medium text-gray-900 col-start-3 row-start-4">
                                        {formatTime(
                                          segment.arrivalAirport.time
                                        )}{" "}
                                        - {segment.arrivalAirport.airportName} (
                                        {segment.arrivalAirport.airportCode})
                                      </div>
                                      <div className="text-sm text-gray-500 py-2 col-start-3 row-start-6">
                                        <>
                                          {segment.airline} - {segment.aircraft}{" "}
                                          - {segment.flightNumber}
                                        </>
                                      </div>
                                      <div className="md:col-start-4 row-start-1 row-span-6">
                                        {segment.extensions.map((extension) => (
                                          <>
                                            <p className="text-sm">
                                              {extension}
                                            </p>
                                          </>
                                        ))}
                                      </div>

                                      {flight?.layovers?.[index] && (
                                        <div className="col-start-3 col-span-2">
                                          <div className="space-y-1 my-2 py-3 border-t-2 border-b-2 border-gray-200">
                                            <div>
                                              {
                                                flight.layovers[index]
                                                  .durationLabel
                                              }{" "}
                                              layover -{" "}
                                              {flight.layovers[index].city} (
                                              {
                                                flight.layovers[index]
                                                  .airportCode
                                              }
                                              )
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </>
                                ))}
                                {!isDesktop && (
                                  <div className="flex flex-col justify-center min-w-0 mx-4 my-4">
                                    {selectFlightButton(flight)}
                                  </div>
                                )}
                              </>
                            )}
                          </DisclosurePanel>
                        </Transition>
                      </div>
                    </>
                  )}
                </Disclosure>
              ))}
          </div>
        </div>
      )}
    </>
  );
};
export default FlightPicker;

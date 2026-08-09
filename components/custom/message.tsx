"use client";

import { Attachment, ToolInvocation } from "ai";
import { motion } from "framer-motion";
import { ReactNode } from "react";
import { Streamdown } from "streamdown";

import { BotIcon, UserIcon } from "./icons";
import { PreviewAttachment } from "./preview-attachment";
import { Weather } from "./weather";
import {
  ClimbPackageCard,
  BookingStatusCard,
  PaymentStatusView,
  FeedbackForm,
} from "../climb/climb-components";
import { AuthorizePayment } from "../flights/authorize-payment";
import { DisplayBoardingPass } from "../flights/boarding-pass";
import { CreateReservation } from "../flights/create-reservation";
import { FlightStatus } from "../flights/flight-status";
import { ListFlights } from "../flights/list-flights";
import { SelectSeats } from "../flights/select-seats";
import { VerifyPayment } from "../flights/verify-payment";

export const Message = ({
  chatId,
  role,
  content,
  toolInvocations,
  attachments,
}: {
  chatId: string;
  role: string;
  content: string | ReactNode;
  toolInvocations: Array<ToolInvocation> | undefined;
  attachments?: Array<Attachment>;
}) => {
  return (
    <motion.div
      className={`flex flex-row gap-4 px-4 w-full md:w-[500px] md:px-0 first-of-type:pt-20`}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="size-[24px] border rounded-sm p-1 flex flex-col justify-center items-center shrink-0 text-zinc-500">
        {role === "assistant" ? <BotIcon /> : <UserIcon />}
      </div>

      <div className="flex flex-col gap-2 w-full">
        {content && typeof content === "string" && (
          <div className="text-zinc-800 dark:text-zinc-300 flex flex-col gap-4">
            <Streamdown>{content}</Streamdown>
          </div>
        )}

        {toolInvocations && (
          <div className="flex flex-col gap-4">
            {toolInvocations.map((toolInvocation) => {
              const { toolName, toolCallId, state } = toolInvocation;

              if (state === "result") {
                const { result } = toolInvocation;

                return (
                  <div key={toolCallId}>
                    {toolName === "getWeather" ? (
                      <Weather weatherAtLocation={result} />
                    ) : toolName === "displayFlightStatus" ? (
                      <FlightStatus flightStatus={result} />
                    ) : toolName === "searchFlights" ? (
                      <ListFlights chatId={chatId} results={result} />
                    ) : toolName === "selectSeats" ? (
                      <SelectSeats chatId={chatId} availability={result} />
                    ) : toolName === "createReservation" ? (
                      Object.keys(result).includes("error") ? null : (
                        <CreateReservation reservation={result} />
                      )
                    ) : toolName === "authorizePayment" ? (
                      <AuthorizePayment intent={result} />
                    ) : toolName === "displayBoardingPass" ? (
                      <DisplayBoardingPass boardingPass={result} />
                    ) : toolName === "verifyPayment" ? (
                      result.hasCompletedPayment ? (
                        <PaymentStatusView success={true} />
                      ) : (
                        <VerifyPayment result={result} />
                      )
                    ) : toolName === "searchClimbKnowledge" ? (
                      <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-lg text-xs text-slate-300">
                        <h4 className="font-bold text-amber-400 mb-1">Informações de Conhecimento:</h4>
                        <pre className="whitespace-pre-wrap font-sans text-[11px]">{JSON.stringify(result, null, 2)}</pre>
                      </div>
                    ) : toolName === "listClimbPackages" ? (
                      <div className="flex flex-col gap-3">
                        {(() => {
                          const packages = Array.isArray(result) ? result : result?.packages;
                          return Array.isArray(packages) && packages.length > 0 ? (
                            packages.map((pkg: any) => (
                              <ClimbPackageCard key={pkg.id} pkg={pkg} />
                            ))
                          ) : (
                            <div className="text-xs text-slate-400">Nenhum pacote encontrado.</div>
                          );
                        })()}
                      </div>
                    ) : toolName === "createClimbBooking" ? (
                      result.error ? (
                        <div className="text-xs text-rose-400">{result.error}</div>
                      ) : (
                        <BookingStatusCard booking={result} />
                      )
                    ) : toolName === "generatePaymentLink" ? (
                      result.error ? (
                        <div className="text-xs text-rose-400">{result.error}</div>
                      ) : (
                        <BookingStatusCard
                          booking={{
                            bookingId: result.bookingId,
                            packageId: "",
                            packageName: "Reserva de Escalada Xperience",
                            date: "Data Agendada",
                            participants: 1,
                            priceInBRL: result.amount,
                            totalPriceBRL: result.amount,
                            location: "",
                          }}
                          paymentDetails={result}
                        />
                      )
                    ) : toolName === "saveLeadInfo" ? (
                      result.error ? (
                        <div className="text-xs text-rose-400">{result.error}</div>
                      ) : (
                        <div className="p-3 bg-emerald-950/40 border border-emerald-900 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                          <span className="font-semibold">{result.message}</span>
                        </div>
                      )
                    ) : toolName === "submitUserFeedback" ? (
                      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-300">
                        {result.message}
                      </div>
                    ) : (
                      <div>{JSON.stringify(result, null, 2)}</div>
                    )}
                  </div>
                );
              } else {
                return (
                  <div key={toolCallId} className="skeleton">
                    {toolName === "getWeather" ? (
                      <Weather />
                    ) : toolName === "displayFlightStatus" ? (
                      <FlightStatus />
                    ) : toolName === "searchFlights" ? (
                      <ListFlights chatId={chatId} />
                    ) : toolName === "selectSeats" ? (
                      <SelectSeats chatId={chatId} />
                    ) : toolName === "createReservation" ? (
                      <CreateReservation />
                    ) : toolName === "authorizePayment" ? (
                      <AuthorizePayment />
                    ) : toolName === "displayBoardingPass" ? (
                      <DisplayBoardingPass />
                    ) : toolName === "submitUserFeedback" ? (
                      <FeedbackForm
                        onSubmit={(rating, comment) => {
                          console.log("Feedback rating:", rating, "comment:", comment);
                        }}
                      />
                    ) : (
                      <div className="text-xs text-slate-500 animate-pulse">Carregando ferramenta {toolName}...</div>
                    )}
                  </div>
                );
              }
            })}
          </div>
        )}

        {attachments && (
          <div className="flex flex-row gap-2">
            {attachments.map((attachment) => (
              <PreviewAttachment key={attachment.url} attachment={attachment} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

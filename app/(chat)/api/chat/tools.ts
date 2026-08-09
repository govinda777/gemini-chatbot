import { z } from "zod";

import {
  generateReservationPrice,
  generateSampleFlightSearchResults,
  generateSampleFlightStatus,
  generateSampleSeatSelection,
} from "@/ai/actions";
import { auth } from "@/app/(auth)/auth";
import {
  createFeedback,
  createLead,
  createReservation,
  getReservationById,
} from "@/db/queries";
import climbKnowledge from "@/lib/data/climb-knowledge.json";
import climbPackages from "@/lib/data/climb-packages.json";
import { generateUUID } from "@/lib/utils";

/**
 * Registry of available tools for the AI agents.
 * 
 * Each tool features:
 * - `description`: Instructions for the LLM on when and why to invoke the tool.
 * - `parameters`: A Zod schema validating input arguments.
 * - `execute`: The async function implementing the tool's behavior.
 */
export const getTools = {
  // ==========================================
  // --- GENERAL TOOLS ------------------------
  // ==========================================

  /**
   * ### getWeather
   * 
   * **Purpose:**
   * Fetches real-time weather information and short term forecasts for any given coordinates.
   * 
   * **Triggering / How to Invoke:**
   * Invoke when a user asks about climate conditions, temperatures, or if it is a good day/season for an outdoor activity.
   * 
   * **Parameters:**
   * - `latitude` (number, required): Coordinate latitude (e.g. -23.5505).
   * - `longitude` (number, required): Coordinate longitude (e.g. -46.6333).
   * 
   * **JSON Example Call:**
   * ```json
   * {
   *   "latitude": -23.5337,
   *   "longitude": -46.6253
   * }
   * ```
   * 
   * **Execution Example:**
   * ```typescript
   * import { getTools } from "@/app/(chat)/api/chat/tools";
   * const weather = await getTools.getWeather.execute({
   *   latitude: -23.5337,
   *   longitude: -46.6253
   * });
   * ```
   * 
   * **Returns:**
   * An object containing: `current` weather, `hourly` temperature, and `daily` sunrise/sunset forecast.
   */
  getWeather: {
    description: "Get the current weather at a location",
    parameters: z.object({
      latitude: z.number().describe("Latitude coordinate"),
      longitude: z.number().describe("Longitude coordinate"),
    }),
    execute: async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`,
      );
      const weatherData = await response.json();
      return weatherData;
    },
  },

  // ==========================================
  // --- CLIMB SPECIALIST TOOLS ---------------
  // ==========================================

  /**
   * ### searchClimbKnowledge
   * 
   * **Purpose:**
   * Queries the static climb safety, logistics, and destination guidelines (climb-knowledge.json).
   * 
   * **Triggering / How to Invoke:**
   * Call whenever the user asks questions about checklist, required gear, safety policies, physical requirements, or meeting points.
   * 
   * **Parameters:**
   * - `query` (string, required): Search term (e.g., "segurança", "equipamentos", "Pedra do Baú").
   * 
   * **JSON Example Call:**
   * ```json
   * {
   *   "query": "equipamento de segurança para iniciantes"
   * }
   * ```
   * 
   * **Execution Example:**
   * ```typescript
   * import { getTools } from "@/app/(chat)/api/chat/tools";
   * const knowledge = await getTools.searchClimbKnowledge.execute({
   *   query: "equipamento de segurança para iniciantes"
   * });
   * ```
   * 
   * **Returns:**
   * A filtered portion of climb knowledge containing safety rules, destination info, or logistics checklists.
   */
  searchClimbKnowledge: {
    description: "Search public knowledge base for Xperience Climb (safety, logistics, rules, destinations)",
    parameters: z.object({
      query: z.string().describe("Search term or question about security, rules, or destinations"),
    }),
    execute: async ({ query }: { query: string }) => {
      const q = query.toLowerCase();
      // Simple text search mock over the static JSON content
      const results: any = {};
      if (q.includes("seguran") || q.includes("equipamento") || q.includes("fisic") || q.includes("requer")) {
        results.safety = climbKnowledge.safety;
      }
      if (q.includes("destin") || q.includes("pedra") || q.includes("escola") || q.includes("fundos") || q.includes("bau")) {
        results.destinations = climbKnowledge.destinations;
      }
      if (q.includes("logistica") || q.includes("ponto") || q.includes("encontro") || q.includes("levar") || q.includes("transp") || q.includes("checklist")) {
        results.logistics = climbKnowledge.logistics;
      }
      // If nothing matches, return everything as a fallback
      if (Object.keys(results).length === 0) {
        return climbKnowledge;
      }
      return results;
    },
  },

  /**
   * ### listClimbPackages
   * 
   * **Purpose:**
   * Lists the list of available climbing packages from `climb-packages.json`.
   * 
   * **Triggering / How to Invoke:**
   * Call when the user requests package details, pricing, available routes, or filters packages by difficulty level.
   * 
   * **Parameters:**
   * - `difficulty` (string, optional): One of "iniciante", "intermediario", "avancado".
   * 
   * **JSON Example Call:**
   * ```json
   * {
   *   "difficulty": "iniciante"
   * }
   * ```
   * 
   * **Execution Example:**
   * ```typescript
   * import { getTools } from "@/app/(chat)/api/chat/tools";
   * const packages = await getTools.listClimbPackages.execute({
   *   difficulty: "iniciante"
   * });
   * ```
   * 
   * **Returns:**
   * An array of package objects including ID, name, priceInBRL, location, duration, and details.
   */
  listClimbPackages: {
    description: "List available climb packages with details like price, location, difficulty",
    parameters: z.object({
      difficulty: z.string().optional().describe("Filter by difficulty: iniciante, intermediario, avancado"),
    }),
    execute: async ({ difficulty }: { difficulty?: string }) => {
      if (difficulty) {
        return { packages: climbPackages.filter((pkg) => pkg.difficulty === difficulty) };
      }
      return { packages: climbPackages };
    },
  },

  /**
   * ### createClimbBooking
   * 
   * **Purpose:**
   * Places a climbing package booking reservation for the authenticated user.
   * 
   * **Triggering / How to Invoke:**
   * Call once the user has chosen a specific climb package, and provided the desired date and number of participants.
   * *Note: Requires user session authentication.*
   * 
   * **Parameters:**
   * - `packageId` (string, required): Unique ID of the target package.
   * - `date` (string, required): Desired date in "YYYY-MM-DD" format.
   * - `participants` (number, required): Total number of climbers.
   * 
   * **JSON Example Call:**
   * ```json
   * {
   *   "packageId": "bau-express",
   *   "date": "2026-09-12",
   *   "participants": 2
   * }
   * ```
   * 
   * **Execution Example:**
   * ```typescript
   * import { getTools } from "@/app/(chat)/api/chat/tools";
   * const booking = await getTools.createClimbBooking.execute({
   *   packageId: "bau-express",
   *   date: "2026-09-12",
   *   participants: 2
   * });
   * ```
   * 
   * **Returns:**
   * Booking details object including reservation ID (`bookingId`), total calculated price, and package details, or an error.
   */
  createClimbBooking: {
    description: "Create a booking reservation for a climb package",
    parameters: z.object({
      packageId: z.string().describe("The ID of the package to book"),
      date: z.string().describe("Desired date for the activity (YYYY-MM-DD)"),
      participants: z.number().describe("Number of participants"),
    }),
    execute: async ({ packageId, date, participants }: { packageId: string; date: string; participants: number }) => {
      const session = await auth();
      if (!session || !session.user || !session.user.id) {
        return { error: "User is not signed in to perform this action!" };
      }

      const selectedPackage = climbPackages.find((p) => p.id === packageId);
      if (!selectedPackage) {
        return { error: `Package with ID ${packageId} not found.` };
      }

      const totalPriceBRL = selectedPackage.priceInBRL * participants;
      const bookingId = generateUUID();

      const bookingDetails = {
        bookingId,
        packageId,
        packageName: selectedPackage.name,
        date,
        participants,
        priceInBRL: selectedPackage.priceInBRL,
        totalPriceBRL,
        location: selectedPackage.location,
      };

      await createReservation({
        id: bookingId,
        userId: session.user.id,
        details: bookingDetails,
      });

      return bookingDetails;
    },
  },

  /**
   * ### generatePaymentLink
   * 
   * **Purpose:**
   * Generates mock Stripe payment links and PIX payload details for a given booking ID.
   * 
   * **Triggering / How to Invoke:**
   * Invoke right after a climb booking has been successfully created to present the payment details to the client.
   * 
   * **Parameters:**
   * - `bookingId` (string, required): The unique UUID returned by the booking function.
   * 
   * **JSON Example Call:**
   * ```json
   * {
   *   "bookingId": "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6"
   * }
   * ```
   * 
   * **Execution Example:**
   * ```typescript
   * import { getTools } from "@/app/(chat)/api/chat/tools";
   * const paymentInfo = await getTools.generatePaymentLink.execute({
   *   bookingId: "a1b2c3d4-e5f6-7a8b-9c0d-e1f2a3b4c5d6"
   * });
   * ```
   * 
   * **Returns:**
   * An object with Stripe checkout URL (`paymentUrl`), a PIX string (`pixQrCode`), and details of currency/amount.
   */
  generatePaymentLink: {
    description: "Generate a Stripe checkout link or PIX payload for a reservation/booking",
    parameters: z.object({
      bookingId: z.string().describe("Unique identifier of the booking/reservation"),
    }),
    execute: async ({ bookingId }: { bookingId: string }) => {
      const reservationData = await getReservationById({ id: bookingId });
      if (!reservationData) {
        return { error: `Booking ${bookingId} not found.` };
      }

      const details = reservationData.details as any;
      const amount = details.totalPriceBRL || details.totalPriceInUSD || 100;

      // Mock dynamic Stripe Checkout & PIX Key
      const paymentUrl = `https://checkout.stripe.com/pay/mock_${bookingId}?amount=${amount}`;
      const pixQrCode = `00020101021226840014br.gov.bcb.pix2562pix-mock@xperienceclimb.com5204000053039865406${amount.toFixed(2)}5802BR5915XPERIENCE CLIMB6009SAO PAULO62070503***6304`;

      return {
        bookingId,
        paymentUrl,
        pixQrCode,
        amount,
        currency: details.totalPriceBRL ? "BRL" : "USD",
      };
    },
  },

  /**
   * ### saveLeadInfo
   * 
   * **Purpose:**
   * Registers a customer's contact information (name, email, WhatsApp) into the database for sales outreach.
   * 
   * **Triggering / How to Invoke:**
   * Invoke this to collect a user's details for commercial follow-ups.
   * *Important: Explicit LGPD consent (`consentGranted = true`) must be asked and granted before calling.*
   * 
   * **Parameters:**
   * - `name` (string, required): Full name.
   * - `email` (string, required): Email address.
   * - `whatsapp` (string, required): WhatsApp number with country & area code.
   * - `climbingExperience` (string, required): "iniciante", "intermediario", or "avancado".
   * - `interestDetails` (string, optional): Specific packages or questions they have.
   * - `consentGranted` (boolean, required): Must be true (LGPD consent).
   * 
   * **JSON Example Call:**
   * ```json
   * {
   *   "name": "Maria Silva",
   *   "email": "maria@example.com",
   *   "whatsapp": "+5511999998888",
   *   "climbingExperience": "iniciante",
   *   "interestDetails": "Quer agendar para o mês que vem.",
   *   "consentGranted": true
   * }
   * ```
   * 
   * **Execution Example:**
   * ```typescript
   * import { getTools } from "@/app/(chat)/api/chat/tools";
   * const leadResult = await getTools.saveLeadInfo.execute({
   *   name: "Maria Silva",
   *   email: "maria@example.com",
   *   whatsapp: "+5511999998888",
   *   climbingExperience: "iniciante",
   *   consentGranted: true
   * });
   * ```
   * 
   * **Returns:**
   * Success notification message.
   */
  saveLeadInfo: {
    description: "Capture user contact details for sales/newsletter. Requests LGPD consent.",
    parameters: z.object({
      name: z.string().describe("Full name of the user"),
      email: z.string().email().describe("Email address"),
      whatsapp: z.string().describe("Whatsapp number with area code"),
      climbingExperience: z.string().describe("User experience: iniciante, intermediario, avancado"),
      interestDetails: z.string().optional().describe("Additional comments or specific interests"),
      consentGranted: z.boolean().describe("Explicit LGPD consent to store details"),
    }),
    execute: async (leadData: {
      name: string;
      email: string;
      whatsapp: string;
      climbingExperience: string;
      interestDetails?: string;
      consentGranted: boolean;
    }) => {
      if (!leadData.consentGranted) {
        return { error: "LGPD consent is required to save contact info." };
      }

      const session = await auth();
      const userId = session?.user?.id;

      await createLead({
        name: leadData.name,
        email: leadData.email,
        whatsapp: leadData.whatsapp,
        climbingExperience: leadData.climbingExperience,
        interestDetails: leadData.interestDetails,
        userId,
      });

      // Simulate asynchronous email sender natively (ADR-0002 replacement of n8n)
      console.log(`[EMAIL SEND SIMULATION] Sending new lead notification email to sales@xperienceclimb.com:`, leadData);

      return {
        success: true,
        message: "Lead cadastrado com sucesso! Entraremos em contato via WhatsApp em breve.",
      };
    },
  },

  /**
   * ### submitUserFeedback
   * 
   * **Purpose:**
   * Submits user satisfaction rating and feedback comments to the database.
   * 
   * **Triggering / How to Invoke:**
   * Invoke when the user offers a review or feedback about the bot experience, website, or instructors.
   * 
   * **Parameters:**
   * - `rating` (number, required): Score from 1 to 5.
   * - `comment` (string, optional): Text feedback.
   * - `category` (string, required): e.g., "sistema", "servico", "instrutores".
   * 
   * **JSON Example Call:**
   * ```json
   * {
   *   "rating": 5,
   *   "comment": "Muito fácil fechar o pacote por aqui!",
   *   "category": "sistema"
   * }
   * ```
   * 
   * **Execution Example:**
   * ```typescript
   * import { getTools } from "@/app/(chat)/api/chat/tools";
   * const feedbackResult = await getTools.submitUserFeedback.execute({
   *   rating: 5,
   *   comment: "Excelente!",
   *   category: "sistema"
   * });
   * ```
   * 
   * **Returns:**
   * A thank-you message object.
   */
  submitUserFeedback: {
    description: "Submit rating and comment for the system or service",
    parameters: z.object({
      rating: z.number().min(1).max(5).describe("Satisfaction score from 1 (poor) to 5 (excellent)"),
      comment: z.string().optional().describe("User remarks/critiques"),
      category: z.string().describe("Feedback category, e.g., 'sistema', 'servico', 'instrutores'"),
    }),
    execute: async ({ rating, comment, category }: { rating: number; comment?: string; category: string }) => {
      const session = await auth();
      if (!session || !session.user || !session.user.id) {
        return { error: "User is not signed in to perform this action!" };
      }

      await createFeedback({
        userId: session.user.id,
        rating,
        comment,
        category,
      });

      return {
        success: true,
        message: "Obrigado pelo seu feedback! Ele nos ajuda a melhorar a experiência.",
      };
    },
  },

  // ==========================================
  // --- FLIGHT BOOKING TOOLS -----------------
  // ==========================================

  /**
   * ### displayFlightStatus
   * 
   * **Purpose:**
   * Shows current live flight information (delays, gate, status) for a flight number on a specific date.
   * 
   * **Triggering / How to Invoke:**
   * Call when a user asks about details or status of a specific flight.
   * 
   * **Parameters:**
   * - `flightNumber` (string, required): Flight identification code (e.g. "AA123").
   * - `date` (string, required): Date of flight.
   * 
   * **JSON Example Call:**
   * ```json
   * {
   *   "flightNumber": "LA8072",
   *   "date": "2026-08-10"
   * }
   * ```
   * 
   * **Execution Example:**
   * ```typescript
   * import { getTools } from "@/app/(chat)/api/chat/tools";
   * const status = await getTools.displayFlightStatus.execute({
   *   flightNumber: "LA8072",
   *   date: "2026-08-10"
   * });
   * ```
   * 
   * **Returns:**
   * Simulated flight status details.
   */
  displayFlightStatus: {
    description: "Display the status of a flight",
    parameters: z.object({
      flightNumber: z.string().describe("Flight number"),
      date: z.string().describe("Date of the flight"),
    }),
    execute: async ({ flightNumber, date }: { flightNumber: string; date: string }) => {
      const flightStatus = await generateSampleFlightStatus({ flightNumber, date });
      return flightStatus;
    },
  },

  /**
   * ### searchFlights
   * 
   * **Purpose:**
   * Queries list of matching flight connections between origin and destination.
   * 
   * **Triggering / How to Invoke:**
   * First step of the flight booking flow. Invoke when user wants to book or find a flight.
   * 
   * **Parameters:**
   * - `origin` (string, required): Source airport or city name.
   * - `destination` (string, required): Destination airport or city name.
   * 
   * **JSON Example Call:**
   * ```json
   * {
   *   "origin": "GRU",
   *   "destination": "JFK"
   * }
   * ```
   * 
   * **Execution Example:**
   * ```typescript
   * import { getTools } from "@/app/(chat)/api/chat/tools";
   * const flightList = await getTools.searchFlights.execute({
   *   origin: "GRU",
   *   destination: "JFK"
   * });
   * ```
   * 
   * **Returns:**
   * List of flights matching the criteria.
   */
  searchFlights: {
    description: "Search for flights based on the given parameters",
    parameters: z.object({
      origin: z.string().describe("Origin airport or city"),
      destination: z.string().describe("Destination airport or city"),
    }),
    execute: async ({ origin, destination }: { origin: string; destination: string }) => {
      const results = await generateSampleFlightSearchResults({ origin, destination });
      return results;
    },
  },

  /**
   * ### selectSeats
   * 
   * **Purpose:**
   * Fetches the cabin seat map layout and availability status for a selected flight.
   * 
   * **Triggering / How to Invoke:**
   * Second step of flight booking flow. Call after a flight was found/selected, to allow users to select seat codes.
   * 
   * **Parameters:**
   * - `flightNumber` (string, required): Flight identification code.
   * 
   * **JSON Example Call:**
   * ```json
   * {
   *   "flightNumber": "LA8072"
   * }
   * ```
   * 
   * **Execution Example:**
   * ```typescript
   * import { getTools } from "@/app/(chat)/api/chat/tools";
   * const seatMap = await getTools.selectSeats.execute({
   *   flightNumber: "LA8072"
   * });
   * ```
   * 
   * **Returns:**
   * Array of seat layout models (seat number, status, price level).
   */
  selectSeats: {
    description: "Select seats for a flight",
    parameters: z.object({
      flightNumber: z.string().describe("Flight number"),
    }),
    execute: async ({ flightNumber }: { flightNumber: string }) => {
      const seats = await generateSampleSeatSelection({ flightNumber });
      return seats;
    },
  },

  /**
   * ### createReservation
   * 
   * **Purpose:**
   * Initiates a pending flight reservation details record.
   * 
   * **Triggering / How to Invoke:**
   * Third step of flight booking flow. Call after flight selection and seat choice to lock the itinerary before payment.
   * 
   * **Parameters:**
   * - `seats` (string[], required): List of selected seat numbers (e.g. `["12A", "12B"]`).
   * - `flightNumber` (string, required): Flight number.
   * - `departure`/`arrival` (objects, required): Airport details, timestamp, gate, terminal.
   * - `passengerName` (string, required): Full passenger name.
   * 
   * **JSON Example Call:**
   * ```json
   * {
   *   "flightNumber": "AA123",
   *   "seats": ["12A"],
   *   "passengerName": "John Doe",
   *   "departure": {
   *     "cityName": "Miami",
   *     "airportCode": "MIA",
   *     "timestamp": "2026-08-10T10:00:00Z",
   *     "gate": "D10",
   *     "terminal": "N"
   *   },
   *   "arrival": {
   *     "cityName": "London",
   *     "airportCode": "LHR",
   *     "timestamp": "2026-08-10T22:00:00Z",
   *     "gate": "A5",
   *     "terminal": "5"
   *   }
   * }
   * ```
   * 
   * **Execution Example:**
   * ```typescript
   * import { getTools } from "@/app/(chat)/api/chat/tools";
   * const reservation = await getTools.createReservation.execute({
   *   flightNumber: "AA123",
   *   seats: ["12A"],
   *   passengerName: "John Doe",
   *   departure: {
   *     cityName: "Miami",
   *     airportCode: "MIA",
   *     timestamp: "2026-08-10T10:00:00Z",
   *     gate: "D10",
   *     terminal: "N"
   *   },
   *   arrival: {
   *     cityName: "London",
   *     airportCode: "LHR",
   *     timestamp: "2026-08-10T22:00:00Z",
   *     gate: "A5",
   *     terminal: "5"
   *   }
   * });
   * ```
   * 
   * **Returns:**
   * Created reservation details containing UUID `id` and total USD price.
   */
  createReservation: {
    description: "Display pending reservation details",
    parameters: z.object({
      seats: z.string().array().describe("Array of selected seat numbers"),
      flightNumber: z.string().describe("Flight number"),
      departure: z.object({
        cityName: z.string().describe("Name of the departure city"),
        airportCode: z.string().describe("Code of the departure airport"),
        timestamp: z.string().describe("ISO 8601 date of departure"),
        gate: z.string().describe("Departure gate"),
        terminal: z.string().describe("Departure terminal"),
      }),
      arrival: z.object({
        cityName: z.string().describe("Name of the arrival city"),
        airportCode: z.string().describe("Code of the arrival airport"),
        timestamp: z.string().describe("ISO 8601 date of arrival"),
        gate: z.string().describe("Arrival gate"),
        terminal: z.string().describe("Arrival terminal"),
      }),
      passengerName: z.string().describe("Name of the passenger"),
    }),
    execute: async (props: any) => {
      const { totalPriceInUSD } = await generateReservationPrice(props);
      const session = await auth();
      const id = generateUUID();

      if (session && session.user && session.user.id) {
        await createReservation({
          id,
          userId: session.user.id,
          details: { ...props, totalPriceInUSD },
        });

        return { id, ...props, totalPriceInUSD };
      } else {
        return { error: "User is not signed in to perform this action!" };
      }
    },
  },

  /**
   * ### authorizePayment
   * 
   * **Purpose:**
   * Prompt flight payment authorization window.
   * 
   * **Triggering / How to Invoke:**
   * Fourth step of flight booking flow. Wait for user to input credentials and explicitly consent.
   * 
   * **Parameters:**
   * - `reservationId` (string, required): Unique flight reservation ID.
   * 
   * **JSON Example Call:**
   * ```json
   * {
   *   "reservationId": "a1b2c3d4-..."
   * }
   * ```
   * 
   * **Execution Example:**
   * ```typescript
   * import { getTools } from "@/app/(chat)/api/chat/tools";
   * const authResult = await getTools.authorizePayment.execute({
   *   reservationId: "a1b2c3d4-..."
   * });
   * ```
   * 
   * **Returns:**
   * Object with the `reservationId`.
   */
  authorizePayment: {
    description: "User will enter credentials to authorize payment, wait for user to respond when they are done",
    parameters: z.object({
      reservationId: z.string().describe("Unique identifier for the reservation"),
    }),
    execute: async ({ reservationId }: { reservationId: string }) => {
      return { reservationId };
    },
  },

  /**
   * ### verifyPayment
   * 
   * **Purpose:**
   * Queries payment status (database flag `hasCompletedPayment`) for either climbing booking or flight reservation.
   * 
   * **Triggering / How to Invoke:**
   * Call to double check if checkout succeeded before displaying boarding tickets or confirming reservations.
   * 
   * **Parameters:**
   * - `reservationId` (string, required): Unique identifier of reservation.
   * 
   * **JSON Example Call:**
   * ```json
   * {
   *   "reservationId": "a1b2c3d4-..."
   * }
   * ```
   * 
   * **Execution Example:**
   * ```typescript
   * import { getTools } from "@/app/(chat)/api/chat/tools";
   * const paymentStatus = await getTools.verifyPayment.execute({
   *   reservationId: "a1b2c3d4-..."
   * });
   * ```
   * 
   * **Returns:**
   * `{ hasCompletedPayment: boolean }`
   */
  verifyPayment: {
    description: "Verify payment status for booking or reservation",
    parameters: z.object({
      reservationId: z.string().describe("Unique identifier for the reservation/booking"),
    }),
    execute: async ({ reservationId }: { reservationId: string }) => {
      const reservation = await getReservationById({ id: reservationId });
      if (reservation && reservation.hasCompletedPayment) {
        return { hasCompletedPayment: true };
      } else {
        return { hasCompletedPayment: false };
      }
    },
  },

  /**
   * ### displayBoardingPass
   * 
   * **Purpose:**
   * Outputs the formatted flight boarding ticket info structure.
   * 
   * **Triggering / How to Invoke:**
   * Final step of the flight booking flow.
   * *Constraint: Only call after verifying payment (`hasCompletedPayment` is true).*
   * 
   * **Parameters:**
   * - `reservationId` (string, required): Reservation code.
   * - `passengerName` (string, required): Passenger Name.
   * - `flightNumber` (string, required): Flight identification.
   * - `seat` (string, required): Selected seat number.
   * - `departure`/`arrival` (objects, required): Rich info.
   * 
   * **JSON Example Call:**
   * ```json
   * {
   *   "reservationId": "res-12345",
   *   "passengerName": "John Doe",
   *   "flightNumber": "AA123",
   *   "seat": "12A",
   *   "departure": {
   *     "cityName": "Miami",
   *     "airportCode": "MIA",
   *     "airportName": "Miami International Airport",
   *     "timestamp": "2026-08-10T10:00:00Z",
   *     "terminal": "N",
   *     "gate": "D10"
   *   },
   *   "arrival": {
   *     "cityName": "London",
   *     "airportCode": "LHR",
   *     "airportName": "London Heathrow Airport",
   *     "timestamp": "2026-08-10T22:00:00Z",
   *     "terminal": "5",
   *     "gate": "A5"
   *   }
   * }
   * ```
   * 
   * **Execution Example:**
   * ```typescript
   * import { getTools } from "@/app/(chat)/api/chat/tools";
   * const boardingPass = await getTools.displayBoardingPass.execute({
   *   reservationId: "res-12345",
   *   passengerName: "John Doe",
   *   flightNumber: "AA123",
   *   seat: "12A",
   *   departure: {
   *     cityName: "Miami",
   *     airportCode: "MIA",
   *     airportName: "Miami International Airport",
   *     timestamp: "2026-08-10T10:00:00Z",
   *     terminal: "N",
   *     gate: "D10"
   *   },
   *   arrival: {
   *     cityName: "London",
   *     airportCode: "LHR",
   *     airportName: "London Heathrow Airport",
   *     timestamp: "2026-08-10T22:00:00Z",
   *     terminal: "5",
   *     gate: "A5"
   *   }
   * });
   * ```
   * 
   * **Returns:**
   * The boarding pass details.
   */
  displayBoardingPass: {
    description: "Display a boarding pass",
    parameters: z.object({
      reservationId: z.string().describe("Unique identifier for the reservation"),
      passengerName: z.string().describe("Name of the passenger, in title case"),
      flightNumber: z.string().describe("Flight number"),
      seat: z.string().describe("Seat number"),
      departure: z.object({
        cityName: z.string().describe("Name of the departure city"),
        airportCode: z.string().describe("Code of the departure airport"),
        airportName: z.string().describe("Name of the departure airport"),
        timestamp: z.string().describe("ISO 8601 date of departure"),
        terminal: z.string().describe("Departure terminal"),
        gate: z.string().describe("Departure gate"),
      }),
      arrival: z.object({
        cityName: z.string().describe("Name of the arrival city"),
        airportCode: z.string().describe("Code of the arrival airport"),
        airportName: z.string().describe("Name of the arrival airport"),
        timestamp: z.string().describe("ISO 8601 date of arrival"),
        terminal: z.string().describe("Arrival terminal"),
        gate: z.string().describe("Arrival gate"),
      }),
    }),
    execute: async (boardingPass: any) => {
      return boardingPass;
    },
  },
};
export type ToolsType = typeof getTools;

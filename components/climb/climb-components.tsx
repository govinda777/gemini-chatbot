"use client";

import { Compass, ShieldCheck, Calendar, Users, MapPin, Sparkles, Star, CheckCircle, CreditCard } from "lucide-react";
import { useState } from "react";

// ADR-0004: ClimbPackageCard displays climbing/mountaineering packages
export function ClimbPackageCard({
  pkg,
  onBook,
}: {
  pkg: {
    id: string;
    name: string;
    difficulty: string;
    duration: string;
    priceInBRL: number;
    originalPriceInBRL?: number;
    description: string;
    location: string;
    inclusions: string[];
  };
  onBook?: (pkgId: string) => void;
}) {
  const diffColors: Record<string, string> = {
    iniciante: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    intermediario: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    avancado: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  };

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-slate-700 bg-slate-900/60 backdrop-blur-md text-slate-100 max-w-sm shadow-xl">
      <div className="flex justify-between items-start">
        <span className={`text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${diffColors[pkg.difficulty] || "border-slate-500 text-slate-300"}`}>
          {pkg.difficulty}
        </span>
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Compass className="size-3 text-amber-500" /> {pkg.duration}
        </span>
      </div>
      <div>
        <h3 className="font-bold text-lg text-amber-400">{pkg.name}</h3>
        <p className="text-xs text-slate-300 mt-1 line-clamp-2">{pkg.description}</p>
      </div>
      <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
        <MapPin className="size-3 text-rose-500" /> <span>{pkg.location}</span>
      </div>
      <div className="border-t border-slate-800 pt-2 mt-1">
        <span className="text-xs text-slate-400">Inclusões:</span>
        <ul className="grid grid-cols-2 gap-1 mt-1">
          {pkg.inclusions.map((inc, i) => (
            <li key={i} className="text-[10px] text-slate-300 flex items-center gap-1">
              <ShieldCheck className="size-2.5 text-emerald-400 shrink-0" />
              <span className="truncate">{inc}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-800">
        <div>
          <span className="text-[10px] text-slate-400 block leading-none">A partir de</span>
          <div className="flex items-center gap-1.5">
            {pkg.originalPriceInBRL && (
              <span className="text-xs text-slate-400 line-through">R$ {pkg.originalPriceInBRL}</span>
            )}
            <span className="text-lg font-extrabold text-white">R$ {pkg.priceInBRL}</span>
          </div>
        </div>
        {onBook && (
          <button
            onClick={() => onBook(pkg.id)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white transition-all shadow-md active:scale-95"
          >
            Reservar
          </button>
        )}
      </div>
    </div>
  );
}

// ADR-0004: BookingStatusCard for showing pending climb bookings and payment links
export function BookingStatusCard({
  booking,
  paymentDetails,
  onPaySuccess,
}: {
  booking: {
    bookingId: string;
    packageId: string;
    packageName: string;
    date: string;
    participants: number;
    priceInBRL: number;
    totalPriceBRL: number;
    location: string;
  };
  paymentDetails?: {
    paymentUrl: string;
    pixQrCode: string;
    amount: number;
  };
  onPaySuccess?: () => void;
}) {
  const [showPix, setShowPix] = useState(false);

  return (
    <div className="flex flex-col gap-4 p-5 rounded-xl border border-slate-700 bg-slate-900/80 backdrop-blur-md text-slate-100 max-w-md shadow-2xl">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Calendar className="size-5 text-amber-500" />
        <div>
          <h3 className="font-bold text-base text-white">Confirmação de Reserva</h3>
          <p className="text-[10px] text-slate-400">ID: {booking.bookingId}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-slate-400 block">Atividade</span>
          <span className="font-semibold text-amber-400">{booking.packageName}</span>
        </div>
        <div>
          <span className="text-slate-400 block">Data</span>
          <span className="font-semibold">{booking.date}</span>
        </div>
        <div>
          <span className="text-slate-400 block">Participantes</span>
          <span className="font-semibold flex items-center gap-1">
            <Users className="size-3 text-slate-400" /> {booking.participants}x
          </span>
        </div>
        <div>
          <span className="text-slate-400 block">Valor Total</span>
          <span className="font-extrabold text-white text-sm">R$ {booking.totalPriceBRL.toFixed(2)}</span>
        </div>
      </div>

      {paymentDetails && (
        <div className="border-t border-slate-800 pt-4 flex flex-col gap-3">
          <span className="text-xs font-semibold text-slate-300">Escolha o Método de Pagamento:</span>
          
          <div className="flex gap-2">
            <a
              href={paymentDetails.paymentUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs transition-all shadow-md text-center"
            >
              <CreditCard className="size-4" /> Cartão de Crédito
            </a>
            <button
              onClick={() => setShowPix(!showPix)}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-semibold text-xs transition-all"
            >
              Pagar via PIX
            </button>
          </div>

          {showPix && (
            <div className="flex flex-col items-center gap-2 p-3 bg-slate-950 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400">Escaneie o QR Code ou copie a chave:</span>
              <div className="size-32 bg-white p-2 rounded-lg flex items-center justify-center">
                {/* Mock QR Code representation */}
                <div className="size-28 bg-slate-900 flex items-center justify-center text-[10px] text-center text-amber-400 font-mono border border-slate-700">
                  [QR CODE PIX MOCK]
                </div>
              </div>
              <input
                readOnly
                value={paymentDetails.pixQrCode}
                className="w-full text-[9px] font-mono p-1 bg-slate-900 border border-slate-800 text-slate-300 rounded"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <span className="text-[9px] text-emerald-400">Chave Pix copiada com sucesso!</span>
            </div>
          )}

          {onPaySuccess && (
            <button
              onClick={onPaySuccess}
              className="mt-2 w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-semibold transition-all"
            >
              Simular Confirmação de Pagamento
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ADR-0004: PaymentStatusView with SUCCESS animations
export function PaymentStatusView({
  success,
  message,
}: {
  success: boolean;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-6 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md max-w-sm shadow-xl animate-fade-in">
      <div className="relative flex items-center justify-center">
        <div className="absolute animate-ping size-12 rounded-full bg-emerald-500/20 opacity-75"></div>
        <CheckCircle className="size-14 text-emerald-500 relative z-10 animate-bounce" />
      </div>
      <h3 className="font-extrabold text-lg text-white mt-4">Pagamento Confirmado!</h3>
      <p className="text-xs text-slate-300 mt-2">
        {message || "Sua aventura na Xperience Climb está agendada! Você receberá os detalhes e o contato do guia por WhatsApp."}
      </p>
      <div className="mt-4 flex items-center gap-1.5 px-3 py-1 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-400">
        <Sparkles className="size-3.5 text-amber-500" />
        Prepare os equipamentos e boa escalada!
      </div>
    </div>
  );
}

// ADR-0004: FeedbackForm star-rating component
export function FeedbackForm({
  onSubmit,
}: {
  onSubmit: (rating: number, comment: string) => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSend = () => {
    onSubmit(rating, comment);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-100 text-xs text-center">
        <CheckCircle className="size-6 text-emerald-500 mx-auto mb-2" />
        Feedback enviado. Obrigado por nos ajudar a crescer!
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-slate-700 bg-slate-900/80 backdrop-blur-md text-slate-100 max-w-xs shadow-lg">
      <h4 className="font-bold text-xs text-amber-400">Avalie seu Atendimento</h4>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className="hover:scale-110 transition-transform"
          >
            <Star
              className={`size-6 ${
                star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-500"
              }`}
            />
          </button>
        ))}
      </div>
      <textarea
        placeholder="Deixe um comentário (opcional)..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full text-xs p-2 rounded bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
        rows={2}
      />
      <button
        onClick={handleSend}
        className="w-full py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors"
      >
        Enviar Avaliação
      </button>
    </div>
  );
}

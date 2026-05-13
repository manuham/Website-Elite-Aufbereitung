import { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { X as XIcon, Check } from 'lucide-react';
import gsap from 'gsap';

const DAYS_FULL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

export default function DayTimePickerModal({
  date,
  slots,
  allSlots,
  selectedTime,
  loading,
  isFallback,
  onSelectTime,
  onConfirm,
  onClose,
  isMobile,
}) {
  const [pendingTime, setPendingTime] = useState(selectedTime || null);
  const [ghostWarning, setGhostWarning] = useState(false);
  const backdropRef = useRef(null);
  const modalRef = useRef(null);
  const closeBtnRef = useRef(null);
  const savedFocusRef = useRef(document.activeElement);

  // Detect when a slot the user selected gets taken (while modal is open)
  useEffect(() => {
    if (pendingTime && slots.length > 0 && !slots.includes(pendingTime)) {
      setGhostWarning(true);
      setPendingTime(null);
    }
  }, [slots, pendingTime]);

  // GSAP entrance animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      if (isMobile) {
        gsap.fromTo(modalRef.current,
          { y: '100%' },
          { y: 0, duration: 0.4, ease: 'power3.out' }
        );
      } else {
        gsap.fromTo(modalRef.current,
          { opacity: 0, scale: 0.94, y: 16 },
          { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'power3.out' }
        );
      }
      gsap.fromTo(backdropRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.25 }
      );
    });

    // Focus close button on mount
    const t = setTimeout(() => closeBtnRef.current?.focus(), 50);

    return () => {
      ctx.revert();
      clearTimeout(t);
    };
  }, [isMobile]);

  const handleClose = useCallback(() => {
    const onComplete = () => {
      onClose();
      savedFocusRef.current?.focus();
    };
    if (isMobile) {
      gsap.to(modalRef.current, { y: '100%', duration: 0.3, ease: 'power3.in', onComplete });
    } else {
      gsap.to(modalRef.current, { opacity: 0, scale: 0.94, y: 16, duration: 0.2, ease: 'power2.in', onComplete });
    }
    gsap.to(backdropRef.current, { opacity: 0, duration: 0.2 });
  }, [isMobile, onClose]);

  const handleConfirm = () => {
    if (!pendingTime) return;
    // Double-check slot is still available
    if (!slots.includes(pendingTime)) {
      setGhostWarning(true);
      setPendingTime(null);
      return;
    }
    onSelectTime(pendingTime);
    onConfirm();
  };

  const handleSlotClick = (slot) => {
    setGhostWarning(false);
    setPendingTime(prev => prev === slot ? null : slot);
  };

  const dayName = DAYS_FULL[date.getDay()];
  const dateLabel = `${date.getDate()}. ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

  const modalClasses = isMobile
    ? 'fixed z-50 bottom-0 left-0 right-0 bg-slate/[0.98] backdrop-blur-xl border-t border-slate/60 rounded-t-[2rem] shadow-[0_-16px_40px_rgba(0,0,0,0.5)] flex flex-col max-h-[90vh]'
    : 'fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate/[0.98] backdrop-blur-xl border border-slate/60 rounded-[2rem] shadow-[0_32px_80px_rgba(0,0,0,0.6)] flex flex-col max-h-[85vh]';

  const modal = (
    <div className="fixed inset-0 z-40" style={{ isolation: 'isolate' }}>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-obsidian/60 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal sheet */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="daypicker-title"
        className={modalClasses}
        style={isMobile ? undefined : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      >
        {/* Drag handle (mobile only) */}
        {isMobile && (
          <div className="w-10 h-1 rounded-full bg-ivory/20 mx-auto mt-3 mb-1 shrink-0" />
        )}

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate/60 shrink-0">
          <div id="daypicker-title">
            <span className="font-drama italic text-2xl text-ivory block leading-tight">{dayName}</span>
            <span className="font-sans text-sm text-ivory/50 block mt-0.5">{dateLabel}</span>
          </div>
          <button
            ref={closeBtnRef}
            onClick={handleClose}
            aria-label="Schließen"
            className="w-8 h-8 rounded-full bg-obsidian border border-slate/80 hover:border-accent/50 hover:text-accent flex items-center justify-center text-ivory/50 transition-colors duration-150 shrink-0 mt-0.5"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Slot list */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 flex flex-col gap-1 min-h-0">
          {loading ? (
            // Skeleton placeholders
            Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-obsidian/50 border border-slate/30 animate-pulse" />
            ))
          ) : allSlots.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 gap-3">
              <p className="font-sans text-sm text-ivory/40 text-center">Geschlossen</p>
            </div>
          ) : slots.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-10 gap-3">
              <p className="font-sans text-sm text-ivory/40 text-center">
                An diesem Tag sind leider keine Termine mehr frei.
              </p>
              <p className="font-sans text-xs text-ivory/25 text-center">
                Bitte wählen Sie einen anderen Tag.
              </p>
            </div>
          ) : (
            allSlots.map(slot => {
              const isAvailable = slots.includes(slot);
              const isSelected = pendingTime === slot;
              const isBooked = !isAvailable;

              return (
                <button
                  key={slot}
                  disabled={isBooked}
                  onClick={() => isAvailable && handleSlotClick(slot)}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border transition-all duration-150 text-left w-full
                    ${isBooked
                      ? 'opacity-40 cursor-not-allowed border-transparent'
                      : isSelected
                        ? 'bg-accent/15 border-accent/50 cursor-pointer shadow-[0_0_16px_rgba(77,178,146,0.12)]'
                        : 'border-transparent cursor-pointer hover:bg-accent/10 hover:border-accent/20'
                    }`}
                >
                  {/* Time */}
                  <span className={`font-mono text-base font-semibold w-14 shrink-0
                    ${isBooked ? 'text-ivory/40' : isSelected ? 'text-accent' : 'text-ivory'}`}>
                    {slot}
                  </span>

                  {/* Duration */}
                  <span className="font-mono text-[10px] text-ivory/30 uppercase tracking-wider">
                    90 min
                  </span>

                  {/* Status */}
                  <span className="ml-auto flex items-center gap-1.5 shrink-0">
                    {isBooked ? (
                      <span className="font-sans text-xs text-ivory/30 italic">Vergeben</span>
                    ) : isSelected ? (
                      <>
                        <span className="font-sans text-xs text-accent">Ausgewählt</span>
                        <span className="w-5 h-5 p-1 rounded-full bg-accent text-obsidian flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" strokeWidth={3} />
                        </span>
                      </>
                    ) : (
                      <span className="font-sans text-xs text-accent/60">Verfügbar</span>
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Ghost warning — slot was taken while modal was open */}
        {ghostWarning && (
          <p className="font-sans text-xs text-red-400 text-center px-6 pb-2">
            Dieser Termin wurde soeben gebucht. Bitte wählen Sie einen anderen.
          </p>
        )}

        {/* Fallback notice */}
        {isFallback && !loading && (
          <p className="font-mono text-[10px] text-ivory/25 text-center px-6 pb-2 uppercase tracking-wider">
            Live-Verfügbarkeit nicht geladen — Standardzeiten werden angezeigt
          </p>
        )}

        {/* Footer */}
        <div className="px-4 py-4 border-t border-slate/60 shrink-0 flex flex-col gap-3">
          {/* Selected summary */}
          <div className="text-center min-h-[1.25rem]">
            {pendingTime ? (
              <p className="font-sans text-sm text-ivory/70">
                Ausgewählt:{' '}
                <span className="font-mono font-bold text-accent">{pendingTime} Uhr</span>
              </p>
            ) : (
              <p className="font-sans text-xs text-ivory/30">Wählen Sie eine Zeit aus</p>
            )}
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            disabled={!pendingTime}
            className="btn-magnetic w-full bg-accent text-obsidian py-4 rounded-full font-sans font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-opacity duration-200"
          >
            Termin bestätigen →
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modal, document.body);
}

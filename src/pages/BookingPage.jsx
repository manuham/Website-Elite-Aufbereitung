import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, ArrowLeft, Phone, Mail, MapPin, Plus, X as XIcon, Sparkles, AlertTriangle, Truck } from 'lucide-react';
import { serviceCategories, allInOnePackages } from '../data/services';
import { useAvailability } from '../hooks/useAvailability';
import { submitBooking } from '../lib/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const TIME_SLOTS_WEEKDAY = ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00'];
const TIME_SLOTS_SATURDAY = ['08:00', '09:30', '11:00', '12:30'];

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y, m) { return (new Date(y, m, 1).getDay() + 6) % 7; }

function parsePriceNum(priceStr) {
    const match = priceStr.replace(/\./g, '').match(/€(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDot({ num, label, active, done, totalSteps }) {
    return (
        <div className="flex flex-col items-center gap-1.5">
            <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-sm font-bold transition-all duration-300 border-2 ${done ? 'bg-accent border-accent text-obsidian' : active ? 'bg-transparent border-accent text-accent' : 'bg-transparent border-slate text-ivory/30'}`}
                aria-label={`Schritt ${num} von ${totalSteps}: ${label}${done ? ' (abgeschlossen)' : active ? ' (aktuell)' : ''}`}
                role="listitem"
            >
                {done ? <Check className="w-4 h-4" strokeWidth={3} /> : num}
            </div>
            <span className={`font-sans text-[10px] uppercase tracking-widest transition-colors ${active || done ? 'text-ivory/70' : 'text-ivory/20'}`}>{label}</span>
        </div>
    );
}

function StepBar({ step }) {
    const steps = ['Standort', 'Service', 'Termin', 'Kontakt'];
    return (
        <div className="flex items-start justify-center gap-3 sm:gap-6 mb-16" role="list" aria-label="Buchungsschritte">
            {steps.map((label, i) => (
                <div key={label} className="flex items-center gap-3 sm:gap-6">
                    <StepDot num={i + 1} label={label} active={step === i} done={step > i} totalSteps={steps.length} />
                    {i < steps.length - 1 && (
                        <div className={`h-px w-6 sm:w-14 mt-[-1.25rem] transition-colors duration-500 ${step > i ? 'bg-accent' : 'bg-slate'}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

// ─── Step 0: Service Location Choice ─────────────────────────────────────────

function Step0({ serviceMode, setServiceMode, onNext }) {
    return (
        <div className="flex flex-col gap-10 w-full">
            <div>
                <h2 className="font-drama italic text-4xl sm:text-5xl text-ivory mb-2">Wo soll es stattfinden?</h2>
                <p className="font-sans text-sm text-ivory/50">Wählen Sie, ob Sie zu uns kommen oder wir zu Ihnen kommen sollen.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button
                    onClick={() => setServiceMode('studio')}
                    className={`text-left p-8 rounded-[2rem] border-2 transition-all duration-300 flex flex-col gap-5 group relative overflow-hidden ${serviceMode === 'studio'
                        ? 'bg-accent/10 border-accent shadow-[0_0_30px_rgba(77,178,146,0.2)]'
                        : 'bg-slate/30 border-slate/50 hover:border-ivory/30'}`}
                >
                    <div className="w-14 h-14 rounded-2xl bg-slate/50 border border-slate/60 flex items-center justify-center group-hover:border-accent/40 transition-colors">
                        <MapPin className="w-7 h-7 text-accent" strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <h3 className="font-sans font-bold text-2xl text-ivory">Im Studio</h3>
                        <p className="font-sans text-sm text-ivory/50">Sie bringen Ihr Fahrzeug zu uns</p>
                    </div>
                    <div className="flex items-center gap-2 mt-auto pt-2">
                        <MapPin className="w-4 h-4 text-ivory/40" />
                        <span className="font-sans text-xs text-ivory/40">Bundesstraße 2a, 6714 Nüziders</span>
                    </div>
                    {serviceMode === 'studio' && (
                        <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                            <Check className="w-4 h-4 text-obsidian" strokeWidth={3} />
                        </div>
                    )}
                </button>

                <button
                    onClick={() => setServiceMode('mobil')}
                    className={`text-left p-8 rounded-[2rem] border-2 transition-all duration-300 flex flex-col gap-5 group relative overflow-hidden ${serviceMode === 'mobil'
                        ? 'bg-accent/10 border-accent shadow-[0_0_30px_rgba(77,178,146,0.2)]'
                        : 'bg-slate/30 border-slate/50 hover:border-ivory/30'}`}
                >
                    <span className="absolute top-4 left-4 bg-champagne text-obsidian px-3 py-1 rounded-full font-sans font-bold text-[10px] uppercase tracking-wider">Neu</span>
                    <div className="w-14 h-14 rounded-2xl bg-slate/50 border border-slate/60 flex items-center justify-center group-hover:border-accent/40 transition-colors mt-4">
                        <Truck className="w-7 h-7 text-accent" strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <h3 className="font-sans font-bold text-2xl text-ivory">Mobiler Service</h3>
                        <p className="font-sans text-sm text-ivory/50">Wir kommen direkt zu Ihnen</p>
                    </div>
                    <div className="flex items-center gap-2 mt-auto pt-2">
                        <Truck className="w-4 h-4 text-ivory/40" />
                        <span className="font-sans text-xs text-ivory/40">Vorarlberg & Umgebung</span>
                    </div>
                    {serviceMode === 'mobil' && (
                        <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-accent flex items-center justify-center">
                            <Check className="w-4 h-4 text-obsidian" strokeWidth={3} />
                        </div>
                    )}
                </button>
            </div>

            <div className="flex justify-end mt-2">
                <button
                    onClick={onNext}
                    disabled={!serviceMode}
                    className="btn-magnetic bg-accent text-obsidian px-10 py-4 rounded-full font-sans font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(77,178,146,0.2)]"
                >
                    Weiter →
                </button>
            </div>
        </div>
    );
}

// ─── Step 1: Service Selection (multi-select) ─────────────────────────────────

function Step1({ selectedItems, toggleItem, onNext, onBack }) {
    const [activeTab, setActiveTab] = useState(serviceCategories[0].id);
    const [showDisclaimer, setShowDisclaimer] = useState(false);
    const [pendingItem, setPendingItem] = useState(null);

    const isSelected = (id) => selectedItems.some(i => i.id === id);

    const totalNum = selectedItems.reduce((sum, i) => sum + i.priceNum, 0);
    const totalStr = totalNum > 0 ? `ab €${totalNum.toLocaleString('de-AT')},-` : null;

    // Show disclaimer when adding, toggle directly when removing
    const addWithDisclaimer = (item) => {
        if (isSelected(item.id)) {
            toggleItem(item);
        } else {
            setPendingItem(item);
            setShowDisclaimer(true);
        }
    };

    const confirmDisclaimer = () => {
        if (pendingItem) toggleItem(pendingItem);
        setPendingItem(null);
        setShowDisclaimer(false);
    };

    // Toggle an All-in-One package
    const toggleAIO = (pkg) => {
        addWithDisclaimer({ id: pkg.id, name: pkg.name, price: pkg.price, priceNum: pkg.priceNum, type: 'aio' });
    };

    // Toggle an individual service package
    const toggleService = (cat, pkg, idx) => {
        const id = `${cat.id}-${idx}`;
        const priceNum = parsePriceNum(pkg.price);
        addWithDisclaimer({ id, name: pkg.name, price: pkg.price, priceNum, type: 'service' });
    };

    const activeCategory = serviceCategories.find(c => c.id === activeTab);

    const tabs = [
        ...serviceCategories.map(c => ({ id: c.id, label: c.title })),
        { id: 'aio', label: '✦ All-in-One' },
    ];

    return (
        <div className="flex flex-col gap-10 w-full">
            <div>
                <h2 className="font-drama italic text-4xl sm:text-5xl text-ivory mb-2">Welche Services?</h2>
                <p className="font-sans text-sm text-ivory/50">Wählen Sie beliebig viele Leistungen — Kombinationen sind möglich.</p>
            </div>

            {/* Tab bar */}
            <div className="flex flex-wrap gap-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-5 py-2.5 rounded-full font-sans text-sm font-semibold transition-all duration-200 ${activeTab === tab.id
                            ? 'bg-accent text-obsidian shadow-[0_0_16px_rgba(77,178,146,0.3)]'
                            : 'bg-slate/50 text-ivory/60 border border-slate hover:border-accent/50 hover:text-ivory'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <p className="font-sans text-xs text-ivory/50 text-center">
                Alle Preise sind Endpreise; keine Umsatzsteuer gemäß § 6 Abs. 1 Z 27 UStG.
            </p>

            {/* All-in-One grid */}
            {activeTab === 'aio' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {allInOnePackages.map(pkg => {
                        const selected = isSelected(pkg.id);
                        return (
                            <button
                                key={pkg.id}
                                onClick={() => toggleAIO(pkg)}
                                className={`text-left p-6 rounded-[1.5rem] border transition-all duration-200 flex flex-col gap-4 relative ${selected
                                    ? 'bg-accent/10 border-accent shadow-[0_0_24px_rgba(77,178,146,0.15)]'
                                    : 'bg-slate/30 border-slate/50 hover:border-slate'}`}
                            >
                                {pkg.badge && (
                                    <div className="absolute -top-3 left-6 bg-accent text-obsidian px-4 py-1 rounded-full font-sans font-bold text-[10px] uppercase tracking-wider">
                                        {pkg.badge}
                                    </div>
                                )}

                                <div className="flex items-start justify-between gap-3 mt-1">
                                    <div className="flex flex-col gap-1">
                                        <span className="font-sans font-bold text-lg text-ivory leading-tight">{pkg.name}</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {pkg.includes.map(inc => (
                                                <span key={inc} className="font-mono text-[10px] text-ivory/40 border border-slate/50 rounded-full px-2 py-0.5">{inc}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${selected ? 'bg-accent border-accent' : 'border-slate'}`}>
                                        {selected ? <Check className="w-3.5 h-3.5 text-obsidian" strokeWidth={3} /> : <Plus className="w-3.5 h-3.5 text-ivory/30" />}
                                    </div>
                                </div>

                                <div className="flex items-end justify-between">
                                    <div className="font-mono text-2xl font-bold text-accent">{pkg.price}</div>
                                    <span className="font-sans text-xs text-accent/70 bg-accent/10 px-3 py-1 rounded-full">{pkg.savings}</span>
                                </div>

                                <ul className="flex flex-col gap-1.5">
                                    {pkg.features.map((f, fi) => (
                                        <li key={fi} className="font-sans text-xs text-ivory/50 flex items-start gap-2">
                                            <span className="text-accent mt-0.5 shrink-0">·</span>{f}
                                        </li>
                                    ))}
                                </ul>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Individual service packages */}
            {activeTab !== 'aio' && activeCategory && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {activeCategory.packages.map((pkg, i) => {
                        const id = `${activeCategory.id}-${i}`;
                        const selected = isSelected(id);
                        return (
                            <button
                                key={i}
                                onClick={() => toggleService(activeCategory, pkg, i)}
                                className={`text-left p-6 rounded-[1.5rem] border transition-all duration-200 flex flex-col gap-4 ${selected
                                    ? 'bg-accent/10 border-accent shadow-[0_0_20px_rgba(77,178,146,0.15)]'
                                    : 'bg-slate/30 border-slate/50 hover:border-slate'}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <span className="font-sans font-bold text-lg text-ivory leading-tight">{pkg.name}</span>
                                    <div className={`w-6 h-6 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${selected ? 'bg-accent border-accent' : 'border-slate'}`}>
                                        {selected ? <Check className="w-3.5 h-3.5 text-obsidian" strokeWidth={3} /> : <Plus className="w-3.5 h-3.5 text-ivory/30" />}
                                    </div>
                                </div>
                                <div className="font-mono text-2xl font-bold text-accent">{pkg.price}</div>
                                <ul className="flex flex-col gap-1.5 flex-1">
                                    {pkg.features.slice(0, 4).map((f, fi) => (
                                        <li key={fi} className="font-sans text-xs text-ivory/50 flex items-start gap-2">
                                            <span className="text-accent mt-0.5 shrink-0">·</span>{f}
                                        </li>
                                    ))}
                                    {pkg.features.length > 4 && (
                                        <li className="font-sans text-xs text-ivory/30">+{pkg.features.length - 4} weitere</li>
                                    )}
                                </ul>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Selection basket */}
            {selectedItems.length > 0 && (
                <div className="bg-slate/40 border border-accent/30 rounded-[1.5rem] p-5 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-accent" />
                        <span className="font-sans font-bold text-sm text-ivory uppercase tracking-widest">Ihre Auswahl</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {selectedItems.map(item => (
                            <div key={item.id} className="flex items-center gap-2 bg-obsidian border border-slate/60 rounded-full pl-4 pr-2 py-1.5">
                                <span className="font-sans text-sm text-ivory">{item.name}</span>
                                <span className="font-mono text-xs text-accent">{item.price}</span>
                                <button
                                    onClick={() => toggleItem(item)}
                                    className="w-5 h-5 rounded-full bg-slate/60 hover:bg-accent/20 flex items-center justify-center transition-colors ml-1"
                                >
                                    <XIcon className="w-3 h-3 text-ivory/60" />
                                </button>
                            </div>
                        ))}
                    </div>
                    {totalStr && (
                        <div className="flex items-center justify-between pt-2 border-t border-slate/50">
                            <span className="font-sans text-sm text-ivory/50">Geschätzte Gesamtsumme</span>
                            <span className="font-mono text-xl font-bold text-accent">{totalStr}</span>
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-between mt-2">
                {onBack && (
                    <button onClick={onBack} className="flex items-center gap-2 font-sans text-sm text-ivory/50 hover:text-ivory transition-colors link-lift">
                        <ChevronLeft className="w-4 h-4" /> Zurück
                    </button>
                )}
                <button
                    onClick={onNext}
                    disabled={selectedItems.length === 0}
                    className="btn-magnetic bg-accent text-obsidian px-10 py-4 rounded-full font-sans font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(77,178,146,0.2)] ml-auto"
                >
                    Weiter → {selectedItems.length > 0 && `(${selectedItems.length} Service${selectedItems.length > 1 ? 's' : ''})`}
                </button>
            </div>

            {/* Price disclaimer modal */}
            {showDisclaimer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={confirmDisclaimer}>
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
                    <div className="relative bg-obsidian border border-slate/60 rounded-[2rem] p-8 max-w-md w-full shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col items-center gap-5 text-center" onClick={e => e.stopPropagation()}>
                        <div className="w-14 h-14 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center">
                            <AlertTriangle className="w-7 h-7 text-accent" />
                        </div>
                        <h3 className="font-drama italic text-2xl text-ivory">Preishinweis</h3>
                        <p className="font-sans text-sm text-ivory/60 leading-relaxed">
                            Die angegebenen Preise sind <span className="text-ivory font-semibold">Richtpreise</span> und können je nach Fahrzeuggröße und Verschmutzungsgrad variieren. Der endgültige Preis wird vor Ort individuell festgelegt.
                        </p>
                        <button
                            onClick={confirmDisclaimer}
                            className="btn-magnetic bg-accent text-obsidian px-10 py-3.5 rounded-full font-sans font-bold text-sm shadow-[0_0_16px_rgba(77,178,146,0.25)] mt-2"
                        >
                            Verstanden
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Step 2: Date & Time ──────────────────────────────────────────────────────

function Step2({ datetime, setDatetime, onNext, onBack, serviceMode }) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [viewYear, setViewYear] = useState(today.getFullYear());
    const [viewMonth, setViewMonth] = useState(today.getMonth());

    const { slots, loading: slotsLoading, isFallback } = useAvailability(datetime.date);

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

    const prevMonth = () => viewMonth === 0 ? (setViewMonth(11), setViewYear(y => y - 1)) : setViewMonth(m => m - 1);
    const nextMonth = () => viewMonth === 11 ? (setViewMonth(0), setViewYear(y => y + 1)) : setViewMonth(m => m + 1);

    const selectDate = (day) => {
        const d = new Date(viewYear, viewMonth, day);
        if (d < today || d.getDay() === 0) return;
        setDatetime(dt => ({ ...dt, date: d, time: null }));
    };

    const isDisabled = (day) => {
        const d = new Date(viewYear, viewMonth, day);
        return d < today || d.getDay() === 0;
    };
    const isSelected = (day) => datetime.date && datetime.date.getFullYear() === viewYear && datetime.date.getMonth() === viewMonth && datetime.date.getDate() === day;
    const isToday = (day) => today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

    return (
        <div className="flex flex-col gap-10 w-full">
            <div>
                <h2 className="font-drama italic text-4xl sm:text-5xl text-ivory mb-2">{serviceMode === 'mobil' ? 'Wann sollen wir kommen?' : 'Wann kommen Sie?'}</h2>
                <p className="font-sans text-sm text-ivory/50">Wählen Sie einen verfügbaren Termin. Sonntags geschlossen.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Calendar */}
                <div className="bg-slate/30 border border-slate/50 rounded-[2rem] p-6 flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                        <button onClick={prevMonth} className="w-9 h-9 rounded-full border border-slate hover:border-accent hover:text-accent transition-colors flex items-center justify-center text-ivory/60">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-sans font-semibold text-ivory text-sm tracking-wide">{MONTHS[viewMonth]} {viewYear}</span>
                        <button onClick={nextMonth} className="w-9 h-9 rounded-full border border-slate hover:border-accent hover:text-accent transition-colors flex items-center justify-center text-ivory/60">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {DAYS_SHORT.map(d => (
                            <div key={d} className={`text-center font-mono text-[10px] uppercase tracking-wider py-1 ${d === 'So' ? 'text-ivory/20' : 'text-ivory/40'}`}>{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const disabled = isDisabled(day);
                            const selected = isSelected(day);
                            const todayMark = isToday(day);
                            return (
                                <button key={day} onClick={() => selectDate(day)} disabled={disabled}
                                    className={`aspect-square rounded-xl flex items-center justify-center font-sans text-sm font-medium transition-all duration-150
                                        ${disabled ? 'text-ivory/15 cursor-not-allowed' : 'cursor-pointer hover:bg-accent/20 hover:text-accent'}
                                        ${selected ? 'bg-accent text-obsidian font-bold shadow-[0_0_12px_rgba(77,178,146,0.4)]' : ''}
                                        ${todayMark && !selected ? 'border border-accent/40 text-accent' : ''}
                                        ${!disabled && !selected ? 'text-ivory/80' : ''}`}
                                >{day}</button>
                            );
                        })}
                    </div>
                    <p className="font-mono text-[10px] text-ivory/30 text-center uppercase tracking-wider">Mo – Sa geöffnet</p>
                </div>

                {/* Time slots */}
                <div className="flex flex-col gap-5">
                    {datetime.date ? (
                        <>
                            <div className="font-sans text-sm text-ivory/60">
                                Verfügbare Zeiten am <span className="text-ivory font-semibold">{datetime.date.toLocaleDateString('de-AT', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
                            </div>
                            {slotsLoading ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <div key={i} className="py-3.5 rounded-xl bg-slate/30 border border-slate/50 animate-pulse" />
                                    ))}
                                </div>
                            ) : slots.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {slots.map(slot => (
                                        <button key={slot} onClick={() => setDatetime(dt => ({ ...dt, time: slot }))}
                                            className={`py-3.5 rounded-xl font-mono text-sm font-medium border transition-all duration-150 ${datetime.time === slot
                                                ? 'bg-accent text-obsidian border-accent shadow-[0_0_12px_rgba(77,178,146,0.3)] font-bold'
                                                : 'bg-slate/30 border-slate/50 text-ivory/70 hover:border-accent/50 hover:text-accent'}`}
                                        >{slot}</button>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center py-8">
                                    <p className="font-sans text-sm text-ivory/40 text-center">
                                        An diesem Tag sind leider keine Termine mehr frei.
                                    </p>
                                </div>
                            )}
                            {isFallback && (
                                <p className="font-mono text-[10px] text-ivory/25 text-center">
                                    Live-Verfügbarkeit konnte nicht geladen werden — Standardzeiten werden angezeigt.
                                </p>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="font-sans text-sm text-ivory/30 text-center">← Wählen Sie zuerst ein Datum</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-between mt-2">
                <button onClick={onBack} className="flex items-center gap-2 font-sans text-sm text-ivory/50 hover:text-ivory transition-colors link-lift">
                    <ChevronLeft className="w-4 h-4" /> Zurück
                </button>
                <button onClick={onNext} disabled={!datetime.date || !datetime.time}
                    className="btn-magnetic bg-accent text-obsidian px-10 py-4 rounded-full font-sans font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed">
                    Weiter →
                </button>
            </div>
        </div>
    );
}

// ─── Step 3: Contact Form ─────────────────────────────────────────────────────

const VEHICLE_TYPES = ['PKW / Stadtauto', 'SUV / Geländewagen', 'Kombi / Familienauto', 'Transporter / Sprinter'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d][\d\s\-/]{6,}$/;

function Step3({ contact, setContact, onSubmit, onBack, loading, serviceMode }) {
    const set = (key) => (e) => setContact(c => ({ ...c, [key]: e.target.value }));

    const nameValid = contact.name.trim().length >= 2;
    const phoneValid = PHONE_REGEX.test(contact.phone.trim());
    const emailValid = EMAIL_REGEX.test(contact.email.trim());
    const addressValid = serviceMode !== 'mobil' || (contact.address && contact.address.trim().length >= 5);
    const valid = nameValid && phoneValid && emailValid && contact.vehicle && addressValid;

    const inputClass = "w-full bg-slate/30 border border-slate/60 focus:border-accent outline-none rounded-xl px-4 py-3.5 font-sans text-sm text-ivory placeholder:text-ivory/30 transition-colors";
    const errorClass = "font-sans text-[11px] text-red-400 mt-1";

    return (
        <div className="flex flex-col gap-10 w-full">
            <div>
                <h2 className="font-drama italic text-4xl sm:text-5xl text-ivory mb-2">Ihre Kontaktdaten</h2>
                <p className="font-sans text-sm text-ivory/50">Wir melden uns innerhalb von 24 Stunden zur Bestätigung.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex flex-col gap-2">
                    <label htmlFor="booking-name" className="font-sans text-xs text-ivory/50 uppercase tracking-widest">Vor- & Nachname *</label>
                    <input id="booking-name" type="text" value={contact.name} onChange={set('name')} placeholder="Max Mustermann" className={inputClass} />
                    {contact.name && !nameValid && <span className={errorClass}>Bitte geben Sie Ihren vollständigen Namen ein.</span>}
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="booking-phone" className="font-sans text-xs text-ivory/50 uppercase tracking-widest">Telefonnummer *</label>
                    <input id="booking-phone" type="tel" value={contact.phone} onChange={set('phone')} placeholder="+43 664 000 0000" className={inputClass} />
                    {contact.phone && !phoneValid && <span className={errorClass}>Bitte geben Sie eine gültige Telefonnummer ein.</span>}
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                    <label htmlFor="booking-email" className="font-sans text-xs text-ivory/50 uppercase tracking-widest">E-Mail-Adresse *</label>
                    <input id="booking-email" type="email" value={contact.email} onChange={set('email')} placeholder="max@mustermann.at" className={inputClass} />
                    {contact.email && !emailValid && <span className={errorClass}>Bitte geben Sie eine gültige E-Mail-Adresse ein.</span>}
                </div>
                {serviceMode === 'mobil' && (
                    <div className="flex flex-col gap-2 sm:col-span-2">
                        <label htmlFor="booking-address" className="font-sans text-xs text-ivory/50 uppercase tracking-widest">Adresse (Einsatzort) *</label>
                        <input id="booking-address" type="text" value={contact.address || ''} onChange={set('address')} placeholder="Straße, Hausnummer, PLZ, Ort" className={inputClass} />
                        {contact.address && contact.address.trim().length < 5 && <span className={errorClass}>Bitte geben Sie eine vollständige Adresse ein.</span>}
                    </div>
                )}
                <div className="flex flex-col gap-3 sm:col-span-2">
                    <label className="font-sans text-xs text-ivory/50 uppercase tracking-widest">Fahrzeugtyp *</label>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {VEHICLE_TYPES.map(v => (
                            <button key={v} type="button" onClick={() => setContact(c => ({ ...c, vehicle: v }))}
                                aria-pressed={contact.vehicle === v}
                                className={`py-3 px-4 rounded-xl border font-sans text-sm text-left transition-all ${contact.vehicle === v
                                    ? 'bg-accent/10 border-accent text-ivory'
                                    : 'bg-slate/30 border-slate/50 text-ivory/50 hover:border-slate'}`}
                            >{v}</button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-2 sm:col-span-2">
                    <label htmlFor="booking-notes" className="font-sans text-xs text-ivory/50 uppercase tracking-widest">Anmerkungen</label>
                    <textarea id="booking-notes" rows={3} value={contact.notes} onChange={set('notes')}
                        placeholder="Fahrzeugmodell, Zustand, besondere Wünsche..."
                        className={`${inputClass} resize-none`} />
                </div>
            </div>

            <div className="flex justify-between mt-2">
                <button onClick={onBack} className="flex items-center gap-2 font-sans text-sm text-ivory/50 hover:text-ivory transition-colors link-lift">
                    <ChevronLeft className="w-4 h-4" /> Zurück
                </button>
                <button onClick={onSubmit} disabled={!valid || loading}
                    className="btn-magnetic bg-accent text-obsidian px-10 py-4 rounded-full font-sans font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed">
                    {loading ? 'Wird gesendet...' : 'Anfrage absenden'}
                </button>
            </div>
        </div>
    );
}

// ─── Step 4: Confirmation ─────────────────────────────────────────────────────

function Step4({ selectedItems, datetime, serviceMode, contact }) {
    const total = selectedItems.reduce((s, i) => s + i.priceNum, 0);

    return (
        <div className="flex flex-col items-center text-center gap-10 py-8 w-full max-w-xl mx-auto">
            <div className="w-20 h-20 rounded-full bg-accent/20 border border-accent flex items-center justify-center shadow-[0_0_30px_rgba(77,178,146,0.2)]">
                <Check className="w-10 h-10 text-accent" strokeWidth={2} />
            </div>

            <div className="flex flex-col gap-4">
                <h2 className="font-drama italic text-4xl sm:text-5xl text-ivory">Anfrage erhalten!</h2>
                <p className="font-sans text-base text-ivory/60 leading-relaxed">
                    Vielen Dank. Wir melden uns innerhalb von <span className="text-ivory font-semibold">24 Stunden</span> zur Bestätigung Ihres Termins.
                </p>
            </div>

            <div className="w-full bg-slate/40 border border-slate/60 rounded-[1.5rem] p-6 flex flex-col gap-4 text-left">
                <h3 className="font-sans font-bold text-xs uppercase tracking-widest text-ivory/40">Ihre Buchungsübersicht</h3>

                {/* Services list */}
                <div className="flex flex-col gap-2">
                    {selectedItems.map((item, i) => (
                        <div key={i} className="flex justify-between items-center">
                            <span className="font-sans text-sm text-ivory/70">{item.name}</span>
                            <span className="font-mono text-sm text-accent font-semibold">{item.price}</span>
                        </div>
                    ))}
                </div>

                {selectedItems.length > 1 && (
                    <>
                        <div className="h-px bg-slate/50" />
                        <div className="flex justify-between items-center">
                            <span className="font-sans text-sm font-bold text-ivory">Gesamtsumme</span>
                            <span className="font-mono text-lg font-bold text-accent">ab €{total.toLocaleString('de-AT')},-</span>
                        </div>
                    </>
                )}

                <div className="h-px bg-slate/50" />
                <div className="flex justify-between items-center">
                    <span className="font-sans text-sm text-ivory/60">Service-Art</span>
                    <span className="font-sans text-sm font-semibold text-ivory inline-flex items-center gap-2">
                        {serviceMode === 'mobil' ? (
                            <><Truck className="w-4 h-4 text-accent" /> Mobiler Service</>
                        ) : (
                            <><MapPin className="w-4 h-4 text-accent" /> Im Studio</>
                        )}
                    </span>
                </div>

                <div className="h-px bg-slate/50" />
                <div className="flex justify-between items-center">
                    <span className="font-sans text-sm text-ivory/60">Datum</span>
                    <span className="font-sans text-sm font-semibold text-ivory">
                        {datetime.date?.toLocaleDateString('de-AT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                </div>
                <div className="h-px bg-slate/50" />
                <div className="flex justify-between items-center">
                    <span className="font-sans text-sm text-ivory/60">Uhrzeit</span>
                    <span className="font-mono text-sm font-bold text-accent">{datetime.time} Uhr</span>
                </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
                <p className="font-sans text-xs text-ivory/40 uppercase tracking-widest">Direkter Kontakt</p>
                <div className="flex flex-col sm:flex-row gap-3">
                    <a href="tel:+436642546078" className="flex-1 flex items-center gap-3 bg-slate/30 border border-slate/50 hover:border-accent/50 rounded-xl px-4 py-3 transition-colors group">
                        <Phone className="w-4 h-4 text-accent shrink-0" />
                        <span className="font-sans text-sm text-ivory/70 group-hover:text-ivory">+43 664 2546078</span>
                    </a>
                    <a href="mailto:info.eliteaufbereitung@gmail.com" className="flex-1 flex items-center gap-3 bg-slate/30 border border-slate/50 hover:border-accent/50 rounded-xl px-4 py-3 transition-colors group">
                        <Mail className="w-4 h-4 text-accent shrink-0" />
                        <span className="font-sans text-sm text-ivory/70 group-hover:text-ivory truncate">info.eliteaufbereitung@gmail.com</span>
                    </a>
                </div>
                <div className="flex items-center gap-3 bg-slate/30 border border-slate/50 rounded-xl px-4 py-3">
                    {serviceMode === 'mobil' ? (
                        <>
                            <Truck className="w-4 h-4 text-accent shrink-0" />
                            <div className="flex flex-col">
                                <span className="font-sans text-xs text-accent font-semibold uppercase tracking-wider">Mobiler Service</span>
                                <span className="font-sans text-sm text-ivory/70">{contact?.address}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <MapPin className="w-4 h-4 text-accent shrink-0" />
                            <div className="flex flex-col">
                                <span className="font-sans text-xs text-ivory/40 uppercase tracking-wider">Im Studio</span>
                                <span className="font-sans text-sm text-ivory/70">Bundesstraße 2a, 6714 Nüziders</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <Link to="/" className="btn-magnetic flex items-center gap-2 border border-slate hover:border-accent/50 text-ivory/60 hover:text-ivory px-8 py-3.5 rounded-full font-sans text-sm font-medium transition-all">
                <ArrowLeft className="w-4 h-4" /> Zurück zur Startseite
            </Link>
        </div>
    );
}

// ─── Main BookingPage ─────────────────────────────────────────────────────────

export default function BookingPage() {
    const [searchParams] = useSearchParams();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [serviceMode, setServiceMode] = useState(null);

    const [selectedItems, setSelectedItems] = useState([]);
    const [datetime, setDatetime] = useState({ date: null, time: null });
    const [contact, setContact] = useState({ name: '', phone: '', email: '', vehicle: '', notes: '', address: '' });
    const [submitError, setSubmitError] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        const preselect = searchParams.get('service');
        if (preselect === 'mobil') {
            setServiceMode('mobil');
            setStep(1);
        }
    }, []);

    const toggleItem = (item) => {
        setSelectedItems(prev => {
            const exists = prev.find(i => i.id === item.id);
            return exists ? prev.filter(i => i.id !== item.id) : [...prev, item];
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        setSubmitError(null);

        const dateStr = datetime.date?.toLocaleDateString('de-AT', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
        const yyyy = datetime.date.getFullYear();
        const mm = String(datetime.date.getMonth() + 1).padStart(2, '0');
        const dd = String(datetime.date.getDate()).padStart(2, '0');
        const isoDate = `${yyyy}-${mm}-${dd}`;
        const total = selectedItems.reduce((s, i) => s + i.priceNum, 0);

        try {
            // Create Google Calendar event (primary booking action)
            await submitBooking({
                date: isoDate,
                time: datetime.time,
                services: selectedItems,
                contact,
                serviceMode,
            });

            // Send email notification in parallel (fire-and-forget backup)
            fetch('https://formsubmit.co/ajax/info.eliteaufbereitung@gmail.com', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    _subject: `${serviceMode === 'mobil' ? '[MOBIL] ' : ''}Terminanfrage: ${selectedItems.map(i => i.name).join(' + ')} — ${dateStr}`,
                    _captcha: 'false',
                    _template: 'table',
                    'Service-Art': serviceMode === 'mobil' ? 'Mobiler Service' : 'Im Studio',
                    ...(serviceMode === 'mobil' ? { Einsatzort: contact.address } : { Standort: 'Bundesstraße 2a, 6714 Nüziders' }),
                    Name: contact.name,
                    Telefon: contact.phone,
                    'E-Mail': contact.email,
                    Fahrzeug: contact.vehicle,
                    Datum: dateStr,
                    Uhrzeit: `${datetime.time} Uhr`,
                    Services: selectedItems.map(i => `${i.name} (${i.price})`).join(', '),
                    Gesamtsumme: selectedItems.length > 1 ? `ab €${total.toLocaleString('de-AT')},-` : selectedItems[0]?.price || '',
                    Anmerkungen: contact.notes || '—',
                }),
            }).catch(() => {});

            setStep(4);
        } catch (err) {
            if (err.status === 409 && err.data?.error === 'slot_taken') {
                setSubmitError('Dieser Termin wurde soeben von jemand anderem gebucht. Bitte wählen Sie einen anderen Zeitpunkt.');
                setDatetime(dt => ({ ...dt, time: null }));
                setStep(2);
            } else {
                setSubmitError('Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-obsidian text-ivory font-sans">
            <div className="fixed inset-0 pointer-events-none z-50 opacity-60"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")` }} />

            <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 sm:px-12 py-5 border-b border-slate/30 bg-obsidian/80 backdrop-blur-xl">
                <Link to="/" className="flex items-center gap-2 font-sans text-sm text-ivory/50 hover:text-ivory transition-colors link-lift">
                    <ArrowLeft className="w-4 h-4" /> Zurück
                </Link>
                <img src="/assets/logo-new2.png" alt="Elité Auto Aufbereitung" className="h-[5.5rem] sm:h-[7.5rem] lg:h-[9rem] w-auto object-contain -my-10" />
                <div className="flex items-center gap-2 bg-obsidian/50 px-3 py-1.5 rounded-full border border-slate/50">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    <span className="font-mono text-[10px] text-ivory/60 uppercase tracking-widest">{serviceMode === 'mobil' ? 'Mobiler Service' : 'Studio Offen'}</span>
                </div>
            </header>

            <main className="pt-28 pb-24 px-6 sm:px-12 lg:px-24">
                <div className="max-w-4xl mx-auto">
                    {step < 4 && <StepBar step={step} />}
                    {step === 0 && <Step0 serviceMode={serviceMode} setServiceMode={setServiceMode} onNext={() => setStep(1)} />}
                    {step === 1 && <Step1 selectedItems={selectedItems} toggleItem={toggleItem} onNext={() => setStep(2)} onBack={() => setStep(0)} />}
                    {step === 2 && <Step2 datetime={datetime} setDatetime={setDatetime} onNext={() => setStep(3)} onBack={() => setStep(1)} serviceMode={serviceMode} />}
                    {step === 3 && (
                        <>
                            <Step3 contact={contact} setContact={setContact} onSubmit={handleSubmit} onBack={() => setStep(2)} loading={loading} serviceMode={serviceMode} />
                            {submitError && (
                                <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl px-5 py-4 text-center">
                                    <p className="font-sans text-sm text-red-400">{submitError}</p>
                                    <a href="tel:+436642546078" className="font-sans text-sm text-accent hover:underline mt-2 inline-block">
                                        Direkter Kontakt: +43 664 2546078
                                    </a>
                                </div>
                            )}
                        </>
                    )}
                    {step === 4 && <Step4 selectedItems={selectedItems} datetime={datetime} serviceMode={serviceMode} contact={contact} />}
                </div>
            </main>
        </div>
    );
}

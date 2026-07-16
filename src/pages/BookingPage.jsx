import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, ChevronDown, ArrowLeft, Phone, Mail, MapPin, Plus, X as XIcon, Sparkles, AlertTriangle, Truck, Zap, Gift, Construction, Camera } from 'lucide-react';
import gsap from 'gsap';
import { serviceCategories, tierPackages, allInOnePackages } from '../data/services';
import { useRecommendations } from '../hooks/useRecommendations';
import { useAvailability } from '../hooks/useAvailability';
import { submitBooking } from '../lib/api';
import { summarizePhotoUploads } from '../lib/photoUploads';
import {
    computeBookingDuration, startOfDay, workingSpan,
    sameDayPlan, multiDayStartState, DAY, HORIZON_DAYS, minToTime, durLabel, daysLabel, germanFull,
    multiDayTerms,
} from '../lib/scheduling';
import RecommendationPanel from '../components/booking/RecommendationPanel';
import AvailabilityRail from '../components/booking/AvailabilityRail';
import PhoneConsultModal from '../components/PhoneConsultModal';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const MOBILE_SURCHARGE = 50;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB per photo
// Per-package Mobil-Aufpreis on top of the flat Anfahrtspauschale: the most equipment-intensive
// package in the cart sets it (published €45–85). Max, not sum, so overlapping equipment for two
// premium jobs isn't double-charged and the value stays within the advertised range.
function mobilePackageSurchargeOf(items, serviceMode) {
    if (serviceMode !== 'mobil') return 0;
    return (items || []).reduce((max, i) => Math.max(max, i.mobilSurcharge || 0), 0);
}
// Size-based Aufpreis applies to any package/service flagged `sizeSurcharge: true` in the data.
// The set is DERIVED from that flag (single source of truth) so StepVehicle, Step4 and handleSubmit
// stay in sync automatically — flip the flag in services.js and every surface follows.
// Applies to all full-car services (all tier packages, Handwäsche, Innenreinigung, Politur except
// Spot/Scheinwerfer, Keramik, Verkauf). The per-unit Zusatzpakete add-ons stay surcharge-free.
const SIZE_SURCHARGE_IDS = new Set([
    ...tierPackages.filter(p => p.sizeSurcharge).map(p => p.id),
    ...serviceCategories.flatMap(cat =>
        cat.packages.flatMap((pkg, i) => (pkg.sizeSurcharge ? [`${cat.id}-${i}`] : []))
    ),
]);

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDayOfMonth(y, m) { return (new Date(y, m, 1).getDay() + 6) % 7; }

function parsePriceNum(priceStr) {
    const match = priceStr.replace(/\./g, '').match(/€(\d+)/);
    return match ? parseInt(match[1]) : 0;
}

// ─── Cloudinary photo upload ──────────────────────────────────────────────────

async function uploadPhoto(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'vdrpbzfw');
    const res = await fetch('https://api.cloudinary.com/v1_1/ddtmjszd6/image/upload', {
        method: 'POST',
        body: formData,
    });
    const data = await res.json();
    if (!data.secure_url) throw new Error('Upload fehlgeschlagen');
    return data.secure_url;
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
    const steps = ['Standort', 'Service', 'Fahrzeug', 'Termin', 'Kontakt'];
    return (
        <div className="flex items-start justify-start sm:justify-center gap-3 sm:gap-6 mb-16 overflow-x-auto hide-scrollbar pb-2" role="list" aria-label="Buchungsschritte">
            {steps.map((label, i) => (
                <div key={label} className="flex items-center gap-3 sm:gap-6 shrink-0">
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

function Step0({ serviceMode, setServiceMode, studioLocation, setStudioLocation, onNext }) {
    const [showLocationModal, setShowLocationModal] = useState(false);

    const handleStudioClick = () => {
        setShowLocationModal(true);
    };

    const selectLocation = (loc) => {
        setStudioLocation(loc);
        setServiceMode('studio');
        setShowLocationModal(false);
    };

    return (
        <div className="flex flex-col gap-10 w-full">
            <div>
                <h2 className="font-drama italic text-4xl sm:text-5xl text-ivory mb-2">Wo soll es stattfinden?</h2>
                <p className="font-sans text-sm text-ivory/50">Wählen Sie, ob Sie zu uns kommen oder wir zu Ihnen kommen sollen.</p>
            </div>

            {/* Studio Location Selection Modal */}
            {showLocationModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" onClick={() => setShowLocationModal(false)}>
                    <div className="absolute inset-0 bg-black/70" />
                    <div className="relative bg-obsidian border border-slate/60 rounded-[2rem] p-8 max-w-lg w-full shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col gap-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="font-drama italic text-2xl text-ivory">Standort wählen</h3>
                            <button onClick={() => setShowLocationModal(false)} className="w-8 h-8 rounded-full border border-slate/50 flex items-center justify-center text-ivory/50 hover:text-ivory hover:border-ivory/30 transition-colors">
                                <XIcon className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-4">
                            {/* Feldkirch — available */}
                            <button
                                onClick={() => selectLocation('feldkirch')}
                                className={`text-left p-5 rounded-[1.5rem] border-2 transition-all duration-300 flex flex-col gap-3 group ${studioLocation === 'feldkirch'
                                    ? 'bg-accent/10 border-accent shadow-[0_0_20px_rgba(77,178,146,0.15)]'
                                    : 'bg-slate/30 border-slate/50 hover:border-accent/50'}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <MapPin className="w-5 h-5 text-accent" strokeWidth={1.5} />
                                        <span className="font-sans font-bold text-lg text-ivory">Feldkirch</span>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${studioLocation === 'feldkirch' ? 'bg-accent border-accent' : 'border-slate/60'}`}>
                                        {studioLocation === 'feldkirch' && <Check className="w-3.5 h-3.5 text-obsidian" strokeWidth={3} />}
                                    </div>
                                </div>
                                <span className="font-sans text-sm text-ivory/60">Ketschenstraße 1, 6800 Feldkirch</span>
                            </button>

                            {/* Nüziders — gesperrt */}
                            <div className="relative p-5 rounded-[1.5rem] border-2 border-slate/30 bg-slate/20 flex flex-col gap-3 opacity-60 cursor-not-allowed">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Construction className="w-5 h-5 text-amber-500" strokeWidth={1.5} />
                                        <span className="font-sans font-bold text-lg text-ivory/60">Nüziders</span>
                                    </div>
                                    <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">Gesperrt</span>
                                </div>
                                <span className="font-sans text-sm text-ivory/40">Bundesstraße 2a, 6714 Nüziders</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500/70" />
                                    <span className="font-sans text-xs text-amber-500/70">Wegen Bauarbeiten gesperrt bis September 2026</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button
                    onClick={handleStudioClick}
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
                        <span className="font-sans text-xs text-ivory/40">
                            {studioLocation === 'feldkirch' ? 'Ketschenstraße 1, 6800 Feldkirch' : '2 Standorte verfügbar'}
                        </span>
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
                        <span className="font-mono text-xs text-champagne mt-1">+€{MOBILE_SURCHARGE},- Anfahrtspauschale</span>
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

function Step1({ selectedItems, toggleItem, onNext, onBack, recommendations, packageSuggestion, onReplaceWithPackage, serviceMode }) {
    const [activeTab, setActiveTab] = useState(serviceCategories[0].id);
    const [showDisclaimer, setShowDisclaimer] = useState(false);
    const [pendingItem, setPendingItem] = useState(null);
    const [phoneModal, setPhoneModal] = useState(null);
    // Cards whose full feature list is expanded ("+X weitere Leistungen")
    const [expandedCards, setExpandedCards] = useState({});
    const toggleExpanded = (id) => setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));

    const isSelected = (id) => selectedItems.some(i => i.id === id);

    const serviceNum = selectedItems.reduce((sum, i) => sum + i.priceNum, 0);
    const mobileSurcharge = serviceMode === 'mobil' ? MOBILE_SURCHARGE : 0;
    const mobilePkgSurcharge = mobilePackageSurchargeOf(selectedItems, serviceMode);
    const totalNum = serviceNum + mobileSurcharge + mobilePkgSurcharge;
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
        const priceNum = parseInt(pkg.price.replace(/[^\d]/g, ''));
        addWithDisclaimer({
            id: pkg.id, name: `${pkg.tier} – ${pkg.name}`, price: pkg.price, priceNum, type: 'aio',
            durationMin: pkg.durationMin ?? null, durationDays: pkg.durationDays ?? null,
            mobilExtraMin: pkg.mobilExtraMin ?? 0, mobilSurcharge: pkg.mobilSurcharge ?? 0,
        });
    };

    // Toggle an individual service package
    const toggleService = (cat, pkg, idx) => {
        const id = `${cat.id}-${idx}`;
        const priceNum = parsePriceNum(pkg.price);
        addWithDisclaimer({
            id, name: pkg.name, price: pkg.price, priceNum, type: 'service',
            durationMin: pkg.durationMin ?? null, durationDays: pkg.durationDays ?? null,
            mobilExtraMin: pkg.mobilExtraMin ?? 0, mobilSurcharge: pkg.mobilSurcharge ?? 0,
        });
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
                    {tierPackages.map(pkg => {
                        const selected = isSelected(pkg.id);
                        const isElite = pkg.id === 'tier-elite';
                        const textFeatures = pkg.features.filter(f => !f.section);
                        const expanded = !!expandedCards[pkg.id];
                        const visibleFeatures = expanded ? textFeatures : textFeatures.slice(0, 5);
                        const extraCount = textFeatures.length - 5;
                        const selectCard = () => pkg.phoneOnly ? setPhoneModal(`${pkg.tier} – ${pkg.name}`) : toggleAIO(pkg);
                        return (
                            <div
                                key={pkg.id}
                                role="button"
                                tabIndex={0}
                                onClick={selectCard}
                                onKeyDown={(e) => {
                                    if (e.target !== e.currentTarget) return;
                                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectCard(); }
                                }}
                                className={`text-left cursor-pointer rounded-[1.5rem] border transition-all duration-200 flex flex-col overflow-hidden relative ${selected
                                    ? 'border-accent shadow-[0_0_24px_rgba(77,178,146,0.15)]'
                                    : isElite ? 'border-accent/30 hover:border-accent/60' : 'bg-slate/30 border-slate/50 hover:border-slate'}`}
                            >
                                {/* Gradient header */}
                                <div className="px-5 pt-4 pb-3" style={pkg.headerStyle}>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        {pkg.dots > 0 ? (
                                            Array.from({ length: pkg.dots }).map((_, i) => (
                                                <span key={i} className="w-2 h-2 rounded-full bg-white/80" />
                                            ))
                                        ) : (
                                            <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                                        )}
                                        <span className="font-sans font-black text-[10px] uppercase tracking-widest text-white/90 ml-1">{pkg.tier}</span>
                                    </div>
                                    <h3 className="font-drama italic text-2xl text-white leading-tight">{pkg.name}</h3>
                                    <p className="font-sans text-xs text-white/60 mt-0.5">{pkg.subtitle}</p>
                                </div>

                                {/* Body */}
                                <div className="p-5 flex flex-col gap-3 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="font-mono text-2xl font-bold text-accent">{pkg.price}</div>
                                        {pkg.phoneOnly ? (
                                            <span className="flex items-center gap-1 shrink-0 mt-0.5 px-2.5 py-1 rounded-full border border-champagne/40 bg-champagne/10 text-champagne font-sans text-[10px] font-bold uppercase tracking-wider">
                                                <Phone className="w-3 h-3" /> Nur auf Termin
                                            </span>
                                        ) : (
                                            <div className={`w-6 h-6 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${selected ? 'bg-accent border-accent' : 'border-slate'}`}>
                                                {selected ? <Check className="w-3.5 h-3.5 text-obsidian" strokeWidth={3} /> : <Plus className="w-3.5 h-3.5 text-ivory/30" />}
                                            </div>
                                        )}
                                    </div>

                                    <ul className="flex flex-col gap-1.5">
                                        {visibleFeatures.map((f, fi) => (
                                            <li key={fi} className="font-sans text-xs text-ivory/50 flex items-start gap-2">
                                                <span className="text-accent mt-0.5 shrink-0">·</span>
                                                <span className={f.muted ? 'text-ivory/30' : ''}>{f.text}</span>
                                            </li>
                                        ))}
                                        {extraCount > 0 && (
                                            <li className="ml-4">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); toggleExpanded(pkg.id); }}
                                                    className="font-sans text-xs text-ivory/40 hover:text-accent transition-colors flex items-center gap-1"
                                                >
                                                    {expanded ? 'Weniger anzeigen' : `+${extraCount} weitere Leistungen`}
                                                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                                                </button>
                                            </li>
                                        )}
                                    </ul>

                                    {pkg.gift && (
                                        <div className="flex items-center gap-2 bg-accent/10 rounded-lg px-3 py-2 mt-auto">
                                            <Gift className="w-4 h-4 text-accent shrink-0" />
                                            <span className="font-sans text-xs text-accent font-semibold">{pkg.gift.title}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
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
                        const expanded = !!expandedCards[id];
                        const visibleFeatures = expanded ? pkg.features : pkg.features.slice(0, 4);
                        const selectCard = () => pkg.phoneOnly ? setPhoneModal(pkg.name) : toggleService(activeCategory, pkg, i);
                        return (
                            <div
                                key={i}
                                role="button"
                                tabIndex={0}
                                onClick={selectCard}
                                onKeyDown={(e) => {
                                    if (e.target !== e.currentTarget) return;
                                    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectCard(); }
                                }}
                                className={`text-left cursor-pointer p-6 rounded-[1.5rem] border transition-all duration-200 flex flex-col gap-4 ${selected
                                    ? 'bg-accent/10 border-accent shadow-[0_0_20px_rgba(77,178,146,0.15)]'
                                    : 'bg-slate/30 border-slate/50 hover:border-slate'}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <span className="font-sans font-bold text-lg text-ivory leading-tight">{pkg.name}</span>
                                    {pkg.phoneOnly ? (
                                        <span className="flex items-center gap-1 shrink-0 mt-0.5 px-2.5 py-1 rounded-full border border-champagne/40 bg-champagne/10 text-champagne font-sans text-[10px] font-bold uppercase tracking-wider">
                                            <Phone className="w-3 h-3" /> Nur auf Termin
                                        </span>
                                    ) : (
                                        <div className={`w-6 h-6 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${selected ? 'bg-accent border-accent' : 'border-slate'}`}>
                                            {selected ? <Check className="w-3.5 h-3.5 text-obsidian" strokeWidth={3} /> : <Plus className="w-3.5 h-3.5 text-ivory/30" />}
                                        </div>
                                    )}
                                </div>
                                <div className="font-mono text-2xl font-bold text-accent">{pkg.price}</div>
                                <ul className="flex flex-col gap-1.5 flex-1">
                                    {visibleFeatures.map((f, fi) => (
                                        <li key={fi} className="font-sans text-xs text-ivory/50 flex items-start gap-2">
                                            <span className="text-accent mt-0.5 shrink-0">·</span>{f}
                                        </li>
                                    ))}
                                    {pkg.features.length > 4 && (
                                        <li>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); toggleExpanded(id); }}
                                                className="font-sans text-xs text-ivory/40 hover:text-accent transition-colors flex items-center gap-1"
                                            >
                                                {expanded ? 'Weniger anzeigen' : `+${pkg.features.length - 4} weitere`}
                                                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                                            </button>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Smart recommendations */}
            {selectedItems.length > 0 && (recommendations.length > 0 || packageSuggestion) && (
                <RecommendationPanel
                    recommendations={recommendations}
                    packageSuggestion={packageSuggestion}
                    onAddService={(service) => addWithDisclaimer(service)}
                    onReplaceWithPackage={onReplaceWithPackage}
                />
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
                    {serviceMode === 'mobil' && (
                        <div className="flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full pl-4 pr-4 py-1.5">
                            <Truck className="w-3.5 h-3.5 text-accent" />
                            <span className="font-sans text-sm text-ivory">Anfahrtspauschale</span>
                            <span className="font-mono text-xs text-champagne font-semibold ml-auto">+€{MOBILE_SURCHARGE},-</span>
                        </div>
                    )}
                    {mobilePkgSurcharge > 0 && (
                        <div className="flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-full pl-4 pr-4 py-1.5">
                            <Truck className="w-3.5 h-3.5 text-accent" />
                            <span className="font-sans text-sm text-ivory">Mobil-Aufpreis (Premium-Paket)</span>
                            <span className="font-mono text-xs text-champagne font-semibold ml-auto">+€{mobilePkgSurcharge},-</span>
                        </div>
                    )}
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" onClick={confirmDisclaimer}>
                    <div className="absolute inset-0 bg-black/70" />
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

            {/* "Nur auf Termin" services — route to phone/email instead of the cart */}
            {phoneModal && (
                <PhoneConsultModal packageName={phoneModal} onClose={() => setPhoneModal(null)} />
            )}
        </div>
    );
}

// ─── Step 2: Vehicle Category ────────────────────────────────────────────────

const VEHICLE_CATEGORIES = [
    { id: 'kleinwagen', name: 'Kleinwagen', examples: 'z. B. VW Polo, Ford Fiesta', description: 'Kurze Autos, 2–4 Türen', aufpreis: 0 },
    { id: 'kompakt', name: 'Kompaktklasse', examples: 'z. B. VW Golf, Audi A3', description: 'Standardgröße, die meisten Autos', aufpreis: 55 },
    { id: 'mittelklasse', name: 'Mittelklasse / Limousine', examples: 'z. B. BMW 3er, Mercedes C-Klasse, Audi A6', description: 'Länger, oft 4 Türen + Kofferraum', aufpreis: 75 },
    { id: 'suv', name: 'SUV / Van', examples: 'z. B. VW Tiguan, BMW X5, Sharan', description: 'Höher, größer, mehr Innenraum', aufpreis: 95 },
    { id: 'gross', name: 'Großfahrzeuge / Transporter', examples: 'z. B. VW Bus, Sprinter, Transporter', description: 'Deutlich größer, gewerblich/Family Vans', aufpreis: null },
];

function StepVehicle({ vehicleCategory, setVehicleCategory, selectedItems, onNext, onBack, serviceMode }) {
    const serviceTotal = selectedItems.reduce((sum, i) => sum + i.priceNum, 0);
    const mobileSurcharge = serviceMode === 'mobil' ? MOBILE_SURCHARGE : 0;
    const mobilePkgSurcharge = mobilePackageSurchargeOf(selectedItems, serviceMode);
    // Size surcharge only counts when a sizeSurcharge-flagged service/package is in the cart.
    const appliesSurcharge = selectedItems.some(i => SIZE_SURCHARGE_IDS.has(i.id));

    return (
        <div className="flex flex-col gap-10 w-full">
            <div>
                <h2 className="font-drama italic text-4xl sm:text-5xl text-ivory mb-2">Ihr Fahrzeug</h2>
                <p className="font-sans text-sm text-ivory/50">
                    {appliesSurcharge
                        ? 'Der Größen-Aufpreis richtet sich nach der Fahrzeuggröße.'
                        : 'Hilft uns bei der Planung. Ein Größen-Aufpreis fällt nur bei bestimmten Leistungen an.'}
                </p>
            </div>

            <div className="flex flex-col gap-3">
                {VEHICLE_CATEGORIES.map(cat => {
                    const selected = vehicleCategory?.id === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setVehicleCategory(cat)}
                            className={`text-left p-5 sm:p-6 rounded-[1.5rem] border transition-all duration-200 flex items-center gap-4 sm:gap-5 ${selected
                                ? 'bg-accent/10 border-accent shadow-[0_0_20px_rgba(77,178,146,0.15)]'
                                : 'bg-slate/30 border-slate/50 hover:border-slate'}`}
                        >
                            <div className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${selected ? 'bg-accent border-accent' : 'border-slate'}`}>
                                {selected && <Check className="w-3.5 h-3.5 text-obsidian" strokeWidth={3} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="font-sans font-bold text-base text-ivory">{cat.name}</span>
                                <span className="font-sans text-xs text-ivory/40 block">{cat.examples}</span>
                                <span className="font-sans text-[11px] text-ivory/25">{cat.description}</span>
                            </div>
                            <div className="shrink-0">
                                {!appliesSurcharge ? (
                                    <span className="font-mono text-sm text-ivory/40 font-semibold">kein Aufpreis</span>
                                ) : cat.aufpreis === null ? (
                                    <span className="font-mono text-sm text-champagne font-semibold">auf Anfrage</span>
                                ) : cat.aufpreis === 0 ? (
                                    <span className="font-mono text-sm text-accent font-semibold">kein Aufpreis</span>
                                ) : (
                                    <span className="font-mono text-sm text-accent font-semibold">+€{cat.aufpreis},-</span>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {vehicleCategory && serviceTotal > 0 && (
                <div className="bg-slate/40 border border-accent/30 rounded-[1.5rem] p-5 flex flex-col gap-3">
                    {serviceMode === 'mobil' && (
                        <div className="flex items-center justify-between">
                            <span className="font-sans text-sm text-ivory/50 inline-flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-accent" /> Anfahrtspauschale</span>
                            <span className="font-mono text-sm text-champagne font-semibold">+€{MOBILE_SURCHARGE},-</span>
                        </div>
                    )}
                    {mobilePkgSurcharge > 0 && (
                        <div className="flex items-center justify-between">
                            <span className="font-sans text-sm text-ivory/50 inline-flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-accent" /> Mobil-Aufpreis (Premium-Paket)</span>
                            <span className="font-mono text-sm text-champagne font-semibold">+€{mobilePkgSurcharge},-</span>
                        </div>
                    )}
                    {appliesSurcharge && vehicleCategory.aufpreis > 0 && (
                        <div className="flex items-center justify-between">
                            <span className="font-sans text-sm text-ivory/50">Größen-Aufpreis ({vehicleCategory.name})</span>
                            <span className="font-mono text-sm text-champagne font-semibold">+€{vehicleCategory.aufpreis},-</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <span className="font-sans text-sm text-ivory/50">Geschätzte Gesamtsumme</span>
                        {appliesSurcharge && vehicleCategory.aufpreis === null ? (
                            <div className="flex flex-col items-end gap-0.5">
                                <span className="font-mono text-lg font-bold text-accent">ab €{(serviceTotal + mobileSurcharge + mobilePkgSurcharge).toLocaleString('de-AT')},-</span>
                                <span className="font-mono text-[10px] text-champagne">+ Aufpreis auf Anfrage</span>
                            </div>
                        ) : (
                            <span className="font-mono text-xl font-bold text-accent">
                                ab €{(serviceTotal + (appliesSurcharge ? (vehicleCategory.aufpreis || 0) : 0) + mobileSurcharge + mobilePkgSurcharge).toLocaleString('de-AT')},-
                            </span>
                        )}
                    </div>
                    {!appliesSurcharge && (
                        <p className="font-sans text-[11px] text-ivory/40">Für die gewählten Leistungen fällt kein Größen-Aufpreis an.</p>
                    )}
                </div>
            )}

            <div className="flex justify-between mt-2">
                <button onClick={onBack} className="flex items-center gap-2 font-sans text-sm text-ivory/50 hover:text-ivory transition-colors link-lift">
                    <ChevronLeft className="w-4 h-4" /> Zurück
                </button>
                <button onClick={onNext} disabled={!vehicleCategory}
                    className="btn-magnetic bg-accent text-obsidian px-10 py-4 rounded-full font-sans font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(77,178,146,0.2)] ml-auto"
                >
                    Weiter →
                </button>
            </div>
        </div>
    );
}

// ─── Step 3: Date & Time ──────────────────────────────────────────────────────

function Step2({ datetime, setDatetime, onNext, onBack, serviceMode, selectedItems }) {
    // `now` must not be frozen at mount: a tab left open past midnight would anchor the horizon to
    // yesterday and keep shading today as past. Tick on the poll interval, but bucket to the minute
    // so everything downstream memoises on a stable key instead of a per-tick Date identity.
    // Truncating to the minute is exact for scheduling — sameDayPlan only reads hours + minutes.
    const [nowTick, setNowTick] = useState(() => Date.now());
    useEffect(() => {
        const id = setInterval(() => setNowTick(Date.now()), 30_000);
        return () => clearInterval(id);
    }, []);
    const nowKey = Math.floor(nowTick / 60_000);
    const now = useMemo(() => new Date(nowKey * 60_000), [nowKey]);

    const duration = useMemo(() => computeBookingDuration(selectedItems, serviceMode), [selectedItems, serviceMode]);
    const durKey = duration.multiDay ? `m${duration.spanDays}` : `s${duration.durationMin}`;

    const [ghostWarning, setGhostWarning] = useState(null);
    const [phoneModal, setPhoneModal] = useState(false);
    const prevDurKey = useRef(durKey);

    // One horizon anchored on today. The rail renders every free day inside it, so there is no
    // week to page through — no per-arrow fetch, no mobile/desktop split.
    const horizonStart = useMemo(() => startOfDay(now), [now]);
    const { avail, loading, hasLoaded, isFallback, isStale, refresh } = useAvailability(horizonStart, HORIZON_DAYS, true);

    const selectSameDay = (date, time) => {
        setGhostWarning(null);
        setDatetime(dt => ({ ...dt, date, time, multiDay: false, spanDays: null, endDate: null }));
    };
    const selectMultiDay = (date) => {
        setGhostWarning(null);
        const span = workingSpan(date, duration.spanDays);
        setDatetime(dt => ({ ...dt, date, time: null, multiDay: true, spanDays: duration.spanDays, endDate: span[span.length - 1] || date }));
    };
    const clearPick = () => {
        setGhostWarning(null);
        setDatetime(dt => ({ ...dt, date: null, time: null, multiDay: duration.multiDay, spanDays: null, endDate: null }));
    };

    // Switching service (duration) invalidates the current pick.
    useEffect(() => {
        if (prevDurKey.current !== durKey) {
            prevDurKey.current = durKey;
            setDatetime(dt => ({ ...dt, date: null, time: null, multiDay: duration.multiDay, spanDays: null, endDate: null }));
        }
    }, [durKey, duration.multiDay, setDatetime]);

    // Ghost-booking guard: a poll showing the pick is gone clears it and says why.
    //
    // Gates on COVERAGE, never on `loading`. React 18 batches the hook's setBusyByIso with its
    // setLoading(false), so `loading` was already false in the very commit the new map landed —
    // the old `if (loading) return` never guarded anything. The pick used to survive a week change
    // only because an unfetched day read as free; now that unknown is honest, the guard has to be
    // explicit or it would clear valid picks with a false "soeben vergeben".
    //
    // Only a definite FULL clears. UNKNOWN must not: during a Google outage every day is unknown,
    // and clearing on that would wipe every in-flight pick site-wide over a server hiccup.
    useEffect(() => {
        if (!datetime.date) return;
        if (duration.multiDay) {
            if (multiDayStartState(datetime.date, duration.spanDays, avail, now) === DAY.FULL) {
                setGhostWarning({ reason: 'multiday' });
                setDatetime(dt => ({ ...dt, date: null, time: null }));
            }
        } else if (datetime.time) {
            if (!avail.isKnown(datetime.date)) return;
            const plan = sameDayPlan(datetime.date, duration.durationMin, avail.busy(datetime.date), now);
            if (!plan.free.some(b => minToTime(b.start) === datetime.time)) {
                setGhostWarning({
                    reason: plan.free.length === 0 ? 'day-full' : 'time-taken',
                    day: germanFull(datetime.date),
                });
                setDatetime(dt => ({ ...dt, time: null }));
            }
        }
    }, [avail, datetime.date, datetime.time, duration, now, setDatetime]);

    const ready = duration.multiDay
        ? (!!datetime.date && datetime.multiDay === true && !!datetime.endDate)
        : (!!datetime.date && !!datetime.time);

    const terms = multiDayTerms(serviceMode);

    // Split by cause. "Dieser Termin wurde soeben vergeben" was wrong for the commonest case —
    // usually only the one time slot went, and the day still has others. Vocabulary: a whole day is
    // "ausgebucht", a single interval is "belegt". The multi-day wording comes from multiDayTerms
    // (mobil says Starttag, studio says Abgabetag) — never hardcode it here.
    const ghostText = useMemo(() => {
        if (!ghostWarning) return null;
        if (ghostWarning.reason === 'time-taken') {
            return 'Diese Uhrzeit wurde soeben vergeben. Bitte wählen Sie eine andere.';
        }
        if (ghostWarning.reason === 'day-full') {
            return `Dieser Termin wurde soeben vergeben — der ${ghostWarning.day} ist jetzt ausgebucht. Bitte wählen Sie einen anderen Tag.`;
        }
        return `Dieser ${terms.chooseDay} ist nicht mehr verfügbar — in Ihrem Zeitraum wurde inzwischen ein Termin vergeben. Bitte wählen Sie einen anderen ${terms.chooseDay}.`;
    }, [ghostWarning, terms]);

    let summary = null;
    if (duration.multiDay && datetime.date) {
        const span = workingSpan(datetime.date, duration.spanDays);
        summary = `${terms.start} ${germanFull(span[0])} ${terms.startTime} · ${terms.end} ${germanFull(span[span.length - 1])} ${terms.endTime}`;
    } else if (!duration.multiDay && datetime.date && datetime.time) {
        const [h, m] = datetime.time.split(':').map(Number);
        summary = `${germanFull(datetime.date)} · ${datetime.time}–${minToTime(h * 60 + m + duration.durationMin)} Uhr`;
    }

    const subline = duration.multiDay
        ? `${terms.stay(daysLabel(duration.spanDays))} — wählen Sie einen ${terms.chooseDay}.`
        : `Dauer ca. ${durLabel(duration.durationMin)} — wählen Sie einen freien Termin.`;

    const noData = !loading && (isFallback || (isStale && !hasLoaded));
    const showStale = isStale && hasLoaded && !isFallback;

    return (
        <div className="flex flex-col gap-8 w-full">
            <div>
                <h2 className="font-drama italic text-4xl sm:text-5xl text-ivory mb-2">Wann passt es Ihnen?</h2>
                <p className="font-sans text-sm text-ivory/50">{subline}</p>
            </div>

            {/* A stale poll (data still real, just older) keeps the rail and shows a soft note above
                it — it changes the meaning of what's below, so it can't sit under the fold. A total
                outage (noData) is handled inside the rail, which replaces the list with a phone CTA
                rather than a wall of fabricated free days. */}
            {showStale && (
                <div className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30" role="status">
                    <p className="font-sans text-xs text-amber-300/90 text-center leading-relaxed">
                        Live-Verfügbarkeit gerade nicht abrufbar — wir bestätigen Ihren Wunschtermin telefonisch.
                    </p>
                </div>
            )}
            {ghostText && (
                <p className="font-sans text-xs text-red-400 text-center" role="alert">{ghostText}</p>
            )}

            <AvailabilityRail
                duration={duration}
                avail={avail}
                now={now}
                selected={datetime}
                serviceMode={serviceMode}
                hasLoaded={hasLoaded}
                pending={loading}
                noData={noData}
                onSelectSameDay={selectSameDay}
                onSelectMultiDay={selectMultiDay}
                onRetry={refresh}
                onPhone={() => setPhoneModal(true)}
            />
            <p className="font-mono text-[10px] text-ivory/30 text-center uppercase tracking-wider">
                Alle Zeitangaben sind Richtwerte und können je nach Fahrzeugzustand variieren.
            </p>

            {summary && (
                <div className="bg-slate/40 border border-accent/30 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex flex-col">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-ivory/40">{duration.multiDay ? 'Ihr Zeitraum' : 'Ihr Termin'}</span>
                        <span className="font-sans text-sm text-accent">{summary}</span>
                    </div>
                    <button onClick={clearPick} className="font-sans text-xs text-ivory/50 hover:text-ivory underline">ändern</button>
                </div>
            )}

            <div className="flex justify-between mt-2">
                <button onClick={onBack} className="flex items-center gap-2 font-sans text-sm text-ivory/50 hover:text-ivory transition-colors link-lift">
                    <ChevronLeft className="w-4 h-4" /> Zurück
                </button>
                <button onClick={onNext} disabled={!ready}
                    className="btn-magnetic bg-accent text-obsidian px-10 py-4 rounded-full font-sans font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed">
                    Weiter →
                </button>
            </div>

            {phoneModal && (
                <PhoneConsultModal
                    eyebrow="Terminanfrage"
                    title="Wir finden Ihren Termin"
                    body="Online ist gerade nichts Passendes frei. Rufen Sie uns an — wir planen Ihren Termin persönlich und finden oft kurzfristig eine Lösung."
                    onClose={() => setPhoneModal(false)}
                />
            )}
        </div>
    );
}

// ─── Step 4: Contact Form ─────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d][\d\s\-/]{6,}$/;

function Step3({ contact, setContact, honeypot, setHoneypot, photos, setPhotos, photoPreviews, setPhotoPreviews, onSubmit, onBack, loading, uploadingPhotos, serviceMode }) {
    const set = (key) => (e) => setContact(c => ({ ...c, [key]: e.target.value }));

    const nameValid = contact.name.trim().length >= 2;
    const phoneValid = PHONE_REGEX.test(contact.phone.trim());
    const emailValid = EMAIL_REGEX.test(contact.email.trim());
    const addressValid = serviceMode !== 'mobil' || (contact.address && contact.address.trim().length >= 5);
    const consentValid = contact.consent === true;
    const valid = nameValid && phoneValid && emailValid && addressValid && photos.length >= 1 && consentValid;

    const inputClass = "input-elite w-full bg-slate/30 border border-slate/60 outline-none rounded-xl px-4 py-3.5 font-sans text-sm text-ivory placeholder:text-ivory/30";
    const errorClass = "font-sans text-[11px] text-red-400 mt-1";

    const addPhotos = (files) => {
        const imageFiles = files.filter(f => f.type.startsWith('image/') && f.size <= MAX_PHOTO_BYTES);
        const allowed = imageFiles.slice(0, 4 - photos.length);
        if (allowed.length === 0) return;
        setPhotos(prev => [...prev, ...allowed]);
        setPhotoPreviews(prev => [...prev, ...allowed.map(f => URL.createObjectURL(f))]);
    };

    const removePhoto = (index) => {
        URL.revokeObjectURL(photoPreviews[index]);
        setPhotos(prev => prev.filter((_, i) => i !== index));
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const buttonLabel = uploadingPhotos ? 'Fotos werden hochgeladen...' : loading ? 'Wird gesendet...' : 'Anfrage absenden';

    return (
        <div className="flex flex-col gap-10 w-full">
            {/* Honeypot: hidden from users, tempting to bots. A filled value → server drops the request. */}
            <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
            />
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
                <div className="flex flex-col gap-2 sm:col-span-2">
                    <label htmlFor="booking-notes" className="font-sans text-xs text-ivory/50 uppercase tracking-widest">Anmerkungen</label>
                    <textarea id="booking-notes" rows={3} value={contact.notes} onChange={set('notes')}
                        placeholder="Fahrzeugmodell, Zustand, besondere Wünsche..."
                        className={`${inputClass} resize-none`} />
                </div>
            </div>

            {/* Photo upload */}
            <div className="flex flex-col gap-4">
                <div>
                    <p className="font-sans text-xs text-ivory/50 uppercase tracking-widest">
                        Fahrzeugfotos * <span className="normal-case text-ivory/30">(1–4 Fotos)</span>
                    </p>
                    <p className="font-sans text-xs text-ivory/30 mt-1">
                        Laden Sie Fotos hoch, damit wir den Zustand Ihres Fahrzeugs einschätzen können.
                    </p>
                </div>

                {photos.length < 4 && (
                    <label
                        className="flex flex-col items-center justify-center gap-3 p-8 rounded-[1.5rem] border-2 border-dashed border-slate/60 hover:border-accent/50 cursor-pointer transition-colors group"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => { e.preventDefault(); addPhotos(Array.from(e.dataTransfer.files)); }}
                    >
                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addPhotos(Array.from(e.target.files))} />
                        <Camera className="w-8 h-8 text-ivory/30 group-hover:text-accent/60 transition-colors" />
                        <div className="text-center">
                            <span className="font-sans text-sm text-ivory/50 group-hover:text-ivory/70 block">Fotos auswählen oder hierher ziehen</span>
                            <span className="font-mono text-[10px] text-ivory/25 uppercase tracking-wider">{photos.length} / 4 Fotos</span>
                        </div>
                    </label>
                )}

                {photoPreviews.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {photoPreviews.map((src, i) => (
                            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate/60 group">
                                <img src={src} className="w-full h-full object-cover" alt={`Foto ${i + 1}`} />
                                <button
                                    type="button"
                                    onClick={() => removePhoto(i)}
                                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                                >
                                    <XIcon className="w-3 h-3 text-white" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {photos.length === 0 && (
                    <p className="font-sans text-[11px] text-ivory/35">Bitte laden Sie mindestens 1 Foto hoch.</p>
                )}
            </div>

            {/* Consent */}
            <label className="flex items-start gap-3 cursor-pointer">
                <input
                    type="checkbox"
                    checked={contact.consent === true}
                    onChange={(e) => setContact(c => ({ ...c, consent: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 shrink-0 accent-accent cursor-pointer"
                />
                <span className="font-sans text-xs text-ivory/50 leading-relaxed">
                    Ich akzeptiere die{' '}
                    <a href="/datenschutz" target="_blank" rel="noreferrer" className="text-champagne hover:underline">Datenschutzerklärung</a>,{' '}
                    <a href="/agb" target="_blank" rel="noreferrer" className="text-champagne hover:underline">AGB</a>{' '}
                    und{' '}
                    <a href="/widerruf" target="_blank" rel="noreferrer" className="text-champagne hover:underline">Widerrufsbelehrung</a>.
                </span>
            </label>

            <div className="flex justify-between mt-2">
                <button onClick={onBack} className="flex items-center gap-2 font-sans text-sm text-ivory/50 hover:text-ivory transition-colors link-lift">
                    <ChevronLeft className="w-4 h-4" /> Zurück
                </button>
                <button onClick={onSubmit} disabled={!valid || loading || uploadingPhotos}
                    className="btn-magnetic bg-accent text-obsidian px-10 py-4 rounded-full font-sans font-bold text-sm disabled:opacity-30 disabled:cursor-not-allowed">
                    {buttonLabel}
                </button>
            </div>
        </div>
    );
}

// ─── Step 4: Confirmation ─────────────────────────────────────────────────────

const STUDIO_ADDRESSES = {
    feldkirch: 'Ketschenstraße 1, 6800 Feldkirch',
    nueziders: 'Bundesstraße 2a, 6714 Nüziders',
};

function Step4({ selectedItems, datetime, serviceMode, contact, vehicleCategory, studioLocation, photoWarning }) {
    const serviceTotal = selectedItems.reduce((s, i) => s + i.priceNum, 0);
    const appliesSurcharge = selectedItems.some(i => SIZE_SURCHARGE_IDS.has(i.id));
    const onRequestSurcharge = appliesSurcharge && vehicleCategory?.aufpreis === null;
    const aufpreis = appliesSurcharge ? (vehicleCategory?.aufpreis || 0) : 0;
    const mobileSurcharge = serviceMode === 'mobil' ? MOBILE_SURCHARGE : 0;
    const mobilePkgSurcharge = mobilePackageSurchargeOf(selectedItems, serviceMode);
    const total = serviceTotal + aufpreis + mobileSurcharge + mobilePkgSurcharge;
    const terms = multiDayTerms(serviceMode);

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

            {/* The booking went through; only the photos did not. Amber, not red — and it says
                what to do about it, rather than just that something went wrong. */}
            {photoWarning && (
                <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-4 text-left">
                    <p className="font-sans text-sm text-amber-200/90 leading-relaxed">
                        {photoWarning}{' '}
                        Sie können uns die Fotos gerne per E-Mail an{' '}
                        <a href="mailto:info.eliteaufbereitung@gmail.com" className="text-amber-100 underline underline-offset-2">
                            info.eliteaufbereitung@gmail.com
                        </a>{' '}
                        senden — nötig ist das aber nicht.
                    </p>
                </div>
            )}

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

                {vehicleCategory && (
                    <div className="flex justify-between items-center">
                        <span className="font-sans text-sm text-ivory/70">{vehicleCategory.name}</span>
                        <span className="font-mono text-sm text-accent font-semibold">
                            {!appliesSurcharge ? 'kein Aufpreis' : vehicleCategory.aufpreis === null ? 'auf Anfrage' : vehicleCategory.aufpreis === 0 ? 'kein Aufpreis' : `+€${vehicleCategory.aufpreis},-`}
                        </span>
                    </div>
                )}

                {serviceMode === 'mobil' && (
                    <div className="flex justify-between items-center">
                        <span className="font-sans text-sm text-ivory/70 inline-flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-accent" /> Anfahrtspauschale</span>
                        <span className="font-mono text-sm text-champagne font-semibold">+€{MOBILE_SURCHARGE},-</span>
                    </div>
                )}

                {mobilePkgSurcharge > 0 && (
                    <div className="flex justify-between items-center">
                        <span className="font-sans text-sm text-ivory/70 inline-flex items-center gap-2"><Truck className="w-3.5 h-3.5 text-accent" /> Mobil-Aufpreis (Premium-Paket)</span>
                        <span className="font-mono text-sm text-champagne font-semibold">+€{mobilePkgSurcharge},-</span>
                    </div>
                )}

                <div className="h-px bg-slate/50" />
                <div className="flex justify-between items-center">
                    <span className="font-sans text-sm font-bold text-ivory">Gesamtsumme</span>
                    {onRequestSurcharge ? (
                        <div className="flex flex-col items-end gap-0.5">
                            <span className="font-mono text-lg font-bold text-accent">ab €{(serviceTotal + mobileSurcharge + mobilePkgSurcharge).toLocaleString('de-AT')},-</span>
                            <span className="font-mono text-[10px] text-champagne">+ Aufpreis auf Anfrage</span>
                        </div>
                    ) : (
                        <span className="font-mono text-lg font-bold text-accent">ab €{total.toLocaleString('de-AT')},-</span>
                    )}
                </div>

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

                {datetime.multiDay ? (
                    <>
                        <div className="h-px bg-slate/50" />
                        <div className="flex justify-between items-center">
                            <span className="font-sans text-sm text-ivory/60">{terms.start}</span>
                            <span className="font-sans text-sm font-semibold text-ivory">
                                {datetime.date?.toLocaleDateString('de-AT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })} {terms.startTime}
                            </span>
                        </div>
                        <div className="h-px bg-slate/50" />
                        <div className="flex justify-between items-center">
                            <span className="font-sans text-sm text-ivory/60">{terms.end}</span>
                            <span className="font-mono text-sm font-bold text-accent">
                                {datetime.endDate?.toLocaleDateString('de-AT', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' })} {terms.endTime}
                            </span>
                        </div>
                    </>
                ) : (
                    <>
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
                    </>
                )}
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
                        <span className="font-sans text-sm text-ivory/70 group-hover:text-ivory break-all">info.eliteaufbereitung@gmail.com</span>
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
                                <span className="font-sans text-sm text-ivory/70">{STUDIO_ADDRESSES[studioLocation] || STUDIO_ADDRESSES.feldkirch}</span>
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
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [serviceMode, setServiceMode] = useState(null);
    const [studioLocation, setStudioLocation] = useState(null);

    const [selectedItems, setSelectedItems] = useState([]);
    const [vehicleCategory, setVehicleCategory] = useState(null);
    const [datetime, setDatetime] = useState({ date: null, time: null });
    const [contact, setContact] = useState({ name: '', phone: '', email: '', notes: '', address: '' });
    const [honeypot, setHoneypot] = useState(''); // spam trap — real users never fill this
    const [photos, setPhotos] = useState([]);
    const [photoPreviews, setPhotoPreviews] = useState([]);
    const [uploadingPhotos, setUploadingPhotos] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    // Non-blocking: the booking succeeded, but some photos did not attach.
    const [photoWarning, setPhotoWarning] = useState(null);

    const stepContentRef = useRef(null);
    const prevStepRef = useRef(0);

    // Animate step transitions
    const animateStep = useCallback((newStep) => {
        const goingForward = newStep > prevStepRef.current;
        const el = stepContentRef.current;
        if (!el) {
            setStep(newStep);
            prevStepRef.current = newStep;
            return;
        }

        // Animate out
        gsap.to(el, {
            opacity: 0,
            x: goingForward ? -60 : 60,
            duration: 0.25,
            ease: 'power2.in',
            onComplete: () => {
                setStep(newStep);
                prevStepRef.current = newStep;
                window.scrollTo({ top: 0, behavior: 'smooth' });

                // Animate in from opposite side
                gsap.fromTo(el,
                    { opacity: 0, x: goingForward ? 60 : -60 },
                    { opacity: 1, x: 0, duration: 0.4, ease: 'power3.out', clearProps: 'x' }
                );
            }
        });
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
        const preselect = searchParams.get('service');
        if (preselect === 'mobil') {
            setServiceMode('mobil');
            setStep(1);
            prevStepRef.current = 1;
        }
    }, []);

    const { recommendations, packageSuggestion } = useRecommendations(selectedItems);

    // Any change to the cart's duration SHAPE (same-day minutes ↔ multi-day span) invalidates a
    // previously chosen date/time. Lifted to the parent so it survives Step2's unmount/remount
    // between steps (the in-Step2 guard alone could never fire, so a stale same-day pick used to
    // leak into a now-multi-day booking — confirmation showed a clock time while the calendar/email
    // recorded a multi-day drop-off).
    const durationShape = useMemo(() => {
        const d = computeBookingDuration(selectedItems, serviceMode);
        return d.multiDay ? `m${d.spanDays}` : `s${d.durationMin}`;
    }, [selectedItems, serviceMode]);
    const prevDurationShape = useRef(durationShape);
    useEffect(() => {
        if (prevDurationShape.current !== durationShape) {
            prevDurationShape.current = durationShape;
            setDatetime({ date: null, time: null });
        }
    }, [durationShape]);

    const toggleItem = (item) => {
        setSelectedItems(prev => {
            const exists = prev.find(i => i.id === item.id);
            return exists ? prev.filter(i => i.id !== item.id) : [...prev, item];
        });
    };

    const replaceWithPackage = (pkg, replaceIds) => {
        setSelectedItems(prev => {
            const filtered = prev.filter(i => !replaceIds.includes(i.id));
            return [...filtered, {
                id: pkg.id, name: pkg.name, price: pkg.price, priceNum: pkg.priceNum, type: 'aio',
                durationMin: pkg.durationMin ?? null, durationDays: pkg.durationDays ?? null,
                mobilExtraMin: pkg.mobilExtraMin ?? 0, mobilSurcharge: pkg.mobilSurcharge ?? 0,
            }];
        });
    };

    const handleSubmit = async () => {
        setLoading(true);
        setSubmitError(null);

        // Photos are supporting material, not the booking. allSettled, not all: a Cloudinary
        // hiccup must never abort a completed booking. Upload what we can, keep the rest.
        setUploadingPhotos(true);
        setPhotoWarning(null);
        const results = await Promise.allSettled(photos.map(uploadPhoto));
        const { urls: photoUrls, warning } = summarizePhotoUploads(results);
        if (warning) {
            console.error('Photo upload(s) failed:',
                results.filter((r) => r.status === 'rejected').map((r) => r.reason));
            setPhotoWarning(warning);
        }
        setUploadingPhotos(false);

        const dateStr = datetime.date?.toLocaleDateString('de-AT', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
        const yyyy = datetime.date.getFullYear();
        const mm = String(datetime.date.getMonth() + 1).padStart(2, '0');
        const dd = String(datetime.date.getDate()).padStart(2, '0');
        const isoDate = `${yyyy}-${mm}-${dd}`;
        const serviceTotal = selectedItems.reduce((s, i) => s + i.priceNum, 0);
        // Size-based Aufpreis only applies to sizeSurcharge-flagged services (see SIZE_SURCHARGE_IDS).
        const appliesSurcharge = selectedItems.some(i => SIZE_SURCHARGE_IDS.has(i.id));
        const onRequestSurcharge = appliesSurcharge && vehicleCategory?.aufpreis === null;
        const aufpreis = appliesSurcharge ? (vehicleCategory?.aufpreis || 0) : 0;
        const mobileSurchargeVal = serviceMode === 'mobil' ? MOBILE_SURCHARGE : 0;
        const mobilePkgSurchargeVal = mobilePackageSurchargeOf(selectedItems, serviceMode);
        const total = serviceTotal + aufpreis + mobileSurchargeVal + mobilePkgSurchargeVal;
        const aufpreisStr = onRequestSurcharge ? 'auf Anfrage' : aufpreis > 0 ? `+€${aufpreis},-` : 'kein Aufpreis';

        const location = serviceMode === 'mobil'
            ? contact.address
            : (STUDIO_ADDRESSES[studioLocation] || STUDIO_ADDRESSES.feldkirch);
        const totalStr = onRequestSurcharge
            ? `ab €${(serviceTotal + mobileSurchargeVal + mobilePkgSurchargeVal).toLocaleString('de-AT')},- + Aufpreis auf Anfrage`
            : `ab €${total.toLocaleString('de-AT')},-`;

        // Effective duration → same-day block vs. multi-day span
        const duration = computeBookingDuration(selectedItems, serviceMode);
        const terms = multiDayTerms(serviceMode);
        let terminLabel;
        if (duration.multiDay) {
            const span = workingSpan(datetime.date, duration.spanDays);
            const fmtDay = (d) => d.toLocaleDateString('de-AT', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
            terminLabel = `${terms.start} ${fmtDay(span[0])} ${terms.startTime} · ${terms.end} ${fmtDay(span[span.length - 1])} ${terms.endTime}`;
        } else {
            const [hh, mmn] = datetime.time.split(':').map(Number);
            terminLabel = `${datetime.time}–${minToTime(hh * 60 + mmn + duration.durationMin)} Uhr`;
        }

        try {
            // Create Google Calendar event (primary booking action, with double-booking guard).
            // The backup notification email is sent server-side by /api/book — only after a
            // validated, rate-limited booking succeeds — so there is no client-side email call.
            await submitBooking({
                date: isoDate,
                time: datetime.time,
                services: selectedItems,
                contact,
                website: honeypot, // spam trap; server silently rejects if non-empty
                serviceMode,
                location,
                vehicleCategory: vehicleCategory?.name,
                vehicleAufpreis: aufpreisStr,
                mobileSurcharge: mobileSurchargeVal,
                mobilePackageSurcharge: mobilePkgSurchargeVal,
                totalStr,
                photoUrls,
                durationMin: duration.durationMin,
                multiDay: duration.multiDay,
                spanDays: duration.spanDays,
            });

            animateStep(5);
        } catch (err) {
            if (err.status === 409 && err.data?.error === 'slot_taken') {
                setSubmitError('Dieser Termin wurde soeben von jemand anderem gebucht. Bitte wählen Sie einen anderen Zeitpunkt.');
                setDatetime(dt => ({ ...dt, date: null, time: null }));
                animateStep(3);
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

            <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 sm:px-12 py-3 border-b border-slate/30 bg-obsidian/80 backdrop-blur-xl">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 font-sans text-sm text-ivory/50 hover:text-ivory transition-colors link-lift">
                    <ArrowLeft className="w-4 h-4" /> Zurück
                </button>
                <Link to="/">
                    <img src="/assets/logo-new2.png" alt="Elité Auto Aufbereitung" className="h-[4rem] sm:h-[4.5rem] lg:h-[5.5rem] w-auto object-contain" />
                </Link>
                <div className="flex items-center gap-2 bg-obsidian/50 px-3 py-1.5 rounded-full border border-slate/50">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    <span className="font-mono text-[10px] text-ivory/60 uppercase tracking-widest">{serviceMode === 'mobil' ? 'Mobiler Service' : serviceMode === 'studio' ? `Studio ${studioLocation === 'feldkirch' ? 'Feldkirch' : 'Offen'}` : 'Studio Offen'}</span>
                </div>
            </header>

            <main className="pt-28 sm:pt-32 lg:pt-36 pb-24 px-6 sm:px-12 lg:px-24">
                <div className="max-w-4xl mx-auto">
                    {step < 5 && <StepBar step={step} />}
                    <div ref={stepContentRef}>
                        {step === 0 && <Step0 serviceMode={serviceMode} setServiceMode={setServiceMode} studioLocation={studioLocation} setStudioLocation={setStudioLocation} onNext={() => animateStep(1)} />}
                        {step === 1 && <Step1 selectedItems={selectedItems} toggleItem={toggleItem} onNext={() => animateStep(2)} onBack={() => animateStep(0)} recommendations={recommendations} packageSuggestion={packageSuggestion} onReplaceWithPackage={replaceWithPackage} serviceMode={serviceMode} />}
                        {step === 2 && <StepVehicle vehicleCategory={vehicleCategory} setVehicleCategory={setVehicleCategory} selectedItems={selectedItems} onNext={() => animateStep(3)} onBack={() => animateStep(1)} serviceMode={serviceMode} />}
                        {step === 3 && <Step2 datetime={datetime} setDatetime={setDatetime} onNext={() => animateStep(4)} onBack={() => animateStep(2)} serviceMode={serviceMode} selectedItems={selectedItems} />}
                        {step === 4 && (
                            <>
                                <Step3 contact={contact} setContact={setContact} honeypot={honeypot} setHoneypot={setHoneypot} photos={photos} setPhotos={setPhotos} photoPreviews={photoPreviews} setPhotoPreviews={setPhotoPreviews} onSubmit={handleSubmit} onBack={() => animateStep(3)} loading={loading} uploadingPhotos={uploadingPhotos} serviceMode={serviceMode} />
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
                        {step === 5 && <Step4 selectedItems={selectedItems} datetime={datetime} serviceMode={serviceMode} contact={contact} vehicleCategory={vehicleCategory} studioLocation={studioLocation} photoWarning={photoWarning} />}
                    </div>
                </div>
            </main>
        </div>
    );
}

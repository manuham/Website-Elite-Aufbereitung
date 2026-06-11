import { Link } from 'react-router-dom';
import { Phone, Mail } from 'lucide-react';
import SplitText from './SplitText';
import Disclosure from './Disclosure';

// Hand-written answers drawn from the website's own content (services, durations, prices,
// mobile service, locations). Kept in sync with src/data/services.js.
const FAQS = [
    {
        q: 'Wie lange dauert eine Innenreinigung?',
        a: 'Eine Basic Innenreinigung dauert ca. 90 Minuten, eine Premium Innenreinigung (inkl. Lederpflege, Nassreinigung & Kunststoffbehandlung) ca. 2,5 Stunden. Stark verschmutzte oder größere Fahrzeuge brauchen entsprechend etwas länger.',
    },
    {
        q: 'Was kostet eine Aufbereitung?',
        a: 'Unsere Einstiegspreise: Handwäsche ab €75,–, Innenreinigung ab €75,–, das Komplettpaket „Deep Clean" ab €420,–. Alle Preise sind Endpreise und Richtwerte für durchschnittlich verschmutzte Pkw. Der finale Preis richtet sich nach Aufwand, Verschmutzungsgrad und – bei Deep Clean & Leichter Politur – nach der Fahrzeuggröße. Eine genaue Übersicht findest du im Bereich Services & Preise.',
    },
    {
        q: 'Wie wäscht Elité mein Auto mobil bei mir in der Einfahrt?',
        a: 'Beim mobilen Service kommen wir mit unserem voll ausgestatteten Van direkt zu dir – in die Einfahrt, zum Stellplatz oder vor die Haustür. Wir bringen das komplette Equipment mit und arbeiten weitgehend autark. Ein Strom- bzw. Wasseranschluss ist hilfreich, aber nicht zwingend nötig. Es gilt eine Anfahrtspauschale von €50,–. Alle Leistungen sind auch mobil buchbar.',
    },
    {
        q: 'Wo befindet sich Elité Aufbereitung?',
        a: 'Wir haben zwei Standorte in Vorarlberg: Ketschenstraße 1 in 6800 Feldkirch und Bundesstraße 2a in 6714 Nüziders. Alternativ kommen wir mit dem mobilen Service direkt zu dir.',
    },
    {
        q: 'Wie lange dauert eine Politur oder Keramikbeschichtung?',
        a: 'Eine Leichte Politur dauert ca. einen Arbeitstag, eine Schwere Politur etwa 1,5 Tage. Keramikbeschichtungen benötigen je nach Paket 2–3 Werktage. Bei mehrtägigen Leistungen gibst du das Fahrzeug morgens ab und holst es nach Fertigstellung wieder ab.',
    },
    {
        q: 'Warum gibt es einen Aufpreis nach Fahrzeuggröße?',
        a: 'Größere Fahrzeuge bedeuten mehr Fläche und Arbeitsaufwand. Ein größenabhängiger Aufpreis fällt nur bei Deep Clean & Leichter Politur an: Kompaktklasse +55,–, Mittelklasse +75,–, SUV/Van +95,–, Großfahrzeuge auf Anfrage. Kleinwagen sind ohne Aufpreis. Für alle anderen Leistungen gilt kein größenabhängiger Aufpreis.',
    },
    {
        q: 'Wie buche ich einen Termin?',
        a: 'Am einfachsten online über „Jetzt buchen": Du wählst Standort oder mobilen Service, die gewünschte Leistung, deine Fahrzeuggröße und einen freien Termin und lädst 1–4 Fotos deines Fahrzeugs hoch. Wir bestätigen deine Anfrage innerhalb von 24 Stunden. Hochpreisige Premium-Leistungen (z. B. Endstufe, Keramik) stimmen wir vorab kurz telefonisch ab.',
    },
    {
        q: 'Muss ich mein Auto vorbereiten?',
        a: 'Nein. Entnimm einfach deine persönlichen Gegenstände aus dem Fahrzeug – um den Rest kümmern wir uns. Wertgegenstände nimm bitte mit.',
    },
    {
        q: 'Wie lange hält eine Versiegelung?',
        a: 'Eine Sprühversiegelung schützt ca. 12.000 km vor UV-Strahlung, Vogelkot, Streusalz & Oxidation. Unsere FIREBALL Keramikbeschichtung (Endstufe/Keramik-Pakete) hält je nach Paket deutlich länger – bis zu 40.000–60.000 km mit extremem Abperleffekt.',
    },
];

export default function FAQ() {
    return (
        <section id="faq" className="py-24 sm:py-32 px-4 sm:px-8 lg:px-12 xl:px-16 bg-background relative overflow-hidden">
            <div className="mx-auto max-w-3xl flex flex-col gap-12 items-center">

                {/* Header */}
                <div className="flex flex-col gap-4 items-center text-center">
                    <h3 className="font-sans font-bold text-lg text-ivory/60 uppercase tracking-widest">Häufige Fragen</h3>
                    <h2 className="font-drama italic text-4xl sm:text-5xl lg:text-6xl text-ivory">
                        <SplitText type="words" triggerStart="top 85%">
                            Fragen &
                        </SplitText>{' '}
                        <span className="text-accent relative inline-block">
                            <SplitText type="chars" triggerStart="top 85%" delay={0.2}>
                                Antworten
                            </SplitText>
                            <span className="underline-draw bg-accent" />
                        </span>
                    </h2>
                </div>

                {/* FAQ list */}
                <div className="flex flex-col gap-4 w-full">
                    {FAQS.map((item, i) => (
                        <Disclosure key={i} title={item.q} defaultOpen={i === 0}>
                            <p className="font-sans text-sm sm:text-[15px] text-ivory/70 leading-relaxed">
                                {item.a}
                            </p>
                        </Disclosure>
                    ))}
                </div>

                {/* Contact CTA */}
                <div className="w-full bg-slate/30 border border-slate/50 rounded-2xl p-6 sm:p-8 text-center flex flex-col gap-4 items-center">
                    <p className="font-sans text-sm text-ivory/70 leading-relaxed max-w-xl">
                        Deine Frage war nicht dabei? Wir helfen dir gerne persönlich weiter.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <a href="tel:+436642546078" className="flex-1 flex items-center justify-center gap-2 bg-slate/40 border border-slate/60 hover:border-accent/50 rounded-xl px-5 py-3 transition-colors group">
                            <Phone className="w-4 h-4 text-accent shrink-0" />
                            <span className="font-sans text-sm text-ivory/80 group-hover:text-ivory">+43 664 2546078</span>
                        </a>
                        <a href="mailto:info.eliteaufbereitung@gmail.com" className="flex-1 flex items-center justify-center gap-2 bg-slate/40 border border-slate/60 hover:border-accent/50 rounded-xl px-5 py-3 transition-colors group">
                            <Mail className="w-4 h-4 text-accent shrink-0" />
                            <span className="font-sans text-sm text-ivory/80 group-hover:text-ivory break-all">info.eliteaufbereitung@gmail.com</span>
                        </a>
                    </div>
                    <Link
                        to="/buchen"
                        className="btn-magnetic bg-accent text-obsidian px-8 py-3 rounded-full font-sans font-bold text-sm mt-1 shadow-[0_0_20px_rgba(77,178,146,0.2)]"
                    >
                        Jetzt Termin buchen
                    </Link>
                </div>

            </div>
        </section>
    );
}

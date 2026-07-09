import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Datenschutz() {
    return (
        <div className="min-h-screen bg-obsidian text-ivory font-sans overflow-hidden">
            <Navbar />

            {/* Content */}
            <div className="max-w-3xl mx-auto px-6 sm:px-12 pt-32 sm:pt-36 pb-16 flex flex-col gap-10">

                <div className="flex flex-col gap-2">
                    <span className="font-mono text-xs text-champagne uppercase tracking-widest">Rechtliches</span>
                    <h1 className="font-drama text-4xl sm:text-5xl text-ivory">Datenschutzerklärung</h1>
                </div>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">1. Verantwortlicher</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Verantwortlich für die Datenverarbeitung auf dieser Website ist:<br /><br />
                        <span className="text-ivory font-semibold">Elité Auto Aufbereitung</span><br />
                        Bundesstraße 2a, 6714 Nüziders, Österreich<br />
                        Tel: <a href="tel:+436642546078" className="text-champagne hover:underline">+43 664 2546078</a><br />
                        E-Mail: <a href="mailto:info.eliteaufbereitung@gmail.com" className="text-champagne hover:underline">info.eliteaufbereitung@gmail.com</a>
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">2. Erhebung und Verarbeitung personenbezogener Daten</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Wir erheben personenbezogene Daten nur, wenn Sie uns diese im Rahmen einer Terminanfrage
                        freiwillig mitteilen. Dies betrifft folgende Daten:
                    </p>
                    <ul className="list-disc list-inside text-ivory/70 text-sm leading-relaxed flex flex-col gap-1 ml-2">
                        <li>Vor- und Nachname</li>
                        <li>Telefonnummer</li>
                        <li>E-Mail-Adresse</li>
                        <li>Einsatzadresse (nur bei Buchung des mobilen Service)</li>
                        <li>Fahrzeugtyp, gewählte Leistungen und optionale Anmerkungen</li>
                        <li>Fahrzeugfotos, die Sie zur Einschätzung des Aufwands hochladen</li>
                    </ul>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Diese Daten verwenden wir ausschließlich zur Bearbeitung und Abwicklung Ihrer Terminanfrage.
                        Eine Weitergabe erfolgt nur an die unter Punkt 5 genannten Auftragsverarbeiter, soweit dies
                        zur Erbringung der Leistung erforderlich ist.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">3. Rechtsgrundlage</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Die Verarbeitung der von Ihnen übermittelten Anfragedaten erfolgt auf Grundlage von
                        Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung und -erfüllung) sowie Ihrer ausdrücklichen
                        Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO. Die Verarbeitung von Server-Logfiles erfolgt
                        auf Grundlage unseres berechtigten Interesses am sicheren und stabilen Betrieb der Website
                        (Art. 6 Abs. 1 lit. f DSGVO).
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">4. Speicherdauer</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Ihre personenbezogenen Daten werden nur so lange gespeichert, wie es für die Erfüllung des
                        jeweiligen Zwecks erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen.
                        Anfragedaten werden nach vollständiger Abwicklung des Termins gelöscht, sofern keine
                        gesetzlichen Aufbewahrungspflichten entgegenstehen.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">5. Auftragsverarbeiter und externe Dienste</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Zur Abwicklung Ihrer Terminanfrage setzen wir folgende Dienstleister ein, mit denen jeweils
                        Auftragsverarbeitungsverträge bzw. Standardvertragsklauseln bestehen:
                    </p>
                    <ul className="list-disc list-inside text-ivory/70 text-sm leading-relaxed flex flex-col gap-2 ml-2">
                        <li>
                            <span className="text-ivory/90 font-semibold">Google Calendar</span> (Google Ireland Ltd.,
                            Irland): Speicherung und Verwaltung Ihrer Terminbuchung sowie Prüfung verfügbarer Termine.
                        </li>
                        <li>
                            <span className="text-ivory/90 font-semibold">Cloudinary</span> (Cloudinary Ltd., USA):
                            Hosting der von Ihnen hochgeladenen Fahrzeugfotos.
                        </li>
                        <li>
                            <span className="text-ivory/90 font-semibold">FormSubmit</span> (FormSubmit.co, USA):
                            Versand einer E-Mail-Benachrichtigung über Ihre Terminanfrage an uns.
                        </li>
                        <li>
                            <span className="text-ivory/90 font-semibold">Vercel</span> (Vercel Inc., USA): Hosting
                            und Auslieferung dieser Website.
                        </li>
                    </ul>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">6. Server-Logfiles</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Beim Aufruf dieser Website werden durch unseren Hosting-Anbieter automatisch Informationen in
                        Server-Logfiles erfasst, die Ihr Browser übermittelt. Dies sind insbesondere IP-Adresse,
                        Datum und Uhrzeit des Zugriffs, verwendeter Browser und Betriebssystem. Diese Daten dienen
                        ausschließlich der technischen Bereitstellung, Sicherheit und Stabilität der Website und
                        werden nicht mit anderen Datenquellen zusammengeführt.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">7. Datenübermittlung in Drittländer</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Einige der unter Punkt 5 genannten Dienste (Cloudinary, FormSubmit, Vercel) können Daten in
                        den USA verarbeiten. Die Übermittlung erfolgt auf Grundlage des EU-US Data Privacy Framework
                        bzw. der Standardvertragsklauseln der Europäischen Kommission, die ein angemessenes
                        Datenschutzniveau sicherstellen.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">8. Cookies und Tracking</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Diese Website setzt keine Cookies zu Marketing- oder Analysezwecken und verwendet kein
                        Web-Analytics-Tool (z. B. Google Analytics). Es werden keine einwilligungspflichtigen Cookies
                        gesetzt. Lediglich für die reine Funktion der Website kann eine technische Information
                        vorübergehend im Speicher Ihres Browsers (Session Storage) abgelegt werden; diese wird beim
                        Schließen des Browser-Tabs automatisch gelöscht.
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">9. Ihre Rechte</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Sie haben gemäß DSGVO folgende Rechte gegenüber uns bezüglich der Sie betreffenden
                        personenbezogenen Daten:
                    </p>
                    <ul className="list-disc list-inside text-ivory/70 text-sm leading-relaxed flex flex-col gap-1 ml-2">
                        <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
                        <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
                        <li>Recht auf Löschung (Art. 17 DSGVO)</li>
                        <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                        <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
                        <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
                    </ul>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Zur Ausübung Ihrer Rechte wenden Sie sich bitte an:{' '}
                        <a href="mailto:info.eliteaufbereitung@gmail.com" className="text-champagne hover:underline">
                            info.eliteaufbereitung@gmail.com
                        </a>
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">10. Beschwerderecht</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Sie haben das Recht, sich bei der österreichischen Datenschutzbehörde zu beschweren:<br /><br />
                        Österreichische Datenschutzbehörde<br />
                        Barichgasse 40–42, 1030 Wien<br />
                        <a href="https://www.dsb.gv.at" target="_blank" rel="noreferrer" className="text-champagne hover:underline">www.dsb.gv.at</a>
                    </p>
                </section>

                <section className="flex flex-col gap-4">
                    <h2 className="font-sans font-bold text-sm uppercase tracking-widest text-ivory/50">11. Eingebundene Inhalte Dritter</h2>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Diese Website bindet ein YouTube-Video (Google LLC) im erweiterten Datenschutzmodus
                        (youtube-nocookie.com) ein. Beim Aufrufen der Seite wird zunächst nur eine lokal
                        gespeicherte Vorschaugrafik geladen — dabei werden keine Daten an Google oder YouTube
                        übertragen. Erst wenn Sie das Video durch Klick auf die Vorschau starten, wird die
                        YouTube-Einbettung geladen und es können Daten (z. B. Ihre IP-Adresse) an Google
                        übertragen werden; es gelten dann die Datenschutzbestimmungen von Google.
                    </p>
                    <p className="text-ivory/70 leading-relaxed text-sm">
                        Zur einheitlichen Darstellung von Schriftarten werden Google Fonts über die Server von
                        Google geladen. Dabei wird Ihre IP-Adresse an Google übertragen. Weitere Informationen
                        finden Sie in der{' '}
                        <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-champagne hover:underline">
                            Datenschutzerklärung von Google
                        </a>.
                    </p>
                </section>

            </div>

            <Footer />
        </div>
    );
}

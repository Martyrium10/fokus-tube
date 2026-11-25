// ===== 1. EINSTELLUNGEN =====

// Dein API-Schlüssel aus der Google Cloud Console
const API_SCHLUESSEL = "AIzaSyBvgySXC-4gIVIbZoyT7HLl-wxcmmt7FIw";

// Wie viele Tage zurück sollen Videos angezeigt werden?
const TAGE_ZURUECK = 7;

// Deine Kanäle. Die Filter sind freiwillig:
//   mussEnthalten:  ALLE diese Wörter müssen im Titel stehen
//   einsDavon:      MINDESTENS EINS dieser Wörter muss im Titel stehen
//   mindestMinuten: das Video muss mindestens so lang sein
const KANAELE = [
  {
    handle: "@NFL",
    mussEnthalten: ["Highlights"],
    einsDavon: ["Chiefs", "Bills", "Vikings"],
  },
  { handle: "@sportstudiofussball", einsDavon: ["Frankfurt"] }, // vorläufig
  { handle: "@Simplicissimus" },
  { handle: "@Jules1" },
  { handle: "@spacefrogs" },
  { handle: "@fern-tv" },
  { handle: "@unsympathischtv" },
  { handle: "@AliciaJoe" },
  { handle: "@DashcamDriversGermany" },
  { handle: "@rctestflight" },
  { handle: "@2BoredGuysOfficial" },
  { handle: "@dave_" },
  { handle: "@MarkRober" },
  { handle: "@MaxFosh" },
  { handle: "@LanterneRougeCycling" },
  { handle: "@imsorrywhatcomedy" },
  { handle: "@heuteshow", mindestMinuten: 25 }, // vorläufig
  { handle: "@AverageRob" },
  { handle: "@RobBubble" },
  { handle: "@Micro-Econ-YT" },
  { handle: "@colinfurze" },
  { handle: "@StuffMadeHere" },
  { handle: "@DerHeider" },
  { handle: "@tomatolix" },
  { handle: "@ZabelRick" },
  { handle: "@hubikoch" },
  { handle: "@SaschaHellinger" },
  { handle: "@neinmarius" },
  { handle: "@halfasinteresting" },
  { handle: "@100SekundenPhysik" },
  { handle: "@hoog-youtube" },
  { handle: "@MrWissen2go" },
  { handle: "@martifischer" },
  { handle: "@dudeperfect" },
  { handle: "@KurzgesagtDE" },
  { handle: "@TomScottGo" },
  { handle: "@coldmirror" },
  { handle: "@TheBackyardScientist" },
  { handle: "@TheRealLifeGuys" },
  { handle: "@_reidolson" },
  { handle: "@Wendoverproductions" },
  { handle: "@neoexplains" },
  { handle: "@AndreasVenzl" },
  { handle: "@shiey" },
  { handle: "@IMPERIALYT" },
  { handle: "@GIFGAS" },
  { handle: "@mikeybrockmann" },
  { handle: "@TomStantonEngineering" },
  { handle: "@TomGrossiComedy", einsDavon: ["Fan"] }, // vorläufig
];
// ===== 2. KANAL-INFOS (mit Zwischenspeicher) =====

// Holt Name und Upload-Playlist eines Kanals.
// Gefundene Kanäle merken wir uns im localStorage,
// damit wir YouTube nicht bei jedem Neuladen fragen müssen.
async function kanalInfoHolen(handle) {
  const speicherName = "kanal_" + handle;
  const gespeichert = localStorage.getItem(speicherName);

  if (gespeichert) {
    return JSON.parse(gespeichert);
  }

  const adresse =
    "https://www.googleapis.com/youtube/v3/channels" +
    "?part=snippet,contentDetails" +
    "&forHandle=" +
    encodeURIComponent(handle) +
    "&key=" +
    API_SCHLUESSEL;

  const antwort = await fetch(adresse);
  const daten = await antwort.json();

  if (!antwort.ok) {
    console.error("Fehler bei " + handle + ":", daten.error.message);
    return null;
  }

  if (!daten.items || daten.items.length === 0) {
    console.warn("Kanal nicht gefunden:", handle);
    return null;
  }

  const kanal = daten.items[0];
  const info = {
    handle: handle,
    name: kanal.snippet.title,
    uploadPlaylist: kanal.contentDetails.relatedPlaylists.uploads,
  };

  localStorage.setItem(speicherName, JSON.stringify(info));
  return info;
}

// ===== 3. HAUPTABLAUF =====

async function start() {
  const status = document.getElementById("status");
  status.textContent = "Lade Kanäle …";

  const infos = await Promise.all(
    KANAELE.map((eintrag) => kanalInfoHolen(eintrag.handle)),
  );

  const gefunden = infos.filter((info) => info !== null);
  console.table(gefunden);
  status.textContent =
    gefunden.length + " von " + KANAELE.length + " Kanälen gefunden.";
}

start();

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
// ===== 2. TEST: Infos zu einem Kanal holen (vorläufig) =====

async function kanalInfoHolen(handle) {
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
    console.error("Fehler von der YouTube-API:", daten.error.message);
    return;
  }

  if (!daten.items || daten.items.length === 0) {
    console.warn("Kanal nicht gefunden:", handle);
    return;
  }

  const kanal = daten.items[0];
  console.log("Kanalname:", kanal.snippet.title);
  console.log(
    "Upload-Playlist:",
    kanal.contentDetails.relatedPlaylists.uploads,
  );
  console.log("Komplette Antwort:", kanal);
}

kanalInfoHolen("@NFL");

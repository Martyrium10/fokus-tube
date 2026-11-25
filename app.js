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
  { handle: "@sportstudiofussball", einsDavon: ["Eintracht Frankfurt"] },
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
  { handle: "@heuteshow", mussEnthalten: ["heute-show vom"] },
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
  { handle: "@TomGrossiComedy", mussEnthalten: ["Fan", "Reaction"] },
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

// ===== 3. NEUE VIDEOS EINES KANALS HOLEN =====

// Holt aus einer Upload-Playlist alle Videos der letzten TAGE_ZURUECK Tage.
// YouTube liefert höchstens 50 Videos pro Anfrage ("Seite").
// Die Playlist ist nach Datum sortiert (neueste zuerst). Darum hören wir auf,
// sobald wir auf ein älteres Video stoßen.
async function neueVideosHolen(playlistId) {
  const grenze = new Date();
  grenze.setDate(grenze.getDate() - TAGE_ZURUECK);

  const videos = [];
  let seitenToken = "";
  let seitenZahl = 0;
  let weiterSuchen = true;

  while (weiterSuchen) {
    const adresse =
      "https://www.googleapis.com/youtube/v3/playlistItems" +
      "?part=snippet,contentDetails" +
      "&maxResults=50" +
      "&playlistId=" +
      playlistId +
      "&pageToken=" +
      seitenToken +
      "&key=" +
      API_SCHLUESSEL;

    const antwort = await fetch(adresse);
    const daten = await antwort.json();
    seitenZahl = seitenZahl + 1;

    if (!antwort.ok) {
      console.warn(
        "Playlist nicht abrufbar: " +
          playlistId +
          " (" +
          daten.error.message +
          ")",
      );
      return null;
    }

    for (const eintrag of daten.items) {
      const datumText = eintrag.contentDetails.videoPublishedAt;

      // Private oder gelöschte Videos haben kein Datum -> überspringen
      if (!datumText) {
        continue;
      }

      const datum = new Date(datumText);

      if (datum < grenze) {
        weiterSuchen = false;
      } else {
        videos.push({
          id: eintrag.contentDetails.videoId,
          titel: eintrag.snippet.title,
          datum: datum,
        });
      }
    }

    // Keine weitere Seite da, oder Sicherheitsgrenze erreicht -> aufhören
    if (!daten.nextPageToken || seitenZahl >= 6) {
      weiterSuchen = false;
    }
    seitenToken = daten.nextPageToken;
  }

  return videos;
}

// Erledigt alles für einen Kanal: erst die Infos, dann die neuen Videos.
async function kanalVerarbeiten(eintrag) {
  const info = await kanalInfoHolen(eintrag.handle);
  if (!info) {
    return [];
  }

  // Versteckte Playlist nur mit "normalen" Videos (ohne Shorts und Livestreams):
  // aus "UUabc..." wird "UULFabc..."
  const playlistOhneShorts = "UULF" + info.uploadPlaylist.slice(2);
  let videos = await neueVideosHolen(playlistOhneShorts);

  // Falls es die nicht gibt: normale Upload-Playlist als Ersatz nehmen
  if (videos === null) {
    console.warn("Ersatz: normale Uploads für " + info.name);
    videos = await neueVideosHolen(info.uploadPlaylist);
  }

  if (videos === null) {
    return [];
  }

  // Jedem Video merken wir uns den Kanalnamen und die Filter-Einstellungen
  for (const video of videos) {
    video.kanal = info.name;
    video.kanalEintrag = eintrag;
  }

  return videos;
}
// ===== 4. HAUPTABLAUF =====

async function start() {
  const status = document.getElementById("status");
  status.textContent = "Lade Videos …";

  const videosProKanal = await Promise.all(KANAELE.map(kanalVerarbeiten));
  const alleVideos = videosProKanal.flat();

  // Neueste zuerst
  alleVideos.sort((a, b) => b.datum - a.datum);

  console.log("Gefundene Videos:", alleVideos.length);
  console.table(
    alleVideos.map((video) => ({
      kanal: video.kanal,
      titel: video.titel,
      datum: video.datum.toLocaleString("de-DE"),
    })),
  );

  status.textContent =
    alleVideos.length + " neue Videos gefunden (noch ungefiltert).";
}

start();

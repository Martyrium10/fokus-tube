// ===== 1. EINSTELLUNGEN =====

// Dein API-Schlüssel aus der Google Cloud Console
const API_SCHLUESSEL = "AIzaSyAlja7QyN3Q3NV3aIukl4mYXGBfA2--nr0";

// Client-ID für den Google-Login (darf öffentlich sein)
const GOOGLE_CLIENT_ID =
  "517234073856-u9pj75tgenbkvuadfdv5ngc94m51rkqb.apps.googleusercontent.com";

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
  { handle: "@veritasium" },
  { handle: "@Ididathing" },
  { handle: "@SpaceGaming" },
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
  { handle: "@hubikoch", mussEnthalten: ["FULL DOKU"] },
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
  {
    handle: "@Formula1",
    einsDavon: [
      "Race Highlights",
      "Qualifying Highlights",
      "Sprint Highlights",
      "Sprinthighlights",
      "Extended Highlights",
    ],
    darfNichtEnthalten: ["F2", "F3", "Academy", "Pre-Season", "Shakedown"],
    nurAktuellesJahr: true,
  },
];

// Themen für die Ansicht "Nach Themen". Reihenfolge hier = Reihenfolge auf der Seite.
// Kanäle, die hier nicht stehen, landen automatisch unter "Sonstiges".
const THEMEN = {
  Sport: ["@NFL", "@sportstudiofussball", "@Formula1", "@LanterneRougeCycling"],
  Wissen: [
    "@Simplicissimus",
    "@AliciaJoe",
    "@Micro-Econ-YT",
    "@halfasinteresting",
    "@100SekundenPhysik",
    "@MrWissen2go",
    "@KurzgesagtDE",
    "@TomScottGo",
    "@Wendoverproductions",
    "@neoexplains",
    "@tomatolix",
    "@RobBubble",
    "@fern-tv",
    "@hoog-youtube",
    "@AndreasVenzl",
    "@IMPERIALYT",
    "@veritasium",
  ],
  "Bastel-Stuff": [
    "@rctestflight",
    "@MarkRober",
    "@colinfurze",
    "@StuffMadeHere",
    "@TheBackyardScientist",
    "@TheRealLifeGuys",
    "@TomStantonEngineering",
    "@Ididathing",
  ],
  Unterhaltung: [
    "@heuteshow",
    "@MaxFosh",
    "@dudeperfect",
    "@TomGrossiComedy",
    "@imsorrywhatcomedy",
    "@coldmirror",
    "@DashcamDriversGermany",
    "@unsympathischtv",
    "@martifischer",
    "@2BoredGuysOfficial",
    "@AverageRob",
    "@ZabelRick",
    "@Jules1",
    "@spacefrogs",
    "@dave_",
    "@DerHeider",
    "@SaschaHellinger",
    "@neinmarius",
    "@_reidolson",
    "@mikeybrockmann",
    "@SpaceGaming",
  ],
  Filme: ["@GIFGAS", "@shiey", "@hubikoch"],
};
// ===== 2. KANAL-INFOS (mit Zwischenspeicher) =====

// Hier merken wir uns den letzten Fehler von YouTube, um ihn auf der Seite anzuzeigen
let letzterFehler = null;

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
    letzterFehler = daten.error.message;
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
      if (antwort.status !== 404) {
        letzterFehler = daten.error.message;
      }
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
// ===== 4. VIDEO-DETAILS HOLEN =====

// Fragt bei YouTube Länge, Live-Status, Vorschaubild und Einbett-Erlaubnis ab.
// Bis zu 50 Videos passen in eine Anfrage (kostet 1 Einheit).
async function videoDetailsHolen(videos) {
  for (let i = 0; i < videos.length; i = i + 50) {
    const gruppe = videos.slice(i, i + 50);
    const ids = gruppe.map((video) => video.id).join(",");

    const adresse =
      "https://www.googleapis.com/youtube/v3/videos" +
      "?part=contentDetails,status,snippet" +
      "&id=" +
      ids +
      "&key=" +
      API_SCHLUESSEL;

    const antwort = await fetch(adresse);
    const daten = await antwort.json();

    if (!antwort.ok) {
      console.error("Fehler bei den Video-Details:", daten.error.message);
      letzterFehler = daten.error.message;
      continue;
    }

    for (const details of daten.items) {
      const video = gruppe.find((v) => v.id === details.id);
      video.sekunden = dauerInSekunden(details.contentDetails.duration);
      video.einbettbar = details.status.embeddable;
      video.live = details.snippet.liveBroadcastContent; // "none", "live" oder "upcoming"
      const bilder = details.snippet.thumbnails;
      const bestesBild = bilder.standard || bilder.high || bilder.medium;
      video.bild = bestesBild.url;
    }
  }
}

// Wandelt die YouTube-Dauer (z. B. "PT1H2M30S") in Sekunden um
function dauerInSekunden(text) {
  const teile = text.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!teile) {
    return 0;
  }
  const stunden = Number(teile[1] || 0);
  const minuten = Number(teile[2] || 0);
  const sekunden = Number(teile[3] || 0);
  return stunden * 3600 + minuten * 60 + sekunden;
}

// Macht aus Sekunden einen lesbaren Text, z. B. 754 -> "12:34"
function dauerAlsText(sekunden) {
  if (sekunden === undefined) {
    return "?";
  }
  const h = Math.floor(sekunden / 3600);
  const m = Math.floor((sekunden % 3600) / 60);
  const s = String(sekunden % 60).padStart(2, "0");

  if (h > 0) {
    return h + ":" + String(m).padStart(2, "0") + ":" + s;
  }
  return m + ":" + s;
}

// ===== 5. FILTER =====

// Entscheidet für ein Video: anzeigen (true) oder aussortieren (false)
function videoPasst(video) {
  // Keine Details bekommen (z. B. gelöscht oder privat) -> weg
  if (video.sekunden === undefined) {
    return false;
  }

  // Darf nicht eingebettet werden, oder ist (noch) live -> weg
  if (!video.einbettbar || video.live !== "none") {
    return false;
  }

  const filter = video.kanalEintrag;
  const titel = video.titel.toLowerCase();

  // mussEnthalten: ALLE Wörter müssen im Titel stehen
  if (filter.mussEnthalten) {
    for (const wort of filter.mussEnthalten) {
      if (!titel.includes(wort.toLowerCase())) {
        return false;
      }
    }
  }

  // einsDavon: MINDESTENS EIN Wort muss im Titel stehen
  if (filter.einsDavon) {
    const treffer = filter.einsDavon.some((wort) =>
      titel.includes(wort.toLowerCase()),
    );
    if (!treffer) {
      return false;
    }
  }

  // darfNichtEnthalten: KEINES dieser Wörter darf im Titel stehen
  if (filter.darfNichtEnthalten) {
    const treffer = filter.darfNichtEnthalten.some((wort) =>
      titel.includes(wort.toLowerCase()),
    );
    if (treffer) {
      return false;
    }
  }

  // nurAktuellesJahr: das aktuelle Jahr (z. B. 2026) muss im Titel stehen
  if (filter.nurAktuellesJahr) {
    const jahr = String(new Date().getFullYear());
    if (!titel.includes(jahr)) {
      return false;
    }
  }

  // mindestMinuten: Video muss mindestens so lang sein
  if (filter.mindestMinuten && video.sekunden < filter.mindestMinuten * 60) {
    return false;
  }

  return true;
}

// ===== 5b. GESEHEN-SPEICHER =====

// Alles rund um "schon gesehen" läuft NUR über diese Funktionen.
// Gespeichert wird: Video-ID -> Zeitpunkt, wann es als gesehen markiert wurde.
// Beispiel: { "abc123": 1764100000000, "def456": 1764200000000 }

function gesehenLaden() {
  const text = localStorage.getItem("gesehen");
  if (!text) {
    return {};
  }
  return JSON.parse(text);
}

function istGesehen(videoId) {
  const gesehen = gesehenLaden();
  return gesehen[videoId] !== undefined;
}

function alsGesehenMarkieren(videoId) {
  gesehenAbgleichen(); // läuft im Hintergrund, falls mit Google verbunden
  const gesehen = gesehenLaden();
  gesehen[videoId] = Date.now();
  localStorage.setItem("gesehen", JSON.stringify(gesehen));
}

// Löscht Einträge, die älter als 14 Tage sind. Diese Videos
// fallen sowieso aus dem 7-Tage-Zeitraum, der Speicher bleibt so klein.
function alteEintraegeAufraeumen() {
  const gesehen = gesehenLaden();
  const grenze = Date.now() - 14 * 24 * 60 * 60 * 1000;

  for (const videoId in gesehen) {
    if (gesehen[videoId] < grenze) {
      delete gesehen[videoId];
    }
  }

  localStorage.setItem("gesehen", JSON.stringify(gesehen));
}

// ===== 6. ANZEIGE =====

let angezeigteVideos = []; // die Videos, die gerade auf der Seite stehen
let ansicht = localStorage.getItem("ansicht") || "neueste"; // "neueste" oder "themen"
let zugeklappteThemen = JSON.parse(localStorage.getItem("zugeklappt") || "[]");

// Macht aus einem Datum einen Text wie "vor 3 Stunden" oder "vor 2 Tagen"
function wieLangeHer(datum) {
  const stunden = Math.floor((new Date() - datum) / (1000 * 60 * 60));

  if (stunden < 1) {
    return "gerade eben";
  }
  if (stunden === 1) {
    return "vor 1 Stunde";
  }
  if (stunden < 24) {
    return "vor " + stunden + " Stunden";
  }

  const tage = Math.floor(stunden / 24);
  if (tage === 1) {
    return "vor 1 Tag";
  }
  return "vor " + tage + " Tagen";
}

// Macht aus Sekunden einen Text wie "1 Std. 9 Min." oder "42 Min."
function gesamtdauerAlsText(sekunden) {
  const stunden = Math.floor(sekunden / 3600);
  const minuten = Math.floor((sekunden % 3600) / 60);
  if (stunden > 0) {
    return stunden + " Std. " + minuten + " Min.";
  }
  return minuten + " Min.";
}

// Sucht das Thema eines Videos in THEMEN (sonst "Sonstiges")
function themaVon(video) {
  for (const thema in THEMEN) {
    if (THEMEN[thema].includes(video.kanalEintrag.handle)) {
      return thema;
    }
  }
  return "Sonstiges";
}

// Baut die Karte für ein einzelnes Video
function karteBauen(video) {
  const karte = document.createElement("li");
  karte.className = "video-karte";

  const bild = document.createElement("img");
  bild.className = "vorschaubild";
  bild.src = video.bild;
  bild.alt = "";
  bild.loading = "lazy";

  const info = document.createElement("div");
  info.className = "video-info";

  const titel = document.createElement("h3");
  titel.className = "video-titel";
  titel.textContent = video.titel;

  const unten = document.createElement("div");
  unten.className = "video-unten";

  const meta = document.createElement("p");
  meta.className = "video-meta";
  meta.textContent =
    video.kanal +
    " · " +
    wieLangeHer(video.datum) +
    " · " +
    dauerAlsText(video.sekunden);

  const knopf = document.createElement("button");
  knopf.className = "gesehen-knopf";
  knopf.textContent = "✓ Gesehen";
  knopf.title = "Als gesehen markieren";
  knopf.addEventListener("click", (ereignis) => {
    ereignis.stopPropagation(); // sonst würde der Klick auch das Video starten
    videoErledigt(video);
  });

  unten.append(meta, knopf);
  info.append(titel, unten);
  karte.append(bild, info);
  karte.addEventListener("click", () => videoAbspielen(video));
  return karte;
}

// Baut eine Liste (Raster) aus mehreren Karten
function listeBauen(videos) {
  const liste = document.createElement("ul");
  liste.className = "video-liste";
  for (const video of videos) {
    liste.append(karteBauen(video));
  }
  return liste;
}

// Baut einen auf- und zuklappbaren Abschnitt für ein Thema
function abschnittBauen(thema, videos) {
  const abschnitt = document.createElement("details");
  abschnitt.className = "thema-abschnitt";
  abschnitt.open = !zugeklappteThemen.includes(thema);

  let sekunden = 0;
  for (const video of videos) {
    sekunden = sekunden + video.sekunden;
  }

  let anzahlText = videos.length + " Videos";
  if (videos.length === 1) {
    anzahlText = "1 Video";
  }

  const kopf = document.createElement("summary");
  kopf.textContent =
    thema + " · " + anzahlText + " · " + gesamtdauerAlsText(sekunden);

  // Merken, welche Abschnitte zugeklappt sind
  abschnitt.addEventListener("toggle", () => {
    if (abschnitt.open) {
      zugeklappteThemen = zugeklappteThemen.filter((t) => t !== thema);
    } else if (!zugeklappteThemen.includes(thema)) {
      zugeklappteThemen.push(thema);
    }
    localStorage.setItem("zugeklappt", JSON.stringify(zugeklappteThemen));
  });

  abschnitt.append(kopf, listeBauen(videos));
  return abschnitt;
}

// Zeigt die Videos an: als eine Liste oder nach Themen sortiert
function videosAnzeigen(videos) {
  angezeigteVideos = videos;

  const bereich = document.getElementById("video-bereich");
  bereich.innerHTML = ""; // erst einmal leeren

  if (ansicht === "neueste") {
    bereich.append(listeBauen(videos));
  } else {
    const reihenfolge = Object.keys(THEMEN).concat(["Sonstiges"]);
    for (const thema of reihenfolge) {
      const videosImThema = videos.filter((video) => themaVon(video) === thema);
      if (videosImThema.length > 0) {
        bereich.append(abschnittBauen(thema, videosImThema));
      }
    }
  }

  ansichtKnoepfeMarkieren();
  statusAktualisieren();
}

// Markiert ein Video als gesehen und nimmt es aus der Anzeige
function videoErledigt(video) {
  alsGesehenMarkieren(video.id);
  gesehenAbgleichen(); // läuft im Hintergrund, falls mit Google verbunden
  videosAnzeigen(angezeigteVideos.filter((v) => v !== video));
}

// Zeigt oben an, wie viele Videos noch übrig sind
function statusAktualisieren() {
  const anzahl = angezeigteVideos.length;
  const status = document.getElementById("status");

  if (anzahl === 0) {
    status.textContent = "Alles gesehen. Zeit für etwas anderes!";
  } else if (anzahl === 1) {
    status.textContent = "1 neues Video";
  } else {
    status.textContent = anzahl + " neue Videos";
  }
}

// Hebt den Knopf der aktuellen Ansicht hervor
function ansichtKnoepfeMarkieren() {
  for (const knopf of document.querySelectorAll(".ansicht-knopf")) {
    if (knopf.dataset.ansicht === ansicht) {
      knopf.classList.add("aktiv");
    } else {
      knopf.classList.remove("aktiv");
    }
  }
}

// Ansicht-Knöpfe anklickbar machen
for (const knopf of document.querySelectorAll(".ansicht-knopf")) {
  knopf.addEventListener("click", () => {
    ansicht = knopf.dataset.ansicht;
    localStorage.setItem("ansicht", ansicht);
    videosAnzeigen(angezeigteVideos);
  });
}
ansichtKnoepfeMarkieren();
// ===== 7. PLAYER =====

let player = null; // der YouTube-Player (wird beim ersten Klick erstellt)
let playerApiBereit = false; // ist die YouTube-Bibliothek schon geladen?
let aktuellesVideo = null; // welches Video gerade läuft

// Diese Funktion ruft die YouTube-Bibliothek von selbst auf, sobald sie geladen ist.
// Der Name ist von YouTube vorgegeben und darf nicht geändert werden.
function onYouTubeIframeAPIReady() {
  playerApiBereit = true;
}

// Spielt ein Video im Player oben auf der Seite ab
function videoAbspielen(video) {
  if (!playerApiBereit) {
    document.getElementById("status").textContent =
      "Der Player lädt noch, bitte gleich noch einmal klicken.";
    return;
  }

  aktuellesVideo = video;
  document.getElementById("player-titel").textContent = video.titel;

  if (player === null) {
    // Erster Klick: Player erstellen
    player = new YT.Player("player", {
      videoId: video.id,
      playerVars: {
        autoplay: 1,
        rel: 0,
        origin: window.location.origin,
      },
      events: {
        onStateChange: playerStatusGeaendert,
      },
    });
  } else {
    // Player gibt es schon: nur das Video wechseln
    player.loadVideoById(video.id);
  }

  // Nach oben zum Player scrollen
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Wird von YouTube aufgerufen, wenn sich der Zustand ändert (Start, Pause, Ende …)
function playerStatusGeaendert(ereignis) {
  // Beim Start eines Videos unser gewähltes Tempo setzen
  // (YouTube setzt es bei einem neuen Video sonst auf 1 zurück)
  if (ereignis.data === YT.PlayerState.PLAYING) {
    if (player.getPlaybackRate() !== gewaehltesTempo) {
      player.setPlaybackRate(gewaehltesTempo);
    }
  }

  if (ereignis.data === YT.PlayerState.ENDED) {
    videoBeendet(aktuellesVideo);
  }
}

// Wird aufgerufen, wenn ein Video fertig ist: am Ende ODER per "Fertig"-Knopf.
// Später kommt hier noch die Google-Tasks-Anzeige dazu.
function videoBeendet(video) {
  if (video === null) {
    return; // nichts zu tun, z. B. bei doppelter Ende-Meldung von YouTube
  }

  aktuellesVideo = null;

  // Player anhalten, damit keine YouTube-Vorschläge erscheinen
  if (player !== null && player.stopVideo) {
    player.stopVideo();
  }

  videoErledigt(video);
  document.getElementById("player-titel").textContent = "✓ " + video.titel;
}

// "Fertig gesehen"-Knopf
function videoVorzeitigFertig() {
  videoBeendet(aktuellesVideo);
}

document
  .getElementById("fertig-knopf")
  .addEventListener("click", videoVorzeitigFertig);
// ===== 8. TEMPO =====

// Zuletzt gewähltes Tempo aus dem Speicher holen (sonst 1)
let gewaehltesTempo = Number(localStorage.getItem("tempo")) || 1;

function tempoSetzen(tempo) {
  gewaehltesTempo = tempo;
  localStorage.setItem("tempo", tempo);

  if (player !== null && player.setPlaybackRate) {
    player.setPlaybackRate(tempo);
    console.log(
      "Mögliche Tempi bei diesem Video:",
      player.getAvailablePlaybackRates(),
    );
  }

  tempoKnoepfeMarkieren();
}

// Hebt den Knopf des gewählten Tempos hervor
function tempoKnoepfeMarkieren() {
  for (const knopf of document.querySelectorAll(".tempo-knopf")) {
    if (Number(knopf.dataset.tempo) === gewaehltesTempo) {
      knopf.classList.add("aktiv");
    } else {
      knopf.classList.remove("aktiv");
    }
  }
}

// Jeden Tempo-Knopf anklickbar machen
for (const knopf of document.querySelectorAll(".tempo-knopf")) {
  knopf.addEventListener("click", () =>
    tempoSetzen(Number(knopf.dataset.tempo)),
  );
}
tempoKnoepfeMarkieren();

// ===== 8b. KINOMODUS =====

function kinomodusSetzen(an) {
  const knopf = document.getElementById("kino-knopf");

  if (an) {
    document.body.classList.add("kino");
    knopf.textContent = "▭ Normal";
  } else {
    document.body.classList.remove("kino");
    knopf.textContent = "▭ Kinomodus";
  }

  localStorage.setItem("kino", an);
}

document.getElementById("kino-knopf").addEventListener("click", () => {
  const istAn = document.body.classList.contains("kino");
  kinomodusSetzen(!istAn);
});

// Beim Laden der Seite den zuletzt gewählten Modus wiederherstellen
kinomodusSetzen(localStorage.getItem("kino") === "true");

// ===== 9. ZWISCHENSPEICHER (Cache) =====

const CACHE_MINUTEN = 30;

// Holt die Videos aus dem Speicher, falls sie jünger als CACHE_MINUTEN sind
function cacheLesen() {
  const text = localStorage.getItem("videoCache");
  if (!text) {
    return null;
  }

  const cache = JSON.parse(text);
  const alterInMinuten = (Date.now() - cache.zeit) / 60000;
  if (alterInMinuten > CACHE_MINUTEN) {
    return null;
  }

  const videos = [];
  for (const video of cache.videos) {
    // Aktuelle Filter-Einstellungen des Kanals aus KANAELE nehmen
    const eintrag = KANAELE.find((k) => k.handle === video.kanalEintrag.handle);
    if (!eintrag) {
      continue; // Kanal wurde inzwischen aus der Liste entfernt
    }
    video.kanalEintrag = eintrag;
    video.datum = new Date(video.datum); // Text wieder in ein Datum umwandeln
    videos.push(video);
  }
  return videos;
}

function cacheSchreiben(videos) {
  const cache = { zeit: Date.now(), videos: videos };
  localStorage.setItem("videoCache", JSON.stringify(cache));
}

// Liefert alle Videos: aus dem Speicher oder frisch von YouTube
async function alleVideosHolen(neuLaden) {
  if (!neuLaden) {
    const ausCache = cacheLesen();
    if (ausCache) {
      console.log("Videos aus dem Zwischenspeicher (0 Einheiten)");
      return ausCache;
    }
  }

  const videosProKanal = await Promise.all(KANAELE.map(kanalVerarbeiten));
  const alleVideos = videosProKanal.flat();
  await videoDetailsHolen(alleVideos);

  if (alleVideos.length > 0) {
    cacheSchreiben(alleVideos);
  }
  console.log("Videos frisch von YouTube geladen");
  return alleVideos;
}

// ===== 10. GOOGLE-LOGIN =====

// Welche Rechte wir bei Google anfragen.
// drive.appdata = NUR der versteckte App-Ordner in deinem Drive, nichts anderes.
const GOOGLE_RECHTE = "https://www.googleapis.com/auth/drive.appdata";

let googleZugang = null; // Zugangs-Token von Google (gilt ca. 1 Stunde)
let tokenClient = null; // das "Anmelde-Werkzeug" von Google

function mitGoogleVerbinden() {
  // Ist die Google-Bibliothek schon geladen?
  if (!window.google || !google.accounts) {
    document.getElementById("fehler").textContent =
      "Der Google-Login lädt noch, bitte gleich noch einmal klicken.";
    return;
  }

  // Beim ersten Klick das Anmelde-Werkzeug einrichten
  if (tokenClient === null) {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GOOGLE_RECHTE,
      callback: googleAntwort,
      error_callback: googleFensterProblem,
    });
  }

  // Anmeldefenster öffnen
  tokenClient.requestAccessToken();
}

// Wird aufgerufen, wenn Google antwortet
function googleAntwort(antwort) {
  if (antwort.error) {
    console.error("Google-Login fehlgeschlagen:", antwort);
    document.getElementById("fehler").textContent =
      "Die Verbindung mit Google hat nicht geklappt.";
    return;
  }

  googleZugang = antwort.access_token;

  const knopf = document.getElementById("google-knopf");
  knopf.textContent = "☁ Verbunden";
  knopf.classList.add("verbunden");
  document.getElementById("fehler").textContent = "";

  console.log(
    "Mit Google verbunden. Zugang gilt für",
    antwort.expires_in,
    "Sekunden.",
  );
  start(); // gleicht "gesehen" mit Drive ab und baut die Liste neu auf
}

// Wird aufgerufen, wenn das Anmeldefenster nicht aufgeht oder geschlossen wird
function googleFensterProblem(problem) {
  console.warn("Google-Fenster:", problem.type);
  if (problem.type === "popup_failed_to_open") {
    document.getElementById("fehler").textContent =
      "Das Google-Fenster wurde blockiert. Bitte Pop-ups für diese Seite erlauben.";
  }
}

document
  .getElementById("google-knopf")
  .addEventListener("click", mitGoogleVerbinden);

// ===== 10b. GOOGLE DRIVE (versteckter App-Ordner) =====

let driveDateiId = null; // die ID unserer Datei "gesehen.json" in Drive

// Schickt eine Anfrage an Google Drive, mit unserem Zugangs-Token
async function driveAnfrage(adresse, methode, inhalt) {
  const antwort = await fetch(adresse, {
    method: methode,
    headers: {
      Authorization: "Bearer " + googleZugang,
      "Content-Type": "application/json",
    },
    body: inhalt,
  });

  if (antwort.status === 401) {
    googleVerbindungVerloren();
    throw new Error("Google-Zugang ist abgelaufen");
  }
  if (!antwort.ok) {
    throw new Error(
      "Drive-Fehler " + antwort.status + ": " + (await antwort.text()),
    );
  }
  return antwort;
}

// Sucht die Datei "gesehen.json" im App-Ordner. Gibt es sie nicht, wird sie angelegt.
async function driveDateiFinden() {
  if (driveDateiId !== null) {
    return driveDateiId;
  }

  const suche =
    "https://www.googleapis.com/drive/v3/files" +
    "?spaces=appDataFolder" +
    "&q=" +
    encodeURIComponent("name = 'gesehen.json'") +
    "&fields=files(id)";
  const antwort = await driveAnfrage(suche, "GET");
  const daten = await antwort.json();

  if (daten.files.length > 0) {
    driveDateiId = daten.files[0].id;
  } else {
    const neueDatei = JSON.stringify({
      name: "gesehen.json",
      parents: ["appDataFolder"],
      mimeType: "application/json",
    });
    const neu = await driveAnfrage(
      "https://www.googleapis.com/drive/v3/files?fields=id",
      "POST",
      neueDatei,
    );
    const neuDaten = await neu.json();
    driveDateiId = neuDaten.id;
  }

  return driveDateiId;
}

// Liest die "gesehen"-Liste aus Drive
async function driveLesen() {
  const id = await driveDateiFinden();
  const adresse =
    "https://www.googleapis.com/drive/v3/files/" + id + "?alt=media";
  const antwort = await driveAnfrage(adresse, "GET");
  const text = await antwort.text();

  if (!text) {
    return {}; // neue, noch leere Datei
  }
  return JSON.parse(text);
}

// Schreibt die "gesehen"-Liste nach Drive
async function driveSchreiben(gesehen) {
  const id = await driveDateiFinden();
  const adresse =
    "https://www.googleapis.com/upload/drive/v3/files/" +
    id +
    "?uploadType=media";
  await driveAnfrage(adresse, "PATCH", JSON.stringify(gesehen));
}

// Führt lokale Liste und Drive-Liste zusammen und speichert das Ergebnis an beiden Orten
async function gesehenAbgleichen() {
  if (googleZugang === null) {
    return; // nicht verbunden -> nichts zu tun
  }

  try {
    const ausDrive = await driveLesen();
    const lokal = gesehenLaden();

    // Alles aus Drive übernehmen, was lokal fehlt (bei doppelten: der neuere Zeitpunkt)
    for (const videoId in ausDrive) {
      if (lokal[videoId] === undefined || ausDrive[videoId] > lokal[videoId]) {
        lokal[videoId] = ausDrive[videoId];
      }
    }

    localStorage.setItem("gesehen", JSON.stringify(lokal));
    alteEintraegeAufraeumen();
    await driveSchreiben(gesehenLaden());

    console.log(
      "Abgleich mit Drive fertig:",
      Object.keys(gesehenLaden()).length,
      "Einträge",
    );
  } catch (problem) {
    console.error("Abgleich fehlgeschlagen:", problem);
    document.getElementById("fehler").textContent =
      "Abgleich mit Google Drive fehlgeschlagen.";
  }
}

// Wird aufgerufen, wenn der Google-Zugang abgelaufen ist (nach ca. 1 Stunde)
function googleVerbindungVerloren() {
  googleZugang = null;
  const knopf = document.getElementById("google-knopf");
  knopf.textContent = "☁ Mit Google verbinden";
  knopf.classList.remove("verbunden");
  document.getElementById("fehler").textContent =
    "Die Google-Verbindung ist abgelaufen. Bitte neu verbinden.";
}

// ===== 11. HAUPTABLAUF =====

// Macht aus einem Video eine kurze Zeile für die Tabelle in der Konsole
function tabellenZeile(video) {
  return {
    kanal: video.kanal,
    titel: video.titel,
    dauer: dauerAlsText(video.sekunden),
    einbettbar: video.einbettbar,
  };
}

// Übersetzt Fehlermeldungen von YouTube in verständliches Deutsch
function fehlerAlsText(meldung) {
  if (meldung.toLowerCase().includes("quota")) {
    return "Das YouTube-Tageskontingent ist aufgebraucht. Ab ca. 9 Uhr morgens geht es wieder.";
  }
  return "Nicht alle Videos konnten geladen werden: " + meldung;
}

async function start(neuLaden) {
  const status = document.getElementById("status");
  const fehler = document.getElementById("fehler");
  status.textContent = "Lade Videos …";
  fehler.textContent = "";
  letzterFehler = null;

  try {
    alteEintraegeAufraeumen();
    await gesehenAbgleichen();

    const alleVideos = await alleVideosHolen(neuLaden);

    const passende = alleVideos.filter(videoPasst);
    const aussortiert = alleVideos.filter((video) => !videoPasst(video));
    const ungesehen = passende.filter((video) => !istGesehen(video.id));

    // Neueste zuerst
    ungesehen.sort((a, b) => b.datum - a.datum);
    videosAnzeigen(ungesehen);

    console.log(
      "ANGEZEIGT:",
      ungesehen.length,
      "| schon gesehen:",
      passende.length - ungesehen.length,
    );
    console.table(ungesehen.map(tabellenZeile));
    console.log("AUSSORTIERT:", aussortiert.length);
    console.table(aussortiert.map(tabellenZeile));

    if (letzterFehler) {
      fehler.textContent = fehlerAlsText(letzterFehler);
      if (alleVideos.length === 0) {
        status.textContent = "Laden fehlgeschlagen.";
      }
    }
  } catch (problem) {
    console.error(problem);
    status.textContent = "Laden fehlgeschlagen.";
    fehler.textContent =
      "Keine Verbindung zu YouTube. Bist du online? Dann oben auf „Aktualisieren“ klicken.";
  }
}

document
  .getElementById("neu-laden-knopf")
  .addEventListener("click", () => start(true));

start();

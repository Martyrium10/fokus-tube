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

// Baut für jedes Video eine Karte und hängt sie in die Liste auf der Seite
function videosAnzeigen(videos) {
  const liste = document.getElementById("video-liste");
  liste.innerHTML = ""; // Liste erst einmal leeren

  for (const video of videos) {
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
    liste.append(karte);

    video.karte = karte; // merken, damit wir die Karte später entfernen können
  }

  statusAktualisieren();
}

// Markiert ein Video als gesehen und nimmt seine Karte aus der Liste
function videoErledigt(video) {
  alsGesehenMarkieren(video.id);
  video.karte.remove();
  statusAktualisieren();
}

// Zeigt oben an, wie viele Videos noch übrig sind
function statusAktualisieren() {
  const anzahl = document.getElementById("video-liste").children.length;
  const status = document.getElementById("status");

  if (anzahl === 0) {
    status.textContent = "Alles gesehen. Zeit für etwas anderes!";
  } else if (anzahl === 1) {
    status.textContent = "1 neues Video";
  } else {
    status.textContent = anzahl + " neue Videos";
  }
}
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
  videoErledigt(video);
  document.getElementById("player-titel").textContent = "✓ " + video.titel;
}

// "Fertig gesehen"-Knopf: Video anhalten und behandeln, als wäre es zu Ende
function videoVorzeitigFertig() {
  if (player !== null && player.stopVideo) {
    player.stopVideo();
  }
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

// ===== 9. HAUPTABLAUF =====

// Macht aus einem Video eine kurze Zeile für die Tabelle in der Konsole
function tabellenZeile(video) {
  return {
    kanal: video.kanal,
    titel: video.titel,
    dauer: dauerAlsText(video.sekunden),
    einbettbar: video.einbettbar,
  };
}

async function start() {
  const status = document.getElementById("status");
  status.textContent = "Lade Videos …";

  alteEintraegeAufraeumen();

  const videosProKanal = await Promise.all(KANAELE.map(kanalVerarbeiten));
  const alleVideos = videosProKanal.flat();

  await videoDetailsHolen(alleVideos);

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
}
start();

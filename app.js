// --- Ubicacion: GPS o fallback Buenos Aires ---
const DEFAULT_LAT = -34.6131;
const DEFAULT_LON = -58.3772;
const DEFAULT_CIUDAD = "Buenos Aires, Argentina";

let userLat = DEFAULT_LAT;
let userLon = DEFAULT_LON;
let userCiudad = DEFAULT_CIUDAD;
let gpsObtenido = false;

function buildApiUrl(lat, lon) {
    return `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
}

function obtenerUbicacion() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) { resolve(false); return; }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                userLat = pos.coords.latitude;
                userLon = pos.coords.longitude;
                gpsObtenido = true;
                resolve(true);
            },
            () => { resolve(false); },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
        );
    });
}

async function obtenerCiudad(lat, lon) {
    try {
        const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`);
        const data = await resp.json();
        const addr = data.address;
        const ciudad = addr.city || addr.town || addr.village || addr.municipality || "";
        const prov = addr.state || "";
        if (ciudad && prov) return `${ciudad}, ${prov}`;
        if (ciudad) return ciudad;
        return data.display_name.split(",").slice(0, 2).join(",");
    } catch (e) {
        return DEFAULT_CIUDAD;
    }
}

// --- Hora local del dispositivo ---
function franjaHoraria() {
    const h = new Date().getHours();
    if (h >= 6 && h < 10) return "amanecer";
    if (h >= 10 && h < 17) return "mediodia";
    if (h >= 17 && h < 20) return "tarde";
    return "noche";
}

function hora() {
    return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// --- Fondos segun clima + hora ---
const FONDOS = {
    despejado: {
        amanecer:  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80",
        mediodia:  "https://images.unsplash.com/photo-1504386106331-3e4e71712b38?w=1920&q=80",
        tarde:     "https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1920&q=80",
        noche:     "https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=1920&q=80",
    },
    nublado: {
        amanecer:  "https://images.unsplash.com/photo-1501908734255-16579c18c25f?w=1920&q=80",
        mediodia:  "https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?w=1920&q=80",
        tarde:     "https://images.unsplash.com/photo-1515490480959-fac3e07ffa1c?w=1920&q=80",
        noche:     "https://images.unsplash.com/photo-1534088568595-a066f410bcda?w=1920&q=80",
    },
    niebla: {
        amanecer:  "https://images.unsplash.com/photo-1487621167305-5d248087c724?w=1920&q=80",
        mediodia:  "https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227?w=1920&q=80",
        tarde:     "https://images.unsplash.com/photo-1543968996-ee822b8176ba?w=1920&q=80",
        noche:     "https://images.unsplash.com/photo-1510272839903-5765dfa1a78d?w=1920&q=80",
    },
    lluvia: {
        amanecer:  "https://images.unsplash.com/photo-1438449805896-28a666819a20?w=1920&q=80",
        mediodia:  "https://images.unsplash.com/photo-1501691223387-dd0500403074?w=1920&q=80",
        tarde:     "https://images.unsplash.com/photo-1428592953211-077101b2021b?w=1920&q=80",
        noche:     "https://images.unsplash.com/photo-1519692933481-e162a57d6721?w=1920&q=80",
    },
    nieve: {
        amanecer:  "https://images.unsplash.com/photo-1457269449834-928af64c684d?w=1920&q=80",
        mediodia:  "https://images.unsplash.com/photo-1491002052546-bf38f186af56?w=1920&q=80",
        tarde:     "https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=1920&q=80",
        noche:     "https://images.unsplash.com/photo-1548777123-e216912df7d8?w=1920&q=80",
    },
    tormenta: {
        amanecer:  "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=1920&q=80",
        mediodia:  "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=1920&q=80",
        tarde:     "https://images.unsplash.com/photo-1428592953211-077101b2021b?w=1920&q=80",
        noche:     "https://images.unsplash.com/photo-1472145246862-b24cf25c4a36?w=1920&q=80",
    },
};

const WMO_CODES = {
    0:  { fondo: "despejado", desc: "Cielo despejado" },
    1:  { fondo: "despejado", desc: "Mayormente despejado" },
    2:  { fondo: "nublado",   desc: "Parcialmente nublado" },
    3:  { fondo: "nublado",   desc: "Nublado" },
    45: { fondo: "niebla",    desc: "Niebla" },
    48: { fondo: "niebla",    desc: "Niebla con escarcha" },
    51: { fondo: "lluvia",    desc: "Llovizna ligera" },
    53: { fondo: "lluvia",    desc: "Llovizna moderada" },
    55: { fondo: "lluvia",    desc: "Llovizna intensa" },
    56: { fondo: "lluvia",    desc: "Llovizna helada ligera" },
    57: { fondo: "lluvia",    desc: "Llovizna helada intensa" },
    61: { fondo: "lluvia",    desc: "Lluvia ligera" },
    63: { fondo: "lluvia",    desc: "Lluvia moderada" },
    65: { fondo: "lluvia",    desc: "Lluvia intensa" },
    66: { fondo: "lluvia",    desc: "Lluvia helada ligera" },
    67: { fondo: "lluvia",    desc: "Lluvia helada intensa" },
    71: { fondo: "nieve",     desc: "Nevada ligera" },
    73: { fondo: "nieve",     desc: "Nevada moderada" },
    75: { fondo: "nieve",     desc: "Nevada intensa" },
    77: { fondo: "nieve",     desc: "Granizo" },
    80: { fondo: "lluvia",    desc: "Chubascos ligeros" },
    81: { fondo: "lluvia",    desc: "Chubascos moderados" },
    82: { fondo: "lluvia",    desc: "Chubascos violentos" },
    85: { fondo: "nieve",     desc: "Nevadas ligeras" },
    86: { fondo: "nieve",     desc: "Nevadas intensas" },
    95: { fondo: "tormenta",  desc: "Tormenta electrica" },
    96: { fondo: "tormenta",  desc: "Tormenta con granizo ligero" },
    99: { fondo: "tormenta",  desc: "Tormenta con granizo fuerte" },
};

// --- DOM ---
const $bg = document.getElementById("bg");
const $bgNext = document.getElementById("bg-next");
const $temp = document.getElementById("temp");
const $sensacion = document.getElementById("sensacion");
const $humedad = document.getElementById("humedad");
const $viento = document.getElementById("viento");
const $update = document.getElementById("update");
const $climaDesc = document.getElementById("clima-desc");
const $forecast = document.getElementById("forecast");
const $rainAlert = document.getElementById("rain-alert");
const $outfitSvg = document.getElementById("outfit-svg");
const $outfitText = document.getElementById("outfit-text");
const $titulo = document.querySelector("h1");

let fondoActual = "";

const WMO_ICONOS = {
    0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️",
    45: "🌫️", 48: "🌫️",
    51: "🌦️", 53: "🌦️", 55: "🌧️", 56: "🌧️", 57: "🌧️",
    61: "🌦️", 63: "🌧️", 65: "🌧️", 66: "🌧️", 67: "🌧️",
    71: "🌨️", 73: "🌨️", 75: "❄️", 77: "❄️",
    80: "🌦️", 81: "🌧️", 82: "🌧️", 85: "🌨️", 86: "🌨️",
    95: "⛈️", 96: "⛈️", 99: "⛈️",
};

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

function renderForecast(daily) {
    $forecast.innerHTML = "";
    for (let i = 0; i < daily.time.length; i++) {
        const fecha = new Date(daily.time[i] + "T12:00:00");
        const nombre = i === 0 ? "Hoy" : DIAS_SEMANA[fecha.getDay()];
        const code = daily.weather_code[i];
        const icono = WMO_ICONOS[code] || "🌡️";
        const max = Math.round(daily.temperature_2m_max[i]);
        const min = Math.round(daily.temperature_2m_min[i]);
        const lluvia = daily.precipitation_probability_max[i];
        const div = document.createElement("div");
        div.className = "forecast-day";
        div.innerHTML = `<div class="dia">${nombre}</div><div class="icono">${icono}</div><div class="temps">${max}° <span class="min">${min}°</span></div><div class="lluvia">💧 ${lluvia}%</div>`;
        $forecast.appendChild(div);
    }
}

function cambiarFondo(url) {
    if (url === fondoActual) return;
    fondoActual = url;
    const img = new Image();
    img.onload = function () {
        $bgNext.style.backgroundImage = `url('${url}')`;
        $bg.style.opacity = "0";
        setTimeout(() => { $bg.style.backgroundImage = `url('${url}')`; $bg.style.opacity = "1"; }, 1500);
    };
    img.src = url;
}

async function actualizar() {
    try {
        const resp = await fetch(buildApiUrl(userLat, userLon));
        const data = await resp.json();
        const c = data.current;
        const u = data.current_units;
        const weatherCode = c.weather_code;
        const info = WMO_CODES[weatherCode] || { fondo: "despejado", desc: `Codigo WMO: ${weatherCode}` };
        cambiarFondo(FONDOS[info.fondo][franjaHoraria()]);
        $climaDesc.textContent = info.desc;
        $temp.textContent = `${c.temperature_2m}${u.temperature_2m}`;
        $temp.classList.remove("loading");
        $sensacion.textContent = `Sensacion termica: ${c.apparent_temperature}${u.apparent_temperature}`;
        $humedad.textContent = `${c.relative_humidity_2m}${u.relative_humidity_2m}`;
        $viento.textContent = `${c.wind_speed_10m} ${u.wind_speed_10m}`;
        $update.textContent = `Ultima actualizacion: ${hora()}`;
        renderForecast(data.daily);
        actualizarAlarma(data.daily);
        actualizarVestimenta(c.apparent_temperature, weatherCode, data.daily.precipitation_probability_max[0]);
    } catch (e) {
        console.error("Error al actualizar:", e.message);
    }
}

// --- Personajes Disney ---
const PERSONAJES = [
    { nombre: "Mickey", img: "https://cdn.s7.shopdisney.eu/is/image/ShopDisneyEMEA/33631_mickey_mouse_character_sq_l", anim: "bounce" },
    { nombre: "Minnie", img: "https://cdn.s7.shopdisney.eu/is/image/ShopDisneyEMEA/33631_minnie_mouse_character_sq_l", anim: "sway" },
    { nombre: "Donald", img: "https://cdn.s7.shopdisney.eu/is/image/ShopDisneyEMEA/33631_donald_duck_character_sq_l", anim: "waddle" },
    { nombre: "Pluto", img: "https://cdn.s7.shopdisney.eu/is/image/ShopDisneyEMEA/33631_pluto_character_sq_l", anim: "wag" },
    { nombre: "Goofy", img: "https://cdn.s7.shopdisney.eu/is/image/ShopDisneyEMEA/33631_goofy_character_sq_l", anim: "trip" },
    { nombre: "Stitch", img: "https://cdn.s7.shopdisney.eu/is/image/ShopDisneyEMEA/33631_stitch_character_sq_l", anim: "bounce" },
    { nombre: "Simba", img: "https://cdn.s7.shopdisney.eu/is/image/ShopDisneyEMEA/33631_simba_character_sq_l", anim: "sway" },
    { nombre: "Olaf", img: "https://cdn.s7.shopdisney.eu/is/image/ShopDisneyEMEA/33631_olaf_character_sq_l", anim: "waddle" },
    { nombre: "Dumbo", img: "https://cdn.s7.shopdisney.eu/is/image/ShopDisneyEMEA/33631_dumbo_character_sq_l", anim: "float" },
    { nombre: "Winnie Pooh", img: "https://cdn.s7.shopdisney.eu/is/image/ShopDisneyEMEA/33631_winnie-the-pooh_character_sq_l", anim: "trip" },
];

function personajeDelDia() {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), 0, 0);
    const dia = Math.floor((hoy - inicio) / 86400000);
    return PERSONAJES[dia % PERSONAJES.length];
}

function obtenerPrendas(temp, weatherCode, lluvia) {
    const esLluvia = [51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(weatherCode);
    const esNieve = [71,73,75,77,85,86].includes(weatherCode);
    let prendas = [];
    let iconos = [];
    if (temp <= 5) {
        prendas = ["Campera de abrigo", "Bufanda y gorro", "Pantalon largo", "Botas"];
        iconos = ["🧥", "🧣", "🧤", "🥾", "🎿"];
    } else if (temp <= 12) {
        prendas = ["Campera liviana", "Manga larga", "Pantalon largo", "Zapatillas"];
        iconos = ["🧥", "👕", "👖", "👟"];
    } else if (temp <= 18) {
        prendas = ["Buzo o sweater", "Remera", "Pantalon largo", "Zapatillas"];
        iconos = ["🧶", "👕", "👖", "👟"];
    } else if (temp <= 25) {
        prendas = ["Remera liviana", "Pantalon liviano", "Zapatillas"];
        iconos = ["👕", "👖", "👟"];
    } else {
        prendas = ["Remera liviana", "Short", "Ojotas o sandalias"];
        iconos = ["👕", "🩳", "🩴", "🕶️"];
    }
    if (esLluvia || lluvia >= 60) { prendas.push("Paraguas"); iconos.push("☂️"); }
    if (esNieve) { prendas.push("Botas impermeables"); iconos.push("🥾"); }
    return { prendas, iconos };
}

const ACC_POS = ["acc-top", "acc-top-right", "acc-right", "acc-bottom-right", "acc-bottom", "acc-bottom-left", "acc-left", "acc-top-left"];

function actualizarVestimenta(temp, weatherCode, lluvia) {
    const personaje = personajeDelDia();
    const { prendas, iconos } = obtenerPrendas(temp, weatherCode, lluvia);
    const accs = iconos.slice(0, ACC_POS.length).map((ic, i) =>
        `<span class="char-acc ${ACC_POS[i]}" style="animation-delay:${i * 0.08}s">${ic}</span>`
    ).join("");
    $outfitSvg.innerHTML = `<div class="char-wrapper"><img src="${personaje.img}" alt="${personaje.nombre}" class="char-img char-anim-${personaje.anim}">${accs}</div>`;
    $outfitText.innerHTML = `<div class="outfit-nombre">${personaje.nombre} recomienda:</div>` +
        prendas.map(p => `<div class="outfit-item">&bull; ${p}</div>`).join("");
}

function actualizarAlarma(daily) {
    const probHoy = daily.precipitation_probability_max[0];
    const codeHoy = daily.weather_code[0];
    const descHoy = WMO_CODES[codeHoy]?.desc || "";
    const esLluvia = [51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(codeHoy);

    if (probHoy >= 70 || esLluvia) {
        $rainAlert.classList.remove("hidden", "nivel-alto");
        if (probHoy >= 85 || [65,67,82,95,96,99].includes(codeHoy)) {
            $rainAlert.classList.add("nivel-alto");
            $rainAlert.textContent = `⚠️ ALERTA: ${descHoy} — Probabilidad de lluvia ${probHoy}%`;
        } else {
            $rainAlert.textContent = `🌧️ Lluvia esperada hoy: ${descHoy} — Probabilidad ${probHoy}%`;
        }
    } else if (probHoy >= 40) {
        $rainAlert.classList.remove("hidden", "nivel-alto");
        $rainAlert.textContent = `☁️ Posible lluvia hoy — Probabilidad ${probHoy}%`;
    } else {
        $rainAlert.classList.add("hidden");
    }
}

// --- Mapa meteorologico ---
let map = null;
let radarLayer = null;
let tempLayer = null;
let cloudsLayer = null;
let precipLayer = null;
let userMarker = null;

function inicializarMapa(lat, lon) {
    map = L.map("map", { zoomControl: true, maxZoom: 12, minZoom: 3 }).setView([lat, lon], 8);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 12
    }).addTo(map);

    userMarker = L.marker([lat, lon]).addTo(map)
        .bindPopup(gpsObtenido ? userCiudad : DEFAULT_CIUDAD)
        .openPopup();

    setTimeout(() => map.invalidateSize(), 500);
}

async function actualizarCapasClima() {
    if (!map) return;

    try {
        const resp = await fetch("https://api.rainviewer.com/public/weather-maps.json");
        const data = await resp.json();
        const last = data.radar.past[data.radar.past.length - 1];

        if (radarLayer) map.removeLayer(radarLayer);
        radarLayer = L.tileLayer(data.host + last.path + "/512/{z}/{x}/{y}/4/1_1.png", {
            opacity: 0.6, tileSize: 512, zoomOffset: -1
        }).addTo(map);
    } catch (e) {
        console.error("Error radar RainViewer:", e.message);
    }

    try {
        const owmBase = "https://tile.openweathermap.org/map";
        const owmKey = "9de243494c0b295cca9337e1e96b00e2";

        if (tempLayer) map.removeLayer(tempLayer);
        tempLayer = L.tileLayer(`${owmBase}/temp_new/{z}/{x}/{y}.png?appid=${owmKey}`, {
            opacity: 0.3, maxZoom: 12
        }).addTo(map);

        if (cloudsLayer) map.removeLayer(cloudsLayer);
        cloudsLayer = L.tileLayer(`${owmBase}/clouds_new/{z}/{x}/{y}.png?appid=${owmKey}`, {
            opacity: 0.25, maxZoom: 12
        }).addTo(map);

        if (precipLayer) map.removeLayer(precipLayer);
        precipLayer = L.tileLayer(`${owmBase}/precipitation_new/{z}/{x}/{y}.png?appid=${owmKey}`, {
            opacity: 0.4, maxZoom: 12
        }).addTo(map);
    } catch (e) {
        console.error("Error capas OWM:", e.message);
    }
}

// --- Inicio ---
async function iniciar() {
    $climaDesc.textContent = "Obteniendo ubicacion...";

    const gps = await obtenerUbicacion();

    if (gps) {
        userCiudad = await obtenerCiudad(userLat, userLon);
    }

    $titulo.textContent = userCiudad;

    inicializarMapa(userLat, userLon);
    actualizarCapasClima();
    setInterval(actualizarCapasClima, 300000);

    actualizar();
    setInterval(actualizar, 60000);
}

iniciar();

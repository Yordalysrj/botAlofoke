import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import * as cheerio from "cheerio";

const TOKEN = "8475068455:AAHa8tSgqMD0IOAng2u0j1bQQNv_BOyv-2c";
const DESTINO = "@casadealofoke02";
const ORIGEN = "alofokemusicrecords"; // sin @

// Inicializa el bot
const bot = new TelegramBot(TOKEN, { polling: false });
let ultimo = "";

// 🔁 Función para revisar nuevas publicaciones
async function revisar() {
  try {
    const { data } = await axios.get(`https://t.me/s/${ORIGEN}`);
    const $ = cheerio.load(data);

    // Busca los mensajes más recientes
    const posts = $("div.tgme_widget_message_wrap").map((i, el) => {
      const id = $(el).find("a.tme_widget_message_date").attr("href");
      const texto = $(el).find(".tgme_widget_message_text").text().trim();
      const img = $(el).find(".tgme_widget_message_photo_wrap").attr("style");
      const video = $(el).find("video").attr("src");
      return { id, texto, img, video };
    }).get();

    const nuevo = posts.pop();

    if (!nuevo || nuevo.id === ultimo) return;
    ultimo = nuevo.id;

    console.log("🔔 Nuevo post detectado:", nuevo.id);

    // 📝 Si hay texto
    if (nuevo.texto) {
      await bot.sendMessage(DESTINO, `🧠 ${nuevo.texto}`);
    }

    // 🖼️ Si hay imagen
    if (nuevo.img) {
      const urlMatch = nuevo.img.match(/url\('([^']+)'\)/);
      if (urlMatch && urlMatch[1]) {
        await bot.sendPhoto(DESTINO, urlMatch[1]);
      }
    }

    // 🎥 Si hay video
    if (nuevo.video) {
      await bot.sendVideo(DESTINO, nuevo.video);
    }

    console.log("✅ Publicado en tu canal:", DESTINO);

  } catch (err) {
    console.error("❌ Error al revisar el canal:", err.message);
  }
}

// Revisar cada 3 minutos
setInterval(revisar, 3 * 60 * 1000);
revisar();

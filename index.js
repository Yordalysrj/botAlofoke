import express from "express";
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import * as cheerio from "cheerio";

// Servidor mínimo para mantener Render activo
const app = express();
app.get("/", (req, res) => res.send("Bot Alofoke activo ✅"));
app.listen(10000, () => console.log("Servidor web activo en puerto 10000"));

// Variables del entorno
const TOKEN = process.env.TOKEN;
const DESTINO = process.env.DESTINO;
const ORIGEN = process.env.ORIGEN;

const bot = new TelegramBot(TOKEN, { polling: false });
let ultimo = "";

async function revisar() {
  try {
    const { data } = await axios.get(`https://t.me/s/${ORIGEN}`);
    const $ = cheerio.load(data);

    const posts = $("div.tgme_widget_message_wrap")
      .map((i, el) => {
        const id = $(el).find("a.tme_widget_message_date").attr("href");
        const texto = $(el).find(".tgme_widget_message_text").text().trim();
        const img = $(el).find(".tgme_widget_message_photo_wrap").attr("style");
        const video = $(el).find("video").attr("src");
        return { id, texto, img, video };
      })
      .get();

    const nuevo = posts.pop();
    if (!nuevo || nuevo.id === ultimo) return;

    ultimo = nuevo.id;
    console.log("🔔 Nuevo post detectado:", nuevo.id);

    if (nuevo.texto) {
      await bot.sendMessage(DESTINO, `🧠 ${nuevo.texto}`);
    }

    if (nuevo.img) {
      const match = nuevo.img.match(/url\('([^']+)'\)/);
      if (match && match[1]) {
        await bot.sendPhoto(DESTINO, match[1]);
      }
    }

    if (nuevo.video) {
      await bot.sendVideo(DESTINO, nuevo.video);
    }

    console.log("✅ Publicado en tu canal:", DESTINO);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
}

// Revisa cada 3 minutos
setInterval(revisar, 3 * 60 * 1000);
revisar();

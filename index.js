import express from "express";
import TelegramBot from "node-telegram-bot-api";
import axios from "axios";
import * as cheerio from "cheerio";

const app = express();
app.get("/", (req, res) => res.send("Bot Alofoke activo ✅"));
app.listen(10000, () => console.log("Servidor activo en Render 🚀"));

const TOKEN = process.env.TOKEN;
const DESTINO = process.env.DESTINO;
const ORIGEN = process.env.ORIGEN;

const bot = new TelegramBot(TOKEN, { polling: false });
let ultimoPost = "";

async function revisar() {
  try {
    const url = `https://t.me/s/${ORIGEN}`;
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    // Encuentra los mensajes
    const mensajes = $("div.tgme_widget_message_wrap").map((i, el) => {
      const id = $(el).find("a.tgme_widget_message_date").attr("href");
      const texto = $(el).find(".tgme_widget_message_text").text().trim();
      const imagen = $(el).find("img.tgme_widget_message_photo").attr("src");
      const video = $(el).find("video").attr("src");
      const link = $(el).find(".tgme_widget_message_link_preview a").attr("href");
      return { id, texto, imagen, video, link };
    }).get();

    const nuevo = mensajes.pop();
    if (!nuevo || nuevo.id === ultimoPost) return;

    ultimoPost = nuevo.id;
    console.log("🔔 Nuevo post detectado:", nuevo.id);

    // Envía texto
    if (nuevo.texto) await bot.sendMessage(DESTINO, nuevo.texto);

    // Envía foto
    if (nuevo.imagen) await bot.sendPhoto(DESTINO, nuevo.imagen);

    // Envía video
    if (nuevo.video) await bot.sendVideo(DESTINO, nuevo.video);

    // Envía enlace de YouTube o externos
    if (nuevo.link) await bot.sendMessage(DESTINO, `🔗 ${nuevo.link}`);

    console.log("✅ Publicado en tu canal:", DESTINO);

  } catch (err) {
    console.error("❌ Error al revisar:", err.message);
  }
}

// Revisa cada 2 minutos
setInterval(revisar, 2 * 60 * 1000);
revisar();

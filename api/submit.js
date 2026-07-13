export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    const webhook = process.env.DISCORD_WEBHOOK_URL;
    const siteUrl = process.env.SITE_URL;
    const reviewKey = process.env.REVIEW_KEY;

    if (!webhook) {
      return res.status(500).json({
        ok: false,
        error: "Brakuje zmiennej DISCORD_WEBHOOK_URL na Vercelu."
      });
    }

    if (!siteUrl) {
      return res.status(500).json({
        ok: false,
        error: "Brakuje zmiennej SITE_URL na Vercelu."
      });
    }

    if (!reviewKey) {
      return res.status(500).json({
        ok: false,
        error: "Brakuje zmiennej REVIEW_KEY na Vercelu."
      });
    }

    const body = req.body || {};

    const required = [
      "lider_nick",
      "lider_discord",
      "lider_data",
      "cz2_nick",
      "cz2_discord",
      "cz2_data",
      "cz3_nick",
      "cz3_discord",
      "cz3_data",
      "video_url"
    ];

    for (const key of required) {
      if (!body[key] || String(body[key]).trim().length < 2) {
        return res.status(400).json({
          ok: false,
          error: "Uzupełnij wszystkie pola."
        });
      }
    }

    const video = String(body.video_url).trim();

    const videoOk =
      video.includes("tiktok.com") ||
      video.includes("youtube.com") ||
      video.includes("youtu.be");

    if (!videoOk) {
      return res.status(400).json({
        ok: false,
        error: "Filmik musi być z TikToka albo YouTube."
      });
    }

    if (String(body.hashtag_confirm) !== "true") {
      return res.status(400).json({
        ok: false,
        error: "Musisz potwierdzić użycie #igrzyskakaucyjne."
      });
    }

    const submittedAt = new Date().toLocaleString("pl-PL", {
      timeZone: "Europe/Warsaw"
    });

    const embed = {
      title: "🛡️ Nowe zgłoszenie — Igrzyska Kaucyjne",
      color: 0xe92828,
      description:
        `**Status:** ⏳ DO SPRAWDZENIA\n` +
        `**Data zgłoszenia:** ${submittedAt}`,
      fields: [
        {
          name: "♛ Lider",
          value:
            `**Nick Minecraft:** ${body.lider_nick}\n` +
            `**ID Discord:** ${body.lider_discord}\n` +
            `**Data urodzenia:** ${body.lider_data}`,
          inline: false
        },
        {
          name: "◆ Członek 2",
          value:
            `**Nick Minecraft:** ${body.cz2_nick}\n` +
            `**ID Discord:** ${body.cz2_discord}\n` +
            `**Data urodzenia:** ${body.cz2_data}`,
          inline: false
        },
        {
          name: "◇ Członek 3",
          value:
            `**Nick Minecraft:** ${body.cz3_nick}\n` +
            `**ID Discord:** ${body.cz3_discord}\n` +
            `**Data urodzenia:** ${body.cz3_data}`,
          inline: false
        },
        {
          name: "🎬 Filmik zgłoszeniowy",
          value:
            `**Link:** ${video}\n` +
            `**Hashtag:** #igrzyskakaucyjne`,
          inline: false
        },
        {
          name: "✅ Wymagania",
          value:
            "Minimum 12 lat\n" +
            "Minecraft premium\n" +
            "Filmik TikTok/YouTube z #igrzyskakaucyjne",
          inline: false
        }
      ],
      footer: {
        text: "Kliknij link Akceptuj/Odrzuć pod wiadomością."
      },
      timestamp: new Date().toISOString()
    };

    const firstResponse = await fetch(`${webhook}?wait=true`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: "Igrzyska Kaucyjne — Zgłoszenia",
        content: "📨 Nowe zgłoszenie do sprawdzenia!",
        embeds: [embed]
      })
    });

    if (!firstResponse.ok) {
      const text = await firstResponse.text();

      return res.status(500).json({
        ok: false,
        error: "Discord webhook nie przyjął zgłoszenia.",
        details: text
      });
    }

    const sentMessage = await firstResponse.json();
    const messageId = sentMessage.id;

    const cleanSiteUrl = siteUrl.replace(/\/$/, "");

    const acceptUrl =
      `${cleanSiteUrl}/api/review?action=accept&message=${messageId}&key=${encodeURIComponent(reviewKey)}`;

    const rejectUrl =
      `${cleanSiteUrl}/api/review?action=reject&message=${messageId}&key=${encodeURIComponent(reviewKey)}`;

    const editResponse = await fetch(`${webhook}/messages/${messageId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: "Igrzyska Kaucyjne — Zgłoszenia",
        content:
          "📨 Nowe zgłoszenie do sprawdzenia!\n\n" +
          `✅ **[Akceptuj zgłoszenie](${acceptUrl})**\n` +
          `❌ **[Odrzuć zgłoszenie](${rejectUrl})**`,
        embeds: [embed]
      })
    });

    if (!editResponse.ok) {
      const text = await editResponse.text();

      return res.status(500).json({
        ok: false,
        error: "Nie udało się dodać linków Akceptuj/Odrzuć do zgłoszenia.",
        details: text
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Zgłoszenie wysłane do administracji."
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Błąd serwera.",
      details: String(err?.message || err)
    });
  }
}

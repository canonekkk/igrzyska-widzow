export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    const botToken = process.env.DISCORD_BOT_TOKEN;
    const channelId = process.env.DISCORD_SUBMISSIONS_CHANNEL_ID;

    if (!botToken) {
      return res.status(500).json({
        ok: false,
        error: "Brakuje zmiennej DISCORD_BOT_TOKEN na Vercelu."
      });
    }

    if (!channelId) {
      return res.status(500).json({
        ok: false,
        error: "Brakuje zmiennej DISCORD_SUBMISSIONS_CHANNEL_ID na Vercelu."
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
        text: "Kliknij Akceptuj albo Odrzuć."
      },
      timestamp: new Date().toISOString()
    };

    const discordResponse = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bot ${botToken}`
        },
        body: JSON.stringify({
          content: "📨 Nowe zgłoszenie do sprawdzenia!",
          embeds: [embed],
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  style: 3,
                  label: "Akceptuj",
                  emoji: {
                    name: "✅"
                  },
                  custom_id: "kaucyjne_accept"
                },
                {
                  type: 2,
                  style: 4,
                  label: "Odrzuć",
                  emoji: {
                    name: "❌"
                  },
                  custom_id: "kaucyjne_reject"
                }
              ]
            }
          ]
        })
      }
    );

    if (!discordResponse.ok) {
      const text = await discordResponse.text();

      return res.status(500).json({
        ok: false,
        error: "Bot nie wysłał zgłoszenia na Discorda.",
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

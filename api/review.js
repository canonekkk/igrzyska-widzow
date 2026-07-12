export default async function handler(req, res) {
  try {
    const webhook = process.env.DISCORD_WEBHOOK_URL;
    const reviewKey = process.env.REVIEW_KEY;

    if (!webhook) {
      return res.status(500).send("Brakuje DISCORD_WEBHOOK_URL.");
    }

    if (!reviewKey) {
      return res.status(500).send("Brakuje REVIEW_KEY.");
    }

    const { action, message, key } = req.query;

    if (key !== reviewKey) {
      return res.status(403).send("Brak dostępu.");
    }

    if (!message) {
      return res.status(400).send("Brakuje ID wiadomości.");
    }

    if (action === "reject") {
      const del = await fetch(`${webhook}/messages/${message}`, {
        method: "DELETE"
      });

      if (!del.ok) {
        const text = await del.text();
        return res.status(500).send(`Nie udało się usunąć zgłoszenia: ${text}`);
      }

      return res.status(200).send("❌ Zgłoszenie odrzucone i usunięte z kanału.");
    }

    if (action === "accept") {
      const getMsg = await fetch(`${webhook}/messages/${message}`);

      if (!getMsg.ok) {
        const text = await getMsg.text();
        return res.status(500).send(`Nie udało się pobrać zgłoszenia: ${text}`);
      }

      const msg = await getMsg.json();
      const oldEmbed = msg.embeds?.[0] || {};

      const newEmbed = {
        ...oldEmbed,
        color: 0x2ecc71,
        description:
          `${oldEmbed.description || ""}\n\n✅ **ZAAKCEPTOWANE**`,
        footer: {
          text: "Zgłoszenie zaakceptowane przez administrację."
        },
        timestamp: new Date().toISOString()
      };

      const patch = await fetch(`${webhook}/messages/${message}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: "✅ ZGŁOSZENIE ZAAKCEPTOWANE",
          embeds: [newEmbed],
          components: []
        })
      });

      if (!patch.ok) {
        const text = await patch.text();
        return res.status(500).send(`Nie udało się zaakceptować zgłoszenia: ${text}`);
      }

      return res.status(200).send("✅ Zgłoszenie zaakceptowane.");
    }

    return res.status(400).send("Nieznana akcja.");
  } catch (err) {
    return res.status(500).send(`Błąd: ${String(err?.message || err)}`);
  }
}

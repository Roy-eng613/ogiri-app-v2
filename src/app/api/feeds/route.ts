import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function parseFeed(xmlText: string, type: "note" | "hatena" | "youtube") {
  const items: any[] = [];
  
  if (type === "note") {
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const content = match[1];
      const titleMatch = content.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || content.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = content.match(/<link>([\s\S]*?)<\/link>/);
      const dateMatch = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
      
      if (titleMatch && linkMatch) {
        items.push({
          source: "note",
          title: titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim(),
          link: linkMatch[1].trim(),
          date: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
        });
      }
    }
  } else if (type === "hatena") {
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = entryRegex.exec(xmlText)) !== null) {
      const content = match[1];
      const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = content.match(/<link[^>]*?href=["']([^"']*)["']/);
      const dateMatch = content.match(/<published>([\s\S]*?)<\/published>/);
      
      if (titleMatch && linkMatch) {
        items.push({
          source: "hatena",
          title: titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim(),
          link: linkMatch[1].trim(),
          date: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
        });
      }
    }
  } else if (type === "youtube") {
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    while ((match = entryRegex.exec(xmlText)) !== null) {
      const content = match[1];
      const titleMatch = content.match(/<title>([\s\S]*?)<\/title>/);
      const linkMatch = content.match(/<link[^>]*?href=["']([^"']*)["']/);
      const dateMatch = content.match(/<published>([\s\S]*?)<\/published>/);
      
      if (titleMatch && linkMatch) {
        items.push({
          source: "youtube",
          title: titleMatch[1].trim(),
          link: linkMatch[1].trim(),
          date: dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString(),
        });
      }
    }
  }
  
  return items;
}

export async function GET() {
  try {
    const noteUrl = "https://note.com/mon_hormone/rss";
    const hatenaUrl = "https://dokusyocoffee.hatenablog.com/feed";
    const youtubeUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=UCFGdlsVmQWrJ-2PXmgfCq9Q";

    // Concurrently fetch all feeds with a 5 second timeout
    const fetchWithTimeout = async (url: string) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 6000);
      try {
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(id);
        if (!res.ok) return "";
        return await res.text();
      } catch (e) {
        clearTimeout(id);
        return "";
      }
    };

    const [noteXml, hatenaXml, youtubeXml] = await Promise.all([
      fetchWithTimeout(noteUrl),
      fetchWithTimeout(hatenaUrl),
      fetchWithTimeout(youtubeUrl),
    ]);

    const noteItems = noteXml ? parseFeed(noteXml, "note") : [];
    const hatenaItems = hatenaXml ? parseFeed(hatenaXml, "hatena") : [];
    const youtubeItems = youtubeXml ? parseFeed(youtubeXml, "youtube") : [];

    // Combine and sort by date descending
    const combined = [...noteItems, ...hatenaItems, ...youtubeItems]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 25); // Limit to top 25 updates to ensure client has enough items

    return NextResponse.json({ success: true, feeds: combined });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

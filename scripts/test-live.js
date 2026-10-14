async function testAll() {
  const urls = ["/", "/c/stampy", "/dashboard", "/terminal", "/login"];
  for (const u of urls) {
    const res = await fetch("https://memories-c9w.pages.dev" + u, {
      headers: { "Cache-Control": "no-cache" }
    });
    const text = await res.text();
    console.log("URL:", u, "| Status:", res.status, "| Size:", text.length, "| HasPhotobooth:", (text.includes("كشك تصوير") || text.includes("استوديو الصور")));
  }
}
testAll();

async function checkScripts() {
  const res = await fetch("https://memories-c9w.pages.dev/");
  const html = await res.text();
  const regex = /src="([^"]+\.js)"/g;
  let match;
  const scripts = [];
  while ((match = regex.exec(html)) !== null) {
    scripts.push(match[1]);
  }
  console.log("Script count:", scripts.length);
  for (const s of scripts) {
    const sRes = await fetch("https://memories-c9w.pages.dev" + s);
    console.log(s, "->", sRes.status);
  }
}
checkScripts();

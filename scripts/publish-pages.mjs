import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
const root = resolve(import.meta.dirname, "..");
const built = resolve(root, "dist-pages");
const html = await readFile(resolve(built, "index.html"), "utf8");
if (!html.includes("/Operations-Platform/assets/"))
  throw Error("The Pages build must use /Operations-Platform/ as its base.");
await rm(resolve(root, "assets"), { recursive: true, force: true });
await mkdir(resolve(root, "assets"), { recursive: true });
await cp(resolve(built, "assets"), resolve(root, "assets"), {
  recursive: true,
});
await writeFile(resolve(root, "index.html"), html);
await writeFile(resolve(root, ".nojekyll"), "");
console.log(
  `Published ${(await readdir(resolve(root, "assets"))).length} built assets and index.html for GitHub Pages. Canonical Vite source is web/index.html.`,
);

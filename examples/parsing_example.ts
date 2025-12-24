// deno run --allow-net scrape-careerjet.ts
import { DOMParser } from "https://deno.land/x/deno_dom/deno-dom-wasm.ts";

// Example HTML snippet (replace this with your fetched HTML)
const html = `<article class="job clicky" data-url="/jobad/tn63f4f57ab530462b96c79bddb6dc07ad" data-as="1" data-o="0">
<header>
<h2> <a href="/jobad/tn63f4f57ab530462b96c79bddb6dc07ad"
title="Administrateur polyvalent chez un Tour operateur International" data-as="1">
Administrateur polyvalent chez un Tour operateur International </a> </h2>
</header>
<ul class="actions notclicky">...</ul>
<p class="company"> Travel Agency HTL </p>
<ul class="location"><li> <svg class="icon">...</svg> Tunis </li></ul>
<ul class="salary"><li> <svg class="icon">...</svg> 1 500 DT par mois </li></ul>
<div class="desc"> L'agence de voyages HTL, tour-opérateur international, recrute un(e) collaborateur(ice)
polyvalent(e) pour un poste permanent dans son bureau a Lac 1. Les responsabilités du/de l&hellip;
</div>
<footer>
<ul class="tags">
<li> <span class="badge badge-r badge-s"> Il y a 17 jours </span> </li>
<li> <span class="badge badge-info badge-r badge-s">Postuler facilement</span> </li>
</ul>
</footer>
</article>`;

// Parse HTML
const doc = new DOMParser().parseFromString(html, "text/html");
if (!doc) throw new Error("Failed to parse HTML");

// Get the article
const article = doc.querySelector("article.job");
if (!article) throw new Error("No job article found");

// Extract info
const titleEl = article.querySelector("h2 a");
const companyEl = article.querySelector("p.company");
const locationEl = article.querySelector("ul.location li");
const salaryEl = article.querySelector("ul.salary li");
const descEl = article.querySelector("div.desc");
const tagsEl = Array.from(article.querySelectorAll("footer ul.tags li span"));

// Build result object
const job = {
  title: titleEl?.textContent.trim() || null,
  url: titleEl?.getAttribute("href") || null,
  company: companyEl?.textContent.trim() || null,
  location: locationEl?.textContent.replace(/\s+/g, " ").trim() || null,
  salary: salaryEl?.textContent.replace(/\s+/g, " ").trim() || null,
  description: descEl?.textContent.replace(/\s+/g, " ").trim() || null,
  tags: tagsEl.map(el => el.textContent.trim()),
};

console.log(job);

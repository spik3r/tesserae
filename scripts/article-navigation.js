import {mkdirSync, writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {themes, modes, densities} from '../common/options.js';

// Fixed, anonymous authoring fixtures: no user HTML or URL input.
export function articleNavigationAssets() {
  const assets = new Map();
  const links = [];
  for (const theme of themes) for (const mode of modes) for (const density of densities) for (const dir of ['ltr', 'rtl']) {
    const stem = `${theme}-${mode}-${density}-${dir}`;
    const names = [`${stem}-first.html`, `${stem}.html`, `${stem}-last.html`];
    const rtl = dir === 'rtl';
    const words = rtl
      ? ['ar', 'تجاوز التنقل إلى المقال', 'التنقل بين الأمثلة', 'جميع الأمثلة', 'ملاحظات خيالية', 'مراجع وملاحظات إضافية', 'حول هذا المثال', 'مثال خيالي فقط. لا توجد بيانات حقيقية.', 'مراجع', 'حول المثال']
      : ['en', 'Skip to article', 'Example navigation', 'All examples', 'Fictional field notes', 'References and additional reading notes', 'About this anonymous example', 'Fictional demonstration only. No real data.', 'References', 'About this example'];
    const [lang, skip, label, all, middleTitle, references, about, text, refHeading, aboutHeading] = words;
    const titles = rtl ? ['بداية الملاحظات الخيالية', middleTitle, 'خاتمة الملاحظات الخيالية']
      : ['Starting the fictional notes', middleTitle, 'Closing the fictional notes'];
    for (const [position, name] of names.entries()) {
      const title = titles[position];
      const adjacent = [];
      if (position > 0) adjacent.push(`<li><a rel="prev" href="${names[position - 1]}">${rtl ? 'المقال السابق' : 'Previous article'}: ${titles[position - 1]}</a></li>`);
      if (position < names.length - 1) adjacent.push(`<li><a rel="next" href="${names[position + 1]}">${rtl ? 'المقال التالي' : 'Next article'}: ${titles[position + 1]}</a></li>`);
      assets.set(name, `<!doctype html>
<html lang="${lang}" dir="${dir}" data-theme="${theme}" data-mode="${mode}" data-density="${density}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><link rel="stylesheet" href="../../../html/tesserae.css"></head>
<body><div class="ts-page ts-report">
<a class="ts-skip-link" href="#article">${skip}</a>
<header class="ts-header">
<nav class="ts-article-nav" aria-label="${label}"><ul>
<li><a href="index.html">${all}</a></li>
<li><a href="${name}" aria-current="page">${title}</a></li>
<li><a href="#references">${references}</a></li>
<li><a href="#about">${about}</a></li>
</ul></nav>
</header>
<main id="article" class="ts-article-main" tabindex="-1"><article><div class="ts-prose">
<h1>${title}</h1><p>${text}</p>
<section id="references"><h2>${refHeading}</h2><p>${text}</p></section>
<section id="about"><h2>${aboutHeading}</h2><p>${text}</p></section>
</div>
<footer>
<p>${rtl ? `الجزء ${position + 1} من 3 في سلسلة خيالية.` : `Part ${position + 1} of 3 in a fictional series.`}</p>
<nav class="ts-article-nav" aria-label="${rtl ? 'مقالات السلسلة' : 'Articles in this series'}"><ul>${adjacent.join('')}</ul></nav>
</footer>
</article></main>
<footer>${text}</footer>
</div></body></html>
`);
      if (position === 1) links.push(`<li><a href="${name}">${theme} / ${mode} / ${density} / ${dir}</a></li>`);
    }
  }
  assets.set('index.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Article navigation examples</title><link rel="stylesheet" href="../../../html/tesserae.css"></head><body><main class="ts-page ts-report"><h1>Article navigation examples</h1><p>Each English or Arabic variant opens the middle of a three-article fictional series; follow its previous/next links to inspect both boundaries. Auto follows the preferred colour scheme. These are review fixtures, not evidence of browser, keyboard, print or assistive-technology acceptance.</p><ul>${links.join('')}</ul></main></body></html>\n`);
  return assets;
}

export function writeArticleNavigation() {
  const directory = new URL('../examples/generated/article-navigation/', import.meta.url);
  mkdirSync(directory, {recursive:true});
  for (const [name, html] of articleNavigationAssets()) writeFileSync(new URL(name, directory), html);
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) writeArticleNavigation();

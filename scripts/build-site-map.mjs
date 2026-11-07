// Writes content/site-map.json from the "Final sitemap" of the site owner (country code, language code and the
// three section folder names of each country). Run in the repository checkout: node build-site-map.mjs
import fs from "node:fs";

const EN = "glossary|legislation|faq";
// cc | hreflang | glossary | legislation | faq        (html lang and direction only where they differ)
const ROWS = `
us|en-US|${EN}
it|it-IT|glossario|normativa|domande-frequenti
at|de-AT|glossar|gesetzgebung|haeufige-fragen
sk|sk-SK|slovnik|legislativa|casto-kladene-otazky
no|no-NO|ordliste|lovverk|ofte-stilte-sporsmal
es|es-ES|glosario|legislacion|preguntas-frecuentes
in|hi-IN|${EN}
mx|es-MX|glosario|legislacion|preguntas-frecuentes
co|es-CO|glosario|legislacion|preguntas-frecuentes
cn|zh-CN|${EN}
tw|zh-TW|${EN}
tr|tr-TR|sozluk|mevzuat|sikca-sorulan-sorular
rs|sr-RS|recnik|zakonodavstvo|cesta-pitanja
ro|ro-RO|glosar|legislatie|intrebari-frecvente
ph|tl-PH|glosaryo|mga-batas|mga-madalas-itanong
pe|es-PE|glosario|legislacion|preguntas-frecuentes
mt|mt-MT|glossarju|legizlazzjoni|mistoqsijiet-frekwenti
jp|ja-JP|${EN}
is|is-IS|ordasafn|loggjof|algengar-spurningar
id|id-ID|glosarium|peraturan|pertanyaan-umum
hk|zh-HK|${EN}
al|sq-AL|fjalor|legjislacion|pyetje-te-shpeshta
pt|pt-PT|glossario|legislacao|perguntas-frequentes
pl|pl-PL|slownik|przepisy|czeste-pytania
lt|lt-LT|zodynas|teises-aktai|dazni-klausimai
hu|hu-HU|fogalomtar|jogszabalyok|gyakori-kerdesek
cz|cs-CZ|slovnik|legislativa|caste-dotazy
my|ms-MY|glosari|perundangan|soalan-lazim
br|pt-BR|glossario|legislacao|perguntas-frequentes
za|zu-ZA|isichazamazwi|imithetho|imibuzo-evamile
kr|ko-KR|${EN}
be|nl-BE|woordenlijst|wetgeving|veelgestelde-vragen
lu|lb-LU|glossar|legislatioun|dacks-gestallte-froen
gr|el-GR|${EN}
fi|fi-FI|sanasto|lainsaadanto|usein-kysytyt-kysymykset
dk|da-DK|ordliste|lovgivning|ofte-stillede-sporgsmal
de|de-DE|glossar|gesetzgebung|haeufige-fragen
cl|es-CL|glosario|legislacion|preguntas-frecuentes
si|sl-SI|slovar|zakonodaja|pogosta-vprasanja
hr|hr-HR|pojmovnik|zakonodavstvo|cesto-postavljana-pitanja
cy|el-CY|${EN}
ru|ru-RU|${EN}
th|th-TH|${EN}
tn|ar-TN|${EN}
vn|vi-VN|thuat-ngu|van-ban-phap-luat|cau-hoi-thuong-gap
fr|fr-FR|glossaire|legislation|questions-frequentes
ca|en-CA|${EN}
gb|en-GB|${EN}
ie|en-IE|${EN}
sg|en-SG|${EN}
nz|en-NZ|${EN}
au|en-AU|${EN}
me|sr-Latn-ME|rjecnik|zakonodavstvo|cesta-pitanja
ae|ar-AE|mustalahat|tashriaat|asila-shaia
`
  .trim()
  .split("\n");

// Serbia: page content is in Cyrillic (court decisions are), addresses stay Latin. Montenegro stays Latin.
const OVERRIDE = { rs: { htmlLang: "sr-Cyrl-RS" }, ph: { htmlLang: "fil-PH" }, me: { htmlLang: "cnr-ME" }, tn: { dir: "rtl" }, ae: { dir: "rtl" }, no: { hreflangAlso: ["nb-NO"] } };
const countries = {};
for (const line of ROWS) {
  const [cc, hreflang, glossary, legislation, faq] = line.split("|");
  countries[cc] = { hreflang, htmlLang: hreflang, dir: "ltr", folders: { glossary, legislation, faq }, ...OVERRIDE[cc] };
}
const siteMap = {
  note:
    "From the site owner's final sitemap (Australia and the United Arab Emirates added by his decisions). Each country: its language codes and the three section folders " +
    "(glossary, legislation, faq): each section has a hub page and one page per term, law or question. " +
    "A case may not be named like a section folder of its country, or 'en'; in /us also not 'federal' or 'states'.",
  reserved: { all: ["en"], us: ["federal", "states"] },
  countries,
};
fs.writeFileSync("content/site-map.json", JSON.stringify(siteMap, null, 2) + "\n");
console.log("countries in the site map:", Object.keys(countries).length);

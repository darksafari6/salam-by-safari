# Salam by Safari

A Quran-focused web interface built with JavaScript, Vite and GSAP. Browse all 114 surahs or 30 parahs, search the collection, and read Arabic verses with a choice of English or Urdu translation. Urdu translations are loaded on demand and the language preference is saved in the browser. Quran text and translation are bundled from [quran-json](https://github.com/risan/quran-json) (Uthmani text from the Noble Qur'an Encyclopedia; English and Urdu translations supplied by that project).

The reader currently displays verses in sequence, **not a verified 16-line Mushaf layout**. A licensed, verified 16-line page/line dataset and appropriate font/layout are needed before claiming print-accurate pagination. This first interface has no account, server, or sync. Three.js and C++ are not required for the current interface.

```sh
npm install
npm run dev
npm run build
npm test
```

## Sahih al-Bukhari library

The Books menu uses the 97 numbered subject books in the [Hadith API](https://github.com/fawazahmed0/hadith-api) Bukhari editions (`ara-bukhari`, `eng-bukhari`, and `urd-bukhari`). The upstream repository lists its sources in [References.md](https://github.com/fawazahmed0/hadith-api/blob/1/References.md); please verify attribution and rights for the underlying editions independently before redistribution. Records are matched by their source hadith number and reference and split into per-book JSON files, loaded only when opened. The source has 311 records with no book reference; these are placed in a book based on the source's numbered section boundaries and explicitly marked. It also has missing texts, including 570 missing Urdu translations; the interface marks missing content rather than fabricating it. Book divisions may differ between printed editions. The texts have not been independently verified against a print edition.

## Personal features

The dashboard calculates prayer times locally after an explicit location permission using the MIT-licensed [adhan-js](https://github.com/batoulapps/adhan-js) library. Times are estimates, shown in the device time zone; users can select a calculation method and Asr school and should verify with their local mosque. Coordinates are not stored by Salam. The Hijri date uses the browser's Umm al-Qura calendar and may differ from local moon sightings.

Quran and hadith bookmarks, an explicitly marked Quran reading position, journal entries, tasbih count, reading size and motion preference are saved in local browser storage only (no account, encryption, synchronization or backup). Audio streams individual verses from EveryAyah's Mishary Rashid Alafasy collection and requires an internet connection. Topic links are selected starting points, not exhaustive or scholarly classifications. Focus mode hides translations; it does not create a verified 16-line Mushaf layout.

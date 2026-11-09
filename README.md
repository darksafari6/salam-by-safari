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

## Quran read and listen modes

The Quran menu offers separate Read and Listen modes. Listen mode uses full-surah recordings and matching verse timestamps from the [Quran Pro content manifest](https://github.com/adilbenmoussa/quran-pro-content). The reciter catalog, timing JSON and audio are loaded on demand from third-party services; only Hafs reciters are listed and those missing a surah in the current selection are disabled. A chosen reciter is saved in browser storage. Switching reciters preserves the selected verse, but playback must be started again. The catalog and external sources can change or become unavailable; their availability and rights should be verified before public deployment. Playback begins only after a user action and stops when leaving the player. Parahs that cross surah boundaries use multiple full-surah files and can pause at the boundary; the app does not provide one single audio file per parah. Verse labels follow the provider’s timings, which have not been independently verified. Internet access is required.

## Abdul Rahman Musaad collection

Listen mode links to a separate collection of the 48 recordings listed by [Way2Quran](https://way2quran.com/en/reciters/abdul-rahman-musaad) at the time of integration. These include both surahs and excerpts; the interface does not assume verse ranges or display verse highlighting without verified timings. Audio streams from the provider; availability, playback permissions and redistribution rights should be verified before public deployment. The list is a snapshot and may not reflect later source updates.

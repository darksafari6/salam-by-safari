# Salam by Safari

A Quran-focused web interface built with JavaScript, Vite and GSAP. Browse all 114 surahs or 30 parahs, search the collection, and read Arabic verses with English translation. Quran text and translation are bundled from [quran-json](https://github.com/risan/quran-json) (Uthmani text from the Noble Qur'an Encyclopedia; English translation supplied by that project).

The reader currently displays verses in sequence, **not a verified 16-line Mushaf layout**. A licensed, verified 16-line page/line dataset and appropriate font/layout are needed before claiming print-accurate pagination. This first interface has no account, server, or sync. Three.js and C++ are not required for the current interface.

```sh
npm install
npm run dev
npm run build
```

// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import quran from '../src/data/quran.json';

vi.mock('gsap', () => ({ gsap: { from: vi.fn(), to: vi.fn() } }));

let listeners;
beforeEach(async () => {
  listeners=[];
  const winAdd=window.addEventListener.bind(window), docAdd=document.addEventListener.bind(document);
  vi.spyOn(window,'addEventListener').mockImplementation((type,listener,options)=>{if(type==='hashchange')listeners.push([window,type,listener]);return winAdd(type,listener,options)});
  vi.spyOn(document,'addEventListener').mockImplementation((type,listener,options)=>{if(type==='keydown')listeners.push([document,type,listener]);return docAdd(type,listener,options)});
  vi.resetModules();
  localStorage.clear();
  history.replaceState(null, '', '/');
  document.body.innerHTML = '<div id="app"></div>';
  document.body.className = '';
  window.matchMedia = vi.fn(() => ({ matches: true, addEventListener() {}, removeEventListener() {} }));
  window.scrollTo = vi.fn();
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal('requestAnimationFrame', callback => { callback(); return 1; });
  vi.stubGlobal('fetch', vi.fn(async url => {
    const reciters=[
      {id:'alafasy',name:'Mishary Rashid Alafasy',style:'murattal',riwayah:'hafs',timingsRevision:2,timingsPath:'timings/alafasy-r2.json',unavailableSurahs:[],surahPaths:['https://quranpro-audio.quranpro.workers.dev/alafasy/{nnn}.mp3','https://archive.org/download/quranpro-mishary-alafasy/{nnn}.mp3']},
      {id:'husary',name:'Mahmoud Khalil Al-Husary',style:'murattal',riwayah:'hafs',timingsRevision:2,timingsPath:'timings/husary-r2.json',unavailableSurahs:[],surahPaths:['https://quranpro-audio.quranpro.workers.dev/husary/{nnn}.mp3']},
      {id:'husary_muallim',name:'Mahmoud Khalil Al-Husary',style:'muallim',riwayah:'hafs',timingsRevision:2,timingsPath:'timings/husary_muallim-r2.json',unavailableSurahs:[],surahPaths:['https://quranpro-audio.quranpro.workers.dev/husary_muallim/{nnn}.mp3']},
      ...['abdulbasit','abdulbasit_mujawwad','abdulsamad','minshawi','minshawimujawwad','tablawi'].map(id=>({id,name:id,style:'murattal',riwayah:'hafs',timingsRevision:2,timingsPath:`timings/${id}-r2.json`,unavailableSurahs:[],surahPaths:[`https://quranpro-audio.quranpro.workers.dev/${id}/{nnn}.mp3`]})),
      {id:'sudais',name:'Abdul Rahman Al-Sudais',style:'murattal',riwayah:'hafs',timingsRevision:2,timingsPath:'timings/sudais-r2.json',unavailableSurahs:[],surahPaths:['https://quranpro-audio.quranpro.workers.dev/sudais/{nnn}.mp3']},
      {id:'balushi',name:'Hazza Al-Balushi',style:'murattal',riwayah:'hafs',timingsRevision:1,timingsPath:'timings/balushi-r1.json',unavailableSurahs:[2],surahPaths:['https://quranpro-audio.quranpro.workers.dev/balushi/{nnn}.mp3']},
      {id:'dokali',name:'Qalun reciter',style:'murattal',riwayah:'qalun',timingsRevision:1,timingsPath:'timings/dokali-r1.json',unavailableSurahs:[],surahPaths:['https://quranpro-audio.quranpro.workers.dev/dokali/{nnn}.mp3']}
    ];
    if(String(url).endsWith('manifest.json'))return {ok:true,json:async()=>({reciters})};
    const timing=String(url).match(/timings\/(alafasy|sudais|husary|balushi)-r(\d+).json/);
    if(timing){const unit=timing[1]==='sudais'?20000:10000;return {ok:true,json:async()=>({reciter:timing[1],revision:Number(timing[2]),surahs:quran.map(s=>s.verses.map(v=>[v.id,(v.id-1)*unit,v.id*unit]))})};}
    const match = String(url).match(/data\/bukhari\/(\d+)\.json/);
    if (!match) throw Error('Unexpected URL');
    return { ok: true, json: async () => JSON.parse(await readFile(`public/data/bukhari/${match[1]}.json`, 'utf8')) };
  }));
  await import('../src/main.js');
});
afterEach(() => { for(const [target,type,listener] of listeners) target.removeEventListener(type,listener); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const click = selector => { const el = document.querySelector(selector); expect(el, selector).not.toBeNull(); el.click(); };
const navigate = async hash => { location.hash = hash; await vi.waitFor(() => expect(document.querySelector('.mobile-menu')).not.toBeNull()); await new Promise(resolve => setTimeout(resolve, 10)); };

describe('core journeys', () => {
  it('keeps Quran content in its menu, searches, switches translation and saves a place', async () => {
    expect(document.querySelector('.cards')).toBeNull();
    await navigate('#quran');
    expect(document.querySelectorAll('.mode-card')).toHaveLength(2);
    expect(document.querySelector('.cards')).toBeNull();
    await navigate('#quran/read');
    expect(document.querySelectorAll('[data-read-surah]')).toHaveLength(114);
    const search = document.querySelector('#search'); search.value = 'Al-Fatihah'; search.dispatchEvent(new Event('input', { bubbles: true }));
    expect(document.querySelectorAll('[data-read-surah]')).toHaveLength(1);
    click('[data-read-surah="1"]');
    expect(document.querySelectorAll('.verse')).toHaveLength(7);
    expect(document.querySelector('.reader-bismillah')).toBeNull();
    click('[data-save-verse="1:1"]'); click('[data-mark="1:1"]');
    expect(JSON.parse(localStorage.getItem('salam-last-read')).ayah).toBe(1);
    const select=document.querySelector('#translation-language'); select.value='ur'; select.dispatchEvent(new Event('change'));
    await vi.waitFor(() => expect(document.querySelector('.verse-translation').lang).toBe('ur'));
    expect(document.querySelector('.verse-translation').dir).toBe('rtl');
    click('.reader-close');
    await navigate('#space');
    expect(document.querySelector('.saved-item').textContent).toContain('Quran 1:1');
    click('.saved-open');
    await vi.waitFor(() => expect(document.querySelector('#verse-1-1')).not.toBeNull());
  });
  it('shows Parah results and handles search with no matches', async () => {
    await navigate('#quran/read'); click('[data-tab="juz"]');
    expect(document.querySelectorAll('[data-read-juz]')).toHaveLength(30);
    const search=document.querySelector('#search'); search.value='not a parah'; search.dispatchEvent(new Event('input',{bubbles:true}));
    expect(document.querySelector('.no-results')).not.toBeNull();
    search.value='1'; search.dispatchEvent(new Event('input',{bubbles:true})); click('[data-read-juz="0"]');
    expect(document.querySelector('.verse-meta').textContent).toContain('1:1');
  });
  it('opens a surah listening queue, advances and cleans up on navigation', async () => {
    const play=vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();
    const pause=vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
    vi.spyOn(HTMLMediaElement.prototype,'load').mockImplementation(()=>{});
    vi.spyOn(HTMLMediaElement.prototype,'readyState','get').mockReturnValue(1);
    await navigate('#quran/listen');
    expect(document.querySelectorAll('[data-listen-surah]')).toHaveLength(114);
    click('[data-listen-surah="1"]');
    await vi.waitFor(()=>expect(document.querySelectorAll('.queue-item')).toHaveLength(7));
    const audio=document.querySelector('#listen-audio');
    expect(audio.src).toContain('/001.mp3');
    audio.dispatchEvent(new Event('loadedmetadata'));
    expect(play).not.toHaveBeenCalled();
    click('#play-pause'); expect(play).toHaveBeenCalled();
    audio.currentTime=10.2; audio.dispatchEvent(new Event('timeupdate'));
    expect(audio.src).toContain('/001.mp3');
    expect(document.querySelector('.track-status').textContent).toContain('1:2');
    click('[data-queue="6"]'); expect(audio.src).toContain('/001.mp3');
    expect(audio.currentTime).toBe(60);
    await navigate('#quran'); expect(pause).toHaveBeenCalled();
  });
  it('builds a Parah queue with correct start and end boundaries', async () => {
    vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
    vi.spyOn(HTMLMediaElement.prototype,'load').mockImplementation(()=>{});
    await navigate('#quran/listen'); click('[data-tab="juz"]');
    expect(document.querySelectorAll('[data-listen-juz]')).toHaveLength(30);
    click('[data-listen-juz="1"]');
    await vi.waitFor(()=>expect(document.querySelectorAll('.queue-item').length).toBeGreaterThan(0));
    const audio=document.querySelector('#listen-audio');expect(audio.src).toContain('/002.mp3');
    audio.dispatchEvent(new Event('loadedmetadata'));expect(audio.currentTime).toBe(1410);
    expect(document.querySelector('.queue-item:last-child .queue-info small').textContent).toContain('2:252');
  });
  it('changes files only at a surah boundary in a multi-surah Parah', async () => {
    vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
    vi.spyOn(HTMLMediaElement.prototype,'load').mockImplementation(()=>{});
    await navigate('#quran/listen/juz/1');
    await vi.waitFor(()=>expect(document.querySelectorAll('.queue-item').length).toBeGreaterThan(7));
    const audio=document.querySelector('#listen-audio');audio.dispatchEvent(new Event('loadedmetadata'));
    expect(audio.src).toContain('/001.mp3');
    audio.currentTime=70;audio.dispatchEvent(new Event('timeupdate'));
    expect(audio.src).toContain('/002.mp3');
    audio.dispatchEvent(new Event('loadedmetadata'));expect(audio.currentTime).toBe(0);
    expect(document.querySelector('.track-status').textContent).toContain('2:1');
  });
  it('falls back to the matching secondary audio host when the primary fails', async () => {
    vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
    vi.spyOn(HTMLMediaElement.prototype,'load').mockImplementation(()=>{});
    await navigate('#quran/listen/surah/1');
    await vi.waitFor(()=>expect(document.querySelectorAll('.queue-item')).toHaveLength(7));
    const audio=document.querySelector('#listen-audio');
    expect(audio.src).toContain('quranpro-audio.quranpro.workers.dev');
    audio.dispatchEvent(new Event('error'));
    expect(audio.src).toContain('archive.org/download/quranpro-mishary-alafasy/001.mp3');
    audio.dispatchEvent(new Event('error'));
    expect(document.querySelector('.track-status').textContent).toMatch(/unavailable/i);
  });
  it('changes reciter with matching timings and keeps the selected verse paused', async () => {
    vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();
    vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
    vi.spyOn(HTMLMediaElement.prototype,'load').mockImplementation(()=>{});
    await navigate('#quran/listen/surah/1');
    await vi.waitFor(()=>expect(document.querySelectorAll('.queue-item')).toHaveLength(7));
    expect(document.querySelectorAll('#reciter-select option')).toHaveLength(3);
    click('[data-queue="2"]');
    expect(document.querySelector('#reciter-select option[value="husary"]')).toBeNull();
    expect(document.querySelector('#reciter-select option[value="husary_muallim"]')).toBeNull();
    for(const id of ['abdulbasit','abdulbasit_mujawwad','abdulsamad','minshawi','minshawimujawwad','tablawi']) expect(document.querySelector(`#reciter-select option[value="${id}"]`)).toBeNull();
    const select=document.querySelector('#reciter-select');select.value='sudais';select.dispatchEvent(new Event('change'));
    await vi.waitFor(()=>expect(document.querySelector('#listen-audio').src).toContain('/sudais/001.mp3'));
    const audio=document.querySelector('#listen-audio');audio.dispatchEvent(new Event('loadedmetadata'));
    expect(audio.currentTime).toBe(40);
    expect(document.querySelector('.track-status').textContent).toContain('1:3');
    expect(document.querySelector('#queue-reciter').textContent).toContain('Al-Sudais');
    expect(JSON.parse(localStorage.getItem('salam-reciter'))).toBe('sudais');
  });
  it('disables reciters missing a surah in the selected parah', async () => {
    vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
    vi.spyOn(HTMLMediaElement.prototype,'load').mockImplementation(()=>{});
    await navigate('#quran/listen/juz/1');
    await vi.waitFor(()=>expect(document.querySelectorAll('.queue-item').length).toBeGreaterThan(0));
    expect(document.querySelector('#reciter-select option[value="balushi"]').disabled).toBe(true);
  });
  it('shows a retry state when timing metadata is unavailable', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'));
    await navigate('#quran/listen/surah/1');
    await vi.waitFor(()=>expect(document.querySelector('.track-status').textContent).toMatch(/retry/i));
    expect(document.querySelector('#play-pause').getAttribute('aria-label')).toBe('Retry loading');
  });
  it('offers the Musaad collection with searchable source recordings, without invented verse labels', async () => {
    const play=vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue();
    const pause=vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
    vi.spyOn(HTMLMediaElement.prototype,'load').mockImplementation(()=>{});
    await navigate('#quran/listen');
    expect(document.querySelector('.musaad-feature').getAttribute('href')).toBe('#quran/listen/musaad');
    click('.musaad-feature');
    await vi.waitFor(()=>expect(document.querySelectorAll('.musaad-track')).toHaveLength(48));
    const search=document.querySelector('#musaad-search');search.value='19';search.dispatchEvent(new Event('input',{bubbles:true}));
    expect(document.querySelectorAll('.musaad-track')).toHaveLength(3);
    click('[data-track="18"]');
    const audio=document.querySelector('#musaad-audio');
    expect(audio.src).toBe('https://media.way2quran.com/abdul-rahman-musaad/hafs-an-asim/019-001.mp3');
    expect(play).toHaveBeenCalled();
    expect(document.querySelector('.musaad-notice').textContent).toContain('verse highlighting is not shown');
    expect(document.querySelector('#musaad-subtitle').textContent).toContain('Recording 1');
    click('#musaad-next');expect(audio.src).toContain('019-002.mp3');
    audio.dispatchEvent(new Event('error'));expect(document.querySelector('#musaad-status').textContent).toContain('Audio unavailable');
    await navigate('#quran/listen');expect(pause).toHaveBeenCalled();
  });
  it('controls Musaad playback, seeking, volume and player state', async () => {
    let paused=true;
    vi.spyOn(HTMLMediaElement.prototype,'paused','get').mockImplementation(()=>paused);
    vi.spyOn(HTMLMediaElement.prototype,'play').mockImplementation(function(){paused=false;this.dispatchEvent(new Event('play'));return Promise.resolve()});
    vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(function(){paused=true;this.dispatchEvent(new Event('pause'))});
    vi.spyOn(HTMLMediaElement.prototype,'load').mockImplementation(()=>{});
    await navigate('#quran/listen/musaad');
    expect(document.querySelector('#musaad-toggle').disabled).toBe(true);
    click('[data-track="0"]');const audio=document.querySelector('#musaad-audio');
    expect(document.querySelector('#musaad-toggle').getAttribute('aria-label')).toBe('Pause recording');
    expect(document.querySelector('#musaad-console').classList.contains('is-playing')).toBe(true);
    Object.defineProperty(audio,'duration',{configurable:true,value:120});audio.dispatchEvent(new Event('loadedmetadata'));
    const seek=document.querySelector('#musaad-seek');expect(seek.disabled).toBe(false);seek.value=500;seek.dispatchEvent(new Event('input'));
    expect(audio.currentTime).toBe(60);expect(document.querySelector('#musaad-current').textContent).toBe('1:00');
    expect(document.querySelector('#musaad-duration').textContent).toBe('2:00');
    click('#musaad-toggle');expect(document.querySelector('#musaad-toggle').getAttribute('aria-label')).toBe('Play recording');
    click('#musaad-mute');expect(audio.muted).toBe(true);expect(document.querySelector('#musaad-mute').getAttribute('aria-label')).toBe('Unmute audio');
    click('#musaad-mute');expect(audio.muted).toBe(false);
  });
  it('opens a saved hadith at the correct pagination and marks missing text', async () => {
    await navigate('#books/bukhari/2');
    await vi.waitFor(() => expect(document.querySelectorAll('.hadith-card').length).toBe(10));
    click('#next-page');
    const number=document.querySelector('[data-save-hadith]').dataset.saveHadith;
    click('[data-save-hadith]');
    await navigate('#space'); click('.saved-open');
    await vi.waitFor(() => expect(document.querySelector(`[data-hadith="${number}"]`)).not.toBeNull());
    expect(document.querySelector('.hadith-pagination').textContent).toContain('Page 2');
  });
  it('persists and deletes journal notes, tasbih, and motion settings', async () => {
    await navigate('#space');
    const textarea=document.querySelector('#journal-text'); textarea.value='<hello>'; document.querySelector('#journal-form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
    expect(document.querySelector('.note-item p').textContent).toBe('<hello>');
    click('#tasbih-count'); expect(document.querySelector('#tasbih-count strong').textContent).toBe('1');
    const motion=document.querySelector('#reduce-motion'); motion.checked=true; motion.dispatchEvent(new Event('change'));
    expect(document.documentElement.classList.contains('reduce-motion')).toBe(true);
    vi.stubGlobal('confirm',()=>true); click('[data-delete-note]'); expect(document.querySelector('.note-item')).toBeNull();
  });
  it('opens selected topic verses in context', async () => {
    await navigate('#topics'); click('[data-open-verse="94:5"]');
    await vi.waitFor(() => expect(document.querySelector('#verse-94-5')).not.toBeNull());
  });
  it('calculates prayer times after permission and responds to settings', async () => {
    Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:ok=>ok({coords:{latitude:33.6844,longitude:73.0479}})}});
    click('#get-prayers'); expect(document.querySelectorAll('.prayer-times div')).toHaveLength(6);
    expect(document.querySelector('#prayer-status').textContent).toMatch(/estimated/i);
    const method=document.querySelector('#prayer-method'); method.value='Karachi'; method.dispatchEvent(new Event('change'));
    expect(JSON.parse(localStorage.getItem('salam-prayer-method'))).toBe('Karachi');
  });
  it('reports denied geolocation instead of leaving a loading state', async () => {
    Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:(_ok,fail)=>fail()}});
    click('#get-prayers'); expect(document.querySelector('#prayer-status').textContent).toMatch(/denied/i);
  });
});

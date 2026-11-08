// @vitest-environment jsdom
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';

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
    await navigate('#quran'); click('[data-tab="juz"]');
    expect(document.querySelectorAll('[data-read-juz]')).toHaveLength(30);
    const search=document.querySelector('#search'); search.value='not a parah'; search.dispatchEvent(new Event('input',{bubbles:true}));
    expect(document.querySelector('.no-results')).not.toBeNull();
    search.value='1'; search.dispatchEvent(new Event('input',{bubbles:true})); click('[data-read-juz="0"]');
    expect(document.querySelector('.verse-meta').textContent).toContain('1:1');
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

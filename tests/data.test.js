import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import quran from '../src/data/quran.json';
import urdu from '../src/data/urdu.json';
import index from '../src/data/bukhari-index.json';

describe('bundled content integrity', () => {
  it('has 114 surahs and an Urdu translation for every Quran verse', () => {
    expect(quran).toHaveLength(114);
    expect(urdu).toHaveLength(114);
    let count=0;
    quran.forEach((surah,i)=>{
      expect(surah.id).toBe(i+1);
      expect(surah.verses).toHaveLength(surah.total_verses);
      expect(urdu[i]).toHaveLength(surah.verses.length);
      surah.verses.forEach((verse,j)=>{expect(verse.id).toBe(j+1);expect(verse.text).toBeTruthy();expect(verse.translation).toBeTruthy();expect(urdu[i][j]).toBeTruthy();count++});
    });
    expect(count).toBe(6236);
  });
  it('contains 97 books with matching record counts and transparently empty fields', async () => {
    expect(index).toHaveLength(97);
    let total=0, missingUrdu=0, missingReferences=0;
    for(const [i,book] of index.entries()){
      expect(book.id).toBe(i+1);
      const entries=JSON.parse(await readFile(`public/data/bukhari/${book.id}.json`,'utf8'));
      expect(entries).toHaveLength(book.count);
      for(const entry of entries){
        expect(entry).toHaveProperty('number');
        expect(entry).toHaveProperty('arabic');
        expect(entry).toHaveProperty('english');
        expect(entry).toHaveProperty('urdu');
        if(!entry.urdu) missingUrdu++;
        if(entry.reference===null) missingReferences++;
      }
      total+=entries.length;
    }
    expect(total).toBe(7589);
    expect(missingUrdu).toBe(570);
    expect(missingReferences).toBe(311);
  });
});

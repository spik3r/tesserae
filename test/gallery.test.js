import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {galleryAssets} from '../scripts/gallery.js';
import {galleryModel} from '../examples/gallery-model.js';
import {componentTypes} from '../html/index.js';
import {themes,modes,densities} from '../common/options.js';

test('gallery exercises every component and declared presentation combination',()=>{
  assert.deepEqual([...new Set(galleryModel.components.map(c=>c.type))].sort(), [...componentTypes].sort());
  const assets = galleryAssets();
  assert.equal(assets.size, themes.length*modes.length*densities.length+1);
  for (const theme of themes) for (const mode of modes) for (const density of densities) {
    const name = `${theme}-${mode}-${density}.html`;
    const html = assets.get(name);
    assert.ok(html.includes(`data-theme="${theme}" data-mode="${mode}" data-density="${density}"`));
    for(const value of ['Missing','Unknown','Not applicable','No records','No groups','No metadata','No recommendations supplied','&lt;tag&gt; &amp; literal text']) assert.ok(html.includes(value),`${name}: ${value}`);
    assert.ok(assets.get('index.html').includes(`href="${name}"`));
    assert.doesNotMatch(html, /<script\b|<iframe\b|https?:\/\//i);
  }
});

test('gallery output is deterministic and committed generated files match',()=>{
  const first = galleryAssets();
  assert.deepEqual(first,galleryAssets());
  for (const [name,html] of first) assert.equal(readFileSync(new URL(`../examples/generated/gallery/${name}`,import.meta.url),'utf8'),html,name);
});

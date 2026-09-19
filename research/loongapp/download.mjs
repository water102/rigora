import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const targetDir = path.join(__dirname, 'raw');

const urls = [
  // Core Engine & JS Libraries
  "https://www.loongbones.app/editor/libs/gmvc.js",
  "https://www.loongbones.app/editor/libs/gboxlayout.js",
  "https://www.loongbones.app/editor/libs/amf.js",
  "https://www.loongbones.app/editor/libs/dragonBones/dragonBones.js",
  "https://www.loongbones.app/editor/libs/triangle.js",
  "https://www.loongbones.app/editor/libs/numeric-1.2.6.min.js",
  "https://www.loongbones.app/editor/libs/bbw.js",
  "https://www.loongbones.app/editor/libs/icon.js",
  "https://www.loongbones.app/editor/static/js/main.94c63af5.js",
  "https://www.loongbones.app/tailwindcss.js",
  "https://www.loongbones.app/lib/pixi.js",
  "https://www.loongbones.app/lib/dragonBones.js",
  "https://www.loongbones.app/js/app.57300cea.js",
  "https://www.loongbones.app/js/npm.ant-design-vue.5c117164.js",
  "https://www.loongbones.app/js/npm.vue.66570ced.js",
  "https://www.loongbones.app/js/npm.html2canvas.3196badd.js",
  "https://www.loongbones.app/js/vendors~app.0f7b276a.js",
  "https://www.loongbones.app/js/chunk-2d0b9cdc.7b7822b2.js",
  "https://www.loongbones.app/js/chunk-2d230e25.e1f77153.js",
  "https://www.loongbones.app/js/forgetPassword.a1ea8860.js",
  "https://www.loongbones.app/js/login.3333e633.js",
  "https://www.loongbones.app/js/rights.6e9d12bf.js",
  "https://www.loongbones.app/js/signup.df4526da.js",
  "https://www.loongbones.app/static/js/790.29c0ad2f.chunk.js",
  
  // Stylesheets & CSS
  "https://www.loongbones.app/editor/libs/gboxlayout.css",
  "https://www.loongbones.app/editor/static/css/main.b498f431.css",
  "https://www.loongbones.app/css/app.1ef25f56.css",
  "https://www.loongbones.app/css/npm.ant-design-vue.d45cfd82.css",
  "https://www.loongbones.app/css/vendors~app.a5b41dce.css",
  "https://www.loongbones.app/css/forgetPassword.91990b1d.css",
  "https://www.loongbones.app/css/login.a7507836.css",
  "https://www.loongbones.app/css/rights.f70d63ea.css",
  "https://www.loongbones.app/css/signup.91990b1d.css",

  // Editor Icons & Assets
  "https://www.loongbones.app/editor/assets/logo.png",
  "https://www.loongbones.app/editor/favicon.ico",
  "https://www.loongbones.app/editor/logo192.png",
  "https://www.loongbones.app/editor/manifest.json",
  "https://www.loongbones.app/editor/assets/icon/panel/select_select.png",
  "https://www.loongbones.app/editor/assets/icon/panel/bone.png",
  "https://www.loongbones.app/editor/assets/icon/panel/bone_pose.png",
  "https://www.loongbones.app/editor/assets/icon/panel/weight.png",
  "https://www.loongbones.app/editor/assets/icon/panel/brush.png",
  "https://www.loongbones.app/editor/assets/icon/panel/first_frame.png",
  "https://www.loongbones.app/editor/assets/icon/panel/prev_frame.png",
  "https://www.loongbones.app/editor/assets/icon/panel/play.png",
  "https://www.loongbones.app/editor/assets/icon/panel/next_frame.png",
  "https://www.loongbones.app/editor/assets/icon/panel/last_frame.png",
  "https://www.loongbones.app/editor/assets/icon/panel/loop.png",
  "https://www.loongbones.app/editor/assets/icon/panel/play_speed.png",
  "https://www.loongbones.app/editor/assets/icon/panel/down_layer.png",
  "https://www.loongbones.app/editor/assets/icon/panel/up_layer.png",
  "https://www.loongbones.app/editor/assets/icon/panel/bottom_layer.png",
  "https://www.loongbones.app/editor/assets/icon/panel/top_layer.png",
  "https://www.loongbones.app/editor/assets/icon/panel/filter_select.png",

  // Website & Demo GIF Assets
  "https://www.loongbones.app/oss/assets/website/logo.png",
  "https://www.loongbones.app/img/logo192.681611f1.png",
  "https://www.loongbones.app/favicon.ico",
  "https://www.loongbones.app/img/game1.934f85c5.jpg",
  "https://www.loongbones.app/img/game2.9ea558fb.jpg",
  "https://www.loongbones.app/img/game3.4f7dfd7e.jpg",
  "https://www.loongbones.app/img/game4.de73157f.jpg",
  "https://www.loongbones.app/img/game5.879d94d7.jpg",
  "https://www.loongbones.app/img/game6.14ad56c5.jpg",
  "https://www.loongbones.app/img/game7.ea04b2a8.png",
  "https://www.loongbones.app/img/bone.8caa0eb8.gif",
  "https://www.loongbones.app/img/ai.acbac763.gif",
  "https://www.loongbones.app/img/timeline.0eeebab4.gif",
  "https://www.loongbones.app/img/ffd.214dbdd2.gif",
  "https://www.loongbones.app/img/ik.293cfbe4.gif",
  "https://www.loongbones.app/img/rigging.69904f7c.gif",
  "https://www.loongbones.app/img/curve.dc4da2e1.gif",
  "https://www.loongbones.app/img/onion.b7973e7b.gif",
  "https://www.loongbones.app/img/subArmature.8ac12b2e.gif",
  "https://www.loongbones.app/img/surface.058d5029.gif",
  "https://www.loongbones.app/img/autoMesh.b15cb12e.gif",
  "https://www.loongbones.app/img/pathConstrain.b47114d7.gif",
  "https://www.loongbones.app/img/shape.61c4856f.gif",
  "https://www.loongbones.app/img/imageMask.470a0d83.gif",
  "https://www.loongbones.app/img/shapeMask.eb309659.gif",
  "https://www.loongbones.app/img/physics.072f1f4f.gif",
  "https://www.loongbones.app/img/transformConstrain.c65a2066.gif",
  "https://www.loongbones.app/img/10.1bad2384.png",
  "https://www.loongbones.app/oss/assets/other/release_note.md",

  // HTML pages
  "https://www.loongbones.app/login",
  "https://www.loongbones.app/works",
  "https://www.loongbones.app/editor/"
];

async function download(urlStr) {
  try {
    const url = new URL(urlStr);
    let pathname = url.pathname;
    if (pathname.endsWith('/')) {
      pathname += 'index.html';
    } else if (!path.extname(pathname)) {
      pathname += '.html';
    }
    
    // Normalize path relative to targetDir
    const relPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
    const destPath = path.join(targetDir, relPath);
    
    fs.mkdirSync(path.dirname(destPath), { recursive: true });

    const res = await fetch(urlStr, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
        'Referer': 'https://www.loongbones.app/editor/?workId=7Qds73FQ'
      }
    });

    if (!res.ok) {
      console.warn(`[FAIL] ${res.status}: ${urlStr}`);
      return;
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buffer);
    console.log(`[OK] ${buffer.length} bytes -> ${relPath}`);
  } catch (err) {
    console.error(`[ERR] ${urlStr}: ${err.message}`);
  }
}

async function run() {
  console.log(`Starting download of ${urls.length} resources into ${targetDir}...`);
  for (const u of urls) {
    await download(u);
  }
  console.log('Download complete.');
}

run();

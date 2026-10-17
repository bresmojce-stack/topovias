const { chromium } = require('/opt/node-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();p.on('pageerror',e=>console.log('ERR',e.message, e.stack&&e.stack.slice(0,300)));p.on('console',m=>m.type()==='error'&&console.log('C',m.text().slice(0,300)));await p.goto('file://'+process.argv[2]);await p.waitForTimeout(2500);await b.close();})();

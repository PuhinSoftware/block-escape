'use strict';
const {spawnSync}=require('node:child_process');
const suites=['browser','animations','board-geometry','mobile-grid','menu','reference-menu','settings','gameplay-ui','crystal-mines','art-upgrade','level-system-browser','collision-browser'];
const results=[];
for(const suite of suites){const run=spawnSync(process.execPath,[`tests/${suite}.cjs`],{stdio:'inherit',env:process.env,timeout:600000});const passed=run.status===0&&!run.error;results.push({suite,passed});if(run.error)console.error(run.error.message)}
console.log('\nBrowser suite summary');for(const result of results)console.log(`${result.passed?'PASS':'FAIL'} ${result.suite}`);
process.exitCode=results.every(r=>r.passed)?0:1;

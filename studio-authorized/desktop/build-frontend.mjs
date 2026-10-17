import {build} from 'vite';
import fs from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';
const root=path.dirname(new URL(import.meta.url).pathname),site=path.dirname(root);
await build({root,base:'./',configFile:false,logLevel:'warn',oxc:{jsx:{runtime:'automatic'}},build:{outDir:root+'/frontend',emptyOutDir:true,rollupOptions:{output:{entryFileNames:'app.js'}}}});
const cssDir=site+'/dist/client/_next/static/css';const css=(await fs.readdir(cssDir)).find(n=>n.endsWith('.css'));await fs.copyFile(cssDir+'/'+css,root+'/frontend/studio.css');
const source=await fs.readFile(site+'/lib/photo-tools.ts','utf8');await fs.writeFile(root+'/rules.mjs',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText);
console.log('Desktop HTML / JS / CSS and prompt rules built');

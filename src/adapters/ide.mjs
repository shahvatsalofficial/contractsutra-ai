import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readdir,copyFile,mkdir,lstat} from 'node:fs/promises';
import {checkedPath,fail} from '../core/utils.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const HOSTS=['claude','cursor','codex','gemini','copilot','windsurf','cline','roo','continue'];
async function copyTree(from,to){for(const d of await readdir(from,{withFileTypes:true})){if(d.isSymbolicLink())fail('Symlink in adapter pack is not allowed');const f=path.join(from,d.name),dest=path.join(to,d.name);if(d.isDirectory()){await mkdir(dest,{recursive:true});await copyTree(f,dest);}else if(d.isFile()){await mkdir(path.dirname(dest),{recursive:true});await copyFile(f,dest);}}}
export async function installIde(host,directory){if(!HOSTS.includes(host))fail('Supported --host: '+HOSTS.join(', '));const target=checkedPath(directory);const from=path.join(ROOT,'adapters/ide',host);const st=await lstat(from);if(!st.isDirectory())fail('Missing adapter pack: '+host);const dest=path.join(target,'.contractsutra','ide-packs',host);await copyTree(from,dest);return {host,installedTo:dest,note:'Project-local copy of instructions only. Native host loading is NOT verified.'};}

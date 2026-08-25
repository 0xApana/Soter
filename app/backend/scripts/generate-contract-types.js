#!/usr/bin/env node
/**
 * Generate TypeScript type definitions from contract-spec.json.
 *
 * Reads contract-spec.json generated from Rust contract source and produces
 * fully typed TypeScript interfaces, enums, structs, and function signatures.
 *
 * Usage:
 *   node scripts/generate-contract-types.js [--spec PATH] [--out PATH]
 */

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  let specPath = path.resolve(
    __dirname,
    '../../onchain/contracts/aid_escrow/contract-spec.json',
  );
  let outPath = path.resolve(
    __dirname,
    '../src/onchain/generated/aid-escrow.types.ts',
  );

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--spec' && args[i + 1]) {
      specPath = path.resolve(args[i + 1]);
      i++;
    } else if (args[i] === '--out' && args[i + 1]) {
      outPath = path.resolve(args[i + 1]);
      i++;
    }
  }

  return { specPath, outPath };
}

function findTopLevelComma(str) {
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '<' || char === '(' || char === '[') depth++;
    else if (char === '>' || char === ')' || char === ']') depth--;
    else if (char === ',' && depth === 0) return i;
  }
  return -1;
}

function splitTopLevelCommas(str) {
  const result = [];
  let current = [];
  let depth = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '<' || char === '(' || char === '[') depth++;
    else if (char === '>' || char === ')' || char === ']') depth--;

    if (char === ',' && depth === 0) {
      result.push(current.join('').trim());
      current = [];
    } else {
      current.push(char);
    }
  }
  if (current.length > 0) {
    result.push(current.join('').trim());
  }
  return result;
}

function rustTypeToTs(rustType) {
  if (!rustType) return 'any';
  let t = rustType.trim();

  // Strip references like &Env, &mut Address -> Env, Address
  t = t.replace(/^&(?:mut\s+)?/, '').trim();

  // Strip module path qualifiers (e.g. crate::delegate::DelegateHistory -> DelegateHistory)
  t = t.replace(/(?:\w+::)+(\w+)/g, '$1');

  // Strip Env parameter if present
  if (t === 'Env') return null;

  if (t === '()' || t === '') return 'void';
  if (t === 'bool') return 'boolean';
  if (['u32', 'u16', 'u8', 'i32', 'i16', 'i8', 'u64', 'i64', 'usize'].includes(t)) return 'number';
  if (['i128', 'u128'].includes(t)) return 'string';
  if (['Address', 'String', 'Symbol', 'Bytes', 'str'].includes(t)) return 'string';

  if (t.startsWith('Vec<') && t.endsWith('>')) {
    const inner = t.substring(4, t.length - 1);
    const innerTs = rustTypeToTs(inner);
    return innerTs ? `${innerTs}[]` : 'any[]';
  }

  if (t.startsWith('Map<') && t.endsWith('>')) {
    const content = t.substring(4, t.length - 1);
    const commaIdx = findTopLevelComma(content);
    if (commaIdx !== -1) {
      const valType = content.substring(commaIdx + 1).trim();
      const valTs = rustTypeToTs(valType) || 'any';
      return `Record<string, ${valTs}>`;
    }
    return 'Record<string, any>';
  }

  if (t.startsWith('Option<') && t.endsWith('>')) {
    const inner = t.substring(7, t.length - 1);
    const innerTs = rustTypeToTs(inner);
    return innerTs ? `${innerTs} | null` : 'any | null';
  }

  if (t.startsWith('Result<') && t.endsWith('>')) {
    const content = t.substring(7, t.length - 1);
    const commaIdx = findTopLevelComma(content);
    const okType = commaIdx !== -1 ? content.substring(0, commaIdx).trim() : content.trim();
    const okTs = rustTypeToTs(okType);
    return okTs === null ? 'void' : okTs;
  }

  if (t.startsWith('(') && t.endsWith(')')) {
    const inner = t.substring(1, t.length - 1).trim();
    if (!inner) return 'void';
    const parts = splitTopLevelCommas(inner);
    const typesTs = parts.map((p) => rustTypeToTs(p.trim())).filter((x) => x !== null);
    return `[${typesTs.join(', ')}]`;
  }

  return t;
}

function generateTypeScript(spec) {
  const lines = [];

  lines.push('/* eslint-disable */');
  lines.push('/**');
  lines.push(' * AUTO-GENERATED FILE — DO NOT EDIT DIRECTLY');
  lines.push(` * Generated from contract spec: ${spec.name} v${spec.version}`);
  lines.push(' * Run `npm run generate:contract-types` to update this file.');
  lines.push(' */');
  lines.push('');

  // 1. Enums
  if (spec.enums) {
    for (const [enumName, enumData] of Object.entries(spec.enums)) {
      lines.push(`export enum ${enumName} {`);
      for (const variant of enumData.variants) {
        lines.push(`  ${variant.name} = ${variant.value},`);
      }
      lines.push('}');
      lines.push('');

      lines.push(`export type ${enumName}String = keyof typeof ${enumName};`);
      lines.push('');
    }
  }

  // 2. Errors
  if (spec.errors && spec.errors.variants) {
    lines.push('export enum ContractError {');
    for (const variant of spec.errors.variants) {
      lines.push(`  ${variant.name} = ${variant.value},`);
    }
    lines.push('}');
    lines.push('');
  }

  // 3. Structs
  if (spec.structs) {
    for (const [structName, structData] of Object.entries(spec.structs)) {
      lines.push(`export interface ${structName} {`);
      for (const field of structData.fields) {
        const tsType = rustTypeToTs(field.type);
        lines.push(`  ${field.name}: ${tsType};`);
      }
      lines.push('}');
      lines.push('');
    }
  }

  // 4. Events
  if (spec.events) {
    lines.push('export interface ContractEvents {');
    for (const [eventName, eventData] of Object.entries(spec.events)) {
      lines.push(`  ${eventName}: {`);
      for (const field of eventData.fields) {
        const tsType = rustTypeToTs(field.type);
        lines.push(`    ${field.name}: ${tsType};`);
      }
      lines.push('  };');
    }
    lines.push('}');
    lines.push('');
  }

  // 5. Functions
  if (spec.functions) {
    lines.push('export interface AidEscrowContractFunctions {');
    for (const [fnName, fnData] of Object.entries(spec.functions)) {
      const params = fnData.parameters
        .map((p) => {
          const tsType = rustTypeToTs(p.type);
          if (!tsType) return null;
          return `${p.name}: ${tsType}`;
        })
        .filter(Boolean);

      let retType = rustTypeToTs(fnData.return_type);
      if (!retType || retType === 'void') {
        retType = 'void';
      }

      lines.push(`  ${fnName}(${params.join(', ')}): Promise<${retType}>;`);
    }
    lines.push('}');
    lines.push('');
  }

  return lines.join('\n');
}

async function main() {
  const { specPath, outPath } = parseArgs();

  if (!fs.existsSync(specPath)) {
    console.error(`Error: Spec file not found at ${specPath}`);
    console.error('Run python app/onchain/scripts/export-spec.py first.');
    process.exit(1);
  }

  const specContent = fs.readFileSync(specPath, 'utf-8');
  const spec = JSON.parse(specContent);

  let tsCode = generateTypeScript(spec);

  try {
    const prettier = require('prettier');
    tsCode = await prettier.format(tsCode, {
      parser: 'typescript',
      singleQuote: true,
      trailingComma: 'all',
    });
  } catch (_err) {
    // Fallback if prettier is not installed or available
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, tsCode.replace(/\r\n/g, '\n'), 'utf-8');

  console.log(`[OK] TypeScript contract types generated at: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

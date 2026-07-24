import assert from 'assert';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import ts from 'typescript';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modulePath = path.resolve(__dirname, '../src/utils/studentId.ts');
if (!existsSync(modulePath)) {
  console.error('Missing module for student ID normalization test');
  process.exit(1);
}

const source = readFileSync(modulePath, 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2019,
  },
}).outputText;

const module = { exports: {} };
const fn = new Function('require', 'module', 'exports', transpiled);
const require = (specifier) => {
  if (specifier === 'assert') {
    return assert;
  }
  return await import(specifier);
};
fn(require, module, module.exports);

const { normalizeStudentId, findStudentById } = module.exports;

assert.strictEqual(normalizeStudentId('B210305051'), 'b210305051');
assert.strictEqual(normalizeStudentId(' b210305051 '), 'b210305051');
assert.strictEqual(normalizeStudentId(''), '');

const students = [{ studentId: 'B210305051' }, { studentId: 'B210305052' }];
assert.deepStrictEqual(findStudentById(students, 'b210305051'), students[0]);
assert.strictEqual(findStudentById(students, 'B210305999'), null);

console.log('Student ID normalization checks passed');

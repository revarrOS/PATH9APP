/**
 * Marker Alias Consistency Test
 *
 * PURPOSE:
 * Validates that MARKER_NAME_ALIASES in bloodwork.types.ts matches
 * MARKER_ALIASES in the analyze-bloodwork-image edge function.
 *
 * WHY THIS MATTERS:
 * The edge function duplicates marker aliases because it runs in Deno
 * and cannot import from the main project. If aliases diverge, image
 * extraction will normalize markers differently than the client expects.
 *
 * HOW TO RUN:
 * npx tsx products/bloodwork/tests/marker-alias-consistency.test.ts
 *
 * EXPECTED RESULT:
 * If aliases match: "✅ Marker alias consistency test PASSED"
 * If aliases differ: Test fails with detailed diff
 */

import * as fs from 'fs';
import * as path from 'path';

// ANSI color codes for output
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

interface AliasMap {
  [key: string]: string;
}

function extractAliasesFromTypesFile(filePath: string): AliasMap {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract MARKER_NAME_ALIASES object
  const match = content.match(/export const MARKER_NAME_ALIASES:\s*Record<string,\s*\w+>\s*=\s*\{([^}]+)\}/s);
  if (!match) {
    throw new Error(`Could not find MARKER_NAME_ALIASES in ${filePath}`);
  }

  const aliasBlock = match[1];
  const aliases: AliasMap = {};

  // Parse each line like: 'LYM#': 'LYM',
  const lines = aliasBlock.split('\n');
  for (const line of lines) {
    const lineMatch = line.match(/'([^']+)':\s*'([^']+)'/);
    if (lineMatch) {
      const [, key, value] = lineMatch;
      aliases[key] = value;
    }
  }

  return aliases;
}

function extractAliasesFromEdgeFunction(filePath: string): AliasMap {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Extract MARKER_ALIASES object
  const match = content.match(/const MARKER_ALIASES:\s*Record<string,\s*string>\s*=\s*\{([^}]+)\}/s);
  if (!match) {
    throw new Error(`Could not find MARKER_ALIASES in ${filePath}`);
  }

  const aliasBlock = match[1];
  const aliases: AliasMap = {};

  // Parse each line like: 'LYM#': 'LYM',
  const lines = aliasBlock.split('\n');
  for (const line of lines) {
    const lineMatch = line.match(/'([^']+)':\s*'([^']+)'/);
    if (lineMatch) {
      const [, key, value] = lineMatch;
      aliases[key] = value;
    }
  }

  return aliases;
}

function compareAliases(typesAliases: AliasMap, edgeFunctionAliases: AliasMap): {
  isMatch: boolean;
  missingInEdgeFunction: string[];
  missingInTypes: string[];
  valueMismatches: Array<{ key: string; typesValue: string; edgeValue: string }>;
} {
  const missingInEdgeFunction: string[] = [];
  const missingInTypes: string[] = [];
  const valueMismatches: Array<{ key: string; typesValue: string; edgeValue: string }> = [];

  // Check for missing keys in edge function
  for (const key in typesAliases) {
    if (!(key in edgeFunctionAliases)) {
      missingInEdgeFunction.push(key);
    } else if (typesAliases[key] !== edgeFunctionAliases[key]) {
      valueMismatches.push({
        key,
        typesValue: typesAliases[key],
        edgeValue: edgeFunctionAliases[key],
      });
    }
  }

  // Check for extra keys in edge function
  for (const key in edgeFunctionAliases) {
    if (!(key in typesAliases)) {
      missingInTypes.push(key);
    }
  }

  const isMatch =
    missingInEdgeFunction.length === 0 &&
    missingInTypes.length === 0 &&
    valueMismatches.length === 0;

  return {
    isMatch,
    missingInEdgeFunction,
    missingInTypes,
    valueMismatches,
  };
}

function runTest() {
  console.log('\n' + YELLOW + '🔍 Running Marker Alias Consistency Test...' + RESET + '\n');

  try {
    // File paths
    const projectRoot = path.resolve(__dirname, '../../..');
    const typesFilePath = path.join(projectRoot, 'products/bloodwork/types/bloodwork.types.ts');
    const edgeFunctionPath = path.join(projectRoot, 'supabase/functions/analyze-bloodwork-image/index.ts');

    // Extract aliases from both files
    console.log('📄 Reading bloodwork.types.ts...');
    const typesAliases = extractAliasesFromTypesFile(typesFilePath);
    console.log(`   Found ${Object.keys(typesAliases).length} aliases\n`);

    console.log('📄 Reading analyze-bloodwork-image/index.ts...');
    const edgeFunctionAliases = extractAliasesFromEdgeFunction(edgeFunctionPath);
    console.log(`   Found ${Object.keys(edgeFunctionAliases).length} aliases\n`);

    // Compare
    const result = compareAliases(typesAliases, edgeFunctionAliases);

    if (result.isMatch) {
      console.log(GREEN + '✅ PASS: Marker aliases are consistent across both files' + RESET);
      console.log(`   ${Object.keys(typesAliases).length} aliases validated\n`);
      process.exit(0);
    } else {
      console.log(RED + '❌ FAIL: Marker alias inconsistency detected' + RESET + '\n');

      if (result.missingInEdgeFunction.length > 0) {
        console.log(RED + '  Missing in edge function:' + RESET);
        result.missingInEdgeFunction.forEach((key) => {
          console.log(`    '${key}': '${typesAliases[key]}'`);
        });
        console.log('');
      }

      if (result.missingInTypes.length > 0) {
        console.log(RED + '  Extra in edge function (not in types):' + RESET);
        result.missingInTypes.forEach((key) => {
          console.log(`    '${key}': '${edgeFunctionAliases[key]}'`);
        });
        console.log('');
      }

      if (result.valueMismatches.length > 0) {
        console.log(RED + '  Value mismatches:' + RESET);
        result.valueMismatches.forEach(({ key, typesValue, edgeValue }) => {
          console.log(`    '${key}':`);
          console.log(`      types:        '${typesValue}'`);
          console.log(`      edge function: '${edgeValue}'`);
        });
        console.log('');
      }

      console.log(YELLOW + '📝 ACTION REQUIRED:' + RESET);
      console.log('   Update MARKER_ALIASES in /supabase/functions/analyze-bloodwork-image/index.ts');
      console.log('   to match MARKER_NAME_ALIASES in /products/bloodwork/types/bloodwork.types.ts\n');

      process.exit(1);
    }
  } catch (error) {
    console.log(RED + '❌ TEST ERROR: ' + RESET + (error as Error).message + '\n');
    process.exit(1);
  }
}

// Run the test
runTest();

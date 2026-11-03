#!/usr/bin/env node
import { main } from '../installer/cli.mjs';

await main(process.argv.slice(2));

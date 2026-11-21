import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import XLSX from 'xlsx';
import * as UserModule from './models/User.js';

const User = UserModule.default || UserModule.User;
const dir = path.dirname(fileURLToPath(import.meta.url));

const readSheet = (name) => {
  const file = path.join(dir, name);
  if (!fs.existsSync(file)) {
    console.error(`Missing file: ${file}\nCopy it into the server folder.`);
    process.exit(1);
  }
  const wb = XLSX.read(fs.readFileSync(file));
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
};

const people = [
  ...readSheet('Hacka_Students.xlsx').map(r => ({
    email: r['Email'], password: r['Password'], role: 'student',
  })),
  ...readSheet('Hacka_Faculty.xlsx').map(r => ({
    email: r['Faculty Mail'], password: r['Password'], role: 'faculty',
  })),
];

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to MongoDB');

const hasRole = !!User.schema.path('role');
const hasName = !!User.schema.path('name');

let added = 0, skipped = 0, failed = 0;
for (const p of people) {
  try {
    if (!p.email || !p.password) { failed++; continue; }
    const email = String(p.email).trim().toLowerCase();
    if (await User.findOne({ email })) { skipped++; continue; }

    const doc = {
      email,
      password: await bcrypt.hash(String(p.password).trim(), 10),
    };
    if (hasRole) doc.role = p.role;
    if (hasName) doc.name = email.split('@')[0];

    await User.create(doc);
    added++;
  } catch (err) {
    failed++;
    console.error(`Failed for ${p.email}: ${err.message}`);
  }
}

console.log(`Added ${added}, skipped ${skipped} duplicates, failed ${failed}`);
process.exit();
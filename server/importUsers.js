require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const XLSX = require('xlsx');
const User = require('./models/User'); // adjust to your model path

const readSheet = (file) =>
  XLSX.utils.sheet_to_json(XLSX.readFile(file).Sheets['Sheet1']);

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const people = [
    ...readSheet('Hacka_Students.xlsx').map(r => ({
      email: r['Email'], password: r['Password'], role: 'student',
    })),
    ...readSheet('Hacka_Faculty.xlsx').map(r => ({
      email: r['Faculty Mail'], password: r['Password'], role: 'faculty',
    })),
  ];

  let added = 0, skipped = 0;
  for (const p of people) {
    const email = String(p.email).trim().toLowerCase();
    if (await User.findOne({ email })) { skipped++; continue; }
    const hash = await bcrypt.hash(String(p.password).trim(), 10);
    await User.create({ email, password: hash, role: p.role });
    added++;
  }

  console.log(`Added ${added}, skipped ${skipped} duplicates`);
  process.exit();
})();
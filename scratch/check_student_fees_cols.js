const mysql = require('mysql2/promise');

async function testFeesDB() {
    const conn = await mysql.createConnection({
        host: '193.203.184.84',
        user: 'u244113830_admin',
        password: 'Srisaicollege@123',
        database: 'u244113830_college',
        port: 3306
    });

    console.log("✅ Connected to Hostinger DB.");

    try {
        const [rows] = await conn.query(`DESCRIBE student_fees`);
        console.log("\n📋 student_fees table columns:");
        rows.forEach(r => console.log(`  - ${r.Field} (${r.Type}) ${r.Null} ${r.Default}`));
    } catch (err) {
        console.error("❌ Error describing student_fees table:", err.message);
    }

    await conn.end();
}

testFeesDB().catch(err => {
    console.error("Fatal error:", err.message);
    process.exit(1);
});

const mysql = require('mysql2/promise');

async function testImportDB() {
    const conn = await mysql.createConnection({
        host: '193.203.184.84',
        user: 'u244113830_admin',
        password: 'Srisaicollege@123',
        database: 'u244113830_college',
        port: 3306
    });

    console.log("✅ Connected to Hostinger DB.");

    try {
        const [tables] = await conn.query(`SHOW TABLES LIKE 'excel_imports'`);
        console.log("excel_imports tables found:", tables);
        if (tables.length > 0) {
            const [rows] = await conn.query(`DESCRIBE excel_imports`);
            console.log("\n📋 excel_imports table columns:", rows);
        }
    } catch (err) {
        console.error("❌ Error checking excel_imports:", err.message);
    }

    await conn.end();
}

testImportDB().catch(err => {
    console.error("Fatal error:", err.message);
    process.exit(1);
});

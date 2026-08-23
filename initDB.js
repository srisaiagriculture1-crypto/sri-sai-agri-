const mysql = require('mysql2/promise');
require('dotenv').config({ path: './backend/.env' });

async function initDB() {
    console.log("🚀 Starting MASTER Database Reset for Hostinger...");
    
    const connectionConfig = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    };

    let pool;
    try {
        pool = await mysql.createConnection(connectionConfig);
        console.log("✅ Connected to Hostinger MySQL Database.");
    } catch (err) {
        console.error("❌ Connection Failed:", err.message);
        return;
    }

    const tables = {
        admins: `
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
        hero: `
            CREATE TABLE IF NOT EXISTS hero (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tag VARCHAR(255),
                h1 TEXT,
                motto TEXT,
                description TEXT,
                btn1_label VARCHAR(255),
                btn1_href VARCHAR(255),
                btn2_label VARCHAR(255),
                btn2_href VARCHAR(255),
                bg_gradient VARCHAR(255),
                image VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
        students: `
            CREATE TABLE IF NOT EXISTS students (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_name VARCHAR(255),
                roll_no VARCHAR(255),
                email VARCHAR(255),
                password VARCHAR(255),
                course_applied VARCHAR(255),
                academic_enrolled_year VARCHAR(255),
                mobile1 VARCHAR(20),
                branch VARCHAR(255),
                photo VARCHAR(255),
                father_name VARCHAR(255),
                mother_name VARCHAR(255),
                inter_type VARCHAR(255),
                dob DATE,
                gender VARCHAR(50),
                admission_type VARCHAR(255),
                medium VARCHAR(255),
                nationality VARCHAR(255),
                religion VARCHAR(255),
                door_no VARCHAR(255),
                village VARCHAR(255),
                mandal VARCHAR(255),
                pin VARCHAR(50),
                district VARCHAR(255),
                mobile2 VARCHAR(20),
                residence_phone VARCHAR(20),
                email_personal VARCHAR(255),
                reference VARCHAR(255),
                current_year VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
        faculty: `
            CREATE TABLE IF NOT EXISTS faculty (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255),
                initials VARCHAR(10),
                experience VARCHAR(255),
                category VARCHAR(255),
                designation VARCHAR(255),
                department VARCHAR(255),
                image VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
        courses: `
            CREATE TABLE IF NOT EXISTS courses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255),
                stream VARCHAR(255),
                duration VARCHAR(255),
                description TEXT,
                details TEXT,
                image VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
        ranks: `
            CREATE TABLE IF NOT EXISTS ranks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_name VARCHAR(255),
                rank VARCHAR(255),
                exam VARCHAR(255),
                stream VARCHAR(255),
                hall_ticket_number VARCHAR(100),
                year INT,
                image VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
        stories: `
            CREATE TABLE IF NOT EXISTS stories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255),
                name VARCHAR(255),
                initials VARCHAR(10),
                place VARCHAR(255),
                category VARCHAR(255),
                description TEXT,
                image VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
        testimonials: `
            CREATE TABLE IF NOT EXISTS testimonials (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255),
                student_name VARCHAR(255),
                initials VARCHAR(10),
                achievement VARCHAR(255),
                role VARCHAR(255),
                content TEXT,
                quote TEXT,
                stars INT,
                image VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
        gallery: `
            CREATE TABLE IF NOT EXISTS gallery (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255),
                sub_label VARCHAR(255),
                label VARCHAR(255),
                category VARCHAR(255),
                image VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
        enquiries: `
            CREATE TABLE IF NOT EXISTS enquiries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                studentName VARCHAR(255),
                parentName VARCHAR(255),
                mobile VARCHAR(20),
                stream VARCHAR(255),
                batch VARCHAR(255),
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
        student_fees: `
            CREATE TABLE IF NOT EXISTS student_fees (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT,
                academic_year VARCHAR(255),
                total_fee DECIMAL(10, 2) DEFAULT 0,
                fee_paid DECIMAL(10, 2) DEFAULT 0,
                due_amount DECIMAL(10, 2) DEFAULT 0,
                hostel_total_fee DECIMAL(10, 2) DEFAULT 0,
                hostel_fee_paid DECIMAL(10, 2) DEFAULT 0,
                hostel_due_amount DECIMAL(10, 2) DEFAULT 0,
                status VARCHAR(50) DEFAULT 'Pending',
                last_payment_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
            )
        `,
        qualifications: `
            CREATE TABLE IF NOT EXISTS qualifications (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT,
                examination VARCHAR(255),
                board_university VARCHAR(255),
                year_of_passing VARCHAR(50),
                percentage_cgpa VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
            )
        `,
        directors: `
            CREATE TABLE IF NOT EXISTS directors (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                position VARCHAR(255) NOT NULL,
                image VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `,
        receptionists: `
            CREATE TABLE IF NOT EXISTS receptionists (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                username VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                status VARCHAR(50) DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `
    };

    for (const [name, query] of Object.entries(tables)) {
        try {
            await pool.query(`DROP TABLE IF EXISTS \`${name}\``);
            await pool.query(query);
            console.log(`✅ Table '${name}' Reset & Ready.`);
        } catch (err) {
            console.error(`❌ Error initializing table '${name}':`, err.message);
        }
    }

    console.log("\n🎉 MASTER RESET COMPLETE! Your database is now 100% compatible.");
    await pool.end();
}

initDB();

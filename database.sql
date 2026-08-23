-- Sri Sai Agriculture College - Complete MySQL Schema

CREATE DATABASE IF NOT EXISTS srisai_db;
USE srisai_db;

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Students Table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    student_name VARCHAR(255),
    father_name VARCHAR(255),
    mother_name VARCHAR(255),
    branch VARCHAR(100),
    inter_type VARCHAR(100),
    dob DATE,
    gender VARCHAR(20),
    admission_type VARCHAR(100),
    course_applied VARCHAR(100),
    medium VARCHAR(50),
    nationality VARCHAR(50),
    religion VARCHAR(50),
    door_no VARCHAR(100),
    village VARCHAR(100),
    mandal VARCHAR(100),
    pin VARCHAR(20),
    district VARCHAR(100),
    mobile1 VARCHAR(20),
    mobile2 VARCHAR(20),
    residence_phone VARCHAR(20),
    email_personal VARCHAR(255),
    reference VARCHAR(255),
    photo TEXT,
    roll_no VARCHAR(50),
    current_year VARCHAR(50) DEFAULT '1st year',
    academic_enrolled_year VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Student Fees Table
CREATE TABLE IF NOT EXISTS student_fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    academic_year VARCHAR(50),
    total_fee DECIMAL(10,2) DEFAULT 0,
    committed_fee DECIMAL(10,2) DEFAULT 0,
    admission_fee DECIMAL(10,2) DEFAULT 0,
    practical_fee DECIMAL(10,2) DEFAULT 0,
    hostel_fee DECIMAL(10,2) DEFAULT 0,
    paid_amount DECIMAL(10,2) DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'Pending',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 4. Faculty Table
CREATE TABLE IF NOT EXISTS faculty (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    initials VARCHAR(10),
    department VARCHAR(255),
    experience VARCHAR(255),
    category VARCHAR(100),
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Courses Table
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    stream VARCHAR(100),
    description TEXT,
    details JSON,
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Success Stories Table
CREATE TABLE IF NOT EXISTS stories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    initials VARCHAR(10),
    place VARCHAR(255),
    category VARCHAR(100),
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Testimonials Table
CREATE TABLE IF NOT EXISTS testimonials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_name VARCHAR(255),
    initials VARCHAR(10),
    achievement VARCHAR(255),
    quote TEXT,
    stars INT DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Ranks Table
CREATE TABLE IF NOT EXISTS ranks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_name VARCHAR(255),
    hall_ticket_number VARCHAR(100),
    rank VARCHAR(100),
    exam VARCHAR(100),
    stream VARCHAR(100),
    year INT,
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Gallery Table
CREATE TABLE IF NOT EXISTS gallery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    image TEXT,
    label VARCHAR(255),
    sub_label VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Hero Section Table
CREATE TABLE IF NOT EXISTS hero (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tag VARCHAR(255),
    h1 JSON,
    motto TEXT,
    description TEXT,
    btn1_label VARCHAR(255),
    btn1_href VARCHAR(255),
    btn2_label VARCHAR(255),
    btn2_href VARCHAR(255),
    bg_gradient TEXT,
    image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Enquiries Table
CREATE TABLE IF NOT EXISTS enquiries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_name VARCHAR(255),
    parent_name VARCHAR(255),
    mobile VARCHAR(20),
    email VARCHAR(255),
    stream VARCHAR(100),
    batch VARCHAR(100),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 12. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course VARCHAR(100),
    subject_name VARCHAR(255),
    subject_code VARCHAR(50),
    semester VARCHAR(50),
    credits INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Qualifications Table (For Student Registration)
CREATE TABLE IF NOT EXISTS qualifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    examination VARCHAR(255),
    board_university VARCHAR(255),
    year_of_passing VARCHAR(10),
    percentage_cgpa VARCHAR(20),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 14. Board of Directors Table
CREATE TABLE IF NOT EXISTS directors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 15. Receptionist Accounts Table
CREATE TABLE IF NOT EXISTS receptionists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



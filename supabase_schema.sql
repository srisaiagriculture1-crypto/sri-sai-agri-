-- Students table (Accounts)
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roll_no TEXT UNIQUE,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  student_name TEXT NOT NULL,
  father_name TEXT NOT NULL,
  mother_name TEXT NOT NULL,
  branch TEXT,
  inter_type TEXT, -- MPC, BiPC, Ag Diploma
  dob DATE,
  gender TEXT,
  admission_type TEXT, -- Residential, Day Scholar
  course_applied TEXT,
  medium TEXT,
  nationality TEXT DEFAULT 'Indian',
  religion TEXT,
  door_no TEXT,
  village TEXT,
  mandal TEXT,
  pin TEXT,
  district TEXT,
  mobile1 TEXT NOT NULL,
  mobile2 TEXT,
  residence_phone TEXT,
  email_personal TEXT,
  reference TEXT,
  photo TEXT, -- Passport size photo URL
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  current_year TEXT DEFAULT '1st year', -- 1st year, 2nd year, 3rd year, 4th year
  academic_enrolled_year TEXT, -- 2024-2025, etc
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Education Qualifications table
CREATE TABLE IF NOT EXISTS qualifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course TEXT,
  examination TEXT,
  percentage TEXT,
  university TEXT,
  passing_year TEXT,
  total_marks TEXT,
  max_marks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Fees table
CREATE TABLE IF NOT EXISTS student_fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  academic_year TEXT, -- 1st year, 2nd year, etc.
  total_fee DECIMAL(10,2) DEFAULT 0,
  committed_fee DECIMAL(10,2) DEFAULT 0,
  admission_fee DECIMAL(10,2) DEFAULT 0,
  practical_fee DECIMAL(10,2) DEFAULT 0,
  hostel_fee DECIMAL(10,2) DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Curriculum/Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course TEXT,
  semester TEXT,
  subject_name TEXT,
  subject_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Board of Directors table
CREATE TABLE IF NOT EXISTS directors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  qualification TEXT,
  experience TEXT,
  message TEXT,
  image TEXT,
  order_num INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


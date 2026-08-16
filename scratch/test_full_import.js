const mysql = require('mysql2/promise');
const XLSX = require('xlsx');

async function testFullImport() {
    const conn = await mysql.createConnection({
        host: '193.203.184.84',
        user: 'u244113830_admin',
        password: 'Srisaicollege@123',
        database: 'u244113830_college',
        port: 3306
    });

    console.log("✅ Connected to Hostinger DB.");

    // Create a mock workbook buffer in memory
    const data = [
        ["Student Name", "Roll No", "Email", "Mobile", "Branch", "Course", "Enrolled Year", "Father Name", "Mother Name", "DOB", "Gender"],
        ["Test Student 1", "TEST101", "teststudent1@srisai.com", "9876543210", "Ag. B.Sc.", "Ag. B.Sc.", "2024", "Father 1", "Mother 1", "2002-05-10", "Male"],
        ["Test Student 2", "TEST102", "", "9876543211", "Ag. B.Sc.", "Ag. B.Sc.", "2024", "Father 2", "Mother 2", "2002-06-15", "Female"]
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    // Now test the logic in studentRoutes.js
    try {
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(sheet);

        console.log("Parsed rows count:", rawRows.length);
        console.log("Row 0:", rawRows[0]);

        await conn.beginTransaction();

        const [importResult] = await conn.query(
            "INSERT INTO excel_imports (filename) VALUES (?)",
            ["Test_Upload.xlsx"]
        );
        const excelImportId = importResult.insertId;
        console.log("Inserted excel_imports id:", excelImportId);

        let importedCount = 0;
        for (const row of rawRows) {
            try {
                const normalizeKey = (key) => String(key).toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
                const normalizedRow = {};
                Object.keys(row).forEach(k => {
                    normalizedRow[normalizeKey(k)] = row[k];
                });

                const rowKeys = Object.keys(normalizedRow);
                const findValue = (keys, exactList, substringList = [], excludeList = []) => {
                    for (const exact of exactList) {
                        const foundKey = keys.find(k => k === exact);
                        if (foundKey) return foundKey;
                    }
                    if (substringList.length > 0) {
                        for (const sub of substringList) {
                            const foundKey = keys.find(k => {
                                const hasSub = k.includes(sub);
                                const hasExclude = excludeList.some(ex => k.includes(ex));
                                return hasSub && !hasExclude;
                            });
                            if (foundKey) return foundKey;
                        }
                    }
                    return null;
                };

                const studentNameKey = findValue(rowKeys, ["student_name", "name", "fullname", "full_name", "studentname", "student"], ["name"], ["father", "mother", "parent"]);
                const student_name = studentNameKey && normalizedRow[studentNameKey] != null ? String(normalizedRow[studentNameKey]).trim() : "";

                const rollNoKey = findValue(rowKeys, ["roll_no", "rollno", "roll_number", "rollnumber", "sno", "sl_no", "slno", "id"], ["roll", "reg", "sno"]);
                const roll_no = rollNoKey && normalizedRow[rollNoKey] != null ? String(normalizedRow[rollNoKey]).trim() : "";

                const emailKey = findValue(rowKeys, ["email", "email_id", "emailid", "email_address", "emailaddress"], ["email"], ["personal"]);
                let email = emailKey && normalizedRow[emailKey] != null ? String(normalizedRow[emailKey]).trim() : "";

                if (!email) {
                    if (roll_no) {
                        email = `${roll_no.toLowerCase().replace(/[^a-z0-9]/g, "")}@srisai.com`;
                    } else if (student_name) {
                        email = `${student_name.toLowerCase().replace(/[^a-z0-9]/g, "")}${Math.floor(100 + Math.random() * 900)}@srisai.com`;
                    }
                }

                const branchKey = findValue(rowKeys, ["branch", "branch_name", "specialization", "course"], ["branch", "spec"]);
                const branch = branchKey && normalizedRow[branchKey] != null ? String(normalizedRow[branchKey]).trim() : "";

                const courseKey = findValue(rowKeys, ["course_applied", "course", "courseapplied", "course_name"], ["course"]);
                const course_applied = courseKey && normalizedRow[courseKey] != null ? String(normalizedRow[courseKey]).trim() : (branch || "Ag. B.Sc.");

                const enrolledYearKey = findValue(rowKeys, ["academic_enrolled_year", "enrolled_year", "academic_year", "enrolledyear", "batch", "academicyear"], ["enrolled", "batch", "academic"]);
                const academic_enrolled_year = enrolledYearKey && normalizedRow[enrolledYearKey] != null ? String(normalizedRow[enrolledYearKey]).trim() : "";

                const mobileKey = findValue(rowKeys, ["mobile1", "mobile", "phone", "phonenumber", "phone_number", "mobile_number", "mobilenumber", "contact", "contact_number", "contactnumber"], ["mobile", "phone", "contact"], ["father", "mother", "parent", "residence", "alt", "2", "landline"]);
                const mobile1 = mobileKey && normalizedRow[mobileKey] != null ? String(normalizedRow[mobileKey]).trim() : "";

                const fatherKey = findValue(rowKeys, ["father_name", "fathername", "fathers_name", "father"], ["father"]);
                const father_name = fatherKey && normalizedRow[fatherKey] != null ? String(normalizedRow[fatherKey]).trim() : "";

                const motherKey = findValue(rowKeys, ["mother_name", "mothername", "mothers_name", "mother"], ["mother"]);
                const mother_name = motherKey && normalizedRow[motherKey] != null ? String(normalizedRow[motherKey]).trim() : "";

                const interKey = findValue(rowKeys, ["inter_type", "intertype", "intermediate", "intermediate_type"], ["inter", "12th"]);
                const inter_type = interKey && normalizedRow[interKey] != null ? String(normalizedRow[interKey]).trim() : "";

                const dobKey = findValue(rowKeys, ["dob", "date_of_birth", "dateofbirth", "birthdate"], ["dob", "birth", "date_of_birth"]);
                const dobVal = dobKey ? normalizedRow[dobKey] : "";
                let dob = null;
                if (dobVal) {
                    if (typeof dobVal === 'number') {
                        const dateObj = new Date(Math.round((dobVal - 25569) * 86400 * 1000));
                        if (!isNaN(dateObj.getTime())) dob = dateObj;
                    } else {
                        const parsed = new Date(dobVal);
                        if (!isNaN(parsed.getTime())) dob = parsed;
                    }
                }

                const genderKey = findValue(rowKeys, ["gender", "sex"], ["gender", "sex"]);
                const gender = genderKey && normalizedRow[genderKey] != null ? String(normalizedRow[genderKey]).trim() : "";

                const admKey = findValue(rowKeys, ["admission_type", "admissiontype"], ["admission"]);
                const admission_type = admKey && normalizedRow[admKey] != null ? String(normalizedRow[admKey]).trim() : "";

                const mediumKey = findValue(rowKeys, ["medium", "medium_of_instruction"], ["medium"]);
                const medium = mediumKey && normalizedRow[mediumKey] != null ? String(normalizedRow[mediumKey]).trim() : "";

                const nationalityKey = findValue(rowKeys, ["nationality"], ["national"]);
                const nationality = nationalityKey && normalizedRow[nationalityKey] != null ? String(normalizedRow[nationalityKey]).trim() : "";

                const religionKey = findValue(rowKeys, ["religion"], ["relig"]);
                const religion = religionKey && normalizedRow[religionKey] != null ? String(normalizedRow[religionKey]).trim() : "";

                const doorKey = findValue(rowKeys, ["door_no", "doorno", "house_no", "houseno", "address"], ["door", "house", "addr"]);
                const door_no = doorKey && normalizedRow[doorKey] != null ? String(normalizedRow[doorKey]).trim() : "";

                const villageKey = findValue(rowKeys, ["village", "town", "village_town"], ["vill", "town"]);
                const village = villageKey && normalizedRow[villageKey] != null ? String(normalizedRow[villageKey]).trim() : "";

                const mandalKey = findValue(rowKeys, ["mandal", "tehsil", "sub_district"], ["mandal", "tehsil"]);
                const mandal = mandalKey && normalizedRow[mandalKey] != null ? String(normalizedRow[mandalKey]).trim() : "";

                const pinKey = findValue(rowKeys, ["pin", "pincode", "zip", "zipcode", "postal_code"], ["pin", "zip", "postal"]);
                const pin = pinKey && normalizedRow[pinKey] != null ? String(normalizedRow[pinKey]).trim() : "";

                const districtKey = findValue(rowKeys, ["district"], ["dist"]);
                const district = districtKey && normalizedRow[districtKey] != null ? String(normalizedRow[districtKey]).trim() : "";

                const mobile2Key = findValue(rowKeys, ["mobile2", "alternate_mobile", "alternative_mobile", "alt_mobile", "mobile_2"], ["mobile2", "alt_mobile", "alt_phone", "alternate"]);
                const mobile2 = mobile2Key && normalizedRow[mobile2Key] != null ? String(normalizedRow[mobile2Key]).trim() : "";

                const residenceKey = findValue(rowKeys, ["residence_phone", "residence", "landline", "home_phone"], ["residence", "land", "home"]);
                const residence_phone = residenceKey && normalizedRow[residenceKey] != null ? String(normalizedRow[residenceKey]).trim() : "";

                const personalEmailKey = findValue(rowKeys, ["email_personal", "personal_email", "personalemail"], ["personal_email", "email_personal", "personalemail"]);
                const email_personal = personalEmailKey && normalizedRow[personalEmailKey] != null ? String(normalizedRow[personalEmailKey]).trim() : "";

                const referenceKey = findValue(rowKeys, ["reference", "referred_by"], ["ref"]);
                const reference = referenceKey && normalizedRow[referenceKey] != null ? String(normalizedRow[referenceKey]).trim() : "";

                const currentYearKey = findValue(rowKeys, ["current_year", "currentyear", "year", "year_level"], ["current_year", "year_level"]);
                const current_year = currentYearKey && normalizedRow[currentYearKey] != null ? String(normalizedRow[currentYearKey]).trim() : "1st year";

                console.log(`Inserting student: ${student_name}, email: ${email}`);

                const authCredential = roll_no || email || "SriSai@123";
                const hashedPassword = "hashed_dummy_password";

                const [studentResult] = await conn.query(
                    `INSERT INTO students (
                        email, password, student_name, father_name, mother_name,
                        branch, inter_type, dob, gender, admission_type,
                        course_applied, medium, nationality, religion,
                        door_no, village, mandal, pin, district,
                        mobile1, mobile2, residence_phone, email_personal, reference,
                        roll_no, current_year, academic_enrolled_year, excel_import_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        email, hashedPassword, student_name, father_name, mother_name,
                        branch, inter_type, dob, gender, admission_type,
                        course_applied, medium, nationality, religion,
                        door_no, village, mandal, pin, district,
                        mobile1, mobile2, residence_phone, email_personal, reference,
                        roll_no, current_year, academic_enrolled_year, excelImportId
                    ]
                );

                const studentId = studentResult.insertId;
                console.log(`Inserted student ID: ${studentId}`);

                const years = ["1st year", "2nd year", "3rd year", "4th year"];
                for (const y of years) {
                    await conn.query(
                        "INSERT INTO student_fees (student_id, academic_year) VALUES (?, ?)",
                        [studentId, y]
                    );
                }
                importedCount++;
            } catch (rowErr) {
                console.error("Row import error details:", rowErr);
            }
        }

        await conn.rollback(); // Clean rollback after test
        console.log(`✅ Test finished successfully. Imported count: ${importedCount}`);
    } catch (err) {
        await conn.rollback();
        console.error("❌ Test failed:", err);
    } finally {
        await conn.end();
    }
}

testFullImport();

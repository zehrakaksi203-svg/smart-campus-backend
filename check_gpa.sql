SELECT id, "studentNumber", gpa FROM "Students" WHERE id = (SELECT "studentId" FROM "Enrollments" WHERE id = 1);

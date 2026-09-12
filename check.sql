SELECT id, "studentId", "courseId", status FROM "Enrollments" WHERE "studentId" = (SELECT id FROM "Students" WHERE "userId" = 13);

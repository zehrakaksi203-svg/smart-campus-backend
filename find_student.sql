SELECT e.id AS "enrollmentId", s.id AS "studentId", u.id AS "userId", u.email, u."fullName"
FROM "Enrollments" e
JOIN "Students" s ON e."studentId" = s.id
JOIN "Users" u ON s."userId" = u.id
WHERE e.id = 1;
